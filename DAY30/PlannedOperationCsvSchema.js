import {
  IMPORT_ISSUE_CODE,
  IMPORT_ISSUE_SEVERITY
} from "./DiagnosisCodes.js";

const DEFINITIONS = [
  ["plannedOperationId", true, "identifier"],
  ["planVersionId", true, "identifier"],
  ["orderId", true, "identifier"],
  ["routingOperationId", true, "identifier"],
  ["equipmentId", true, "identifier"],
  ["plannedDate", true, "date"],
  ["shiftId", false, "identifier"],
  ["plannedStartTime", false, "time"],
  ["plannedEndTime", false, "time"],
  ["plannedQuantity", true, "number"],
  ["quantityUnit", true, "code"],
  ["priority", false, "integer"],
  ["productGroup", false, "identifier"],
  ["materialGroup", false, "identifier"],
  ["dimensionGroup", false, "identifier"],
  ["outsideDiameter", false, "number"],
  ["wallThickness", false, "number"],
  ["processingType", false, "identifier"],
  ["difficultyClass", false, "identifier"],
  ["operationType", false, "identifier"],
  ["note", false, "text"]
];

export const PLANNED_OPERATION_CSV_SCHEMA = Object.freeze(
  DEFINITIONS.map(([name, required, kind], index) =>
    Object.freeze({ name, required, kind, position: index + 1 })
  )
);

export const PLANNED_OPERATION_CSV_HEADERS = Object.freeze(
  PLANNED_OPERATION_CSV_SCHEMA.map((column) => column.name)
);

export const PLANNED_OPERATION_REQUIRED_HEADERS = Object.freeze(
  PLANNED_OPERATION_CSV_SCHEMA
    .filter((column) => column.required)
    .map((column) => column.name)
);

export function analyzePlannedOperationCsvHeaders(headers) {
  const input = Array.isArray(headers) ? headers : [];
  const duplicates = [...new Set(
    input.filter((header, index) => input.indexOf(header) !== index)
  )];
  const allowed = new Set(PLANNED_OPERATION_CSV_HEADERS);
  const unknown = [...new Set(input.filter((header) => !allowed.has(header)))];
  const missingRequired = PLANNED_OPERATION_REQUIRED_HEADERS
    .filter((header) => !input.includes(header));

  const issues = [
    ...duplicates.map((columnName) => Object.freeze({
      severity: IMPORT_ISSUE_SEVERITY.ERROR,
      issueCode: IMPORT_ISSUE_CODE.DUPLICATE_HEADER,
      columnName,
      message: `${columnName} header is duplicated.`
    })),
    ...unknown.map((columnName) => Object.freeze({
      severity: IMPORT_ISSUE_SEVERITY.ERROR,
      issueCode: IMPORT_ISSUE_CODE.UNKNOWN_HEADER,
      columnName,
      message: `${columnName} is not a supported Planned Operation column.`
    })),
    ...missingRequired.map((columnName) => Object.freeze({
      severity: IMPORT_ISSUE_SEVERITY.ERROR,
      issueCode: IMPORT_ISSUE_CODE.REQUIRED_HEADER_MISSING,
      columnName,
      message: `${columnName} header is required.`
    }))
  ];

  return Object.freeze({
    valid: issues.length === 0,
    headers: Object.freeze([...input]),
    duplicates: Object.freeze(duplicates),
    unknown: Object.freeze(unknown),
    missingRequired: Object.freeze(missingRequired),
    issues: Object.freeze(issues)
  });
}

export function mapPlannedOperationCsvRecord(headers, values) {
  const row = {};
  headers.forEach((header, index) => {
    row[header] = values[index] ?? "";
  });
  return Object.freeze(row);
}
