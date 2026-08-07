import {
  ERROR_CODES,
  createApplicationError,
  wrapUnexpectedError
} from "./DiagnosisErrors.js";
import {
  assertDiagnosisBrowserController
} from "./DiagnosisBrowserController.js";
import {
  assertPlannedOperationCsvImportController
} from "./PlannedOperationCsvImportController.js";
import {
  assertEntityCsvImportController
} from "./EntityCsvImportController.js";
import {
  assertDiagnosisBackupController
} from "./DiagnosisBackupController.js";
import {
  assertDiagnosisExecutionDataJsonImportController
} from "./DiagnosisExecutionDataJsonImportController.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatNumber(value) {
  if (value === null || value === undefined) return "未確認";
  if (typeof value !== "number" || !Number.isFinite(value)) return escapeHtml(value);
  return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 3 }).format(value);
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function badgeHtml(badge, className) {
  if (!badge) return `<span class="badge badge-muted">未診断</span>`;
  return `<span class="badge badge-${escapeHtml(badge.tone)} ${className}">${escapeHtml(badge.label)}</span>`;
}

function optionHtml(value, label, selected) {
  return `<option value="${escapeHtml(value)}"${selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function quantityRows(summary) {
  const totals = summary?.quantityTotalsByUnit ?? {};
  const entries = Object.entries(totals);
  if (entries.length === 0) {
    return `<tr><td colspan="6" class="empty-cell">数量集計はありません。</td></tr>`;
  }
  return entries.map(([unit, row]) => `
    <tr>
      <th scope="row">${escapeHtml(unit)}</th>
      <td>${formatNumber(row.plannedQuantity)}</td>
      <td>${formatNumber(row.capacityExecutableQuantity)}</td>
      <td>${formatNumber(row.diagnosedExecutableQuantity)}</td>
      <td>${formatNumber(row.diagnosedShortageQuantity)}</td>
      <td>${formatNumber(row.unknownPlannedQuantity)}</td>
    </tr>`).join("");
}


function formatDelta(value, suffix = "") {
  if (value === null || value === undefined) return "比較不能";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value)}${suffix}`;
}

function comparisonOperationRows(comparison) {
  const rows = comparison?.comparison?.operationComparisons ?? [];
  if (rows.length === 0) {
    return `<tr><td colspan="8" class="empty-cell">比較対象のOperation差分はありません。</td></tr>`;
  }
  return rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.plannedOperationId)}</td>
      <td>${escapeHtml(row.beforeStatus ?? "—")}</td>
      <td>${escapeHtml(row.afterStatus ?? "—")}</td>
      <td><span class="badge badge-muted">${escapeHtml(row.outcome)}</span></td>
      <td>${formatDelta(row.deltas.diagnosedExecutableQuantity)}</td>
      <td>${formatDelta(row.deltas.diagnosedShortageQuantity)}</td>
      <td>${formatDelta(row.deltas.shortageMinutes, "分")}</td>
      <td>${row.primaryReasonChanged ? `${escapeHtml(row.beforePrimaryReasonCode ?? "—")} → ${escapeHtml(row.afterPrimaryReasonCode ?? "—")}` : "変化なし"}</td>
    </tr>`).join("");
}

function scenarioComparisonHtml(state) {
  const wrapper = state?.comparison ?? null;
  if (wrapper === null) return "";
  if (wrapper.comparisonAvailable !== true) {
    if (wrapper.reasonCode === "BASE_SCENARIO_NOT_CONFIGURED") return "";
    return `
      <section class="panel comparison-panel" aria-labelledby="comparison-title">
        <div class="section-heading"><div><p class="step-label">Scenario比較</p><h2 id="comparison-title">基準Scenarioとの差を確認する</h2></div></div>
        <div class="notice notice-info">${escapeHtml(wrapper.message ?? "比較結果を作成できません。")}</div>
      </section>`;
  }

  const comparison = wrapper.comparison;
  const deltas = comparison.summaryDeltas;
  const quantityPiece = deltas.quantityTotalsByUnit?.PIECE ?? {};
  return `
    <section class="panel comparison-panel" aria-labelledby="comparison-title">
      <div class="section-heading">
        <div><p class="step-label">Scenario比較</p><h2 id="comparison-title">基準Scenarioとの差を確認する</h2></div>
        ${badgeHtml(state.comparisonBadge, "comparison-badge")}
      </div>
      <p class="subtext"><strong>比較元：</strong>${escapeHtml(comparison.baseScenario.name)} ／ <strong>比較先：</strong>${escapeHtml(comparison.comparisonScenario.name)}</p>
      <p class="comparison-change"><strong>変更内容：</strong>${escapeHtml(comparison.changeSummary || "変更概要未記載")}</p>
      <div class="notice notice-warning">この表示はScenario間の結果差です。変更内容が結果差の原因であることを、単独で証明するものではありません。</div>
      <div class="metric-grid comparison-metrics">
        <div class="metric"><span>変化したOperation</span><strong>${formatNumber(comparison.changedOperationCount)}件</strong></div>
        <div class="metric"><span>実行可能数量差（PIECE）</span><strong>${formatDelta(quantityPiece.diagnosedExecutableQuantity)}</strong></div>
        <div class="metric"><span>不足数量差（PIECE）</span><strong>${formatDelta(quantityPiece.diagnosedShortageQuantity)}</strong></div>
        <div class="metric"><span>不足時間差</span><strong>${formatDelta(deltas.minutesSummary.knownShortageMinutes, "分")}</strong></div>
        <div class="metric"><span>要対応Operation差</span><strong>${formatDelta(deltas.requiresActionOperationCount)}</strong></div>
        <div class="metric"><span>Open確認項目差</span><strong>${formatDelta(deltas.nextCheckSummary.openNextCheckCount)}</strong></div>
      </div>
      <div class="table-scroll">
        <table>
          <caption>Operation別のScenario差分</caption>
          <thead><tr><th>Operation</th><th>比較元Status</th><th>比較先Status</th><th>判定</th><th>実行可能数量差</th><th>不足数量差</th><th>不足時間差</th><th>主要理由</th></tr></thead>
          <tbody>${comparisonOperationRows(wrapper)}</tbody>
        </table>
      </div>
    </section>`;
}

function operationRows(detail) {
  const rows = detail?.operationResults ?? [];
  if (rows.length === 0) {
    return `<tr><td colspan="10" class="empty-cell">Operation診断結果はありません。</td></tr>`;
  }
  return rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.plannedDate)}</td>
      <td>${escapeHtml(row.plannedOperationId)}</td>
      <td>${escapeHtml(row.orderId)}</td>
      <td>${escapeHtml(row.equipmentId)}</td>
      <td>${formatNumber(row.plannedQuantity)} ${escapeHtml(row.quantityUnit)}</td>
      <td>${formatNumber(row.diagnosedExecutableQuantity)}</td>
      <td>${formatNumber(row.diagnosedShortageQuantity)}</td>
      <td>${formatNumber(row.requiredMinutes)}</td>
      <td>${formatNumber(row.allocatedMinutes)}</td>
      <td><span class="status-code status-${escapeHtml(String(row.status).toLowerCase())}">${escapeHtml(row.status)}</span></td>
    </tr>`).join("");
}

