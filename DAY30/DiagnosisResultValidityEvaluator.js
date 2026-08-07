import {
  RESULT_VALIDITY_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  assertDiagnosisResult
} from "./DiagnosisResult.js";

import {
  StaleReasonDetector,
  assertStaleReasonDetection
} from "./StaleReasonDetector.js";

function sameValues(left, right) {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function freezeValue(value) {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(freezeValue));
  }
  if (value !== null && typeof value === "object") {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = freezeValue(child);
    }
    return Object.freeze(result);
  }
  return value;
}

/** Immutable output of re-evaluating one saved DiagnosisResult. */
export class DiagnosisResultValidityEvaluation {
  constructor({ originalResult, evaluatedResult, detection } = {}) {
    this.originalResult = assertDiagnosisResult(originalResult);
    this.evaluatedResult = assertDiagnosisResult(evaluatedResult);
    this.detection = assertStaleReasonDetection(detection);

    if (
      this.originalResult.diagnosisResultId !==
      this.evaluatedResult.diagnosisResultId
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_RESULT_VALIDITY_EVALUATION,
        "Validity evaluation must not replace the Diagnosis Result identity.",
        {
          originalDiagnosisResultId: this.originalResult.diagnosisResultId,
          evaluatedDiagnosisResultId: this.evaluatedResult.diagnosisResultId
        }
      );
    }

    if (
      this.evaluatedResult.validityStatus !==
      this.detection.validityStatus ||
      !sameValues(
        this.evaluatedResult.validityReasonCodes,
        this.detection.reasonCodes
      )
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_RESULT_VALIDITY_EVALUATION,
        "Evaluated Result validity must match the detection.",
        {}
      );
    }

    this.previousValidityStatus = this.originalResult.validityStatus;
    this.validityStatus = this.evaluatedResult.validityStatus;
    this.reasonCodes = this.evaluatedResult.validityReasonCodes;
    this.changed = this.originalResult !== this.evaluatedResult;
    this.requiresRediagnosis =
      this.validityStatus !== RESULT_VALIDITY_STATUS.CURRENT;
    this.changes = this.detection.changes;

    Object.freeze(this);
  }

  toSnapshot() {
    return freezeValue({
      diagnosisResultId: this.evaluatedResult.diagnosisResultId,
      previousValidityStatus: this.previousValidityStatus,
      validityStatus: this.validityStatus,
      reasonCodes: this.reasonCodes,
      changed: this.changed,
      requiresRediagnosis: this.requiresRediagnosis,
      changes: this.changes,
      evaluatedResult: this.evaluatedResult.toSnapshot()
    });
  }
}

/** Applies StaleReasonDetector output without mutating the saved result. */
export class DiagnosisResultValidityEvaluator {
  #staleReasonDetector;

  constructor({ staleReasonDetector = new StaleReasonDetector() } = {}) {
    if (
      staleReasonDetector === null ||
      typeof staleReasonDetector !== "object" ||
      typeof staleReasonDetector.detect !== "function"
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_RESULT_VALIDITY_EVALUATION,
        "staleReasonDetector must implement detect().",
        { staleReasonDetector }
      );
    }
    this.#staleReasonDetector = staleReasonDetector;
    Object.freeze(this);
  }

  evaluate(parameters = {}) {
    const originalResult = assertDiagnosisResult(parameters.diagnosisResult);
    const detection = assertStaleReasonDetection(
      this.#staleReasonDetector.detect(parameters)
    );

    const isSame =
      originalResult.validityStatus === detection.validityStatus &&
      sameValues(originalResult.validityReasonCodes, detection.reasonCodes);

    const evaluatedResult = isSame
      ? originalResult
      : originalResult.withValidity({
        validityStatus: detection.validityStatus,
        validityReasonCodes: detection.reasonCodes
      });

    return new DiagnosisResultValidityEvaluation({
      originalResult,
      evaluatedResult,
      detection
    });
  }
}

export function assertDiagnosisResultValidityEvaluation(value) {
  if (!(value instanceof DiagnosisResultValidityEvaluation)) {
    throw createDomainError(
      ERROR_CODES.INVALID_RESULT_VALIDITY_EVALUATION,
      "value must be a DiagnosisResultValidityEvaluation.",
      { value }
    );
  }
  return value;
}
