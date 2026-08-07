import {
  IMPORT_BATCH_STATUS,
  IMPORT_ISSUE_CODE,
  IMPORT_ISSUE_SEVERITY,
  IMPORT_PREVIEW_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertCodeValue,
  assertNonEmptyString,
  createImportError
} from "./DiagnosisErrors.js";

import { assertDateTime } from "./DateTimeUtils.js";

const IDENTIFIER_PATTERN = /^\S+$/;

function assertIdentifier(value, code, label) {
  const identifier = assertNonEmptyString(value, code, label);
  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw createImportError(
      code,
      `${label} must not contain whitespace.`,
      { label, value }
    );
  }
  return identifier;
}

function cloneAndFreeze(value) {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(cloneAndFreeze));
  }
  if (value !== null && typeof value === "object") {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).map(([key, child]) => [key, cloneAndFreeze(child)])
      )
    );
  }
  return value;
}

function normalizeRepositoryRevisions(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw createImportError(
      ERROR_CODES.INVALID_IMPORT_PREVIEW,
      "repositoryRevisions must be a plain object.",
      { repositoryRevisions: value }
    );
  }

  const requiredKeys = ["planVersions", "plannedOperations"];
  const normalized = {};
  for (const key of requiredKeys) {
    const revision = value[key];
    if (!Number.isInteger(revision) || revision < 0) {
      throw createImportError(
        ERROR_CODES.INVALID_IMPORT_PREVIEW,
        `${key} revision must be a non-negative integer.`,
        { key, revision }
      );
    }
    normalized[key] = revision;
  }
  return Object.freeze(normalized);
}

export class ImportIssue {
  constructor({
    severity,
    issueCode,
    message,
    rowNumber = null,
    columnName = null,
    rawValue = null,
    details = {}
  } = {}) {
    this.severity = assertCodeValue(
      severity,
      IMPORT_ISSUE_SEVERITY,
      ERROR_CODES.INVALID_IMPORT_PREVIEW,
      "severity"
    );
    this.issueCode = assertCodeValue(
      issueCode,
      IMPORT_ISSUE_CODE,
      ERROR_CODES.INVALID_IMPORT_PREVIEW,
      "issueCode"
    );
    this.message = assertNonEmptyString(
      message,
      ERROR_CODES.INVALID_IMPORT_PREVIEW,
      "message"
    );

    if (rowNumber !== null && (!Number.isInteger(rowNumber) || rowNumber < 1)) {
      throw createImportError(
        ERROR_CODES.INVALID_IMPORT_PREVIEW,
        "rowNumber must be null or a positive integer.",
        { rowNumber }
      );
    }

    if (columnName !== null && typeof columnName !== "string") {
      throw createImportError(
        ERROR_CODES.INVALID_IMPORT_PREVIEW,
        "columnName must be null or a string.",
        { columnName }
      );
    }

    this.rowNumber = rowNumber;
    this.columnName = columnName;
    this.rawValue = rawValue;
    this.details = cloneAndFreeze(details);
    Object.freeze(this);
  }
}

function assertImportIssue(issue) {
  if (!(issue instanceof ImportIssue)) {
    throw createImportError(
      ERROR_CODES.INVALID_IMPORT_PREVIEW,
      "issue must be an ImportIssue.",
      { issue }
    );
  }
  return issue;
}

function normalizePreviewRow(row) {
  if (row === null || typeof row !== "object" || Array.isArray(row)) {
    throw createImportError(
      ERROR_CODES.INVALID_IMPORT_ROW,
      "Preview row must be a plain object.",
      { row }
    );
  }

  if (!Number.isInteger(row.rowNumber) || row.rowNumber < 1) {
    throw createImportError(
      ERROR_CODES.INVALID_IMPORT_ROW,
      "Preview rowNumber must be a positive integer.",
      { rowNumber: row.rowNumber }
    );
  }

  const previewStatus = assertCodeValue(
    row.previewStatus,
    IMPORT_PREVIEW_STATUS,
    ERROR_CODES.INVALID_IMPORT_ROW,
    "previewStatus"
  );

  const plannedOperationId =
    row.plannedOperationId === null || row.plannedOperationId === undefined
      ? null
      : assertIdentifier(
          row.plannedOperationId,
          ERROR_CODES.INVALID_PLANNED_OPERATION_ID,
          "plannedOperationId"
        );

  const issues = Object.freeze(
    (row.issues ?? []).map(assertImportIssue)
  );

  return Object.freeze({
    rowNumber: row.rowNumber,
    plannedOperationId,
    previewStatus,
    normalizedData:
      row.normalizedData === null || row.normalizedData === undefined
        ? null
        : cloneAndFreeze(row.normalizedData),
    existingSnapshot:
      row.existingSnapshot === null || row.existingSnapshot === undefined
        ? null
        : cloneAndFreeze(row.existingSnapshot),
    issues
  });
}