function actionRows(actionItems) {
  if (!Array.isArray(actionItems) || actionItems.length === 0) {
    return `<tr><td colspan="8" class="empty-cell">現在、表示対象の要対応項目はありません。</td></tr>`;
  }
  return actionItems.map((item) => `
    <tr class="${item.overdue ? "row-overdue" : ""}">
      <td>${item.overdue ? '<span class="badge badge-danger">期限超過</span>' : "—"}</td>
      <td>${escapeHtml(item.type)}</td>
      <td>${escapeHtml(item.priority)}</td>
      <td>${escapeHtml(item.plannedOperationId)}</td>
      <td><strong>${escapeHtml(item.title)}</strong><br><span class="subtext">${escapeHtml(item.description)}</span></td>
      <td>${escapeHtml(item.owner ?? "未設定")}</td>
      <td>${escapeHtml(item.dueDate ?? "未設定")}</td>
      <td>${escapeHtml(item.recommendedAction ?? "—")}</td>
    </tr>`).join("");
}

function noticeHtml(state) {
  const parts = [];
  if (state.message) {
    parts.push(`<div class="notice notice-info" role="status">${escapeHtml(state.message)}</div>`);
  }
  if (state.error) {
    parts.push(`
      <div class="notice notice-error" role="alert">
        <strong>処理に失敗しました：${escapeHtml(state.error.code)}</strong>
        <p>${escapeHtml(state.error.message)}</p>
      </div>`);
  }
  if (state.diagnosisBadge?.guidance) {
    parts.push(`<div class="notice notice-${escapeHtml(state.diagnosisBadge.tone)}">${escapeHtml(state.diagnosisBadge.guidance)}</div>`);
  }
  if (state.validityBadge?.guidance) {
    parts.push(`<div class="notice notice-${escapeHtml(state.validityBadge.tone)}">${escapeHtml(state.validityBadge.guidance)}</div>`);
  }
  return parts.join("");
}

function importStatusTone(status) {
  return {
    ADD: "success",
    UPDATE: "warning",
    UNCHANGED: "muted",
    DUPLICATE: "danger",
    ERROR: "danger"
  }[status] ?? "muted";
}

function importPreviewRows(preview) {
  const rows = preview?.rows ?? [];
  if (rows.length === 0) {
    return `<tr><td colspan="5" class="empty-cell">Preview行はありません。</td></tr>`;
  }
  return rows.map((row) => `
    <tr>
      <td>${formatNumber(row.rowNumber)}</td>
      <td>${escapeHtml(row.plannedOperationId ?? "—")}</td>
      <td><span class="badge badge-${importStatusTone(row.previewStatus)}">${escapeHtml(row.previewStatus)}</span></td>
      <td>${escapeHtml(row.normalizedData?.plannedDate ?? "—")}</td>
      <td>${row.issues.length === 0 ? "—" : row.issues.map((issue) => `<div><strong>${escapeHtml(issue.issueCode)}</strong> ${escapeHtml(issue.message)}</div>`).join("")}</td>
    </tr>`).join("");
}

function importIssueRows(preview) {
  const issues = [
    ...(preview?.issues ?? []),
    ...(preview?.rows ?? []).flatMap((row) => row.issues ?? [])
  ];
  if (issues.length === 0) {
    return `<tr><td colspan="5" class="empty-cell">Error・Warningはありません。</td></tr>`;
  }
  return issues.map((issue) => `
    <tr>
      <td>${escapeHtml(issue.severity)}</td>
      <td>${escapeHtml(issue.rowNumber ?? "全体")}</td>
      <td>${escapeHtml(issue.columnName ?? "—")}</td>
      <td>${escapeHtml(issue.issueCode)}</td>
      <td>${escapeHtml(issue.message)}</td>
    </tr>`).join("");
}

