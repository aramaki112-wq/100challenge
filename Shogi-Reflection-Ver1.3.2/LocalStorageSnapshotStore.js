import {
  PERSISTENCE_ERROR_CODES,
  PersistenceError
} from "./PersistenceErrors.js";

export const SHOGI_REFLECTION_STORAGE_KEY =
  "shogi-reflection-interlude.game-reviews.v1";

export class LocalStorageSnapshotStore {
  constructor({ storage, storageKey = SHOGI_REFLECTION_STORAGE_KEY } = {}) {
    this.storage = storage;
    this.storageKey = storageKey;
  }

  #requireStorage() {
    const required = ["setItem", "getItem", "removeItem"];
    const missing = required.filter(
      (methodName) => typeof this.storage?.[methodName] !== "function"
    );
    if (missing.length > 0) {
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.LOCAL_STORAGE_UNAVAILABLE,
        "LocalStorageを利用できません。",
        { missingMethods: missing }
      );
    }
    return this.storage;
  }

  save(jsonText) {
    if (typeof jsonText !== "string") {
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.LOCAL_STORAGE_SAVE_FAILED,
        "保存Dataは文字列である必要があります。"
      );
    }
    try {
      this.#requireStorage().setItem(this.storageKey, jsonText);
      return Object.freeze({ status: "SAVED", storageKey: this.storageKey });
    } catch (error) {
      if (error instanceof PersistenceError) throw error;
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.LOCAL_STORAGE_SAVE_FAILED,
        "LocalStorageへの保存に失敗しました。現在のDomain Dataは変更されていません。",
        { storageKey: this.storageKey },
        { cause: error }
      );
    }
  }

  load() {
    try {
      const value = this.#requireStorage().getItem(this.storageKey);
      if (value === null) return null;
      if (typeof value !== "string") {
        throw new Error("LocalStorageから文字列以外が返されました。");
      }
      return value;
    } catch (error) {
      if (error instanceof PersistenceError) throw error;
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.LOCAL_STORAGE_LOAD_FAILED,
        "LocalStorageからの読込に失敗しました。現在のDomain Dataは変更されていません。",
        { storageKey: this.storageKey },
        { cause: error }
      );
    }
  }

  delete() {
    try {
      this.#requireStorage().removeItem(this.storageKey);
      return Object.freeze({ status: "DELETED", storageKey: this.storageKey });
    } catch (error) {
      if (error instanceof PersistenceError) throw error;
      throw new PersistenceError(
        PERSISTENCE_ERROR_CODES.LOCAL_STORAGE_DELETE_FAILED,
        "LocalStorage保存Dataの削除に失敗しました。現在のDomain Dataは変更されていません。",
        { storageKey: this.storageKey },
        { cause: error }
      );
    }
  }
}
