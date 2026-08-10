export const WORKFLOW_ERROR_CODES = Object.freeze({
  INVALID_WORKFLOW_STATUS: "INVALID_WORKFLOW_STATUS",
  REFLECTION_NOT_READY_FOR_COMPLETION: "REFLECTION_NOT_READY_FOR_COMPLETION"
});

export class WorkflowError extends Error {
  constructor(code, message, context = {}) {
    super(message);
    this.name = "WorkflowError";
    this.code = code;
    this.context = Object.freeze({ ...context });
  }
}
