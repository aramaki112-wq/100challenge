import {
  CAPACITY_BASELINE,
  ID_NAMESPACE,
  IMPORT_ISSUE_CODE,
  IMPORT_ISSUE_SEVERITY,
  IMPORT_PREVIEW_STATUS
} from "./DiagnosisCodes.js";
import {
  ERROR_CODES,
  assertNonEmptyString
} from "./DiagnosisErrors.js";
import { parseCsv } from "./CsvParser.js";
import {
  analyzeDiagnosisScenarioCsvHeaders,
  mapDiagnosisScenarioCsvRecord
} from "./DiagnosisScenarioCsvSchema.js";
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
import { DiagnosisScenario } from "./DiagnosisScenario.js";
import { assertClock, readClockNow } from "./Clock.js";
import { assertIdGenerator, generateId } from "./IdGenerator.js";

const ENTITY_TYPE = "DIAGNOSIS_SCENARIO";

function normalizeRow(row, rowNumber, issues) {
  const diagnosisScenarioId = requiredText(row, "diagnosisScenarioId", rowNumber, issues);
  const name = requiredText(row, "name", rowNumber, issues);
  const planVersionId = requiredText(row, "planVersionId", rowNumber, issues);
  const capacityScenarioId = requiredText(row, "capacityScenarioId", rowNumber, issues);
  const scenarioCategory = requiredText(row, "scenarioCategory", rowNumber, issues);
  const createdAt = requiredText(row, "createdAt", rowNumber, issues);
  const active = parseBooleanCell(row.active, {
    rowNumber,
    columnName: "active",
    defaultValue: true,
    issues
  });
  if (issues.some((candidate) => candidate.severity === IMPORT_ISSUE_SEVERITY.ERROR)) {
    return null;
  }
  return {
    diagnosisScenarioId,
    name,
    planVersionId,
    capacityScenarioId,
    capacityBaseline: optionalText(row, "capacityBaseline")?.toUpperCase()
      ?? CAPACITY_BASELINE.AVAILABLE_CAPACITY,
    baseDiagnosisScenarioId: optionalText(row, "baseDiagnosisScenarioId"),
    scenarioCategory: scenarioCategory.toUpperCase(),
    changeSummary: optionalNote(row, "changeSummary"),
    description: optionalNote(row, "description"),
    createdBy: optionalText(row, "createdBy") ?? "",
    createdAt,
    active,
    note: optionalNote(row, "note")
  };
}

export class PreviewDiagnosisScenarioCsvImport {
  #planVersionRepository;
  #diagnosisScenarioRepository;
  #clock;
  #idGenerator;

  constructor({
    planVersionRepository,
    diagnosisScenarioRepository,
    clock,
    idGenerator
  } = {}) {
    this.#planVersionRepository = assertImportRepository(
      planVersionRepository,
      "planVersionRepository",
      ["findById"]
    );
    this.#diagnosisScenarioRepository = assertImportRepository(
      diagnosisScenarioRepository,
      "diagnosisScenarioRepository",
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

    const headerAnalysis = analyzeDiagnosisScenarioCsvHeaders(document.headers);
    globalIssues.push(...headerAnalysis.issues.map((candidate) => createImportIssue({
      ...candidate,
      rowNumber: document.headerRowNumber ?? 1
    })));
    if (!headerAnalysis.valid) {
      return this.#createPreview({ batchId, targetVersionId, fileName, receivedAt: receivedAt ?? now, previewedAt: now, rows, issues: globalIssues });
    }

    const mappedRecords = document.records.map((record) => ({
      record,
      row: mapDiagnosisScenarioCsvRecord(document.headers, record.values)
    }));
    const idCounts = new Map();
    for (const { row } of mappedRecords) {
      const id = trimCell(row.diagnosisScenarioId);
      if (id !== "") idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
    }
    const csvIds = new Set([...idCounts.keys()]);

    for (const { record, row: mapped } of mappedRecords) {
      const rowIssues = [];
      if (record.values.length !== document.headers.length) {
        rowIssues.push(createImportIssue({
          issueCode: IMPORT_ISSUE_CODE.COLUMN_COUNT_MISMATCH,
          message: "The row column count does not match the header count.",
          rowNumber: record.rowNumber,
          details: { headerCount: document.headers.length, valueCount: record.values.length }
        }));
      }
      const rawId = trimCell(mapped.diagnosisScenarioId);
      if (rawId !== "" && idCounts.get(rawId) > 1) {
        rowIssues.push(createImportIssue({
          issueCode: IMPORT_ISSUE_CODE.DUPLICATE_ROW_ID,
          message: "diagnosisScenarioId is duplicated within the CSV.",
          rowNumber: record.rowNumber,
          columnName: "diagnosisScenarioId",
          rawValue: mapped.diagnosisScenarioId
        }));
      }
      const normalizedData = normalizeRow(mapped, record.rowNumber, rowIssues);
      if (
        normalizedData !== null &&
        normalizedData.planVersionId !== targetVersionId
      ) {
        rowIssues.push(createImportIssue({
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
      if (normalizedData?.baseDiagnosisScenarioId) {
        const baseExists = csvIds.has(normalizedData.baseDiagnosisScenarioId)
          || this.#diagnosisScenarioRepository.findById(normalizedData.baseDiagnosisScenarioId) !== null;
        if (!baseExists) {
          rowIssues.push(createImportIssue({
            issueCode: IMPORT_ISSUE_CODE.BASE_SCENARIO_NOT_FOUND,
            message: "baseDiagnosisScenarioId was not found in the CSV or Repository.",
            rowNumber: record.rowNumber,
            columnName: "baseDiagnosisScenarioId",
            rawValue: normalizedData.baseDiagnosisScenarioId
          }));
        }
      }

      let scenario = null;
      if (!rowIssues.some((candidate) => candidate.severity === IMPORT_ISSUE_SEVERITY.ERROR)) {
        try {
          scenario = new DiagnosisScenario(normalizedData);
        } catch (error) {
          appendEntityValidationIssue(error, record.rowNumber, rowIssues);
        }
      }

      const existing = scenario === null ? null : this.#diagnosisScenarioRepository.findById(scenario.diagnosisScenarioId);
      if (scenario !== null && existing !== null && existing.planVersionId !== targetVersionId) {
        rowIssues.push(createImportIssue({
          issueCode: IMPORT_ISSUE_CODE.EXISTING_ENTITY_VERSION_MISMATCH,
          message: "An existing Diagnosis Scenario with the same ID belongs to another Plan Version.",
          rowNumber: record.rowNumber,
          columnName: "diagnosisScenarioId",
          rawValue: scenario.diagnosisScenarioId,
          details: {
            existingPlanVersionId: existing.planVersionId,
            expectedPlanVersionId: targetVersionId
          }
        }));
        rows.push({
          rowNumber: record.rowNumber,
          entityId: scenario.diagnosisScenarioId,
          previewStatus: IMPORT_PREVIEW_STATUS.ERROR,
          normalizedData: scenario.toSnapshot(),
          existingSnapshot: existing.toSnapshot(),
          issues: rowIssues
        });
        continue;
      }

      rows.push(rowStatusFromEntity({
        entity: scenario,
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
        planVersions: this.#planVersionRepository.revision,
        diagnosisScenarios: this.#diagnosisScenarioRepository.revision
      },
      rows,
      issues
    });
  }
}
