import {
  IMPORT_ISSUE_CODE,
  IMPORT_ISSUE_SEVERITY,
  IMPORT_PREVIEW_STATUS
} from "./DiagnosisCodes.js";
import {
  ERROR_CODES,
  ApplicationError,
  createImportError,
  isApplicationError
} from "./DiagnosisErrors.js";
import { ImportIssue } from "./PlannedOperationImportPreview.js";

export function assertImportRepository(repository, label, requiredMethods) {
  const valid =
    repository !== null &&
    typeof repository === "object" &&
    Number.isInteger(repository.revision) &&
    repository.revision >= 0 &&
    requiredMethods.every((method) => typeof repository[method] === "function");
  if (!valid) {
    throw createImportError(
      ERROR_CODES.INVALID_REPOSITORY,
      `${label} does not satisfy the Import Repository contract.`,
      { label, requiredMethods }
    );
  }
  return repository;
}

export function createImportIssue({
  severity = IMPORT_ISSUE_SEVERITY.ERROR,
  issueCode,
  message,
  rowNumber = null,
  columnName = null,
  rawValue = null,
  details = {}
}) {
  return new ImportIssue({
    severity,
    issueCode,
    message,
    rowNumber,
    columnName,
    rawValue,
    details
  });
}

export function trimCell(value) {
  return typeof value === "string" ? value.trim() : value;
}

export function requiredText(row, columnName, rowNumber, issues) {
  const value = trimCell(row[columnName] ?? "");
  if (value === "") {
    issues.push(createImportIssue({
      issueCode: IMPORT_ISSUE_CODE.REQUIRED_VALUE_MISSING,
      message: `${columnName} is required.`,
      rowNumber,
      columnName,
      rawValue: row[columnName]
    }));
    return null;
  }
  return value;
}

export function optionalText(row, columnName) {
  const value = trimCell(row[columnName] ?? "");
  return value === "" ? null : value;
}

export function optionalNote(row, columnName) {
  return typeof row[columnName] === "string" ? row[columnName].trim() : "";
}

export function parseBooleanCell(rawValue, {
  rowNumber,
  columnName,
  required = false,
  defaultValue = null,
  issues
}) {
  const text = String(rawValue ?? "").trim().toLowerCase();
  if (text === "") {
    if (required && defaultValue === null) {
      issues.push(createImportIssue({
        issueCode: IMPORT_ISSUE_CODE.REQUIRED_VALUE_MISSING,
        message: `${columnName} is required.`,
        rowNumber,
        columnName,
        rawValue
      }));
    }
    return defaultValue;
  }
  if (["true", "1", "yes", "y"].includes(text)) return true;
  if (["false", "0", "no", "n"].includes(text)) return false;
  issues.push(createImportIssue({
    issueCode: IMPORT_ISSUE_CODE.INVALID_VALUE,
    message: `${columnName} must be true or false.`,
    rowNumber,
    columnName,
    rawValue
  }));
  return null;
}

export function snapshotEquals(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function rowStatusFromEntity({
  entity,
  entityId,
  existing,
  rowNumber,
  rowIssues
}) {
  if (entity === null) {
    return {
      rowNumber,
      entityId: entityId || null,
      previewStatus: rowIssues.some((candidate) =>
        candidate.issueCode === IMPORT_ISSUE_CODE.DUPLICATE_ROW_ID
      ) ? IMPORT_PREVIEW_STATUS.DUPLICATE : IMPORT_PREVIEW_STATUS.ERROR,
      normalizedData: null,
      existingSnapshot: null,
      issues: rowIssues
    };
  }

  const proposedSnapshot = entity.toSnapshot();
  if (existing === null) {
    return {
      rowNumber,
      entityId,
      previewStatus: IMPORT_PREVIEW_STATUS.ADD,
      normalizedData: proposedSnapshot,
      existingSnapshot: null,
      issues: rowIssues
    };
  }

  const existingSnapshot = existing.toSnapshot();
  if (snapshotEquals(existingSnapshot, proposedSnapshot)) {
    rowIssues.push(createImportIssue({
      severity: IMPORT_ISSUE_SEVERITY.INFO,
      issueCode: IMPORT_ISSUE_CODE.UNCHANGED_ROW,
      message: "The row is unchanged and will not be written.",
      rowNumber
    }));
    return {
      rowNumber,
      entityId,
      previewStatus: IMPORT_PREVIEW_STATUS.UNCHANGED,
      normalizedData: proposedSnapshot,
      existingSnapshot,
      issues: rowIssues
    };
  }

  rowIssues.push(createImportIssue({
    severity: IMPORT_ISSUE_SEVERITY.WARNING,
    issueCode: IMPORT_ISSUE_CODE.EXISTING_ENTITY_UPDATE,
    message: "The existing entity will be replaced by the imported values.",
    rowNumber
  }));
  return {
    rowNumber,
    entityId,
    previewStatus: IMPORT_PREVIEW_STATUS.UPDATE,
    normalizedData: proposedSnapshot,
    existingSnapshot,
    issues: rowIssues
  };
}

export function appendEntityValidationIssue(error, rowNumber, rowIssues) {
  if (!(error instanceof ApplicationError)) throw error;
  rowIssues.push(createImportIssue({
    issueCode: IMPORT_ISSUE_CODE.ENTITY_VALIDATION_FAILED,
    message: error.message,
    rowNumber,
    details: { errorCode: error.code, ...error.details }
  }));
}

export function parseDocumentOrIssue(parseCsv, csvText, globalIssues) {
  try {
    return parseCsv(csvText);
  } catch (error) {
    if (!isApplicationError(error)) throw error;
    globalIssues.push(createImportIssue({
      issueCode: IMPORT_ISSUE_CODE.CSV_PARSE_FAILED,
      message: error.message,
      details: { errorCode: error.code, ...error.details }
    }));
    return null;
  }
}
