import {
  IMPORT_BATCH_STATUS,
  IMPORT_ISSUE_SEVERITY,
  IMPORT_PREVIEW_STATUS
} from "./DiagnosisCodes.js";
import {
  ERROR_CODES,
  assertNonEmptyString,
  createImportError
} from "./DiagnosisErrors.js";
import { assertDateTime } from "./DateTimeUtils.js";
import { ImportIssue } from "./PlannedOperationImportPreview.js";

const IDENTIFIER_PATTERN = /^\S+$/;

function assertIdentifier(value, code, label) {
  const id = assertNonEmptyString(value, code, label);
  if (!IDENTIFIER_PATTERN.test(id)) {
    throw createImportError(code, `${label} must not contain whitespace.`, {
      label,
      value
    });
  }
  return id;
}

function cloneAndFreeze(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(cloneAndFreeze));
  if (value !== null && typeof value === "object") {
    return Object.freeze(Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, cloneAndFreeze(child)])
    ));
  }
  return value;
}

function normalizeRepositoryRevisions(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw createImportError(
      ERROR_CODES.INVALID_IMPORT_PREVIEW,
      "repositoryRevisions must be a plain object.",
      { repositoryRevisions: value }
    );
  }
  const entries = Object.entries(value);
  if (entries.length === 0) {
    throw createImportError(
      ERROR_CODES.INVALID_IMPORT_PREVIEW,
      "repositoryRevisions must contain at least one revision.",
      {}
    );
  }
  const normalized = {};
  for (const [key, revision] of entries) {
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

function normalizeRow(row) {
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
      "rowNumber must be a positive integer.",
      { rowNumber: row.rowNumber }
    );
  }
  if (!Object.values(IMPORT_PREVIEW_STATUS).includes(row.previewStatus)) {
    throw createImportError(
      ERROR_CODES.INVALID_IMPORT_ROW,
      "previewStatus is not registered.",
      { previewStatus: row.previewStatus }
    );
  }
  const entityId = row.entityId === null || row.entityId === undefined
    ? null
    : assertIdentifier(row.entityId, ERROR_CODES.INVALID_IMPORT_ROW, "entityId");
  const issues = Object.freeze((row.issues ?? []).map((candidate) => {
    if (!(candidate instanceof ImportIssue)) {
      throw createImportError(
        ERROR_CODES.INVALID_IMPORT_ROW,
        "row issues must contain ImportIssue instances.",
        { candidate }
      );
    }
    return candidate;
  }));
  return Object.freeze({
    rowNumber: row.rowNumber,
    entityId,
    previewStatus: row.previewStatus,
    normalizedData: row.normalizedData == null ? null : cloneAndFreeze(row.normalizedData),
    existingSnapshot: row.existingSnapshot == null ? null : cloneAndFreeze(row.existingSnapshot),
    issues
  });
}

export class EntityCsvImportPreview {
  constructor({
    importBatchId,
    entityType,
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
    this.entityType = assertIdentifier(
      entityType,
      ERROR_CODES.INVALID_IMPORT_PREVIEW,
      "entityType"
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
    this.repositoryRevisions = normalizeRepositoryRevisions(repositoryRevisions);
    this.rows = Object.freeze(rows.map(normalizeRow));
    this.issues = Object.freeze((issues ?? []).map((candidate) => {
      if (!(candidate instanceof ImportIssue)) {
        throw createImportError(
          ERROR_CODES.INVALID_IMPORT_PREVIEW,
          "issues must contain ImportIssue instances.",
          { candidate }
        );
      }
      return candidate;
    }));

    const allIssues = [...this.issues, ...this.rows.flatMap((row) => row.issues)];
    const errors = allIssues.filter(
      (candidate) => candidate.severity === IMPORT_ISSUE_SEVERITY.ERROR
    ).length;
    this.batchStatus = errors === 0
      ? IMPORT_BATCH_STATUS.COMMIT_READY
      : IMPORT_BATCH_STATUS.REJECTED;
    this.counts = Object.freeze({
      totalRows: this.rows.length,
      add: this.rows.filter((row) => row.previewStatus === IMPORT_PREVIEW_STATUS.ADD).length,
      update: this.rows.filter((row) => row.previewStatus === IMPORT_PREVIEW_STATUS.UPDATE).length,
      unchanged: this.rows.filter((row) => row.previewStatus === IMPORT_PREVIEW_STATUS.UNCHANGED).length,
      duplicate: this.rows.filter((row) => row.previewStatus === IMPORT_PREVIEW_STATUS.DUPLICATE).length,
      errorRows: this.rows.filter((row) => row.previewStatus === IMPORT_PREVIEW_STATUS.ERROR).length,
      warnings: allIssues.filter((candidate) => candidate.severity === IMPORT_ISSUE_SEVERITY.WARNING).length,
      errors
    });
    Object.freeze(this);
  }

  canCommit() {
    return this.batchStatus === IMPORT_BATCH_STATUS.COMMIT_READY;
  }

  getCommitEntries() {
    return Object.freeze(this.rows
      .filter((row) => [IMPORT_PREVIEW_STATUS.ADD, IMPORT_PREVIEW_STATUS.UPDATE]
        .includes(row.previewStatus))
      .map((row) => Object.freeze({
        rowNumber: row.rowNumber,
        previewStatus: row.previewStatus,
        normalizedData: row.normalizedData
      })));
  }

  toSnapshot() {
    return cloneAndFreeze({
      importBatchId: this.importBatchId,
      entityType: this.entityType,
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

export function assertEntityCsvImportPreview(value, expectedEntityType = null) {
  if (!(value instanceof EntityCsvImportPreview)) {
    throw createImportError(
      ERROR_CODES.INVALID_IMPORT_PREVIEW,
      "value must be an EntityCsvImportPreview.",
      { value }
    );
  }
  if (expectedEntityType !== null && value.entityType !== expectedEntityType) {
    throw createImportError(
      ERROR_CODES.INVALID_IMPORT_PREVIEW,
      "The Import Preview entity type does not match the Commit service.",
      { expectedEntityType, actualEntityType: value.entityType }
    );
  }
  return value;
}