function importPanelHtml(importState, selectedPlanVersionId, dashboardLoading) {
  if (importState === null) return "";
  const preview = importState.preview;
  const counts = preview?.counts ?? {};
  const importBusy = ["PREVIEWING", "COMMITTING"].includes(importState.screenStatus);
  const disabled = dashboardLoading || importBusy || selectedPlanVersionId === null;
  return `
    <section class="panel import-panel" aria-labelledby="import-title">
      <div class="section-heading">
        <div><p class="step-label">STEP 1.5</p><h2 id="import-title">Planned Operation CSVを取り込む</h2></div>
        <span class="revision">Import Revision ${formatNumber(importState.revision)}</span>
      </div>
      <p class="subtext">対象Plan Version：<strong>${escapeHtml(selectedPlanVersionId ?? "未選択")}</strong>。File選択だけでは保存されません。Previewを確認してから確定します。</p>
      ${importState.message ? `<div class="notice ${importState.screenStatus === "COMMITTED" ? "notice-success" : "notice-info"}" role="status">${escapeHtml(importState.message)}</div>` : ""}
      ${importState.error ? `<div class="notice notice-error" role="alert"><strong>${escapeHtml(importState.error.code)}</strong><p>${escapeHtml(importState.error.message)}</p></div>` : ""}
      <div class="import-controls">
        <label>CSV File
          <input type="file" accept=".csv,text/csv" data-action="import-file" ${disabled ? "disabled" : ""}>
        </label>
        <button type="button" class="button button-primary" data-action="commit-import" ${!importState.canCommit || disabled ? "disabled" : ""}>Preview内容を保存</button>
        <button type="button" class="button button-secondary" data-action="clear-import" ${importBusy ? "disabled" : ""}>Previewをクリア</button>
        <a class="button button-link" href="./planned-operations-template.csv" download>CSV Template</a>
      </div>
      ${preview ? `
        <div class="metric-grid import-metrics">
          <div class="metric"><span>追加</span><strong>${formatNumber(counts.add ?? 0)}</strong></div>
          <div class="metric"><span>更新</span><strong>${formatNumber(counts.update ?? 0)}</strong></div>
          <div class="metric"><span>変更なし</span><strong>${formatNumber(counts.unchanged ?? 0)}</strong></div>
          <div class="metric"><span>Error</span><strong>${formatNumber(counts.errors ?? 0)}</strong></div>
        </div>
        <div class="table-scroll import-table">
          <table>
            <caption>Import Preview：${escapeHtml(preview.fileName || "名称なし")}</caption>
            <thead><tr><th>行</th><th>Operation ID</th><th>Status</th><th>計画日</th><th>Issue</th></tr></thead>
            <tbody>${importPreviewRows(preview)}</tbody>
          </table>
        </div>
        <details class="import-issues" ${counts.errors > 0 ? "open" : ""}>
          <summary>Error・Warning一覧</summary>
          <div class="table-scroll">
            <table>
              <thead><tr><th>Severity</th><th>行</th><th>Column</th><th>Code</th><th>内容</th></tr></thead>
              <tbody>${importIssueRows(preview)}</tbody>
            </table>
          </div>
        </details>` : ""}
    </section>`;
}

function entityImportPreviewRows(preview, dateField = null) {
  const rows = preview?.rows ?? [];
  if (rows.length === 0) {
    return `<tr><td colspan="5" class="empty-cell">Preview行はありません。</td></tr>`;
  }
  return rows.map((row) => `
    <tr>
      <td>${formatNumber(row.rowNumber)}</td>
      <td>${escapeHtml(row.entityId ?? "—")}</td>
      <td><span class="badge badge-${importStatusTone(row.previewStatus)}">${escapeHtml(row.previewStatus)}</span></td>
      <td>${escapeHtml(dateField ? (row.normalizedData?.[dateField] ?? "—") : (row.normalizedData?.targetType ?? row.normalizedData?.scenarioCategory ?? "—"))}</td>
      <td>${row.issues.length === 0 ? "—" : row.issues.map((issue) => `<div><strong>${escapeHtml(issue.issueCode)}</strong> ${escapeHtml(issue.message)}</div>`).join("")}</td>
    </tr>`).join("");
}

