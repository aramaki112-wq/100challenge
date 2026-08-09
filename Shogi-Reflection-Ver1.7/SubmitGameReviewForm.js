import { deepFreeze } from "./Immutable.js";
import { ReflectionError } from "./ReflectionErrors.js";
import { WorkflowError } from "./WorkflowErrors.js";
import { ApplicationError } from "./ApplicationErrors.js";
import { PersistenceError } from "./PersistenceErrors.js";
import { GAME_REVIEW_WORKFLOW_STATUS, hasReflectionContent } from "./ReflectionWorkflowStatus.js";

export const GAME_REVIEW_SAVE_INTENT = Object.freeze({
  SAVE_GAME: "SAVE_GAME",
  SAVE_REFLECTION_DRAFT: "SAVE_REFLECTION_DRAFT",
  COMPLETE_REFLECTION: "COMPLETE_REFLECTION"
});

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

function statusForIntent(input, intent) {
  if (intent === GAME_REVIEW_SAVE_INTENT.COMPLETE_REFLECTION) {
    return GAME_REVIEW_WORKFLOW_STATUS.REFLECTION_COMPLETE;
  }
  if (intent === GAME_REVIEW_SAVE_INTENT.SAVE_REFLECTION_DRAFT) {
    return hasReflectionContent(input)
      ? GAME_REVIEW_WORKFLOW_STATUS.REFLECTION_IN_PROGRESS
      : GAME_REVIEW_WORKFLOW_STATUS.GAME_ONLY;
  }
  return hasReflectionContent(input)
    ? GAME_REVIEW_WORKFLOW_STATUS.REFLECTION_IN_PROGRESS
    : GAME_REVIEW_WORKFLOW_STATUS.GAME_ONLY;
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

  execute({ input, intent = GAME_REVIEW_SAVE_INTENT.SAVE_REFLECTION_DRAFT } = {}) {
    let gameReview;
    try {
      gameReview = this.mapper.toEntity(input, { workflowStatus: statusForIntent(input, intent) });
    } catch (error) {
      if (error instanceof ReflectionError || error instanceof WorkflowError) return errorResult(error);
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
        intent,
        saveStatus: saved.status,
        repositoryRevision: saved.repositoryRevision,
        browserPersistence,
        gameReview: saved.gameReview
      });
    } catch (error) {
      if (error instanceof PersistenceError) {
        return deepFreeze({
          status: "SAVED_IN_MEMORY_ONLY",
          intent,
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
