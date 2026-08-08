function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function textBlock(value, emptyText = "未記入") {
  const text = String(value ?? "").trim();
  return text ? `<p class="detail-text">${escapeHtml(text)}</p>` : `<p class="empty-text">${escapeHtml(emptyText)}</p>`;
}

function actionButtons(reviewId, { includeReplay = false } = {}) {
  const safeId = escapeHtml(reviewId);
  const replayButton = includeReplay
    ? `<button type="button" class="secondary-button compact-button" data-replay-review="${safeId}">棋譜再現へ</button>`
    : "";
  return `<div class="review-actions">
    ${replayButton}
    <button type="button" class="primary-button compact-button" data-edit-review="${safeId}">振り返りを開く</button>
    <button type="button" class="danger-button compact-button" data-delete-review="${safeId}">対局を削除</button>
  </div>`;
}

function exportButtons(reviewId, reflectionComplete, readyForNextGame = false) {
  const safeId = escapeHtml(reviewId);
  const canExport = reflectionComplete ?? readyForNextGame;
  const disabled = canExport ? "" : " disabled";
  const title = canExport
    ? "完成済みの振り返りMarkdownを確認します。"
    : "振り返りを完了すると書き出せます。";
  return `<div class="markdown-action-buttons" aria-label="Markdown成果物">
    <button type="button" class="secondary-button compact-button" data-preview-review-markdown="${safeId}" title="${escapeHtml(title)}"${disabled}>振り返り.md</button>
    <button type="button" class="primary-button compact-button" data-preview-observation-card="${safeId}" title="${escapeHtml(title)}"${disabled}>次局用Observation Card.md</button>
  </div>`;
}

function missingGuidance(detail) {
  const labels = {
    KEY_POSITIONS: "重要局面を3件以上記録する",
    OBSERVATION_THEME: "次局の観察テーマを1件決める",
    ACTION_RULES: "次局で守るルールを1件以上決める"
  };
  if (detail.reflectionComplete ?? detail.readyForNextGame) {
    return `<div class="reflection-guidance ready"><strong>振り返り完了</strong><p>最終レポートを書き出し、Observation Cardを作成できます。</p></div>`;
  }
  const items = detail.missingReflectionItems ?? [];
  return `<div class="reflection-guidance"><strong>${escapeHtml(detail.workflowStatusLabel)}</strong><p>棋譜は保存済みです。後から続きを入力できます。</p>${items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(labels[item] ?? item)}</li>`).join("")}</ul>` : '<p>完了条件は揃っています。「振り返りを完了する」で確定してください。</p>'}</div>`;
}

export class BrowserGameReviewLibraryView {
  constructor({ documentObject = document } = {}) {
    this.document = documentObject;
    this.list = this.#required("saved-review-list");
    this.detail = this.#required("saved-review-detail");
    this.library = this.#required("saved-review-library");
  }

