import {
  IMPORT_ISSUE_CODE,
  IMPORT_ISSUE_SEVERITY
} from "./DiagnosisCodes.js";

const DEFINITIONS = [
  ["diagnosisScenarioId", true, "identifier"],
  ["assumptionId", true, "identifier"],
  ["active", false, "boolean"],
  ["note", false, "text"]
];

export const SCENARIO_ASSUMPTION_RELATION_CSV_SCHEMA = Object.freeze(
  DEFINITIONS.map(([name, required, kind], index) =>
    Object.freeze({ name, required, kind, position: index + 1 })
  )
);

export const SCENARIO_ASSUMPTION_RELATION_CSV_HEADERS = Object.freeze(
  SCENARIO_ASSUMPTION_RELATION_CSV_SCHEMA.map((column) => column.name)
);

export const SCENARIO_ASSUMPTION_RELATION_REQUIRED_HEADERS = Object.freeze(
  SCENARIO_ASSUMPTION_RELATION_CSV_SCHEMA
    .filter((column) => column.required)
    .map((column) => column.name)
);

export function analyzeScenarioAssumptionRelationCsvHeaders(headers) {
  const input = Array.isArray(headers) ? headers : [];
  const duplicates = [...new Set(
    input.filter((header, index) => input.indexOf(header) !== index)
  )];
  const allowed = new Set(SCENARIO_ASSUMPTION_RELATION_CSV_HEADERS);
  const unknown = [...new Set(input.filter((header) => !allowed.has(header)))];
  const missingRequired = SCENARIO_ASSUMPTION_RELATION_REQUIRED_HEADERS
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
      message: `${columnName} is not a supported Scenario–Assumption Relation column.`
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

export function mapScenarioAssumptionRelationCsvRecord(headers, values) {
  const row = {};
  headers.forEach((header, index) => {
    row[header] = values[index] ?? "";
  });
  return Object.freeze(row);
}
