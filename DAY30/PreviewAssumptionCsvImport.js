import {
  ASSUMPTION_TARGET_TYPE,
  ID_NAMESPACE,
  IMPORT_ISSUE_CODE,
  IMPORT_ISSUE_SEVERITY,
  IMPORT_PREVIEW_STATUS
} from "./DiagnosisCodes.js";
import {
  ERROR_CODES,
  ApplicationError,
  assertNonEmptyString
} from "./DiagnosisErrors.js";
import { parseCsv } from "./CsvParser.js";
import {
  analyzeAssumptionCsvHeaders,
  mapAssumptionCsvRecord
} from "./AssumptionCsvSchema.js";
import { EntityCsvImportPreview } from "./EntityCsvImportPreview.js";
import {
  appendEntityValidationIssue,
  assertImportRepository,
  createImportIssue,
  optionalNote,
  optionalText,
  parseBooleanCell,
  parseDocumentOrIssue,
  requiredText,
  rowStatusFromEntity,
  trimCell
} from "./EntityCsvImportUtils.js";
import { Assumption } from "./Assumption.js";
import { assertClock, readClockNow } from "./Clock.js";
import { assertIdGenerator, generateId } from "./IdGenerator.js";

const ENTITY_TYPE = "ASSUMPTION";

function normalizeRow(row, rowNumber, issues) {
  const assumptionId = requiredText(row, "assumptionId", rowNumber, issues);
  const assumptionType = requiredText(row, "assumptionType", rowNumber, issues);
  const targetType = requiredText(row, "targetType", rowNumber, issues);
  const targetId = requiredText(row, "targetId", rowNumber, issues);
  const description = requiredText(row, "description", rowNumber, issues);
  const status = requiredText(row, "status", rowNumber, issues);
  const blocking = parseBooleanCell(row.blocking, {
    rowNumber,
    columnName: "blocking",
    defaultValue: false,
    issues
  });
  if (issues.some((candidate) => candidate.severity === IMPORT_ISSUE_SEVERITY.ERROR)) {
    return null;
  }
  return {
    assumptionId,
    assumptionType: assumptionType.toUpperCase(),
    targetType: targetType.toUpperCase(),
    targetId,
    description,
    status: status.toUpperCase(),
    confidence: optionalText(row, "confidence")?.toUpperCase() ?? null,
    owner: optionalText(row, "owner") ?? "",
    confirmationDueDate: optionalText(row, "confirmationDueDate"),
    confirmedAt: optionalText(row, "confirmedAt"),
    confirmedBy: optionalText(row, "confirmedBy") ?? "",
    evidenceType: optionalText(row, "evidenceType")?.toUpperCase() ?? null,
    evidence: optionalNote(row, "evidence"),
    sourceUpdatedAt: optionalText(row, "sourceUpdatedAt"),
    validFrom: optionalText(row, "validFrom"),
    validTo: optionalText(row, "validTo"),
    blocking,
    impactLevel: optionalText(row, "impactLevel")?.toUpperCase() ?? null,
    impactDescription: optionalNote(row, "impactDescription"),
    note: optionalNote(row, "note")
  };
}

