function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function block(title, value) {
  const text = String(value ?? "").trim();
  return `<section class="final-report-block"><h3>${escapeHtml(title)}</h3>${text ? `<p>${escapeHtml(text)}</p>` : '<p class="empty-text">未記入</p>'}</section>`;
}

export class BrowserFinalReportView {
  constructor({ documentObject = document } = {}) {
    this.container = documentObject.getElementById("final-report-preview");
    if (!this.container) throw new Error("必要な最終レポート要素がありません: #final-report-preview");
  }

  render(input = {}) {
    const keyPositions = (input.keyPositions ?? []).filter((item) => String(item.moveNumber ?? "").trim());
    const actionRules = (input.actionRules ?? []).filter((item) => String(item ?? "").trim());
    const kp = keyPositions.length
      ? keyPositions.map((item, index) => `<article class="final-key-position"><strong>重要局面 ${index + 1}｜${escapeHtml(item.moveNumber)}手目 ${escapeHtml(item.moveText)}</strong><p>FACT：${escapeHtml(item.fact || "未記入")}</p><p>INTERPRETATION：${escapeHtml(item.interpretation || "未記入")}</p><p>HYPOTHESIS：${escapeHtml(item.hypothesis || "未記入")}</p></article>`).join("")
      : '<p class="empty-text">重要局面はまだありません。</p>';
    const rules = actionRules.length ? `<ol>${actionRules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}</ol>` : '<p class="empty-text">未記入</p>';
    this.container.innerHTML = `
      <div class="final-report-summary"><strong>${escapeHtml(input.gameDate || "日時未設定")}</strong><span>${escapeHtml(input.side || "")} / ${escapeHtml(input.result || "")}</span><span>先手：${escapeHtml(input.senteName || "未記入")}／後手：${escapeHtml(input.goteName || "未記入")}</span><span>${escapeHtml(input.opponentName || "対局相手未記入")}</span></div>
      ${block("振り返り", input.gameStory)}
      <section class="final-report-block"><h3>重要局面</h3>${kp}</section>
      ${block("判断パターン", input.decisionPattern)}
      ${block("次局の観察テーマ", input.observationTheme)}
      <section class="final-report-block"><h3>実行Rule</h3>${rules}</section>
      <details class="final-kifu"><summary>棋譜本文を表示</summary><pre>${escapeHtml(input.kifuText)}</pre></details>`;
  }
}
