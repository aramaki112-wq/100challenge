import { ENGINE_CANDIDATE_TYPE, ENGINE_EVALUATION_TYPE } from "./EngineAnalysisConstants.js";
import { EVALUATION_TRANSITION } from "./EvaluationDelta.js";

const TYPE_LABEL = Object.freeze({
  [ENGINE_CANDIDATE_TYPE.MAJOR_DROPOFF]: "大きく悪化した可能性",
  [ENGINE_CANDIDATE_TYPE.REVIEW_CANDIDATE]: "振り返り候補",
  [ENGINE_CANDIDATE_TYPE.GOOD_MOVE_CANDIDATE]: "良かった可能性"
});

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}

function evaluationText(evaluation) {
  if (evaluation?.type === ENGINE_EVALUATION_TYPE.CP) {
    const sign = evaluation.centipawns > 0 ? "+" : "";
    return `${sign}${evaluation.centipawns} cp（本人視点）`;
  }
  if (evaluation?.type === ENGINE_EVALUATION_TYPE.MATE) {
    return evaluation.mateIn > 0 ? `詰みの可能性 +${evaluation.mateIn}` : `詰まされる可能性 ${evaluation.mateIn}`;
  }
  return "評価値なし";
}

function deltaText(delta) {
  if (delta?.kind === EVALUATION_TRANSITION.CP_CHANGE) {
    const sign = delta.centipawns > 0 ? "+" : "";
    return `${sign}${delta.centipawns} cp`;
  }
  const labels = {
    [EVALUATION_TRANSITION.MATE_GAINED]: "詰み筋が生じた可能性",
    [EVALUATION_TRANSITION.MATE_LOST]: "詰み筋を逃した可能性",
    [EVALUATION_TRANSITION.MATED_CREATED]: "詰まされる状態へ変化した可能性",
    [EVALUATION_TRANSITION.MATED_ESCAPED]: "詰みを逃れた可能性",
    [EVALUATION_TRANSITION.MATE_DISTANCE_CHANGED]: "詰み手数が変化"
  };
  return labels[delta?.kind] ?? "比較不可";
}

function candidateMarkup(candidate, index) {
  const topMoves = (candidate.candidateMoves ?? []).slice(0, 3);
  return `<article class="engine-candidate-card" data-engine-candidate="${candidate.ply}">
    <div class="engine-candidate-heading">
      <div><p class="eyebrow">候補 ${index + 1} · 第${candidate.moveNumber}手</p><h4>${escapeHtml(TYPE_LABEL[candidate.candidateType] ?? "振り返り候補")}</h4></div>
      <span class="engine-candidate-badge" data-candidate-type="${escapeHtml(candidate.candidateType)}">${escapeHtml(TYPE_LABEL[candidate.candidateType] ?? "候補")}</span>
    </div>
    <dl class="engine-candidate-data">
      <div><dt>実戦手</dt><dd>${escapeHtml(candidate.actualMoveText || candidate.actualMove || "—")}</dd></div>
      <div><dt>Engine候補</dt><dd>${escapeHtml(candidate.bestMove || "—")}</dd></div>
      <div><dt>指す前</dt><dd>${escapeHtml(evaluationText(candidate.evaluationBefore))}</dd></div>
      <div><dt>指した後</dt><dd>${escapeHtml(evaluationText(candidate.evaluationAfter))}</dd></div>
      <div><dt>評価変化</dt><dd>${escapeHtml(deltaText(candidate.evaluationDelta))}</dd></div>
    </dl>
    ${topMoves.length > 1 ? `<details class="engine-multipv"><summary>候補手を表示（上位${topMoves.length}手）</summary><ol>${topMoves.map((move) => `<li>${escapeHtml(move.move)}${move.rank === 1 ? "（最善候補）" : ""}</li>`).join("")}</ol></details>` : ""}
    <p class="engine-candidate-caution">Engineの評価は参考情報です。この局面を重要局面にするかは本人が決めます。</p>
    <div class="button-cluster"><button type="button" class="secondary-button" data-engine-replay-ply="${candidate.ply}" aria-label="第${candidate.moveNumber}手の候補局面を見る">局面を見る</button><button type="button" class="primary-button" data-engine-add-key-position="${candidate.ply}" aria-label="第${candidate.moveNumber}手を重要局面へ追加">重要局面へ追加</button></div>
  </article>`;
}