function entityImportPanelHtml(importState, selectedPlanVersionId, dashboardLoading, {
  title,
  actionPrefix,
  templateHref,
  identityLabel,
  contextLabel,
  dateField = null
}) {
  if (importState === null) return "";
  const preview = importState.preview;
  const counts = preview?.counts ?? {};
  const importBusy = ["PREVIEWING", "COMMITTING"].includes(importState.screenStatus);
  const disabled = dashboardLoading || importBusy || selectedPlanVersionId === null;
  const panelId = `${actionPrefix}-import-title`;
  return `
    <section class="panel import-panel" aria-labelledby="${escapeHtml(panelId)}">
      <div class="section-heading">
        <div><p class="step-label">STEP 1.6</p><h2 id="${escapeHtml(panelId)}">${escapeHtml(title)}</h2></div>
        <span class="revision">Import Revision ${formatNumber(importState.revision)}</span>
      </div>
      <p class="subtext">対象Plan Version：<strong>${escapeHtml(selectedPlanVersionId ?? "未選択")}</strong>。File選択だけでは保存されません。</p>
      ${importState.message ? `<div class="notice ${importState.screenStatus === "COMMITTED" ? "notice-success" : "notice-info"}" role="status">${escapeHtml(importState.message)}</div>` : ""}
      ${importState.error ? `<div class="notice notice-error" role="alert"><strong>${escapeHtml(importState.error.code)}</strong><p>${escapeHtml(importState.error.message)}</p></div>` : ""}
      <div class="import-controls">
        <label>CSV File
          <input type="file" accept=".csv,text/csv" data-action="${escapeHtml(actionPrefix)}-import-file" ${disabled ? "disabled" : ""}>
        </label>
        <button type="button" class="button button-primary" data-action="commit-${escapeHtml(actionPrefix)}-import" ${!importState.canCommit || disabled ? "disabled" : ""}>Preview内容を保存</button>
        <button type="button" class="button button-secondary" data-action="clear-${escapeHtml(actionPrefix)}-import" ${importBusy ? "disabled" : ""}>Previewをクリア</button>
        <a class="button button-link" href="${escapeHtml(templateHref)}" download>CSV Template</a>
      </div>
      ${preview ? `
        <div class="metric-grid import-metrics">
          <div class="metric"><span>追加</span><strong>${formatNumber(counts.add ?? 0)}</strong></div>
          <div class="metric"><span>更新</span><strong>${formatNumber(counts.update ?? 0)}</strong></div>
          <div class="metric"><span>変更なし</span><strong>${formatNumber(counts.unchanged ?? 0)}</strong></div>
          <div class="metric"><span>Error</span><strong>${formatNumber(counts.errors ?? 0)}</strong></div>
        </div>
        <div class="table-scroll import-table">
          <table>
            <caption>Import Preview：${escapeHtml(preview.fileName || "名称なし")}</caption>
            <thead><tr><th>行</th><th>${escapeHtml(identityLabel)}</th><th>Status</th><th>${escapeHtml(contextLabel)}</th><th>Issue</th></tr></thead>
            <tbody>${entityImportPreviewRows(preview, dateField)}</tbody>
          </table>
        </div>
        <details class="import-issues" ${counts.errors > 0 ? "open" : ""}>
          <summary>Error・Warning一覧</summary>
          <div class="table-scroll">
            <table>
              <thead><tr><th>Severity</th><th>行</th><th>Column</th><th>Code</th><th>内容</th></tr></thead>
              <tbody>${importIssueRows(preview)}</tbody>
            </table>
          </div>
        </details>` : ""}
    </section>`;
}


