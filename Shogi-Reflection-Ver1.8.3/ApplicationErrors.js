export const APPLICATION_ERROR_CODES = Object.freeze({
  INVALID_GAME_REVIEW: "INVALID_GAME_REVIEW",
  INVALID_REVIEW_ID: "INVALID_REVIEW_ID",
  GAME_REVIEW_NOT_FOUND: "GAME_REVIEW_NOT_FOUND",
  SAVE_GAME_REVIEW_FAILED: "SAVE_GAME_REVIEW_FAILED",
  GET_GAME_REVIEW_FAILED: "GET_GAME_REVIEW_FAILED",
  LIST_GAME_REVIEWS_FAILED: "LIST_GAME_REVIEWS_FAILED",
  DELETE_GAME_REVIEW_FAILED: "DELETE_GAME_REVIEW_FAILED"
});

export class ApplicationError extends Error {
  constructor(code, message, context = {}, options = {}) {
    super(message, options);
    this.name = "ApplicationError";
    this.code = code;
    this.context = Object.freeze({ ...context });
  }
}
