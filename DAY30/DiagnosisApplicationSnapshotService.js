import {
  ERROR_CODES,
  createApplicationError
} from "./DiagnosisErrors.js";
import { assertDateTime } from "./DateTimeUtils.js";
import {
  DIAGNOSIS_BACKUP_APPLICATION,
  assertDiagnosisRepositorySnapshotService
} from "./DiagnosisRepositorySnapshotService.js";
import {
  assertDiagnosisExecutionDataSnapshotService
} from "./DiagnosisExecutionDataSnapshotService.js";

export const DIAGNOSIS_APPLICATION_BACKUP_SCHEMA_VERSION = 2;

function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export class DiagnosisApplicationSnapshotService {
  #repositorySnapshotService;
  #executionDataSnapshotService;

  constructor({ repositorySnapshotService, executionDataSnapshotService } = {}) {
    this.#repositorySnapshotService = assertDiagnosisRepositorySnapshotService(
      repositorySnapshotService
    );
    this.#executionDataSnapshotService = assertDiagnosisExecutionDataSnapshotService(
      executionDataSnapshotService
    );
    Object.freeze(this);
  }

  createSnapshot({ exportedAt } = {}) {
    const validExportedAt = assertDateTime(
      exportedAt,
      ERROR_CODES.INVALID_REPOSITORY_SNAPSHOT,
      "exportedAt"
    );
    return deepFreeze({
      application: DIAGNOSIS_BACKUP_APPLICATION,
      schemaVersion: DIAGNOSIS_APPLICATION_BACKUP_SCHEMA_VERSION,
      exportedAt: validExportedAt,
      repositorySnapshot: this.#repositorySnapshotService.createSnapshot({
        exportedAt: validExportedAt
      }),
      externalDataSnapshot: this.#executionDataSnapshotService.createSnapshot({
        exportedAt: validExportedAt
      })
    });
  }

  restoreSnapshot(snapshot) {
    if (snapshot?.application !== DIAGNOSIS_BACKUP_APPLICATION) {
      throw createApplicationError(
        ERROR_CODES.INVALID_BACKUP_DOCUMENT,
        "The backup application identifier is invalid.",
        { application: snapshot?.application }
      );
    }

    // Schema Version 1 is the previous repository-only backup.
    if (snapshot.schemaVersion === 1 && snapshot.repositories) {
      const repositoryResult = this.#repositorySnapshotService.restoreSnapshot(snapshot);
      return deepFreeze({
        restoredAt: repositoryResult.restoredAt,
        repositoryResult,
        externalDataResult: null,
        legacyBackup: true
      });
    }

    if (snapshot.schemaVersion !== DIAGNOSIS_APPLICATION_BACKUP_SCHEMA_VERSION) {
      throw createApplicationError(
        ERROR_CODES.UNSUPPORTED_BACKUP_SCHEMA_VERSION,
        "The backup schema version is not supported.",
        {
          expected: DIAGNOSIS_APPLICATION_BACKUP_SCHEMA_VERSION,
          actual: snapshot.schemaVersion
        }
      );
    }

    assertDateTime(
      snapshot.exportedAt,
      ERROR_CODES.INVALID_BACKUP_DOCUMENT,
      "exportedAt"
    );

    // Validate external data before changing repositories.
    this.#executionDataSnapshotService.validateSnapshot(
      snapshot.externalDataSnapshot
    );

    const previousRepositorySnapshot =
      this.#repositorySnapshotService.createSnapshot({
        exportedAt: snapshot.exportedAt
      });
    const previousExternalSnapshot =
      this.#executionDataSnapshotService.createSnapshot({
        exportedAt: snapshot.exportedAt
      });

    try {
      const repositoryResult = this.#repositorySnapshotService.restoreSnapshot(
        snapshot.repositorySnapshot
      );
      const externalDataResult = this.#executionDataSnapshotService.restoreSnapshot(
        snapshot.externalDataSnapshot
      );
      return deepFreeze({
        restoredAt: snapshot.exportedAt,
        repositoryResult,
        externalDataResult,
        legacyBackup: false
      });
    } catch (cause) {
      try {
        this.#repositorySnapshotService.restoreSnapshot(
          previousRepositorySnapshot
        );
        this.#executionDataSnapshotService.restoreSnapshot(
          previousExternalSnapshot
        );
      } catch (rollbackCause) {
        throw createApplicationError(
          ERROR_CODES.APPLICATION_SNAPSHOT_ROLLBACK_FAILED,
          "Application backup restore failed and rollback also failed.",
          {},
          rollbackCause
        );
      }
      throw createApplicationError(
        ERROR_CODES.PERSISTENCE_RESTORE_FAILED,
        "Application backup restore failed and the previous state was recovered.",
        {},
        cause
      );
    }
  }
}

export function assertDiagnosisApplicationSnapshotService(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    typeof value.createSnapshot !== "function" ||
    typeof value.restoreSnapshot !== "function"
  ) {
    throw createApplicationError(
      ERROR_CODES.INVALID_APPLICATION_SNAPSHOT_SERVICE,
      "value does not satisfy the application snapshot service contract.",
      {}
    );
  }
  return value;
}