function validateTarget({
  data,
  targetVersion,
  productionPlanRepository,
  plannedOperationRepository,
  rowNumber,
  issues
}) {
  if (data.targetType === ASSUMPTION_TARGET_TYPE.PLAN_VERSION) {
    if (data.targetId !== targetVersion.planVersionId) {
      issues.push(createImportIssue({
        issueCode: IMPORT_ISSUE_CODE.TARGET_VERSION_MISMATCH,
        message: "A PLAN_VERSION Assumption must target the selected Plan Version.",
        rowNumber,
        columnName: "targetId",
        rawValue: data.targetId,
        details: {
          expectedPlanVersionId: targetVersion.planVersionId,
          actualTargetId: data.targetId
        }
      }));
    }
    return;
  }

  if (data.targetType === ASSUMPTION_TARGET_TYPE.PRODUCTION_PLAN) {
    const plan = productionPlanRepository.findById(data.targetId);
    if (plan === null || plan.planId !== targetVersion.planId) {
      issues.push(createImportIssue({
        issueCode: IMPORT_ISSUE_CODE.TARGET_CONTEXT_MISMATCH,
        message: "A PRODUCTION_PLAN Assumption must target the Plan of the selected Version.",
        rowNumber,
        columnName: "targetId",
        rawValue: data.targetId,
        details: { expectedPlanId: targetVersion.planId }
      }));
    }
    return;
  }

  if (data.targetType === ASSUMPTION_TARGET_TYPE.PLANNED_OPERATION) {
    const operation = plannedOperationRepository.findById(data.targetId);
    if (operation === null || operation.planVersionId !== targetVersion.planVersionId) {
      issues.push(createImportIssue({
        issueCode: IMPORT_ISSUE_CODE.TARGET_CONTEXT_MISMATCH,
        message: "A PLANNED_OPERATION Assumption must target an Operation in the selected Plan Version.",
        rowNumber,
        columnName: "targetId",
        rawValue: data.targetId,
        details: { expectedPlanVersionId: targetVersion.planVersionId }
      }));
    }
  }
}

export class PreviewAssumptionCsvImport {
  #productionPlanRepository;
  #planVersionRepository;
  #plannedOperationRepository;
  #assumptionRepository;
  #clock;
  #idGenerator;