  #required(id) {
    const element = this.document.getElementById(id);
    if (!element) throw new Error(`必要な画面要素がありません: #${id}`);
    return element;
  }

  renderList(viewModel) {
    if (viewModel.status === "EMPTY") {
      this.list.innerHTML = `<div class="library-empty"><strong>保存済み対局はありません</strong><p>棋譜を登録し、「対局を保存」で保存するとここから再開できます。</p></div>`;
      return;
    }

    this.list.innerHTML = viewModel.items.map((item) => `
      <article class="review-list-card" data-review-card="${escapeHtml(item.reviewId)}">
        <button type="button" class="review-card-main" data-view-review="${escapeHtml(item.reviewId)}">
          <span class="workflow-badge" data-status="${escapeHtml(item.workflowStatus)}">${escapeHtml(item.workflowStatusLabel)}</span>
          <span class="review-card-date">対局日：${escapeHtml(item.displayDate)}</span>
          <strong>対戦相手：${escapeHtml(item.opponentLabel)}</strong>
          <span class="review-card-summary"><span>自分の側：${escapeHtml(item.sideLabel)}</span><span>勝敗：${escapeHtml(item.resultLabel)}</span><span>戦型：${escapeHtml(item.openingNameLabel || "未設定")}</span><span>手数：${item.moveCount}手</span></span>
          ${item.storyExcerpt ? `<span class="review-card-excerpt">${escapeHtml(item.storyExcerpt)}</span>` : ""}
          <span class="review-card-meta">重要局面 ${item.keyPositionCount}件・実行Rule ${item.actionRuleCount}件</span>
          <span class="review-card-time">保存：${escapeHtml(item.createdAtLabel)}　更新：${escapeHtml(item.updatedAtLabel)}</span>
        </button>
        ${actionButtons(item.reviewId)}
      </article>`).join("");
  }

  renderDetail(detail) {
    const keyPositions = detail.keyPositions.length
      ? detail.keyPositions.map((item) => `
        <article class="detail-key-position">
          <div class="detail-subheading"><span>重要局面 ${item.displayNumber}</span><strong>${escapeHtml(item.moveNumber)}手目｜${escapeHtml(item.moveText || item.title)}</strong></div>
          <dl class="detail-definition-grid">
            <div><dt>事実（FACT）</dt><dd>${escapeHtml(item.fact)}</dd></div>
            <div><dt>解釈（INTERPRETATION）</dt><dd>${escapeHtml(item.interpretation)}</dd></div>
            <div><dt>仮説（HYPOTHESIS）</dt><dd>${escapeHtml(item.hypothesis)}</dd></div>
          </dl>
        </article>`).join("")
      : `<p class="empty-text">重要局面はまだ記録されていません。</p>`;

    const actionRules = detail.actionRules.length
      ? `<ol>${detail.actionRules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}</ol>`
      : `<p class="empty-text">実行Ruleはまだありません。</p>`;

    this.detail.innerHTML = `
      <div class="detail-heading-row">
        <div><p class="eyebrow">保存済み対局</p><h3>対局日：${escapeHtml(detail.displayDate)}</h3><p>${escapeHtml(detail.opponentLabel)}｜${escapeHtml(detail.sideLabel)}・${escapeHtml(detail.resultLabel)}｜${detail.moveCount}手｜戦型：${escapeHtml(detail.openingNameLabel || "未設定")}</p><span class="workflow-badge" data-status="${escapeHtml(detail.workflowStatus)}">${escapeHtml(detail.workflowStatusLabel)}</span></div>
        ${actionButtons(detail.reviewId, { includeReplay: true })}
      </div>
      <p class="detail-timestamps">保存：${escapeHtml(detail.createdAtLabel)}　更新：${escapeHtml(detail.updatedAtLabel)}</p>
      ${exportButtons(detail.reviewId, detail.reflectionComplete, detail.readyForNextGame)}
      ${missingGuidance(detail)}
      <section class="detail-section"><h4>振り返り</h4>${textBlock(detail.gameStory)}</section>
      <section class="detail-section"><h4>棋譜本文</h4><pre>${escapeHtml(detail.kifuText)}</pre></section>
      <section class="detail-section"><h4>重要局面</h4>${keyPositions}</section>
      <section class="detail-two-columns">
        <section><h4>判断パターン</h4>${textBlock(detail.decisionPattern)}</section>
        <section><h4>次局の観察テーマ</h4>${textBlock(detail.observationTheme)}</section>
      </section>
      <section class="detail-section"><h4>実行Rule</h4>${actionRules}</section>
      <section class="detail-section"><h4>自由メモ</h4>${textBlock(detail.note)}</section>`;
  }

  clearDetail() {
    this.detail.innerHTML = `<div class="library-empty"><strong>対局を選択してください</strong><p>対局カードから棋譜再現・振り返り再開・最終成果物へ進めます。</p></div>`;
  }
}
