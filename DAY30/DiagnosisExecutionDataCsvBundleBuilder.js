import { parseCsv } from "./CsvParser.js";
import { CapacityBucket } from "./CapacityBucket.js";
import { CapacitySnapshot } from "./CapacitySnapshot.js";
import { DiagnosisExecutionData } from "./DiagnosisExecutionData.js";
import { InMemoryDiagnosisExecutionDataProvider } from "./InMemoryDiagnosisExecutionDataProvider.js";
import { DiagnosisExecutionDataSnapshotService } from "./DiagnosisExecutionDataSnapshotService.js";
import {
  ERROR_CODES,
  createApplicationError
} from "./DiagnosisErrors.js";

export const EXECUTION_DATA_CSV_HEADERS = Object.freeze({
  settings: Object.freeze([
    "capacityScenarioId", "targetMonth", "generatedAt", "defaultFactoryId",
    "standardShiftMinutes", "standardDayMinutes", "quantityPrecision"
  ]),
  capacityBuckets: Object.freeze([
    "factoryId", "equipmentId", "date", "shiftId", "availableMinutes",
    "availabilityStatus", "workerStatus", "skillStatus", "assignmentStatus",
    "reasonCodes", "dataConfidence"
  ]),
  equipments: Object.freeze(["equipmentId", "factoryId", "name"]),
  orders: Object.freeze([
    "orderId", "priority", "dueDate", "productGroup", "materialGroup",
    "dimensionGroup", "outsideDiameter", "wallThickness", "processingType",
    "difficultyClass", "operationType"
  ]),
  routingOperations: Object.freeze([
    "routingOperationId", "routingId", "sequence"
  ]),
  shifts: Object.freeze(["shiftId", "sequence"]),
  capacityRules: Object.freeze([
    "capacityRuleId", "equipmentId", "source", "active", "priority",
    "validFrom", "validTo", "plannedOperationId", "productGroup",
    "materialGroup", "dimensionGroup", "outsideDiameter", "wallThickness",
    "processingType", "difficultyClass", "operationType", "capacityValue",
    "quantityUnit", "capacityBasis", "capacityMultiplier"
  ]),
  operationFactories: Object.freeze(["plannedOperationId", "factoryId"]),
  revisions: Object.freeze(["scope", "key", "value"])
});

function fail(message, details = {}, cause) {
  throw createApplicationError(
    ERROR_CODES.EXTERNAL_DATA_CSV_BUNDLE_VALIDATION_FAILED,
    message,
    details,
    cause
  );
}

