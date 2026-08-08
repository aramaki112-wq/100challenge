export const REPOSITORY_ERROR_CODES = Object.freeze({
  INVALID_REPOSITORY: "INVALID_REPOSITORY",
  INVALID_REVIEW_ENTITY: "INVALID_REVIEW_ENTITY",
  INVALID_REVIEW_ID: "INVALID_REVIEW_ID",
  INVALID_REPOSITORY_REVISION: "INVALID_REPOSITORY_REVISION",
  DUPLICATE_REVIEW_ID: "DUPLICATE_REVIEW_ID",
  REPOSITORY_OPERATION_FAILED: "REPOSITORY_OPERATION_FAILED"
});

export class RepositoryError extends Error {
  constructor(code, message, context = {}, options = {}) {
    super(message, options);
    this.name = "RepositoryError";
    this.code = code;
    this.context = Object.freeze({ ...context });
  }
}