export class PlannedOperationImportPreview {
  constructor({
    importBatchId,
    expectedPlanVersionId,
    fileName = "",
    receivedAt,
    previewedAt,
    repositoryRevisions,
    rows = [],
    issues = []
  } = {}) {
    this.importBatchId = assertIdentifier(
      importBatchId,
      ERROR_CODES.INVALID_IMPORT_BATCH_ID,
      "importBatchId"
    );
    this.expectedPlanVersionId = assertIdentifier(
      expectedPlanVersionId,
      ERROR_CODES.INVALID_PLAN_VERSION_ID,
      "expectedPlanVersionId"
    );

    if (typeof fileName !== "string") {
      throw createImportError(
        ERROR_CODES.INVALID_IMPORT_PREVIEW,
        "fileName must be a string.",
        { fileName }
      );
    }
    this.fileName = fileName.trim();
    this.receivedAt = assertDateTime(
      receivedAt,
      ERROR_CODES.INVALID_DATE_TIME,
      "receivedAt"
    );
    this.previewedAt = assertDateTime(
      previewedAt,
      ERROR_CODES.INVALID_DATE_TIME,
      "previewedAt"
    );
    this.repositoryRevisions = normalizeRepositoryRevisions(
      repositoryRevisions
    );
    this.rows = Object.freeze(rows.map(normalizePreviewRow));
    this.issues = Object.freeze(issues.map(assertImportIssue));

    const allIssues = [
      ...this.issues,
      ...this.rows.flatMap((row) => row.issues)
    ];
    const errorCount = allIssues.filter(
      (issue) => issue.severity === IMPORT_ISSUE_SEVERITY.ERROR
    ).length;

    this.batchStatus = errorCount === 0
      ? IMPORT_BATCH_STATUS.COMMIT_READY
      : IMPORT_BATCH_STATUS.REJECTED;

    this.counts = Object.freeze({
      totalRows: this.rows.length,
      add: this.rows.filter((row) => row.previewStatus === IMPORT_PREVIEW_STATUS.ADD).length,
      update: this.rows.filter((row) => row.previewStatus === IMPORT_PREVIEW_STATUS.UPDATE).length,
      unchanged: this.rows.filter((row) => row.previewStatus === IMPORT_PREVIEW_STATUS.UNCHANGED).length,
      duplicate: this.rows.filter((row) => row.previewStatus === IMPORT_PREVIEW_STATUS.DUPLICATE).length,
      errorRows: this.rows.filter((row) => row.previewStatus === IMPORT_PREVIEW_STATUS.ERROR).length,
      warnings: allIssues.filter((issue) => issue.severity === IMPORT_ISSUE_SEVERITY.WARNING).length,
      errors: errorCount
    });

    Object.freeze(this);
  }

  canCommit() {
    return this.batchStatus === IMPORT_BATCH_STATUS.COMMIT_READY;
  }

  getCommitEntries() {
    return Object.freeze(
      this.rows
        .filter((row) => [
          IMPORT_PREVIEW_STATUS.ADD,
          IMPORT_PREVIEW_STATUS.UPDATE
        ].includes(row.previewStatus))
        .map((row) => Object.freeze({
          rowNumber: row.rowNumber,
          previewStatus: row.previewStatus,
          normalizedData: row.normalizedData
        }))
    );
  }

  toSnapshot() {
    return cloneAndFreeze({
      importBatchId: this.importBatchId,
      expectedPlanVersionId: this.expectedPlanVersionId,
      fileName: this.fileName,
      receivedAt: this.receivedAt,
      previewedAt: this.previewedAt,
      repositoryRevisions: this.repositoryRevisions,
      batchStatus: this.batchStatus,
      counts: this.counts,
      rows: this.rows,
      issues: this.issues
    });
  }
}

export function assertPlannedOperationImportPreview(value) {
  if (!(value instanceof PlannedOperationImportPreview)) {
    throw createImportError(
      ERROR_CODES.INVALID_IMPORT_PREVIEW,
      "value must be a PlannedOperationImportPreview.",
      { value }
    );
  }
  return value;
}
