export const ENGINE_ANALYSIS_STATUS = Object.freeze({
  NOT_AVAILABLE: "NOT_AVAILABLE",
  READY: "READY",
  INITIALIZING: "INITIALIZING",
  ANALYZING: "ANALYZING",
  CANCELLING: "CANCELLING",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  // Backward-compatible persisted labels from Ver.1.6/1.7.
  UNANALYZED: "UNANALYZED",
  ANALYZED: "ANALYZED",
  REANALYZABLE: "REANALYZABLE"
});

export const ENGINE_EVALUATION_TYPE = Object.freeze({
  CP: "CP",
  MATE: "MATE",
  UNKNOWN: "UNKNOWN"
});

export const ENGINE_EVALUATION_PERSPECTIVE = Object.freeze({
  SENTE: "SENTE",
  SIDE_TO_MOVE: "SIDE_TO_MOVE"
});

export const ENGINE_CANDIDATE_TYPE = Object.freeze({
  MAJOR_DROPOFF: "MAJOR_DROPOFF",
  REVIEW_CANDIDATE: "REVIEW_CANDIDATE",
  GOOD_MOVE_CANDIDATE: "GOOD_MOVE_CANDIDATE"
});

// Analysis result schema remains Ver.1.7-compatible because Ver.1.8 only adds optional metadata fields.
export const ENGINE_ANALYSIS_SCHEMA_VERSION = 1;
