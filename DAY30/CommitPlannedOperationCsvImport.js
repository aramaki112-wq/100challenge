import {
  IMPORT_BATCH_STATUS,
  IMPORT_PREVIEW_STATUS
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  createImportError,
  isApplicationError
} from "./DiagnosisErrors.js";

import {
  PlannedOperationImportPreview,
  assertPlannedOperationImportPreview
} from "./PlannedOperationImportPreview.js";
import { PlannedOperation } from "./PlannedOperation.js";
import {
  InMemoryRepositoryTransactionManager,
  assertInMemoryRepositoryTransactionManager
} from "./InMemoryRepositoryTransactionManager.js";
import { assertClock, readClockNow } from "./Clock.js";

function freezeResult(value) {
  return Object.freeze({
    ...value,
    repositoryRevisionsBefore: Object.freeze({
      ...value.repositoryRevisionsBefore
    }),
    repositoryRevisionsAfter: Object.freeze({
      ...value.repositoryRevisionsAfter
    })
  });
}

export class CommitPlannedOperationCsvImport {
  #transactionManager;
  #clock;

  constructor({ transactionManager, clock } = {}) {
    this.#transactionManager = assertInMemoryRepositoryTransactionManager(
      transactionManager
    );
    this.#clock = assertClock(clock);
    Object.freeze(this);
  }

  async execute({ preview, committedAt = null } = {}) {
    const validPreview = assertPlannedOperationImportPreview(preview);
    if (!validPreview.canCommit()) {
      throw createImportError(
        ERROR_CODES.IMPORT_COMMIT_NOT_ALLOWED,
        "The Import Preview contains errors and cannot be committed.",
        {
          importBatchId: validPreview.importBatchId,
          batchStatus: validPreview.batchStatus,
          errorCount: validPreview.counts.errors
        }
      );
    }

    const repositories = this.#transactionManager.repositories;
    const planVersions = repositories.planVersions;
    const plannedOperations = repositories.plannedOperations;

    if (!planVersions || !plannedOperations) {
      throw createImportError(
        ERROR_CODES.IMPORT_TRANSACTION_FAILED,
        "The transaction does not contain the required Import repositories."
      );
    }

    const currentRevisions = {
      planVersions: planVersions.revision,
      plannedOperations: plannedOperations.revision
    };

    if (
      currentRevisions.planVersions !== validPreview.repositoryRevisions.planVersions ||
      currentRevisions.plannedOperations !== validPreview.repositoryRevisions.plannedOperations
    ) {
      throw createImportError(
        ERROR_CODES.IMPORT_STALE_PREVIEW,
        "Repository data changed after the Import Preview was created.",
        {
          importBatchId: validPreview.importBatchId,
          previewRevisions: validPreview.repositoryRevisions,
          currentRevisions
        }
      );
    }

    const targetVersion = planVersions.findById(
      validPreview.expectedPlanVersionId
    );
    if (targetVersion === null) {
      throw createImportError(
        ERROR_CODES.IMPORT_TARGET_VERSION_NOT_FOUND,
        "The target Plan Version no longer exists.",
        { expectedPlanVersionId: validPreview.expectedPlanVersionId }
      );
    }
    if (!targetVersion.isEditable()) {
      throw createImportError(
        ERROR_CODES.IMPORT_TARGET_VERSION_NOT_EDITABLE,
        "The target Plan Version is no longer editable.",
        {
          expectedPlanVersionId: validPreview.expectedPlanVersionId,
          status: targetVersion.status
        }
      );
    }

    const entries = validPreview.getCommitEntries();
    const commitTime = committedAt ?? readClockNow(this.#clock);

    try {
      return await this.#transactionManager.execute(async (txRepositories) => {
        let added = 0;
        let updated = 0;

        for (const entry of entries) {
          const operation = new PlannedOperation(entry.normalizedData);
          if (operation.planVersionId !== validPreview.expectedPlanVersionId) {
            throw createImportError(
              ERROR_CODES.IMPORT_TARGET_VERSION_MISMATCH,
              "A commit entry does not belong to the selected Plan Version.",
              {
                rowNumber: entry.rowNumber,
                expectedPlanVersionId: validPreview.expectedPlanVersionId,
                actualPlanVersionId: operation.planVersionId
              }
            );
          }

          if (entry.previewStatus === IMPORT_PREVIEW_STATUS.ADD) {
            txRepositories.plannedOperations.add(operation);
            added += 1;
          } else if (entry.previewStatus === IMPORT_PREVIEW_STATUS.UPDATE) {
            txRepositories.plannedOperations.save(operation);
            updated += 1;
          }
        }

        return freezeResult({
          importBatchId: validPreview.importBatchId,
          batchStatus: IMPORT_BATCH_STATUS.COMMITTED,
          committedAt: commitTime,
          added,
          updated,
          unchanged: validPreview.counts.unchanged,
          totalWritten: added + updated,
          repositoryRevisionsBefore: currentRevisions,
          repositoryRevisionsAfter: {
            planVersions: txRepositories.planVersions.revision,
            plannedOperations: txRepositories.plannedOperations.revision
          }
        });
      });
    } catch (error) {
      if (
        isApplicationError(error) &&
        error.category === "IMPORT"
      ) {
        throw error;
      }
      throw createImportError(
        ERROR_CODES.IMPORT_TRANSACTION_FAILED,
        "The Planned Operation CSV Import transaction failed and was rolled back.",
        { importBatchId: validPreview.importBatchId },
        error
      );
    }
  }
}
