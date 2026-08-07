import {
  ERROR_CODES,
  createRepositoryError
} from "./DiagnosisErrors.js";

const REQUIRED_METHODS = Object.freeze([
  "listPlanSummaries",
  "listScenarioSummaries",
  "getLatestDiagnosisOverview",
  "getDiagnosisResultDetail",
  "listActionItems",
  "getScenarioComparison"
]);

export class DiagnosisReadModel {
  listPlanSummaries() { return this.#notImplemented("listPlanSummaries"); }
  listScenarioSummaries() { return this.#notImplemented("listScenarioSummaries"); }
  getLatestDiagnosisOverview() { return this.#notImplemented("getLatestDiagnosisOverview"); }
  getDiagnosisResultDetail() { return this.#notImplemented("getDiagnosisResultDetail"); }
  listActionItems() { return this.#notImplemented("listActionItems"); }
  getScenarioComparison() { return this.#notImplemented("getScenarioComparison"); }

  #notImplemented(methodName) {
    throw createRepositoryError(
      ERROR_CODES.READ_MODEL_INTEGRITY_ERROR,
      `${methodName} must be implemented by a DiagnosisReadModel adapter.`,
      { methodName }
    );
  }
}

export function assertDiagnosisReadModel(value) {
  if (value === null || typeof value !== "object") {
    throw createRepositoryError(
      ERROR_CODES.READ_MODEL_INTEGRITY_ERROR,
      "diagnosisReadModel must be an object.",
      { value }
    );
  }

  const missingMethods = REQUIRED_METHODS.filter(
    (methodName) => typeof value[methodName] !== "function"
  );

  if (missingMethods.length > 0) {
    throw createRepositoryError(
      ERROR_CODES.READ_MODEL_INTEGRITY_ERROR,
      "diagnosisReadModel does not satisfy the read contract.",
      { missingMethods }
    );
  }

  return value;
}