export class BrowserEngineAnalysisView {
  constructor({ documentObject = document } = {}) {
    this.document = documentObject;
    this.status = this.#required("engine-analysis-status");
    this.progress = this.#required("engine-analysis-progress");
    this.progressText = this.#required("engine-analysis-progress-text");
    this.analyzeButton = this.#required("analyze-game");
    this.cancelButton = this.#required("cancel-analysis");
    this.candidates = this.#required("engine-analysis-candidates");
    this.metadata = this.#required("engine-analysis-metadata");
  }
  #required(id) { const element = this.document.getElementById(id); if (!element) throw new Error(`必要なEngine UI要素がありません: #${id}`); return element; }

  showUnanalyzed({ engineAvailable = null, message = "未解析" } = {}) {
    this.status.dataset.status = "UNANALYZED";
    this.status.textContent = engineAvailable === false ? "未解析 · Engine未設定" : message;
    this.progress.hidden = true; this.progressText.textContent = "";
    this.analyzeButton.disabled = false; this.cancelButton.disabled = true;
  }

  showAnalyzing({ completed = 0, total = 1 } = {}) {
    this.status.dataset.status = "ANALYZING"; this.status.textContent = "解析中";
    this.progress.hidden = false; this.progress.max = Math.max(1, total); this.progress.value = completed;
    this.progress.setAttribute("aria-valuetext", `${completed}/${total}局面を解析済み`);
    this.progressText.textContent = `${completed}/${total}局面を解析済み`;
    this.analyzeButton.disabled = true; this.cancelButton.disabled = false;
  }

  showError(error) {
    this.status.dataset.status = "FAILED";
    this.status.textContent = error?.userMessage ?? error?.message ?? "解析に失敗しました。";
    this.progress.hidden = true; this.cancelButton.disabled = true; this.analyzeButton.disabled = false;
  }

  showCancelled() {
    this.status.dataset.status = "CANCELLED"; this.status.textContent = "解析を中止しました";
    this.progress.hidden = true; this.cancelButton.disabled = true; this.analyzeButton.disabled = false;
  }

  renderResult(result) {
    this.status.dataset.status = "ANALYZED";
    this.status.textContent = result.engine?.mock ? "解析済み（検証用Mock Engine）" : "解析済み";
    this.progress.hidden = true; this.progressText.textContent = `${result.positionsAnalyzed}局面を解析`;
    this.cancelButton.disabled = true; this.analyzeButton.disabled = false; this.analyzeButton.textContent = "現在設定で再解析";
    this.metadata.textContent = `${result.engine.engineName} / ${result.engine.engineVersion} · 評価Model: ${result.engine.evaluationModel} ${result.engine.evaluationModelVersion} · ${result.analysisSettings.preset}`;
    const primary = result.primaryCandidates ?? [];
    if (!primary.length) {
      this.candidates.innerHTML = '<p class="empty-state">今回の設定では自動候補を選出できませんでした。Replayから手動で重要局面を選べます。</p>';
      return;
    }
    this.candidates.innerHTML = `<p class="engine-candidate-summary">最重要候補 ${primary.length}件${primary.length < 3 ? "（候補が少ないため3件未満です）" : ""}</p>${primary.map(candidateMarkup).join("")}${(result.otherCandidates?.length ?? 0) ? `<details class="engine-other-candidates"><summary>その他の候補 ${result.otherCandidates.length}件</summary>${result.otherCandidates.slice(0, 10).map((candidate, index) => candidateMarkup(candidate, primary.length + index)).join("")}</details>` : ""}`;
  }
}
