import {
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
  analyzeScenarioAssumptionRelationCsvHeaders,
  mapScenarioAssumptionRelationCsvRecord
} from "./ScenarioAssumptionRelationCsvSchema.js";
import { EntityCsvImportPreview } from "./EntityCsvImportPreview.js";
import {
  appendEntityValidationIssue,
  assertImportRepository,
  createImportIssue,
  optionalNote,
  parseBooleanCell,
  parseDocumentOrIssue,
  requiredText,
  rowStatusFromEntity,
  trimCell
} from "./EntityCsvImportUtils.js";
import { ScenarioAssumptionRelation } from "./ScenarioAssumptionRelation.js";
import { assertClock, readClockNow } from "./Clock.js";
import { assertIdGenerator, generateId } from "./IdGenerator.js";

const ENTITY_TYPE = "SCENARIO_ASSUMPTION_RELATION";

function normalizeRow(row, rowNumber, issues) {
  const diagnosisScenarioId = requiredText(
    row,
    "diagnosisScenarioId",
    rowNumber,
    issues
  );
  const assumptionId = requiredText(row, "assumptionId", rowNumber, issues);
  const active = parseBooleanCell(row.active, {
    rowNumber,
    columnName: "active",
    defaultValue: true,
    issues
  });

  if (issues.some((issue) => issue.severity === IMPORT_ISSUE_SEVERITY.ERROR)) {
    return null;
  }

  return {
    diagnosisScenarioId,
    assumptionId,
    active,
    note: optionalNote(row, "note")
  };
}

export class PreviewScenarioAssumptionRelationCsvImport {
  #planVersionRepository;
  #diagnosisScenarioRepository;
  #assumptionRepository;
  #relationRepository;
  #clock;
  #idGenerator;

  constructor({
    planVersionRepository,
    diagnosisScenarioRepository,
    assumptionRepository,
    relationRepository,
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
    this.#assumptionRepository = assertImportRepository(
      assumptionRepository,
      "assumptionRepository",
      ["findById"]
    );
    this.#relationRepository = assertImportRepository(
      relationRepository,
      "relationRepository",
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
      globalIssues.push(createImportIssue({
        issueCode: IMPORT_ISSUE_CODE.TARGET_VERSION_NOT_FOUND,
        message: "The target Plan Version was not found.",
        details: { expectedPlanVersionId: targetVersionId }
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

    const headerAnalysis = analyzeScenarioAssumptionRelationCsvHeaders(
      document.headers
    );
    globalIssues.push(...headerAnalysis.issues.map((issue) => createImportIssue({
      ...issue,
      rowNumber: document.headerRowNumber ?? 1
    })));

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

    const relationIdCounts = new Map();
    for (const record of document.records) {
      const mapped = mapScenarioAssumptionRelationCsvRecord(
        document.headers,
        record.values
      );
      const scenarioId = trimCell(mapped.diagnosisScenarioId);
      const assumptionId = trimCell(mapped.assumptionId);
      if (scenarioId !== "" && assumptionId !== "") {
        const relationId = `${scenarioId}::${assumptionId}`;
        relationIdCounts.set(
          relationId,
          (relationIdCounts.get(relationId) ?? 0) + 1
        );
      }
    }

    for (const record of document.records) {
      const rowIssues = [];
      if (record.values.length !== document.headers.length) {
        rowIssues.push(createImportIssue({
          issueCode: IMPORT_ISSUE_CODE.COLUMN_COUNT_MISMATCH,
          message: "The row column count does not match the header count.",
          rowNumber: record.rowNumber,
          details: {
            headerCount: document.headers.length,
            valueCount: record.values.length
          }
        }));
      }

      const mapped = mapScenarioAssumptionRelationCsvRecord(
        document.headers,
        record.values
      );
      const normalizedData = normalizeRow(mapped, record.rowNumber, rowIssues);
      const rawScenarioId = trimCell(mapped.diagnosisScenarioId);
      const rawAssumptionId = trimCell(mapped.assumptionId);
      const rawRelationId = rawScenarioId && rawAssumptionId
        ? `${rawScenarioId}::${rawAssumptionId}`
        : null;

      if (rawRelationId && relationIdCounts.get(rawRelationId) > 1) {
        rowIssues.push(createImportIssue({
          issueCode: IMPORT_ISSUE_CODE.DUPLICATE_ROW_ID,
          message: "The same Scenario and Assumption pair is duplicated within the CSV.",
          rowNumber: record.rowNumber,
          columnName: "assumptionId",
          rawValue: rawRelationId
        }));
      }

      if (normalizedData !== null && targetVersion !== null) {
        const scenario = this.#diagnosisScenarioRepository.findById(
          normalizedData.diagnosisScenarioId
        );
        if (scenario === null) {
          rowIssues.push(createImportIssue({
            issueCode: IMPORT_ISSUE_CODE.TARGET_CONTEXT_MISMATCH,
            message: "The Diagnosis Scenario was not found.",
            rowNumber: record.rowNumber,
            columnName: "diagnosisScenarioId",
            rawValue: normalizedData.diagnosisScenarioId
          }));
        } else if (scenario.planVersionId !== targetVersionId) {
          rowIssues.push(createImportIssue({
            issueCode: IMPORT_ISSUE_CODE.TARGET_VERSION_MISMATCH,
            message: "The Diagnosis Scenario does not belong to the selected Plan Version.",
            rowNumber: record.rowNumber,
            columnName: "diagnosisScenarioId",
            rawValue: normalizedData.diagnosisScenarioId,
            details: {
              expectedPlanVersionId: targetVersionId,
              actualPlanVersionId: scenario.planVersionId
            }
          }));
        }

        const assumption = this.#assumptionRepository.findById(
          normalizedData.assumptionId
        );
        if (assumption === null) {
          rowIssues.push(createImportIssue({
            issueCode: IMPORT_ISSUE_CODE.TARGET_CONTEXT_MISMATCH,
            message: "The Assumption was not found.",
            rowNumber: record.rowNumber,
            columnName: "assumptionId",
            rawValue: normalizedData.assumptionId
          }));
        }
      }

      let relation = null;
      if (!rowIssues.some((issue) => issue.severity === IMPORT_ISSUE_SEVERITY.ERROR)) {
        try {
          relation = new ScenarioAssumptionRelation(normalizedData);
        } catch (error) {
          appendEntityValidationIssue(error, record.rowNumber, rowIssues);
        }
      }

      const existing = relation === null
        ? null
        : this.#relationRepository.findById(relation.relationId);

      rows.push(rowStatusFromEntity({
        entity: relation,
        entityId: rawRelationId,
        existing,
        rowNumber: record.rowNumber,
        rowIssues
      }));
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
    return new EntityCsvImportPreview({
      importBatchId: batchId,
      entityType: ENTITY_TYPE,
      expectedPlanVersionId: targetVersionId,
      fileName,
      receivedAt,
      previewedAt,
      repositoryRevisions: {
        planVersions: this.#planVersionRepository.revision,
        diagnosisScenarios: this.#diagnosisScenarioRepository.revision,
        assumptions: this.#assumptionRepository.revision,
        scenarioAssumptionRelations: this.#relationRepository.revision
      },
      rows,
      issues
    });
  }
}
