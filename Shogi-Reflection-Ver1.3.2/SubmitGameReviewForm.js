import { deepFreeze } from "./Immutable.js";
import { ReflectionError } from "./ReflectionErrors.js";
import { ApplicationError } from "./ApplicationErrors.js";
import { PersistenceError } from "./PersistenceErrors.js";

function assertMethod(target, methodName, label) {
  if (typeof target?.[methodName] !== "function") {
    throw new TypeError(`${label}.${methodName}が必要です。`);
  }
  return target;
}

function errorResult(error) {
  return deepFreeze({
    status: "REJECTED",
    errorType: error.name,
    errorCode: error.code ?? "UNEXPECTED_ERROR",
    message: error.message,
    context: error.context ?? {}
  });
}

export class SubmitGameReviewForm {
  constructor({ mapper, saveGameReview, persistenceCoordinator } = {}) {
    this.mapper = assertMethod(mapper, "toEntity", "mapper");
    this.saveGameReview = assertMethod(saveGameReview, "execute", "saveGameReview");
    this.persistenceCoordinator = assertMethod(
      persistenceCoordinator,
      "saveCurrentDataToBrowser",
      "persistenceCoordinator"
    );
  }

  execute({ input } = {}) {
    let gameReview;
    try {
      gameReview = this.mapper.toEntity(input);
    } catch (error) {
      if (error instanceof ReflectionError) return errorResult(error);
      throw error;
    }

    let saved;
    try {
      saved = this.saveGameReview.execute({ gameReview });
    } catch (error) {
      if (error instanceof ApplicationError) return errorResult(error);
      throw error;
    }

    try {
      const browserPersistence = this.persistenceCoordinator.saveCurrentDataToBrowser();
      return deepFreeze({
        status: "SAVED",
        saveStatus: saved.status,
        repositoryRevision: saved.repositoryRevision,
        browserPersistence,
        gameReview: saved.gameReview
      });
    } catch (error) {
      if (error instanceof PersistenceError) {
        return deepFreeze({
          status: "SAVED_IN_MEMORY_ONLY",
          saveStatus: saved.status,
          repositoryRevision: saved.repositoryRevision,
          persistenceErrorCode: error.code,
          message: error.message,
          gameReview: saved.gameReview
        });
      }
      throw error;
    }
  }
}
