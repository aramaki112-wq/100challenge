import {
  ID_NAMESPACE,
  IMPORT_ISSUE_CODE,
  IMPORT_ISSUE_SEVERITY,
  IMPORT_PREVIEW_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  ApplicationError,
  assertNonEmptyString,
  createImportError,
  isApplicationError
} from "./DiagnosisErrors.js";

import { parseCsv } from "./CsvParser.js";
import {
  analyzePlannedOperationCsvHeaders,
  mapPlannedOperationCsvRecord
} from "./PlannedOperationCsvSchema.js";
import {
  ImportIssue,
  PlannedOperationImportPreview
} from "./PlannedOperationImportPreview.js";
import { PlannedOperation } from "./PlannedOperation.js";
import { assertClock, readClockNow } from "./Clock.js";
import {
  assertIdGenerator,
  generateId
} from "./IdGenerator.js";

function assertRepository(repository, label, requiredMethods) {
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

function issue({
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

function trim(value) {
  return typeof value === "string" ? value.trim() : value;
}

function requiredText(row, columnName, rowNumber, issues) {
  const value = trim(row[columnName]);
  if (value === "") {
    issues.push(issue({
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

function optionalText(row, columnName) {
  const value = trim(row[columnName] ?? "");
  return value === "" ? null : value;
}

function optionalNote(row, columnName) {
  return typeof row[columnName] === "string"
    ? row[columnName].trim()
    : "";
}

function parseNumberCell(rawValue, {
  rowNumber,
  columnName,
  required,
  integer = false,
  issues
}) {
  const text = trim(rawValue ?? "");
  if (text === "") {
    if (required) {
      issues.push(issue({
        issueCode: IMPORT_ISSUE_CODE.REQUIRED_VALUE_MISSING,
        message: `${columnName} is required.`,
        rowNumber,
        columnName,
        rawValue
      }));
    }
    return null;
  }

  const value = Number(text);
  if (!Number.isFinite(value) || (integer && !Number.isInteger(value))) {
    issues.push(issue({
      issueCode: IMPORT_ISSUE_CODE.INVALID_VALUE,
      message: `${columnName} must be ${integer ? "an integer" : "a number"}.`,
      rowNumber,
      columnName,
      rawValue
    }));
    return null;
  }

  return value;
}

function normalizeRow(row, rowNumber, issues) {
  const plannedOperationId = requiredText(
    row,
    "plannedOperationId",
    rowNumber,
    issues
  );
  const planVersionId = requiredText(row, "planVersionId", rowNumber, issues);
  const orderId = requiredText(row, "orderId", rowNumber, issues);
  const routingOperationId = requiredText(
    row,
    "routingOperationId",
    rowNumber,
    issues
  );
  const equipmentId = requiredText(row, "equipmentId", rowNumber, issues);
  const plannedDate = requiredText(row, "plannedDate", rowNumber, issues);
  const quantityUnit = requiredText(row, "quantityUnit", rowNumber, issues);
  const plannedQuantity = parseNumberCell(row.plannedQuantity, {
    rowNumber,
    columnName: "plannedQuantity",
    required: true,
    issues
  });

  const priority = parseNumberCell(row.priority, {
    rowNumber,
    columnName: "priority",
    required: false,
    integer: true,
    issues
  });
  const outsideDiameter = parseNumberCell(row.outsideDiameter, {
    rowNumber,
    columnName: "outsideDiameter",
    required: false,
    issues
  });
  const wallThickness = parseNumberCell(row.wallThickness, {
    rowNumber,
    columnName: "wallThickness",
    required: false,
    issues
  });

  if (issues.some((candidate) => candidate.severity === IMPORT_ISSUE_SEVERITY.ERROR)) {
    return null;
  }

  return {
    plannedOperationId,
    planVersionId,
    orderId,
    routingOperationId,
    equipmentId,
    plannedDate,
    shiftId: optionalText(row, "shiftId"),
    plannedStartTime: optionalText(row, "plannedStartTime"),
    plannedEndTime: optionalText(row, "plannedEndTime"),
    plannedQuantity,
    quantityUnit: quantityUnit.toUpperCase(),
    priority,
    productGroup: optionalText(row, "productGroup"),
    materialGroup: optionalText(row, "materialGroup"),
    dimensionGroup: optionalText(row, "dimensionGroup"),
    outsideDiameter,
    wallThickness,
    processingType: optionalText(row, "processingType"),
    difficultyClass: optionalText(row, "difficultyClass"),
    operationType: optionalText(row, "operationType"),
    note: optionalNote(row, "note")
  };
}

function snapshotEquals(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export class PreviewPlannedOperationCsvImport {
  #planVersionRepository;
  #plannedOperationRepository;
  #clock;
  #idGenerator;

  constructor({
    planVersionRepository,
    plannedOperationRepository,
    clock,
    idGenerator
  } = {}) {
    this.#planVersionRepository = assertRepository(
      planVersionRepository,
      "planVersionRepository",
      ["findById"]
    );
    this.#plannedOperationRepository = assertRepository(
      plannedOperationRepository,
      "plannedOperationRepository",
      ["findById"]
    );
    this.#clock = assertClock(clock);
    this.#idGenerator = assertIdGenerator(idGenerator);
    Object.freeze(this);
  }

  execute({
    csvText,
    expectedPlanVersionId,
    fileName = "",
    importBatchId = null,
    receivedAt = null
  } = {}) {
    const targetVersionId = assertNonEmptyString(
      expectedPlanVersionId,
      ERROR_CODES.INVALID_PLAN_VERSION_ID,
      "expectedPlanVersionId"
    );
    const now = readClockNow(this.#clock);
    const batchId = importBatchId ?? generateId(
      this.#idGenerator,
      ID_NAMESPACE.IMPORT_BATCH
    );
    const globalIssues = [];
    const rows = [];

    const targetVersion = this.#planVersionRepository.findById(targetVersionId);
    if (targetVersion === null) {
      globalIssues.push(issue({
        issueCode: IMPORT_ISSUE_CODE.TARGET_VERSION_NOT_FOUND,
        message: "The target Plan Version was not found.",
        details: { expectedPlanVersionId: targetVersionId }
      }));
    } else if (!targetVersion.isEditable()) {
      globalIssues.push(issue({
        issueCode: IMPORT_ISSUE_CODE.TARGET_VERSION_NOT_EDITABLE,
        message: "The target Plan Version is not editable.",
        details: {
          expectedPlanVersionId: targetVersionId,
          status: targetVersion.status
        }
      }));
    }

    let document;
    try {
      document = parseCsv(csvText);
    } catch (error) {
      if (!isApplicationError(error)) {
        throw error;
      }
      globalIssues.push(issue({
        issueCode: IMPORT_ISSUE_CODE.CSV_PARSE_FAILED,
        message: error.message,
        details: {
          errorCode: error.code,
          ...error.details
        }
      }));
      return this.#createPreview({
        batchId,
        targetVersionId,
        fileName,
        receivedAt: receivedAt ?? now,
        previewedAt: now,
        rows,
        issues: globalIssues
      });
    }

    if (document.headers.length === 0) {
      globalIssues.push(issue({
        issueCode: IMPORT_ISSUE_CODE.EMPTY_FILE,
        message: "The CSV does not contain a header row."
      }));
      return this.#createPreview({
        batchId,
        targetVersionId,
        fileName,
        receivedAt: receivedAt ?? now,
        previewedAt: now,
        rows,
        issues: globalIssues
      });
    }

    const headerAnalysis = analyzePlannedOperationCsvHeaders(document.headers);
    globalIssues.push(
      ...headerAnalysis.issues.map((headerIssue) => issue({
        ...headerIssue,
        rowNumber: document.headerRowNumber ?? 1
      }))
    );

    if (!headerAnalysis.valid) {
      return this.#createPreview({
        batchId,
        targetVersionId,
        fileName,
        receivedAt: receivedAt ?? now,
        previewedAt: now,
        rows,
        issues: globalIssues
      });
    }

    const idCounts = new Map();
    for (const record of document.records) {
      const mapped = mapPlannedOperationCsvRecord(
        document.headers,
        record.values
      );
      const id = trim(mapped.plannedOperationId);
      if (id !== "") {
        idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
      }
    }

    for (const record of document.records) {
      const rowIssues = [];
      if (record.values.length !== document.headers.length) {
        rowIssues.push(issue({
          issueCode: IMPORT_ISSUE_CODE.COLUMN_COUNT_MISMATCH,
          message: "The row column count does not match the header count.",
          rowNumber: record.rowNumber,
          details: {
            headerCount: document.headers.length,
            valueCount: record.values.length
          }
        }));
      }

      const mapped = mapPlannedOperationCsvRecord(
        document.headers,
        record.values
      );
      const rawId = trim(mapped.plannedOperationId);

      if (rawId !== "" && idCounts.get(rawId) > 1) {
        rowIssues.push(issue({
          issueCode: IMPORT_ISSUE_CODE.DUPLICATE_ROW_ID,
          message: "plannedOperationId is duplicated within the CSV.",
          rowNumber: record.rowNumber,
          columnName: "plannedOperationId",
          rawValue: mapped.plannedOperationId,
          details: { plannedOperationId: rawId }
        }));
      }

      const normalizedData = normalizeRow(
        mapped,
        record.rowNumber,
        rowIssues
      );

      if (
        normalizedData !== null &&
        normalizedData.planVersionId !== targetVersionId
      ) {
        rowIssues.push(issue({
          issueCode: IMPORT_ISSUE_CODE.TARGET_VERSION_MISMATCH,
          message: "planVersionId does not match the selected target Plan Version.",
          rowNumber: record.rowNumber,
          columnName: "planVersionId",
          rawValue: normalizedData.planVersionId,
          details: {
            expectedPlanVersionId: targetVersionId,
            actualPlanVersionId: normalizedData.planVersionId
          }
        }));
      }

      let operation = null;
      if (!rowIssues.some((candidate) =>
        candidate.severity === IMPORT_ISSUE_SEVERITY.ERROR
      )) {
        try {
          operation = new PlannedOperation(normalizedData);
        } catch (error) {
          if (!(error instanceof ApplicationError)) {
            throw error;
          }
          rowIssues.push(issue({
            issueCode: IMPORT_ISSUE_CODE.ENTITY_VALIDATION_FAILED,
            message: error.message,
            rowNumber: record.rowNumber,
            details: {
              errorCode: error.code,
              ...error.details
            }
          }));
        }
      }

      if (operation === null) {
        rows.push({
          rowNumber: record.rowNumber,
          plannedOperationId: rawId || null,
          previewStatus: rawId !== "" && idCounts.get(rawId) > 1
            ? IMPORT_PREVIEW_STATUS.DUPLICATE
            : IMPORT_PREVIEW_STATUS.ERROR,
          normalizedData,
          existingSnapshot: null,
          issues: rowIssues
        });
        continue;
      }

      const proposedSnapshot = operation.toSnapshot();
      const existing = this.#plannedOperationRepository.findById(
        operation.plannedOperationId
      );

      if (
        existing !== null &&
        existing.planVersionId !== targetVersionId
      ) {
        rowIssues.push(issue({
          issueCode: IMPORT_ISSUE_CODE.EXISTING_ENTITY_VERSION_MISMATCH,
          message: "An existing Planned Operation with the same ID belongs to another Plan Version.",
          rowNumber: record.rowNumber,
          columnName: "plannedOperationId",
          rawValue: operation.plannedOperationId,
          details: {
            existingPlanVersionId: existing.planVersionId,
            expectedPlanVersionId: targetVersionId
          }
        }));
        rows.push({
          rowNumber: record.rowNumber,
          plannedOperationId: operation.plannedOperationId,
          previewStatus: IMPORT_PREVIEW_STATUS.ERROR,
          normalizedData: proposedSnapshot,
          existingSnapshot: existing.toSnapshot(),
          issues: rowIssues
        });
        continue;
      }

      if (existing === null) {
        rows.push({
          rowNumber: record.rowNumber,
          plannedOperationId: operation.plannedOperationId,
          previewStatus: IMPORT_PREVIEW_STATUS.ADD,
          normalizedData: proposedSnapshot,
          existingSnapshot: null,
          issues: rowIssues
        });
        continue;
      }

      const existingSnapshot = existing.toSnapshot();
      if (snapshotEquals(existingSnapshot, proposedSnapshot)) {
        rowIssues.push(issue({
          severity: IMPORT_ISSUE_SEVERITY.INFO,
          issueCode: IMPORT_ISSUE_CODE.UNCHANGED_ROW,
          message: "The row is unchanged and will not be written.",
          rowNumber: record.rowNumber
        }));
        rows.push({
          rowNumber: record.rowNumber,
          plannedOperationId: operation.plannedOperationId,
          previewStatus: IMPORT_PREVIEW_STATUS.UNCHANGED,
          normalizedData: proposedSnapshot,
          existingSnapshot,
          issues: rowIssues
        });
        continue;
      }

      rowIssues.push(issue({
        severity: IMPORT_ISSUE_SEVERITY.WARNING,
        issueCode: IMPORT_ISSUE_CODE.EXISTING_ENTITY_UPDATE,
        message: "The existing Planned Operation will be replaced by the imported values.",
        rowNumber: record.rowNumber
      }));
      rows.push({
        rowNumber: record.rowNumber,
        plannedOperationId: operation.plannedOperationId,
        previewStatus: IMPORT_PREVIEW_STATUS.UPDATE,
        normalizedData: proposedSnapshot,
        existingSnapshot,
        issues: rowIssues
      });
    }

    return this.#createPreview({
      batchId,
      targetVersionId,
      fileName,
      receivedAt: receivedAt ?? now,
      previewedAt: now,
      rows,
      issues: globalIssues
    });
  }

  #createPreview({
    batchId,
    targetVersionId,
    fileName,
    receivedAt,
    previewedAt,
    rows,
    issues
  }) {
    return new PlannedOperationImportPreview({
      importBatchId: batchId,
      expectedPlanVersionId: targetVersionId,
      fileName,
      receivedAt,
      previewedAt,
      repositoryRevisions: {
        planVersions: this.#planVersionRepository.revision,
        plannedOperations: this.#plannedOperationRepository.revision
      },
      rows,
      issues
    });
  }
}
