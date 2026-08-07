import {
  ERROR_CODES,
  createRepositoryError
} from "./DiagnosisErrors.js";

function assertFunction(value, label) {
  if (typeof value !== "function") {
    throw createRepositoryError(
      ERROR_CODES.INVALID_REPOSITORY,
      `${label} must be a function.`,
      { label, value }
    );
  }
  return value;
}

function assertEntityId(id, entityName) {
  if (typeof id !== "string" || id.trim() === "" || /\s/.test(id)) {
    throw createRepositoryError(
      ERROR_CODES.REPOSITORY_CONTRACT_VIOLATION,
      `${entityName} ID must be a non-empty string without whitespace.`,
      { entityName, id }
    );
  }
  return id;
}

function sortById(left, right, idSelector) {
  return idSelector(left).localeCompare(idSelector(right));
}

/**
 * Test/Browser用の最小InMemory Repository基盤。
 * addは新規専用、saveは同一IDの置換を許すUpsertとする。
 */
export class InMemoryEntityRepository {
  #entityName;
  #idSelector;
  #assertEntity;
  #items;
  #revision;

  constructor({ entityName, idSelector, assertEntity } = {}) {
    if (typeof entityName !== "string" || entityName.trim() === "") {
      throw createRepositoryError(
        ERROR_CODES.INVALID_REPOSITORY,
        "entityName must be a non-empty string.",
        { entityName }
      );
    }

    this.#entityName = entityName.trim();
    this.#idSelector = assertFunction(idSelector, "idSelector");
    this.#assertEntity = assertFunction(assertEntity, "assertEntity");
    this.#items = new Map();
    this.#revision = 0;
  }

  get entityName() {
    return this.#entityName;
  }

  get revision() {
    return this.#revision;
  }

  add(entity) {
    const normalized = this.#normalizeEntity(entity);
    const id = this.#idOf(normalized);

    if (this.#items.has(id)) {
      throw createRepositoryError(
        ERROR_CODES.DUPLICATE_ENTITY,
        `${this.#entityName} already exists.`,
        { entityName: this.#entityName, id }
      );
    }

    this.assertUniqueConstraints(normalized, null);
    this.#items.set(id, normalized);
    this.#revision += 1;
    return normalized;
  }

  addAll(entities) {
    if (!Array.isArray(entities)) {
      throw createRepositoryError(
        ERROR_CODES.REPOSITORY_CONTRACT_VIOLATION,
        "entities must be an array.",
        { entityName: this.#entityName, entities }
      );
    }

    const normalized = entities.map((entity) => this.#normalizeEntity(entity));
    const ids = normalized.map((entity) => this.#idOf(entity));
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

    if (
      duplicateIds.length > 0 ||
      ids.some((id) => this.#items.has(id))
    ) {
      throw createRepositoryError(
        ERROR_CODES.DUPLICATE_ENTITY,
        `${this.#entityName} batch contains an existing or duplicate ID.`,
        {
          entityName: this.#entityName,
          ids,
          duplicateIds: [...new Set(duplicateIds)]
        }
      );
    }

    const temporary = this.captureState();
    try {
      for (const entity of normalized) {
        this.assertUniqueConstraints(entity, null);
        this.#items.set(this.#idOf(entity), entity);
      }
      if (normalized.length > 0) {
        this.#revision += 1;
      }
      return Object.freeze([...normalized]);
    } catch (error) {
      this.restoreState(temporary);
      throw error;
    }
  }

  save(entity) {
    const normalized = this.#normalizeEntity(entity);
    const id = this.#idOf(normalized);
    this.assertUniqueConstraints(normalized, id);

    const previous = this.#items.get(id);
    if (previous === normalized) {
      return normalized;
    }

    this.#items.set(id, normalized);
    this.#revision += 1;
    return normalized;
  }

  findById(id) {
    const normalizedId = assertEntityId(id, this.#entityName);
    return this.#items.get(normalizedId) ?? null;
  }

  getById(id) {
    const entity = this.findById(id);
    if (entity === null) {
      throw createRepositoryError(
        ERROR_CODES.ENTITY_NOT_FOUND,
        `${this.#entityName} was not found.`,
        { entityName: this.#entityName, id }
      );
    }
    return entity;
  }

  existsById(id) {
    return this.findById(id) !== null;
  }

  findAll() {
    return Object.freeze(
      [...this.#items.values()].sort((left, right) =>
        sortById(left, right, this.#idSelector)
      )
    );
  }

  deleteById(id) {
    const normalizedId = assertEntityId(id, this.#entityName);
    const deleted = this.#items.delete(normalizedId);
    if (deleted) {
      this.#revision += 1;
    }
    return deleted;
  }

  count() {
    return this.#items.size;
  }

  clear() {
    if (this.#items.size > 0) {
      this.#items.clear();
      this.#revision += 1;
    }
  }

  filter(predicate) {
    assertFunction(predicate, "predicate");
    return Object.freeze(this.findAll().filter(predicate));
  }

  assertUniqueConstraints(_entity, _replacingId) {
    // Specialized Repositoryで上書きするExtension Point。
  }

  captureState() {
    return Object.freeze({
      items: new Map(this.#items),
      revision: this.#revision
    });
  }

  restoreState(state) {
    if (
      state === null ||
      typeof state !== "object" ||
      !(state.items instanceof Map) ||
      !Number.isInteger(state.revision) ||
      state.revision < 0
    ) {
      throw createRepositoryError(
        ERROR_CODES.INVALID_REPOSITORY_STATE,
        "Repository state is invalid.",
        { entityName: this.#entityName, state }
      );
    }

    this.#items = new Map(state.items);
    this.#revision = state.revision;
  }

  #normalizeEntity(entity) {
    return this.#assertEntity(entity);
  }

  #idOf(entity) {
    return assertEntityId(
      this.#idSelector(entity),
      this.#entityName
    );
  }
}

export function assertInMemoryEntityRepository(value) {
  if (!(value instanceof InMemoryEntityRepository)) {
    throw createRepositoryError(
      ERROR_CODES.INVALID_REPOSITORY,
      "value must be an InMemoryEntityRepository.",
      { value }
    );
  }
  return value;
}