  constructor({
    productionPlanRepository,
    planVersionRepository,
    plannedOperationRepository,
    assumptionRepository,
    clock,
    idGenerator
  } = {}) {
    this.#productionPlanRepository = assertImportRepository(
      productionPlanRepository,
      "productionPlanRepository",
      ["findById"]
    );
    this.#planVersionRepository = assertImportRepository(
      planVersionRepository,
      "planVersionRepository",
      ["findById"]
    );
    this.#plannedOperationRepository = assertImportRepository(
      plannedOperationRepository,
      "plannedOperationRepository",
      ["findById"]
    );
    this.#assumptionRepository = assertImportRepository(
      assumptionRepository,
      "assumptionRepository",
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
    const batchId = importBatchId ?? generateId(this.#idGenerator, ID_NAMESPACE.IMPORT_BATCH);
    const globalIssues = [];
    const rows = [];
    const targetVersion = this.#planVersionRepository.findById(targetVersionId);
    if (targetVersion === null) {
      globalIssues.push(createImportIssue({
        issueCode: IMPORT_ISSUE_CODE.TARGET_VERSION_NOT_FOUND,
        message: "The target Plan Version was not found.",
        details: { expectedPlanVersionId: targetVersionId }
      }));
    } else if (!targetVersion.isEditable()) {
      globalIssues.push(createImportIssue({
        issueCode: IMPORT_ISSUE_CODE.TARGET_VERSION_NOT_EDITABLE,
        message: "The target Plan Version is not editable.",
        details: { expectedPlanVersionId: targetVersionId, status: targetVersion.status }
      }));
    }

    const document = parseDocumentOrIssue(parseCsv, csvText, globalIssues);
    if (document === null || document.headers.length === 0) {
      if (document !== null) {
        globalIssues.push(createImportIssue({
          issueCode: IMPORT_ISSUE_CODE.EMPTY_FILE,
          message: "The CSV does not contain a header row."
        }));
      }
      return this.#createPreview({ batchId, targetVersionId, fileName, receivedAt: receivedAt ?? now, previewedAt: now, rows, issues: globalIssues });
    }

    const headerAnalysis = analyzeAssumptionCsvHeaders(document.headers);
    globalIssues.push(...headerAnalysis.issues.map((candidate) => createImportIssue({
      ...candidate,
      rowNumber: document.headerRowNumber ?? 1
    })));
    if (!headerAnalysis.valid) {
      return this.#createPreview({ batchId, targetVersionId, fileName, receivedAt: receivedAt ?? now, previewedAt: now, rows, issues: globalIssues });
    }

    const idCounts = new Map();
    for (const record of document.records) {
      const mapped = mapAssumptionCsvRecord(document.headers, record.values);
      const id = trimCell(mapped.assumptionId);
      if (id !== "") idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
    }

    for (const record of document.records) {
      const rowIssues = [];
      if (record.values.length !== document.headers.length) {
        rowIssues.push(createImportIssue({
          issueCode: IMPORT_ISSUE_CODE.COLUMN_COUNT_MISMATCH,
          message: "The row column count does not match the header count.",
          rowNumber: record.rowNumber,
          details: { headerCount: document.headers.length, valueCount: record.values.length }
        }));
      }
      const mapped = mapAssumptionCsvRecord(document.headers, record.values);
      const rawId = trimCell(mapped.assumptionId);
      if (rawId !== "" && idCounts.get(rawId) > 1) {
        rowIssues.push(createImportIssue({
          issueCode: IMPORT_ISSUE_CODE.DUPLICATE_ROW_ID,
          message: "assumptionId is duplicated within the CSV.",
          rowNumber: record.rowNumber,
          columnName: "assumptionId",
          rawValue: mapped.assumptionId
        }));
      }
      const normalizedData = normalizeRow(mapped, record.rowNumber, rowIssues);
      if (normalizedData !== null && targetVersion !== null) {
        validateTarget({
          data: normalizedData,
          targetVersion,
          productionPlanRepository: this.#productionPlanRepository,
          plannedOperationRepository: this.#plannedOperationRepository,
          rowNumber: record.rowNumber,
          issues: rowIssues
        });
      }

      let assumption = null;
      if (!rowIssues.some((candidate) => candidate.severity === IMPORT_ISSUE_SEVERITY.ERROR)) {
        try {
          assumption = new Assumption(normalizedData);
        } catch (error) {
          appendEntityValidationIssue(error, record.rowNumber, rowIssues);
        }
      }

      const existing = assumption === null ? null : this.#assumptionRepository.findById(assumption.assumptionId);
      if (
        assumption !== null &&
        existing !== null &&
        (
          existing.assumptionType !== assumption.assumptionType ||
          existing.targetType !== assumption.targetType ||
          existing.targetId !== assumption.targetId
        )
      ) {
        rowIssues.push(createImportIssue({
          issueCode: IMPORT_ISSUE_CODE.EXISTING_ENTITY_SCOPE_MISMATCH,
          message: "An existing Assumption cannot change its type or target through CSV Import.",
          rowNumber: record.rowNumber,
          columnName: "assumptionId",
          rawValue: assumption.assumptionId,
          details: {
            existingAssumptionType: existing.assumptionType,
            proposedAssumptionType: assumption.assumptionType,
            existingTargetType: existing.targetType,
            proposedTargetType: assumption.targetType,
            existingTargetId: existing.targetId,
            proposedTargetId: assumption.targetId
          }
        }));
        rows.push({
          rowNumber: record.rowNumber,
          entityId: assumption.assumptionId,
          previewStatus: IMPORT_PREVIEW_STATUS.ERROR,
          normalizedData: assumption.toSnapshot(),
          existingSnapshot: existing.toSnapshot(),
          issues: rowIssues
        });
        continue;
      }

      rows.push(rowStatusFromEntity({
        entity: assumption,
        entityId: rawId,
        existing,
        rowNumber: record.rowNumber,
        rowIssues
      }));
    }

    return this.#createPreview({ batchId, targetVersionId, fileName, receivedAt: receivedAt ?? now, previewedAt: now, rows, issues: globalIssues });
  }

  #createPreview({ batchId, targetVersionId, fileName, receivedAt, previewedAt, rows, issues }) {
    return new EntityCsvImportPreview({
      importBatchId: batchId,
      entityType: ENTITY_TYPE,
      expectedPlanVersionId: targetVersionId,
      fileName,
      receivedAt,
      previewedAt,
      repositoryRevisions: {
        productionPlans: this.#productionPlanRepository.revision,
        planVersions: this.#planVersionRepository.revision,
        plannedOperations: this.#plannedOperationRepository.revision,
        assumptions: this.#assumptionRepository.revision
      },
      rows,
      issues
    });
  }
}
