import {
  ERROR_CODES,
  createApplicationError,
  isApplicationError,
  wrapUnexpectedError
} from "./DiagnosisErrors.js";

import {
  assertDiagnosisExecutionData
} from "./DiagnosisExecutionData.js";

/**
 * DAY29 Capacity Snapshotと診断用Master／Read Modelを取得するPort。
 */
export class DiagnosisExecutionDataProvider {
  async load(_request) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_PROVIDER,
      "DiagnosisExecutionDataProvider.load() must be implemented.",
      {
        contract: "DiagnosisExecutionDataProvider",
        method: "load"
      }
    );
  }
}

export function assertDiagnosisExecutionDataProvider(value) {
  if (
    value === null ||
    (typeof value !== "object" && typeof value !== "function") ||
    typeof value.load !== "function"
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_DIAGNOSIS_EXECUTION_DATA_PROVIDER,
      "diagnosisExecutionDataProvider must implement load(request).",
      {
        contract: "DiagnosisExecutionDataProvider",
        requiredMethod: "load"
      }
    );
  }

  return value;
}

export async function loadDiagnosisExecutionData(provider, request) {
  const validProvider = assertDiagnosisExecutionDataProvider(provider);

  try {
    const data = await validProvider.load(request);
    return assertDiagnosisExecutionData(data);
  } catch (error) {
    if (isApplicationError(error)) {
      throw error;
    }

    throw wrapUnexpectedError(error, {
      component: "DiagnosisExecutionDataProvider",
      operation: "load",
      request
    });
  }
}