function externalDataImportPanelHtml(importState, dashboardLoading) {
  if (importState === null) return "";
  const preview = importState.preview;
  const busy = ["PREVIEWING", "COMMITTING"].includes(importState.screenStatus);
  const disabled = dashboardLoading || busy;
  const rows = preview?.summaries ?? [];
  return `
    <section class="panel import-panel" aria-labelledby="external-data-import-title">
      <div class="section-heading">
        <div><p class="step-label">外部Read Data</p><h2 id="external-data-import-title">DAY29外部Data JSONを取り込む</h2></div>
        <span class="revision">Import Revision ${formatNumber(importState.revision)}</span>
      </div>
      <p class="subtext">Capacity Snapshot、Equipment、Order、Routing、Shift、Capacity Ruleを一括検証します。File選択だけでは保存されません。</p>
      ${importState.message ? `<div class="notice ${importState.screenStatus === "COMMITTED" ? "notice-success" : "notice-info"}" role="status">${escapeHtml(importState.message)}</div>` : ""}
      ${importState.error ? `<div class="notice notice-error" role="alert"><strong>${escapeHtml(importState.error.code)}</strong><p>${escapeHtml(importState.error.message)}</p></div>` : ""}
      <div class="import-controls">
        <label>外部Data JSON
          <input type="file" accept=".json,application/json" data-action="external-data-import-file" ${disabled ? "disabled" : ""}>
        </label>
        <button type="button" class="button button-primary" data-action="commit-external-data-import" ${!importState.canCommit || disabled ? "disabled" : ""}>Preview内容を保存</button>
        <button type="button" class="button button-secondary" data-action="clear-external-data-import" ${busy ? "disabled" : ""}>Previewをクリア</button>
        <a class="button button-link" href="./diagnosis-execution-data-template.json" download>JSON Template</a>
      </div>
      ${preview ? `
        <div class="metric-grid import-metrics">
          <div class="metric"><span>Package件数</span><strong>${formatNumber(preview.count)}</strong></div>
          <div class="metric"><span>Source Revision</span><strong>${formatNumber(preview.providerRevision)}</strong></div>
        </div>
        <div class="table-scroll import-table">
          <table>
            <caption>外部Data Preview：${escapeHtml(importState.fileName || "名称なし")}</caption>
            <thead><tr><th>Capacity Scenario</th><th>対象月</th><th>生成日時</th><th>Bucket</th><th>設備</th><th>Order</th><th>Routing</th><th>Capacity Rule</th></tr></thead>
            <tbody>${rows.length === 0 ? `<tr><td colspan="8" class="empty-cell">外部Dataはありません。</td></tr>` : rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.capacityScenarioId)}</td>
                <td>${escapeHtml(row.targetMonth)}</td>
                <td>${formatDateTime(row.generatedAt)}</td>
                <td>${formatNumber(row.bucketCount)}</td>
                <td>${formatNumber(row.equipmentCount)}</td>
                <td>${formatNumber(row.orderCount)}</td>
                <td>${formatNumber(row.routingOperationCount)}</td>
                <td>${formatNumber(row.capacityRuleCount)}</td>
              </tr>`).join("")}</tbody>
          </table>
        </div>` : ""}
    </section>`;
}

function backupPanelHtml(backupState, dashboardLoading) {
  if (backupState === null) return "";
  const busy = ["SAVING", "RESTORING"].includes(backupState.screenStatus);
  const disabled = dashboardLoading || busy;
  const downloadHref = backupState.backupJson
    ? `data:application/json;charset=utf-8,${encodeURIComponent(backupState.backupJson)}`
    : null;
  return `
    <section class="panel backup-panel" aria-labelledby="backup-title">
      <div class="section-heading">
        <div><p class="step-label">保存・復元</p><h2 id="backup-title">Browser保存とBackup</h2></div>
        <span class="revision">Backup Revision ${formatNumber(backupState.revision)}</span>
      </div>
      <p class="subtext">Browser保存は同じ端末・同じBrowserでの継続用です。重要DataはBackup JSONもDownloadして別の場所へ保管してください。</p>
      ${backupState.message ? `<div class="notice ${backupState.screenStatus === "ERROR" ? "notice-error" : "notice-info"}" role="status">${escapeHtml(backupState.message)}</div>` : ""}
      ${backupState.error ? `<div class="notice notice-error" role="alert"><strong>${escapeHtml(backupState.error.code)}</strong><p>${escapeHtml(backupState.error.message)}</p></div>` : ""}
      <div class="import-controls">
        <button type="button" class="button button-primary" data-action="save-browser-data" ${disabled ? "disabled" : ""}>現在DataをBrowserへ保存</button>
        <button type="button" class="button button-secondary" data-action="create-backup" ${disabled ? "disabled" : ""}>Backup JSONを作成</button>
        ${downloadHref ? `<a class="button button-link" href="${escapeHtml(downloadHref)}" download="${escapeHtml(backupState.backupFileName ?? "DAY30-backup.json")}">Backup JSONをDownload</a>` : ""}
        <label>Backup JSONを復元
          <input type="file" accept=".json,application/json" data-action="restore-backup-file" ${disabled ? "disabled" : ""}>
        </label>
        <button type="button" class="button button-danger" data-action="clear-browser-storage" ${disabled || !backupState.hasStoredSnapshot ? "disabled" : ""}>Browser保存Dataを削除</button>
      </div>
      <p class="subtext">最終保存：${formatDateTime(backupState.lastSavedAt)} ／ 最終復元：${formatDateTime(backupState.lastRestoredAt)}</p>
    </section>`;
}

export function buildDiagnosisDashboardHtml(state, importState = null, supplementalImportStates = {}) {
  const plans = state?.plans ?? [];
  const scenarios = state?.scenarios ?? [];
  const detail = state?.detail ?? null;
  const summary = detail?.summary ?? state?.overview?.latestDiagnosis ?? null;
  const minutes = summary?.minutesSummary ?? {};
  const statusCounts = summary?.statusCounts ?? {};
  const loading = state?.screenStatus === "LOADING";

  return `
    <div class="dashboard-shell" data-screen-status="${escapeHtml(state?.screenStatus ?? "IDLE")}">
      <header class="dashboard-header">
        <div>
          <p class="eyebrow">100アプリチャレンジ DAY30</p>
          <h1>生産計画診断 Dashboard</h1>
          <p class="lead">計画と現実Capacityを比較し、無理・不足・未確認条件を根拠付きで表示します。</p>
        </div>
        <div class="header-actions">
          <button type="button" class="button button-secondary" data-action="refresh" ${loading ? "disabled" : ""}>再読込</button>
          <button type="button" class="button button-primary" data-action="run-diagnosis" ${!state?.canRunDiagnosis || loading ? "disabled" : ""}>診断を実行</button>
        </div>
      </header>

      ${loading ? `<div class="loading-bar" role="status">処理中：${escapeHtml(state.busyAction ?? "LOADING")}</div>` : ""}
      ${noticeHtml(state ?? {})}

      <section class="panel controls-panel" aria-labelledby="selection-title">
        <div class="section-heading">
          <div><p class="step-label">STEP 1</p><h2 id="selection-title">診断対象を選ぶ</h2></div>
          <span class="revision">画面Revision ${formatNumber(state?.revision ?? 0)}</span>
        </div>
        <div class="control-grid">
          <label>Production Plan
            <select data-action="select-plan" ${plans.length === 0 || loading ? "disabled" : ""}>
              ${plans.length === 0 ? optionHtml("", "Planがありません", true) : plans.map((plan) => optionHtml(plan.planId, `${plan.name}（${plan.targetMonth ?? "対象月未設定"}）`, plan.planId === state.selectedPlanId)).join("")}
            </select>
          </label>
          <label>Diagnosis Scenario
            <select data-action="select-scenario" ${scenarios.length === 0 || loading ? "disabled" : ""}>
              ${scenarios.length === 0 ? optionHtml("", "Scenarioがありません", true) : scenarios.map((scenario) => optionHtml(scenario.diagnosisScenarioId, scenario.name, scenario.diagnosisScenarioId === state.selectedScenarioId)).join("")}
            </select>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" data-action="toggle-closed" ${state?.filters?.includeClosedActionItems ? "checked" : ""} ${loading ? "disabled" : ""}>
            完了済みの確認項目も表示
          </label>
        </div>
      </section>

      ${importPanelHtml(importState, state?.selectedPlanVersionId ?? null, loading)}
      ${entityImportPanelHtml(
        supplementalImportStates.assumption ?? null,
        state?.selectedPlanVersionId ?? null,
        loading,
        {
          title: "Assumption CSVを取り込む",
          actionPrefix: "assumption",
          templateHref: "./assumptions-template.csv",
          identityLabel: "Assumption ID",
          contextLabel: "Target Type"
        }
      )}
      ${entityImportPanelHtml(
        supplementalImportStates.diagnosisScenario ?? null,
        state?.selectedPlanVersionId ?? null,
        loading,
        {
          title: "Diagnosis Scenario CSVを取り込む",
          actionPrefix: "scenario",
          templateHref: "./diagnosis-scenarios-template.csv",
          identityLabel: "Scenario ID",
          contextLabel: "Category",
          dateField: "createdAt"
        }
      )}
      ${entityImportPanelHtml(
        supplementalImportStates.scenarioAssumptionRelation ?? null,
        state?.selectedPlanVersionId ?? null,
        loading,
        {
          title: "Scenario–Assumption Relation CSVを取り込む",
          actionPrefix: "relation",
          templateHref: "./scenario-assumption-relations-template.csv",
          identityLabel: "Relation ID",
          contextLabel: "Scenario ID",
          dateField: "diagnosisScenarioId"
        }
      )}
      ${externalDataImportPanelHtml(supplementalImportStates.externalData ?? null, loading)}
      ${backupPanelHtml(supplementalImportStates.backup ?? null, loading)}

      <section class="status-grid" aria-label="診断状態">
        <article class="status-card"><span>Diagnosis Status</span>${badgeHtml(state?.diagnosisBadge, "diagnosis-badge")}</article>
        <article class="status-card"><span>Result Validity</span>${badgeHtml(state?.validityBadge, "validity-badge")}</article>
        <article class="status-card"><span>診断日時</span><strong>${formatDateTime(detail?.metadata?.diagnosedAt ?? state?.overview?.latestDiagnosis?.diagnosedAt)}</strong></article>
        <article class="status-card ${state?.requiresAttention ? "attention-card" : ""}"><span>要対応Operation</span><strong>${formatNumber(summary?.requiresActionOperationCount ?? 0)}件</strong></article>
      </section>

      <section class="panel" aria-labelledby="summary-title">
        <div class="section-heading"><div><p class="step-label">STEP 2</p><h2 id="summary-title">全体Summaryを読む</h2></div></div>
        <div class="metric-grid">
          <div class="metric"><span>実行可能</span><strong>${formatNumber(statusCounts.FEASIBLE ?? 0)}</strong></div>
          <div class="metric"><span>一部実行可能</span><strong>${formatNumber(statusCounts.PARTIALLY_FEASIBLE ?? 0)}</strong></div>
          <div class="metric"><span>実行不可能</span><strong>${formatNumber(statusCounts.INFEASIBLE ?? 0)}</strong></div>
          <div class="metric"><span>判断不能</span><strong>${formatNumber(statusCounts.UNKNOWN ?? 0)}</strong></div>
          <div class="metric"><span>必要時間</span><strong>${formatNumber(minutes.knownRequiredMinutes)}分</strong></div>
          <div class="metric"><span>割当時間</span><strong>${formatNumber(minutes.knownAllocatedMinutes)}分</strong></div>
          <div class="metric"><span>不足時間</span><strong>${formatNumber(minutes.knownShortageMinutes)}分</strong></div>
          <div class="metric"><span>Action Item</span><strong>${formatNumber(state?.actionItems?.length ?? 0)}件</strong></div>
        </div>
        <div class="table-scroll"><table><caption>数量単位別の診断集計</caption><thead><tr><th>単位</th><th>計画</th><th>Capacity上可能</th><th>最終可能</th><th>確定不足</th><th>判断不能対象</th></tr></thead><tbody>${quantityRows(summary)}</tbody></table></div>
      </section>

      ${scenarioComparisonHtml(state)}

      <section class="panel" aria-labelledby="operation-title">
        <div class="section-heading"><div><p class="step-label">STEP 3</p><h2 id="operation-title">Operationごとの理由を確認する</h2></div></div>
        <div class="table-scroll"><table><thead><tr><th>日付</th><th>Operation</th><th>Order</th><th>設備</th><th>計画数量</th><th>実行可能</th><th>不足</th><th>必要分</th><th>割当分</th><th>Status</th></tr></thead><tbody>${operationRows(detail)}</tbody></table></div>
      </section>

      <section class="panel" aria-labelledby="action-title">
        <div class="section-heading"><div><p class="step-label">STEP 4</p><h2 id="action-title">次に確認・修正すること</h2></div></div>
        <div class="table-scroll"><table><thead><tr><th>期限</th><th>種別</th><th>優先度</th><th>Operation</th><th>内容</th><th>担当</th><th>確認期限</th><th>推奨Action</th></tr></thead><tbody>${actionRows(state?.actionItems ?? [])}</tbody></table></div>
      </section>

      <footer class="dashboard-footer"><p><strong>判断Rule：</strong>UNKNOWNは0でも実行不可能でもありません。STALEは変更理由を確認して再診断してください。</p></footer>
    </div>`;
}

function assertDocument(value) {
  if (value === null || typeof value !== "object" || typeof value.querySelector !== "function") {
    throw createApplicationError(ERROR_CODES.INVALID_DIAGNOSIS_DOM_RENDERER, "document must implement querySelector().", {});
  }
  return value;
}

export class DiagnosisDashboardDomRenderer {
  #document;
  #controller;
  #importController;
  #assumptionImportController;
  #diagnosisScenarioImportController;
  #scenarioAssumptionRelationImportController;
  #executionDataImportController;
  #backupController;
  #rootSelector;
  #root = null;
  #mounted = false;
  #lastTask = Promise.resolve();

  constructor({
    document,
    controller,
    importController = null,
    assumptionImportController = null,
    diagnosisScenarioImportController = null,
    scenarioAssumptionRelationImportController = null,
    executionDataImportController = null,
    backupController = null,
    rootSelector = "#app"
  } = {}) {
    this.#document = assertDocument(document);
    this.#controller = assertDiagnosisBrowserController(controller);
    this.#importController = importController === null
      ? null
      : assertPlannedOperationCsvImportController(importController);
    this.#assumptionImportController = assumptionImportController === null
      ? null
      : assertEntityCsvImportController(assumptionImportController);
    this.#diagnosisScenarioImportController = diagnosisScenarioImportController === null
      ? null
      : assertEntityCsvImportController(diagnosisScenarioImportController);
    this.#scenarioAssumptionRelationImportController = scenarioAssumptionRelationImportController === null
      ? null
      : assertEntityCsvImportController(scenarioAssumptionRelationImportController);
    this.#executionDataImportController = executionDataImportController === null
      ? null
      : assertDiagnosisExecutionDataJsonImportController(executionDataImportController);
    this.#backupController = backupController === null
      ? null
      : assertDiagnosisBackupController(backupController);
    this.#rootSelector = rootSelector;
    Object.freeze(this);
  }

  mount() {
    if (this.#mounted) return this;
    const root = this.#document.querySelector(this.#rootSelector);
    if (!root || typeof root.addEventListener !== "function") {
      throw createApplicationError(ERROR_CODES.DIAGNOSIS_DOM_ROOT_NOT_FOUND, "Dashboard root element was not found.", { rootSelector: this.#rootSelector });
    }
    this.#root = root;
    root.addEventListener("click", (event) => this.#handleClick(event));
    root.addEventListener("change", (event) => this.#handleChange(event));
    this.#mounted = true;
    this.render();
    return this;
  }

  async start(filters = {}) {
    this.mount();
    return this.#executeDashboard(() => this.#controller.initialize(filters));
  }

  render(state = this.#controller.getState()) {
    if (!this.#root) return state;
    this.#root.innerHTML = buildDiagnosisDashboardHtml(
      state,
      this.#importController?.getState() ?? null,
      {
        assumption: this.#assumptionImportController?.getState() ?? null,
        diagnosisScenario: this.#diagnosisScenarioImportController?.getState() ?? null,
        scenarioAssumptionRelation: this.#scenarioAssumptionRelationImportController?.getState() ?? null,
        externalData: this.#executionDataImportController?.getState() ?? null,
        backup: this.#backupController?.getState() ?? null
      }
    );
    return state;
  }

  whenIdle() { return this.#lastTask; }

  #executeDashboard(action, { persistAfter = false } = {}) {
    let task;
    try {
      task = action();
      this.render(this.#controller.getState());
    } catch (error) {
      task = Promise.reject(error);
    }
    this.#lastTask = Promise.resolve(task)
      .catch((error) => { throw wrapUnexpectedError(error, { component: "DiagnosisDashboardDomRenderer" }); })
      .then(async (state) => {
        for (const importController of [
          this.#importController,
          this.#assumptionImportController,
          this.#diagnosisScenarioImportController,
          this.#scenarioAssumptionRelationImportController
        ]) {
          const importState = importController?.getState();
          if (
            importState?.expectedPlanVersionId &&
            importState.expectedPlanVersionId !== state.selectedPlanVersionId
          ) {
            importController.reset({ message: "Plan Versionが変わったため、以前のImport Previewをクリアしました。" });
          }
        }
        if (persistAfter && this.#backupController !== null) {
          this.#backupController.saveNow();
        }
        this.render(state);
        return state;
      });
    return this.#lastTask;
  }

  #executeImport(importController, action, { refreshDashboard = false } = {}) {
    if (importController === null) return Promise.resolve(null);
    let task;
    try {
      task = action();
      this.render();
    } catch (error) {
      task = Promise.resolve(importController.showError(error));
    }
    this.#lastTask = Promise.resolve(task)
      .then(async (importState) => {
        if (refreshDashboard && importState?.screenStatus === "COMMITTED") {
          await this.#controller.refresh();
          this.#backupController?.saveNow();
        }
        this.render();
        return importState;
      });
    return this.#lastTask;
  }

  #handleClick(event) {
    const action = event?.target?.dataset?.action;
    if (action === "refresh") {
      this.#executeDashboard(() => this.#controller.refresh());
    } else if (action === "run-diagnosis") {
      this.#executeDashboard(() => this.#controller.runDiagnosis(), { persistAfter: true });
    } else if (action === "commit-import") {
      this.#executeImport(this.#importController, () => this.#importController.commit(), { refreshDashboard: true });
    } else if (action === "clear-import") {
      this.#executeImport(this.#importController, () => this.#importController.reset());
    } else if (action === "commit-assumption-import") {
      this.#executeImport(this.#assumptionImportController, () => this.#assumptionImportController.commit(), { refreshDashboard: true });
    } else if (action === "clear-assumption-import") {
      this.#executeImport(this.#assumptionImportController, () => this.#assumptionImportController.reset());
    } else if (action === "commit-scenario-import") {
      this.#executeImport(this.#diagnosisScenarioImportController, () => this.#diagnosisScenarioImportController.commit(), { refreshDashboard: true });
    } else if (action === "clear-scenario-import") {
      this.#executeImport(this.#diagnosisScenarioImportController, () => this.#diagnosisScenarioImportController.reset());
    } else if (action === "commit-relation-import") {
      this.#executeImport(this.#scenarioAssumptionRelationImportController, () => this.#scenarioAssumptionRelationImportController.commit(), { refreshDashboard: true });
    } else if (action === "clear-relation-import") {
      this.#executeImport(this.#scenarioAssumptionRelationImportController, () => this.#scenarioAssumptionRelationImportController.reset());
    } else if (action === "commit-external-data-import") {
      this.#executeImport(this.#executionDataImportController, () => this.#executionDataImportController.commit(), { refreshDashboard: true });
    } else if (action === "clear-external-data-import") {
      this.#executeImport(this.#executionDataImportController, () => this.#executionDataImportController.reset());
    } else if (action === "save-browser-data") {
      this.#backupController?.saveNow();
      this.render();
    } else if (action === "create-backup") {
      this.#backupController?.createBackup();
      this.render();
    } else if (action === "clear-browser-storage") {
      this.#backupController?.clearStorage();
      this.render();
    }
  }

  #handleChange(event) {
    const target = event?.target;
    const action = target?.dataset?.action;
    if (action === "select-plan" && target.value) {
      this.#executeDashboard(() => this.#controller.selectPlan(target.value));
    } else if (action === "select-scenario" && target.value) {
      this.#executeDashboard(() => this.#controller.selectScenario(target.value));
    } else if (action === "toggle-closed") {
      this.#executeDashboard(() => this.#controller.refreshActionItems({ includeClosed: Boolean(target.checked) }));
    } else if (action === "import-file") {
      const file = target.files?.[0] ?? null;
      if (file === null || this.#importController === null) return;
      const expectedPlanVersionId = this.#controller.getState().selectedPlanVersionId;
      this.#executeImport(this.#importController, async () => {
        try {
          if (typeof file.text !== "function") {
            throw createApplicationError(ERROR_CODES.INVALID_CSV_TEXT, "Selected File cannot be read as text.", { fileName: file.name ?? "" });
          }
          const csvText = await file.text();
          return this.#importController.previewCsv({
            csvText,
            fileName: file.name ?? "",
            expectedPlanVersionId
          });
        } catch (error) {
          return this.#importController.showError(error, { message: "CSV Fileを読み込めませんでした。" });
        }
      });
    } else if (action === "assumption-import-file") {
      this.#previewSelectedFile(target, this.#assumptionImportController);
    } else if (action === "scenario-import-file") {
      this.#previewSelectedFile(target, this.#diagnosisScenarioImportController);
    } else if (action === "relation-import-file") {
      this.#previewSelectedFile(target, this.#scenarioAssumptionRelationImportController);
    } else if (action === "external-data-import-file") {
      this.#previewExternalDataFile(target);
    } else if (action === "restore-backup-file") {
      this.#restoreBackupFile(target);
    }
  }

  #previewExternalDataFile(target) {
    const file = target.files?.[0] ?? null;
    if (file === null || this.#executionDataImportController === null) return;
    this.#executeImport(this.#executionDataImportController, async () => {
      try {
        if (typeof file.text !== "function") {
          throw createApplicationError(
            ERROR_CODES.INVALID_EXTERNAL_DATA_DOCUMENT,
            "Selected File cannot be read as text.",
            { fileName: file.name ?? "" }
          );
        }
        const jsonText = await file.text();
        return this.#executionDataImportController.previewJson({
          jsonText,
          fileName: file.name ?? ""
        });
      } catch (error) {
        return this.#executionDataImportController.showError(error, {
          message: "外部Data JSONを読み込めませんでした。"
        });
      }
    });
  }

  #restoreBackupFile(target) {
    const file = target.files?.[0] ?? null;
    if (file === null || this.#backupController === null) return;
    this.#lastTask = Promise.resolve()
      .then(async () => {
        let jsonText = "";
        if (typeof file.text === "function") {
          jsonText = await file.text();
        }
        const backupState = this.#backupController.restoreBackup({
          jsonText,
          fileName: file.name ?? ""
        });
        if (backupState.screenStatus === "RESTORED") {
          await this.#controller.refresh();
        }
        this.render();
        return backupState;
      })
      .catch(() => {
        const backupState = this.#backupController.restoreBackup({
          jsonText: "",
          fileName: file.name ?? ""
        });
        this.render();
        return backupState;
      });
  }

  #previewSelectedFile(target, importController) {
    const file = target.files?.[0] ?? null;
    if (file === null || importController === null) return;
    const expectedPlanVersionId = this.#controller.getState().selectedPlanVersionId;
    this.#executeImport(importController, async () => {
      try {
        if (typeof file.text !== "function") {
          throw createApplicationError(
            ERROR_CODES.INVALID_CSV_TEXT,
            "Selected File cannot be read as text.",
            { fileName: file.name ?? "" }
          );
        }
        const csvText = await file.text();
        return importController.previewCsv({
          csvText,
          fileName: file.name ?? "",
          expectedPlanVersionId
        });
      } catch (error) {
        return importController.showError(error, { message: "CSV Fileを読み込めませんでした。" });
      }
    });
  }
}

export function assertDiagnosisDashboardDomRenderer(value) {
  if (value === null || typeof value !== "object" || typeof value.mount !== "function" || typeof value.start !== "function" || typeof value.render !== "function") {
    throw createApplicationError(ERROR_CODES.INVALID_DIAGNOSIS_DOM_RENDERER, "value does not satisfy the Diagnosis Dashboard DOM Renderer contract.", {});
  }
  return value;
}