function assertText(value, label, { optional = false } = {}) {
  if (optional && (value === "" || value === null || value === undefined)) {
    return null;
  }
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} must be a non-empty string.`, { label, value });
  }
  return value.trim();
}

function optionalText(value) {
  return value === "" || value === null || value === undefined
    ? null
    : String(value).trim();
}

function parseInteger(value, label, { optional = false, min = null } = {}) {
  if (optional && (value === "" || value === null || value === undefined)) {
    return null;
  }
  if (!/^-?\d+$/.test(String(value).trim())) {
    fail(`${label} must be an integer.`, { label, value });
  }
  const result = Number.parseInt(String(value).trim(), 10);
  if (min !== null && result < min) {
    fail(`${label} must be at least ${min}.`, { label, value: result });
  }
  return result;
}

function parseNumber(value, label, { optional = false, positive = false } = {}) {
  if (optional && (value === "" || value === null || value === undefined)) {
    return null;
  }
  const result = Number(String(value).trim());
  if (!Number.isFinite(result) || (positive && result <= 0)) {
    fail(`${label} must be a valid${positive ? " positive" : ""} number.`, {
      label,
      value
    });
  }
  return result;
}

function parseBoolean(value, label, { optional = false, defaultValue = null } = {}) {
  if (value === "" || value === null || value === undefined) {
    if (optional) return defaultValue;
    fail(`${label} must be TRUE or FALSE.`, { label, value });
  }
  const normalized = String(value).trim().toUpperCase();
  if (["TRUE", "1", "YES"].includes(normalized)) return true;
  if (["FALSE", "0", "NO"].includes(normalized)) return false;
  fail(`${label} must be TRUE or FALSE.`, { label, value });
}

function parseSheet(csvText, expectedHeaders, label) {
  if (typeof csvText !== "string") {
    fail(`${label} CSV is required.`, { label, csvTextType: typeof csvText });
  }
  const parsed = parseCsv(csvText);
  if (
    parsed.headers.length !== expectedHeaders.length ||
    expectedHeaders.some((header, index) => parsed.headers[index] !== header)
  ) {
    fail(`${label} CSV headers do not match the formal schema.`, {
      label,
      expectedHeaders,
      actualHeaders: parsed.headers
    });
  }
  return parsed.records.map((record) => {
    const row = {};
    expectedHeaders.forEach((header, index) => {
      row[header] = record.values[index] ?? "";
    });
    return Object.freeze({ rowNumber: record.rowNumber, ...row });
  });
}

function cleanObject(record) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(record).filter(([, value]) => value !== null && value !== "")
    )
  );
}

function buildSettings(rows) {
  if (rows.length !== 1) {
    fail("settings CSV must contain exactly one data row.", {
      rowCount: rows.length
    });
  }
  const row = rows[0];
  return Object.freeze({
    capacityScenarioId: assertText(row.capacityScenarioId, "capacityScenarioId"),
    targetMonth: assertText(row.targetMonth, "targetMonth"),
    generatedAt: assertText(row.generatedAt, "generatedAt"),
    defaultFactoryId: optionalText(row.defaultFactoryId),
    standardShiftMinutes: parseInteger(
      row.standardShiftMinutes,
      "standardShiftMinutes",
      { optional: true, min: 1 }
    ),
    standardDayMinutes: parseInteger(
      row.standardDayMinutes,
      "standardDayMinutes",
      { optional: true, min: 1 }
    ),
    quantityPrecision: parseInteger(
      row.quantityPrecision,
      "quantityPrecision",
      { optional: true, min: 0 }
    )
  });
}

function buildRevisions(rows) {
  const capacitySource = {};
  const externalInput = {};
  for (const row of rows) {
    const scope = assertText(row.scope, `revisions row ${row.rowNumber} scope`);
    const key = assertText(row.key, `revisions row ${row.rowNumber} key`);
    const value = parseInteger(
      row.value,
      `revisions row ${row.rowNumber} value`,
      { min: 0 }
    );
    const target = scope === "CAPACITY_SOURCE"
      ? capacitySource
      : scope === "EXTERNAL_INPUT"
        ? externalInput
        : null;
    if (target === null) {
      fail("revision scope must be CAPACITY_SOURCE or EXTERNAL_INPUT.", {
        rowNumber: row.rowNumber,
        scope
      });
    }
    if (Object.hasOwn(target, key)) {
      fail("revision keys must not be duplicated within the same scope.", {
        rowNumber: row.rowNumber,
        scope,
        key
      });
    }
    target[key] = value;
  }
  if (Object.keys(capacitySource).length === 0) {
    fail("At least one CAPACITY_SOURCE revision is required.", {});
  }
  return Object.freeze({
    capacitySource: Object.freeze(capacitySource),
    externalInput: Object.freeze(externalInput)
  });
}

function buildCapacityBuckets(rows) {
  return rows.map((row) => new CapacityBucket({
    factoryId: assertText(row.factoryId, `capacity row ${row.rowNumber} factoryId`),
    equipmentId: assertText(row.equipmentId, `capacity row ${row.rowNumber} equipmentId`),
    date: assertText(row.date, `capacity row ${row.rowNumber} date`),
    shiftId: optionalText(row.shiftId),
    availableMinutes: parseInteger(
      row.availableMinutes,
      `capacity row ${row.rowNumber} availableMinutes`,
      { optional: true, min: 0 }
    ),
    availabilityStatus: assertText(row.availabilityStatus, `capacity row ${row.rowNumber} availabilityStatus`),
    workerStatus: assertText(row.workerStatus, `capacity row ${row.rowNumber} workerStatus`),
    skillStatus: assertText(row.skillStatus, `capacity row ${row.rowNumber} skillStatus`),
    assignmentStatus: assertText(row.assignmentStatus, `capacity row ${row.rowNumber} assignmentStatus`),
    reasonCodes: optionalText(row.reasonCodes)?.split(";").map((v) => v.trim()).filter(Boolean) ?? [],
    dataConfidence: assertText(row.dataConfidence, `capacity row ${row.rowNumber} dataConfidence`)
  }));
}

function buildEquipments(rows) {
  return rows.map((row) => cleanObject({
    equipmentId: assertText(row.equipmentId, `equipment row ${row.rowNumber} equipmentId`),
    factoryId: assertText(row.factoryId, `equipment row ${row.rowNumber} factoryId`),
    name: optionalText(row.name)
  }));
}

function buildOrders(rows) {
  return rows.map((row) => cleanObject({
    orderId: assertText(row.orderId, `order row ${row.rowNumber} orderId`),
    priority: parseInteger(row.priority, `order row ${row.rowNumber} priority`, { optional: true, min: 1 }),
    dueDate: optionalText(row.dueDate),
    productGroup: optionalText(row.productGroup),
    materialGroup: optionalText(row.materialGroup),
    dimensionGroup: optionalText(row.dimensionGroup),
    outsideDiameter: parseNumber(row.outsideDiameter, `order row ${row.rowNumber} outsideDiameter`, { optional: true, positive: true }),
    wallThickness: parseNumber(row.wallThickness, `order row ${row.rowNumber} wallThickness`, { optional: true, positive: true }),
    processingType: optionalText(row.processingType),
    difficultyClass: optionalText(row.difficultyClass),
    operationType: optionalText(row.operationType)
  }));
}

function buildRoutingOperations(rows) {
  return rows.map((row) => Object.freeze({
    routingOperationId: assertText(row.routingOperationId, `routing row ${row.rowNumber} routingOperationId`),
    routingId: optionalText(row.routingId),
    sequence: parseInteger(row.sequence, `routing row ${row.rowNumber} sequence`, { min: 1 })
  }));
}

function buildShifts(rows) {
  return rows.map((row) => Object.freeze({
    shiftId: assertText(row.shiftId, `shift row ${row.rowNumber} shiftId`),
    sequence: parseInteger(row.sequence, `shift row ${row.rowNumber} sequence`, { min: 1 })
  }));
}

function buildCapacityRules(rows) {
  return rows.map((row) => cleanObject({
    capacityRuleId: assertText(row.capacityRuleId, `rule row ${row.rowNumber} capacityRuleId`),
    equipmentId: assertText(row.equipmentId, `rule row ${row.rowNumber} equipmentId`),
    source: assertText(row.source, `rule row ${row.rowNumber} source`),
    active: parseBoolean(row.active, `rule row ${row.rowNumber} active`, { optional: true, defaultValue: true }),
    priority: parseInteger(row.priority, `rule row ${row.rowNumber} priority`, { optional: true, min: 1 }),
    validFrom: optionalText(row.validFrom),
    validTo: optionalText(row.validTo),
    plannedOperationId: optionalText(row.plannedOperationId),
    productGroup: optionalText(row.productGroup),
    materialGroup: optionalText(row.materialGroup),
    dimensionGroup: optionalText(row.dimensionGroup),
    outsideDiameter: parseNumber(row.outsideDiameter, `rule row ${row.rowNumber} outsideDiameter`, { optional: true, positive: true }),
    wallThickness: parseNumber(row.wallThickness, `rule row ${row.rowNumber} wallThickness`, { optional: true, positive: true }),
    processingType: optionalText(row.processingType),
    difficultyClass: optionalText(row.difficultyClass),
    operationType: optionalText(row.operationType),
    capacityValue: parseNumber(row.capacityValue, `rule row ${row.rowNumber} capacityValue`, { positive: true }),
    quantityUnit: assertText(row.quantityUnit, `rule row ${row.rowNumber} quantityUnit`),
    capacityBasis: assertText(row.capacityBasis, `rule row ${row.rowNumber} capacityBasis`),
    capacityMultiplier: parseNumber(row.capacityMultiplier, `rule row ${row.rowNumber} capacityMultiplier`, { optional: true, positive: true }) ?? 1
  }));
}

function buildOperationFactories(rows) {
  const result = {};
  for (const row of rows) {
    const operationId = assertText(row.plannedOperationId, `operation factory row ${row.rowNumber} plannedOperationId`);
    if (Object.hasOwn(result, operationId)) {
      fail("plannedOperationId must not be duplicated in operationFactories.", {
        rowNumber: row.rowNumber,
        plannedOperationId: operationId
      });
    }
    result[operationId] = assertText(row.factoryId, `operation factory row ${row.rowNumber} factoryId`);
  }
  return Object.freeze(result);
}

export class DiagnosisExecutionDataCsvBundleBuilder {
  build({
    settingsCsv,
    capacityBucketsCsv,
    equipmentsCsv,
    ordersCsv,
    routingOperationsCsv,
    shiftsCsv,
    capacityRulesCsv,
    operationFactoriesCsv,
    revisionsCsv,
    exportedAt
  } = {}) {
    try {
      const settings = buildSettings(parseSheet(
        settingsCsv,
        EXECUTION_DATA_CSV_HEADERS.settings,
        "settings"
      ));
      const revisions = buildRevisions(parseSheet(
        revisionsCsv,
        EXECUTION_DATA_CSV_HEADERS.revisions,
        "revisions"
      ));
      const capacitySnapshot = new CapacitySnapshot({
        capacityScenarioId: settings.capacityScenarioId,
        targetMonth: settings.targetMonth,
        generatedAt: settings.generatedAt,
        sourceRevision: revisions.capacitySource,
        buckets: buildCapacityBuckets(parseSheet(
          capacityBucketsCsv,
          EXECUTION_DATA_CSV_HEADERS.capacityBuckets,
          "capacityBuckets"
        ))
      });
      const executionData = new DiagnosisExecutionData({
        capacitySnapshot,
        defaultFactoryId: settings.defaultFactoryId,
        factoryIdByOperation: buildOperationFactories(parseSheet(
          operationFactoriesCsv,
          EXECUTION_DATA_CSV_HEADERS.operationFactories,
          "operationFactories"
        )),
        equipments: buildEquipments(parseSheet(
          equipmentsCsv,
          EXECUTION_DATA_CSV_HEADERS.equipments,
          "equipments"
        )),
        orders: buildOrders(parseSheet(
          ordersCsv,
          EXECUTION_DATA_CSV_HEADERS.orders,
          "orders"
        )),
        routingOperations: buildRoutingOperations(parseSheet(
          routingOperationsCsv,
          EXECUTION_DATA_CSV_HEADERS.routingOperations,
          "routingOperations"
        )),
        shifts: buildShifts(parseSheet(
          shiftsCsv,
          EXECUTION_DATA_CSV_HEADERS.shifts,
          "shifts"
        )),
        capacityRules: buildCapacityRules(parseSheet(
          capacityRulesCsv,
          EXECUTION_DATA_CSV_HEADERS.capacityRules,
          "capacityRules"
        )),
        standardShiftMinutes: settings.standardShiftMinutes,
        standardDayMinutes: settings.standardDayMinutes,
        quantityPrecision: settings.quantityPrecision,
        externalInputRevision: revisions.externalInput
      });
      const provider = new InMemoryDiagnosisExecutionDataProvider({
        data: [executionData]
      });
      const snapshotService = new DiagnosisExecutionDataSnapshotService({
        executionDataProvider: provider
      });
      const snapshot = snapshotService.createSnapshot({ exportedAt });
      const validation = snapshotService.validateSnapshot(snapshot);
      return Object.freeze({
        snapshot,
        jsonText: JSON.stringify(snapshot, null, 2),
        executionData,
        summary: validation.summaries[0]
      });
    } catch (error) {
      if (error?.code === ERROR_CODES.EXTERNAL_DATA_CSV_BUNDLE_VALIDATION_FAILED) {
        throw error;
      }
      fail("External data CSV bundle could not be converted.", {}, error);
    }
  }
}

export function assertDiagnosisExecutionDataCsvBundleBuilder(value) {
  if (value === null || typeof value !== "object" || typeof value.build !== "function") {
    throw createApplicationError(
      ERROR_CODES.INVALID_EXTERNAL_DATA_CSV_BUNDLE_BUILDER,
      "value does not satisfy the CSV bundle builder contract.",
      {}
    );
  }
  return value;
}
