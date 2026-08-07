import { SystemClock } from "./Clock.js";
import { assertGameReviewRepository } from "./GameReviewRepository.js";
import {
  gameReviewFromPersistentSnapshot,
  gameReviewToPersistentSnapshot
} from "./GameReviewSnapshotMapper.js";
import { deepFreeze } from "./Immutable.js";
import {
  PERSISTENCE_ERROR_CODES,
  PersistenceError
} from "./PersistenceErrors.js";
import { RepositoryError } from "./RepositoryErrors.js";

export const SHOGI_REFLECTION_APPLICATION_ID = "SHOGI_REFLECTION_INTERLUDE";
export const SHOGI_REFLECTION_SCHEMA_VERSION = 1;

function assertSnapshotObject(snapshot) {
  if (snapshot === null || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new PersistenceError(
      PERSISTENCE_ERROR_CODES.INVALID_SNAPSHOT_DOCUMENT,
      "SnapshotはObjectである必要があります。"
    );
  }
}

function normalizeExportedAt(exportedAt) {
  const parsed = new Date(exportedAt);
  if (Number.isNaN(parsed.getTime())) {
    throw new PersistenceError(
      PERSISTENCE_ERROR_CODES.INVALID_EXPORTED_AT,
      "exportedAtは有効な日時である必要があります。",
      { exportedAt }
    );
  }
  return parsed.toISOString();
}

function assertRepositoryRevision(revision) {
  if (!Number.isInteger(revision) || revision < 0) {
    throw new PersistenceError(
      PERSISTENCE_ERROR_CODES.INVALID_REPOSITORY_REVISION,
      "repositoryRevisionは0以上の整数である必要があります。",
      { repositoryRevision: revision }
    );
  }
  return revision;
}

export class GameReviewSnapshotService {
  constructor({ repository, clock = new SystemClock() } = {}) {
    this.repository = assertGameReviewRepository(repository);
    this.clock = clock;
  }

  createSnapshot({ exportedAt = this.clock.now() } = {}) {
    const normalizedExportedAt = normalizeExportedAt(exportedAt);
    const gameReviews = this.repository.findAll().map(
      (gameReview) => gameReviewToPersistentSnapshot(gameReview)
    );

    return deepFreeze({
      applicationId: SHOGI_REFLECTION_APPLICATION_ID,
      schemaVersion: SHOGI_REFLECTION_SCHEMA_VERSION,
      exportedAt: normalizedExportedAt,
      repositoryRevision: this.repository.getRevision(),
      gameReviews
    });
  }

  createJson(options = {}) {
    return JSON.stringify(this.createSnapshot(options), null, 2);
  }

  restoreJson(jsonText) {
    if (typeof jsonText !== "string") {
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.INVALID_SNAPSHOT_JSON,
        "復元DataはJSON文字列で入力してください。"
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.INVALID_SNAPSHOT_JSON,
        "JSONが壊れているため復元できません。",
        {},
        { cause: error }
      );
    }

    return this.restoreSnapshot(parsed);
  }

  restoreSnapshot(snapshot) {
    assertSnapshotObject(snapshot);

    if (snapshot.applicationId !== SHOGI_REFLECTION_APPLICATION_ID) {
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.INVALID_APPLICATION_ID,
        "Application IDが一致しません。",
        {
          expected: SHOGI_REFLECTION_APPLICATION_ID,
          actual: snapshot.applicationId
        }
      );
    }

    if (snapshot.schemaVersion !== SHOGI_REFLECTION_SCHEMA_VERSION) {
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.UNSUPPORTED_SCHEMA_VERSION,
        "対応していないSchema Versionです。",
        {
          supported: SHOGI_REFLECTION_SCHEMA_VERSION,
          actual: snapshot.schemaVersion
        }
      );
    }

    normalizeExportedAt(snapshot.exportedAt);
    const revision = assertRepositoryRevision(snapshot.repositoryRevision);

    if (!Array.isArray(snapshot.gameReviews)) {
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.INVALID_SNAPSHOT_DOCUMENT,
        "gameReviewsは配列である必要があります。"
      );
    }

    const ids = new Set();
    const restoredEntities = [];

    // 現在Repositoryへ触れる前に、全件をDomain Entityとして再生成する。
    for (const item of snapshot.gameReviews) {
      const id = item?.reviewId;
      if (typeof id === "string" && ids.has(id)) {
        throw new PersistenceError(
          PERSISTENCE_ERROR_CODES.DUPLICATE_GAME_REVIEW_ID,
          "GameReview IDが重複しています。",
          { reviewId: id }
        );
      }
      if (typeof id === "string") ids.add(id);
      restoredEntities.push(gameReviewFromPersistentSnapshot(item));
    }

    try {
      const result = this.repository.replaceAll({
        gameReviews: restoredEntities,
        revision
      });
      return deepFreeze({
        status: "RESTORED",
        count: result.count,
        repositoryRevision: result.revision
      });
    } catch (error) {
      if (error instanceof PersistenceError) throw error;
      if (error instanceof RepositoryError) {
        throw new PersistenceError(
          PERSISTENCE_ERROR_CODES.SNAPSHOT_RESTORE_FAILED,
          "Repositoryの一括復元に失敗しました。現在Dataは変更されていません。",
          { repositoryErrorCode: error.code },
          { cause: error }
        );
      }
      throw error;
    }
  }
}
