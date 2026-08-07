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
  assertEntityCsvImportPreview
} from "./EntityCsvImportPreview.js";
import { Assumption } from "./Assumption.js";
import {
  assertInMemoryRepositoryTransactionManager
} from "./InMemoryRepositoryTransactionManager.js";
import { assertClock, readClockNow } from "./Clock.js";

const ENTITY_TYPE = "ASSUMPTION";

function freezeResult(value) {
  return Object.freeze({
    ...value,
    repositoryRevisionsBefore: Object.freeze({ ...value.repositoryRevisionsBefore }),
    repositoryRevisionsAfter: Object.freeze({ ...value.repositoryRevisionsAfter })
  });
}

export class CommitAssumptionCsvImport {
  #transactionManager;
  #clock;

  constructor({ transactionManager, clock } = {}) {
    this.#transactionManager = assertInMemoryRepositoryTransactionManager(transactionManager);
    this.#clock = assertClock(clock);
    Object.freeze(this);
  }

  async execute({ preview, committedAt = null } = {}) {
    const validPreview = assertEntityCsvImportPreview(preview, ENTITY_TYPE);
    if (!validPreview.canCommit()) {
      throw createImportError(
        ERROR_CODES.IMPORT_COMMIT_NOT_ALLOWED,
        "The Assumption Import Preview contains errors and cannot be committed.",
        { importBatchId: validPreview.importBatchId, errorCount: validPreview.counts.errors }
      );
    }
    const repositories = this.#transactionManager.repositories;
    const required = ["productionPlans", "planVersions", "plannedOperations", "assumptions"];
    if (required.some((name) => !repositories[name])) {
      throw createImportError(
        ERROR_CODES.IMPORT_TRANSACTION_FAILED,
        "The transaction does not contain the required Assumption Import repositories.",
        { required }
      );
    }
    const currentRevisions = Object.fromEntries(required.map((name) => [name, repositories[name].revision]));
    if (required.some((name) => currentRevisions[name] !== validPreview.repositoryRevisions[name])) {
      throw createImportError(
        ERROR_CODES.IMPORT_STALE_PREVIEW,
        "Repository data changed after the Assumption Import Preview was created.",
        { previewRevisions: validPreview.repositoryRevisions, currentRevisions }
      );
    }
    const targetVersion = repositories.planVersions.findById(validPreview.expectedPlanVersionId);
    if (targetVersion === null) {
      throw createImportError(ERROR_CODES.IMPORT_TARGET_VERSION_NOT_FOUND, "The target Plan Version no longer exists.", {});
    }
    if (!targetVersion.isEditable()) {
      throw createImportError(ERROR_CODES.IMPORT_TARGET_VERSION_NOT_EDITABLE, "The target Plan Version is no longer editable.", { status: targetVersion.status });
    }

    const commitTime = committedAt ?? readClockNow(this.#clock);
    try {
      return await this.#transactionManager.execute(async (tx) => {
        let added = 0;
        let updated = 0;
        for (const entry of validPreview.getCommitEntries()) {
          const assumption = new Assumption(entry.normalizedData);
          if (entry.previewStatus === IMPORT_PREVIEW_STATUS.ADD) {
            tx.assumptions.add(assumption);
            added += 1;
          } else if (entry.previewStatus === IMPORT_PREVIEW_STATUS.UPDATE) {
            tx.assumptions.save(assumption);
            updated += 1;
          }
        }
        return freezeResult({
          importBatchId: validPreview.importBatchId,
          entityType: ENTITY_TYPE,
          batchStatus: IMPORT_BATCH_STATUS.COMMITTED,
          committedAt: commitTime,
          added,
          updated,
          unchanged: validPreview.counts.unchanged,
          totalWritten: added + updated,
          repositoryRevisionsBefore: currentRevisions,
          repositoryRevisionsAfter: Object.fromEntries(required.map((name) => [name, tx[name].revision]))
        });
      });
    } catch (error) {
      if (isApplicationError(error) && error.category === "IMPORT") throw error;
      throw createImportError(
        ERROR_CODES.IMPORT_TRANSACTION_FAILED,
        "The Assumption CSV Import transaction failed and was rolled back.",
        { importBatchId: validPreview.importBatchId },
        error
      );
    }
  }
}
