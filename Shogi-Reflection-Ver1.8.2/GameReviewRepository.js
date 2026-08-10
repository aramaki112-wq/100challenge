import {
  REPOSITORY_ERROR_CODES,
  RepositoryError
} from "./RepositoryErrors.js";

const REQUIRED_METHODS = Object.freeze([
  "save",
  "findById",
  "findAll",
  "deleteById",
  "existsById",
  "getRevision",
  "replaceAll"
]);

export class GameReviewRepository {
  save() { throw new Error("Not implemented"); }
  findById() { throw new Error("Not implemented"); }
  findAll() { throw new Error("Not implemented"); }
  deleteById() { throw new Error("Not implemented"); }
  existsById() { throw new Error("Not implemented"); }
  getRevision() { throw new Error("Not implemented"); }
  replaceAll() { throw new Error("Not implemented"); }
}

export function assertGameReviewRepository(repository) {
  const missingMethods = REQUIRED_METHODS.filter(
    (methodName) => typeof repository?.[methodName] !== "function"
  );

  if (missingMethods.length > 0) {
    throw new RepositoryError(
      REPOSITORY_ERROR_CODES.INVALID_REPOSITORY,
      "GameReviewRepository Contractを満たしていません。",
      { missingMethods }
    );
  }

  return repository;
}
