import {
  ERROR_CODES,
  createRepositoryError
} from "./DiagnosisErrors.js";
import {
  assertInMemoryEntityRepository
} from "./InMemoryEntityRepository.js";

function normalizeRepositories(repositories) {
  if (
    repositories === null ||
    typeof repositories !== "object" ||
    Array.isArray(repositories)
  ) {
    throw createRepositoryError(
      ERROR_CODES.INVALID_TRANSACTION_MANAGER,
      "repositories must be a plain object.",
      { repositories }
    );
  }

  const entries = Object.entries(repositories);
  if (entries.length === 0) {
    throw createRepositoryError(
      ERROR_CODES.INVALID_TRANSACTION_MANAGER,
      "repositories must contain at least one Repository.",
      { repositories }
    );
  }

  for (const [name, repository] of entries) {
    try {
      assertInMemoryEntityRepository(repository);
    } catch (cause) {
      throw createRepositoryError(
        ERROR_CODES.INVALID_TRANSACTION_MANAGER,
        `${name} must be an InMemoryEntityRepository.`,
        { name },
        cause
      );
    }
  }

  return Object.freeze({ ...repositories });
}

/**
 * 複数InMemory Repositoryへのwriteを一つのTransactionとして扱う。
 * Entity内部のin-place変更ではなく、Repositoryへのadd/save/deleteをRollback対象とする。
 */
export class InMemoryRepositoryTransactionManager {
  #repositories;
  #active;

  constructor({ repositories } = {}) {
    this.#repositories = normalizeRepositories(repositories);
    this.#active = false;
  }

  get repositories() {
    return this.#repositories;
  }

  get active() {
    return this.#active;
  }

  async execute(work) {
    if (typeof work !== "function") {
      throw createRepositoryError(
        ERROR_CODES.INVALID_TRANSACTION_MANAGER,
        "work must be a function.",
        { work }
      );
    }

    if (this.#active) {
      throw createRepositoryError(
        ERROR_CODES.TRANSACTION_ALREADY_ACTIVE,
        "Nested InMemory Repository transactions are not supported."
      );
    }

    const states = new Map(
      Object.entries(this.#repositories).map(([name, repository]) => [
        name,
        repository.captureState()
      ])
    );

    this.#active = true;
    try {
      return await work(this.#repositories);
    } catch (error) {
      try {
        for (const [name, repository] of Object.entries(this.#repositories)) {
          repository.restoreState(states.get(name));
        }
      } catch (rollbackError) {
        throw createRepositoryError(
          ERROR_CODES.TRANSACTION_ROLLBACK_FAILED,
          "Repository transaction rollback failed.",
          {},
          rollbackError
        );
      }
      throw error;
    } finally {
      this.#active = false;
    }
  }
}

export function assertInMemoryRepositoryTransactionManager(value) {
  if (!(value instanceof InMemoryRepositoryTransactionManager)) {
    throw createRepositoryError(
      ERROR_CODES.INVALID_TRANSACTION_MANAGER,
      "value must be an InMemoryRepositoryTransactionManager.",
      { value }
    );
  }
  return value;
}
