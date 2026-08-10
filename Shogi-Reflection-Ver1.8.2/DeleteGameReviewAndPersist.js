import { deepFreeze } from "./Immutable.js";
import { PersistenceError } from "./PersistenceErrors.js";

function assertMethod(target, methodName, label) {
  if (typeof target?.[methodName] !== "function") {
    throw new TypeError(`${label}.${methodName}が必要です。`);
  }
  return target;
}

export class DeleteGameReviewAndPersist {
  constructor({ deleteGameReview, snapshotService, persistenceCoordinator } = {}) {
    this.deleteGameReview = assertMethod(deleteGameReview, "execute", "deleteGameReview");
    this.snapshotService = assertMethod(snapshotService, "createSnapshot", "snapshotService");
    assertMethod(snapshotService, "restoreSnapshot", "snapshotService");
    this.persistenceCoordinator = assertMethod(
      persistenceCoordinator,
      "saveCurrentDataToBrowser",
      "persistenceCoordinator"
    );
  }

  execute({ reviewId } = {}) {
    const beforeDelete = this.snapshotService.createSnapshot();
    const deleted = this.deleteGameReview.execute({ reviewId });

    if (deleted.status === "NOT_FOUND") {
      return deepFreeze({ ...deleted, status: "NOT_FOUND" });
    }

    try {
      const browserPersistence = this.persistenceCoordinator.saveCurrentDataToBrowser();
      return deepFreeze({
        status: "DELETED",
        reviewId: deleted.reviewId,
        repositoryRevision: deleted.repositoryRevision,
        browserPersistence
      });
    } catch (error) {
      if (!(error instanceof PersistenceError)) throw error;

      const rollback = this.snapshotService.restoreSnapshot(beforeDelete);
      return deepFreeze({
        status: "DELETE_ROLLED_BACK",
        reviewId: deleted.reviewId,
        repositoryRevision: rollback.repositoryRevision,
        persistenceErrorCode: error.code,
        message: "Browser保存に失敗したため、削除前のDataへ戻しました。"
      });
    }
  }
}
