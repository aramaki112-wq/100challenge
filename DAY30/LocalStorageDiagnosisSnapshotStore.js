import {
  ERROR_CODES,
  createApplicationError
} from "./DiagnosisErrors.js";

function assertStorage(value) {
  const methods = ["getItem", "setItem", "removeItem"];
  if (
    value === null ||
    typeof value !== "object" ||
    methods.some((method) => typeof value[method] !== "function")
  ) {
    throw createApplicationError(
      ERROR_CODES.PERSISTENCE_STORAGE_ERROR,
      "storage must implement getItem(), setItem(), and removeItem().",
      { methods }
    );
  }
  return value;
}

export class LocalStorageDiagnosisSnapshotStore {
  #storage;
  #storageKey;

  constructor({
    storage,
    storageKey = "DAY30_PRODUCTION_PLAN_DIAGNOSIS_STATE_V1"
  } = {}) {
    this.#storage = assertStorage(storage);
    if (typeof storageKey !== "string" || storageKey.trim() === "") {
      throw createApplicationError(
        ERROR_CODES.PERSISTENCE_STORAGE_ERROR,
        "storageKey must be a non-empty string.",
        { storageKey }
      );
    }
    this.#storageKey = storageKey.trim();
    Object.freeze(this);
  }

  get storageKey() { return this.#storageKey; }

  save(snapshot) {
    try {
      this.#storage.setItem(this.#storageKey, JSON.stringify(snapshot));
      return true;
    } catch (cause) {
      throw createApplicationError(
        ERROR_CODES.PERSISTENCE_STORAGE_ERROR,
        "Failed to save the DAY30 snapshot to Browser storage.",
        { storageKey: this.#storageKey },
        cause
      );
    }
  }

  load() {
    try {
      const raw = this.#storage.getItem(this.#storageKey);
      if (raw === null || raw === "") return null;
      return JSON.parse(raw);
    } catch (cause) {
      throw createApplicationError(
        ERROR_CODES.PERSISTENCE_STORAGE_ERROR,
        "Failed to load or parse the DAY30 snapshot from Browser storage.",
        { storageKey: this.#storageKey },
        cause
      );
    }
  }

  remove() {
    try {
      this.#storage.removeItem(this.#storageKey);
      return true;
    } catch (cause) {
      throw createApplicationError(
        ERROR_CODES.PERSISTENCE_STORAGE_ERROR,
        "Failed to remove the DAY30 snapshot from Browser storage.",
        { storageKey: this.#storageKey },
        cause
      );
    }
  }

  hasSnapshot() {
    try {
      const raw = this.#storage.getItem(this.#storageKey);
      return raw !== null && raw !== "";
    } catch (cause) {
      throw createApplicationError(
        ERROR_CODES.PERSISTENCE_STORAGE_ERROR,
        "Failed to check Browser storage.",
        { storageKey: this.#storageKey },
        cause
      );
    }
  }
}
