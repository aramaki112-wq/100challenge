import { ENGINE_CANDIDATE_TYPE, ENGINE_EVALUATION_TYPE } from "./EngineAnalysisConstants.js";
import { ENGINE_CANDIDATE_GROUP } from "./EngineCandidateSelector.js";
import { EVALUATION_TRANSITION } from "./EvaluationDelta.js";

const TYPE_LABEL = Object.freeze({
  [ENGINE_CANDIDATE_TYPE.MAJOR_DROPOFF]: "大きく考え直したい手",
  [ENGINE_CANDIDATE_TYPE.REVIEW_CANDIDATE]: "考え直したい手",
  [ENGINE_CANDIDATE_TYPE.GOOD_MOVE_CANDIDATE]: "良かった手"
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

function pvText(candidate) {
  const pv = candidate.bestMovePv?.length
    ? candidate.bestMovePv
    : (candidate.candidateMoves ?? []).find((move) => move.rank === 1)?.pv ?? [];
  return pv.slice(0, 6).join(" ") || "—";
}

function reasonsMarkup(candidate) {
  const reasons = (candidate.reasons ?? []).filter(Boolean);
  if (!reasons.length) return "";
  return `<ul class="engine-candidate-reasons" aria-label="候補に選んだ理由">${reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>`;
}

function topMovesMarkup(candidate) {
  const topMoves = (candidate.candidateMoves ?? []).slice(0, 3);
  if (topMoves.length <= 1) return "";
  return `<details class="engine-multipv"><summary>Engine候補を表示（上位${topMoves.length}手）</summary><ol>${topMoves.map((move) => `<li>${escapeHtml(move.move)}${move.rank === 1 ? "（最善候補）" : ""}${move.evaluation ? ` · ${escapeHtml(evaluationText(move.evaluation))}` : ""}</li>`).join("")}</ol></details>`;
}

function badCandidateData(candidate) {
  const bestEvaluation = candidate.bestEvaluation ?? candidate.evaluationBefore;
  const actualEvaluation = candidate.actualEvaluation ?? candidate.evaluationAfter;
  return `<dl class="engine-candidate-data" aria-label="実戦手とEngine推奨手の比較">
    <div><dt>実戦手</dt><dd>${escapeHtml(candidate.actualMoveText || candidate.actualMove || "—")}</dd></div>
    <div><dt>指す前の評価</dt><dd>${escapeHtml(evaluationText(candidate.evaluationBefore))}</dd></div>
    <div><dt>実戦後評価</dt><dd>${escapeHtml(evaluationText(actualEvaluation))}</dd></div>
    <div><dt>Engine推奨</dt><dd>${escapeHtml(candidate.bestMove || "—")}</dd></div>
    <div><dt>推奨手評価</dt><dd>${escapeHtml(evaluationText(bestEvaluation))}</dd></div>
    <div><dt>実戦手との差</dt><dd>${escapeHtml(deltaText(candidate.evaluationDelta))}</dd></div>
    <div class="engine-candidate-pv"><dt>読み筋</dt><dd>${escapeHtml(pvText(candidate))}</dd></div>
  </dl>`;
}

function goodCandidateData(candidate) {
  return `<dl class="engine-candidate-data" aria-label="良かった手の評価変化">
    <div><dt>実戦手</dt><dd>${escapeHtml(candidate.actualMoveText || candidate.actualMove || "—")}</dd></div>
    <div><dt>指す前</dt><dd>${escapeHtml(evaluationText(candidate.evaluationBefore))}</dd></div>
    <div><dt>指した後</dt><dd>${escapeHtml(evaluationText(candidate.evaluationAfter))}</dd></div>
    <div><dt>改善・差</dt><dd>${escapeHtml(deltaText(candidate.evaluationDelta))}</dd></div>
    <div><dt>Engine推奨</dt><dd>${escapeHtml(candidate.bestMove || "—")}</dd></div>
    <div><dt>一致</dt><dd>${candidate.bestMoveMatched ? "実戦手はEngine最善候補と一致" : "別候補（評価変化から選出）"}</dd></div>
  </dl>`;
}

function candidateMarkup(candidate, index, group) {
  const isBad = group === ENGINE_CANDIDATE_GROUP.BAD;
  const headingId = `engine-candidate-heading-${group.toLowerCase()}-${candidate.ply}`;
  const groupLabel = isBad ? "考え直したい手" : "良かった手";
  return `<article class="engine-candidate-card" data-engine-candidate="${candidate.ply}" data-candidate-group="${group}" aria-labelledby="${headingId}">
    <div class="engine-candidate-heading">
      <div><p class="eyebrow">${escapeHtml(groupLabel)} ${index + 1} · 第${candidate.moveNumber}手</p><h5 id="${headingId}">${escapeHtml(candidate.actualMoveText || candidate.actualMove || "実戦手")}</h5></div>
      <span class="engine-candidate-badge" data-candidate-type="${escapeHtml(candidate.candidateType)}">${escapeHtml(TYPE_LABEL[candidate.candidateType] ?? groupLabel)}</span>
    </div>
    ${isBad ? badCandidateData(candidate) : goodCandidateData(candidate)}
    ${reasonsMarkup(candidate)}
    ${topMovesMarkup(candidate)}
    <p class="engine-candidate-caution">Engine推奨は唯一の正解という意味ではありません。実戦手との差を盤面で確認し、重要局面にするかは本人が決めます。</p>
    <div class="button-cluster"><button type="button" class="secondary-button" data-engine-replay-ply="${candidate.ply}" aria-label="第${candidate.moveNumber}手の候補局面をReplay盤面で見る">局面を見る</button><button type="button" class="primary-button" data-engine-add-key-position="${candidate.ply}" aria-label="第${candidate.moveNumber}手を重要局面へ追加">重要局面へ追加</button></div>
  </article>`;
}

function groupMarkup({ id, title, description, candidates, group }) {
  return `<section class="engine-candidate-group" data-engine-candidate-group="${group}" aria-labelledby="${id}">
    <div class="engine-candidate-group-heading"><h4 id="${id}">${escapeHtml(title)}</h4><span>${candidates.length}件</span></div>
    <p class="engine-candidate-group-description">${escapeHtml(description)}</p>
    ${candidates.length
      ? `<div class="engine-candidate-group-list">${candidates.map((candidate, index) => candidateMarkup(candidate, index, group)).join("")}</div>`
      : '<p class="empty-state">基準を満たす候補はありませんでした。</p>'}
  </section>`;
}

function groupedCandidates(result) {
  if (Array.isArray(result.goodCandidates) || Array.isArray(result.badCandidates)) {
    return {
      good: result.goodCandidates ?? [],
      bad: result.badCandidates ?? []
    };
  }
  const primary = result.primaryCandidates ?? [];
  return {
    good: primary.filter((candidate) => candidate.candidateType === ENGINE_CANDIDATE_TYPE.GOOD_MOVE_CANDIDATE),
    bad: primary.filter((candidate) => candidate.candidateType !== ENGINE_CANDIDATE_TYPE.GOOD_MOVE_CANDIDATE)
  };
}

export class BrowserEngineAnalysisView {
  constructor({ documentObject = document } = {}) {
    this.document = documentObject;
    this.panel = this.#required("engine-analysis-panel");
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
    this.panel.setAttribute("aria-busy", "false");
    this.status.dataset.status = engineAvailable === false ? "NOT_AVAILABLE" : "READY";
    this.status.textContent = engineAvailable === false ? "Engineを利用できません" : (message === "未解析" ? "解析できます" : message);
    this.progress.hidden = true; this.progress.value = 0; this.progressText.textContent = "";
    this.analyzeButton.disabled = false; this.analyzeButton.textContent = "棋譜を解析する"; this.cancelButton.disabled = true;
    this.metadata.textContent = engineAvailable === false ? "Engineを利用できません。Replay・手動重要局面登録・振り返りはそのまま利用できます。" : "Local Engineは棋譜を外部送信せずBrowser内で解析します。EngineなしでもReplay・手動重要局面登録・振り返りは利用できます。";
    this.candidates.innerHTML = '<p class="empty-state">まだ解析していません。必要なら棋譜を解析して振り返り候補を表示できます。</p>';
  }

  showInitializing() {
    this.panel.setAttribute("aria-busy", "true");
    this.status.dataset.status = "INITIALIZING"; this.status.textContent = "Engine初期化中";
    this.progress.hidden = true; this.progressText.textContent = "";
    this.metadata.textContent = "Local Engine Workerを準備しています。";
    this.analyzeButton.disabled = true; this.cancelButton.disabled = false;
  }

  showCancelling() {
    this.panel.setAttribute("aria-busy", "true");
    this.status.dataset.status = "CANCELLING"; this.status.textContent = "解析を中止しています";
    this.cancelButton.disabled = true;
  }

  showAnalyzing({ completed = 0, total = 1 } = {}) {
    this.panel.setAttribute("aria-busy", "true");
    this.status.dataset.status = "ANALYZING"; this.status.textContent = "解析中";
    this.progress.hidden = false; this.progress.max = Math.max(1, total); this.progress.value = completed;
    this.progress.setAttribute("aria-valuetext", `${completed}/${total}局面を解析済み`);
    this.progressText.textContent = `${completed}/${total}局面を解析済み`;
    this.metadata.textContent = "解析中です。Replay操作やScrollは継続できます。";
    this.candidates.innerHTML = '<p class="empty-state">解析中…</p>';
    this.analyzeButton.disabled = true; this.cancelButton.disabled = false;
  }

  showError(error) {
    this.panel.setAttribute("aria-busy", "false");
    this.status.dataset.status = "FAILED";
    this.status.textContent = error?.userMessage ?? error?.message ?? "解析に失敗しました。";
    this.progress.hidden = true; this.cancelButton.disabled = true; this.analyzeButton.disabled = false;
  }

  showCancelled() {
    this.panel.setAttribute("aria-busy", "false");
    this.status.dataset.status = "CANCELLED"; this.status.textContent = "解析を中止しました";
    this.progress.hidden = true; this.cancelButton.disabled = true; this.analyzeButton.disabled = false;
  }

  renderResult(result) {
    this.panel.setAttribute("aria-busy", "false");
    this.status.dataset.status = "COMPLETED";
    if (result.engine?.mock) this.status.textContent = "解析完了（検証用Mock Engine）";
    else if (result.engine?.fallback) this.status.textContent = "解析完了（簡易Engineへ切替）";
    else this.status.textContent = "解析完了";
    this.progress.hidden = true;
    this.progressText.textContent = `${result.positionsAnalyzed} / ${result.totalPositionsInGame ?? result.positionsAnalyzed} 局面${result.analysisTruncated ? "（安全上限で終了）" : "（解析完了）"}`;
    this.cancelButton.disabled = true; this.analyzeButton.disabled = false; this.analyzeButton.textContent = "現在設定で再解析";
    const truncated = result.analysisTruncated ? ` · ${result.positionsAnalyzed}/${result.totalPositionsInGame}局面まで（安全上限）` : "";
    const fallback = result.engine?.fallback ? ` · 簡易Engineへ切り替わりました${result.engine.fallbackReason ? `（${result.engine.fallbackReason}）` : ""}` : "";
    this.metadata.textContent = `${result.engine.engineName} / ${result.engine.engineVersion} · 評価Model: ${result.engine.evaluationModel} ${result.engine.evaluationModelVersion} · ${result.analysisSettings.preset}${truncated}${fallback}`;

    const { good, bad } = groupedCandidates(result);
    if (!good.length && !bad.length) {
      this.candidates.innerHTML = '<p class="engine-candidate-summary">基準を満たす候補のみ表示しています。</p><p class="empty-state">今回の設定では自動候補を選出できませんでした。Replayから手動で重要局面を選べます。</p>';
      return;
    }

    this.candidates.innerHTML = `<p class="engine-candidate-summary">良かった手 ${good.length}件 / 考え直したい手 ${bad.length}件。基準を満たす候補のみ表示しています。</p>
      ${groupMarkup({
        id: "engine-good-candidate-heading",
        title: "良かった手",
        description: "評価を保った・改善した、またはEngine最善候補と一致した局面などを最大5件表示します。",
        candidates: good,
        group: ENGINE_CANDIDATE_GROUP.GOOD
      })}
      ${groupMarkup({
        id: "engine-bad-candidate-heading",
        title: "考え直したい手",
        description: "実戦手とEngine推奨手の差が大きい局面などを最大5件表示します。",
        candidates: bad,
        group: ENGINE_CANDIDATE_GROUP.BAD
      })}`;
  }
}
