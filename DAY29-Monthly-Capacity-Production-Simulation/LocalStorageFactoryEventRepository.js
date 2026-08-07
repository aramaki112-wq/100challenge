import {
  ApplicationError,
  ERROR_CODES
} from "./errors.js";

export const DAY26_STORAGE_KEY = "factoryEventLogDay26";
export const DAY27_STORAGE_KEY = "factoryEventLogDay27";
export const DAY28_STORAGE_KEY = "factoryEventLogDay28";

function defaultStorage() {
  const storage = globalThis.localStorage ?? globalThis.window?.localStorage;
  if (!storage) {
    throw new ApplicationError(
      ERROR_CODES.INVALID_ARGUMENT,
      "A storage adapter is required outside the browser."
    );
  }
  return storage;
}

export class LocalStorageFactoryEventRepository {
  constructor({
    storage,
    storageKey = DAY27_STORAGE_KEY
  } = {}) {
    this.storage = storage ?? defaultStorage();
    this.storageKey = storageKey;
  }

  async findAll() {
    const raw = this.storage.getItem(this.storageKey);
    if (raw == null) return [];

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new TypeError("Stored event log must be an array.");
      }
      return structuredClone(parsed);
    } catch (error) {
      throw new ApplicationError(
        ERROR_CODES.STORAGE_DATA_INVALID,
        "Saved DAY27 event data is invalid.",
        { cause: error.message }
      );
    }
  }

  async saveAll(events) {
    this.storage.setItem(
      this.storageKey,
      JSON.stringify(structuredClone(events))
    );
  }

  async append(event) {
    const events = await this.findAll();
    events.push(structuredClone(event));
    await this.saveAll(events);
  }

  async clear() {
    this.storage.removeItem(this.storageKey);
  }
}
