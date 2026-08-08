import { deepFreeze } from "./Immutable.js";

export class ReflectionBackupController {
  constructor({ persistenceCoordinator } = {}) {
    if (!persistenceCoordinator) {
      throw new TypeError("persistenceCoordinatorは必須です。");
    }
    this.persistenceCoordinator = persistenceCoordinator;
  }

  saveCurrentDataToBrowser() {
    return deepFreeze(this.persistenceCoordinator.saveCurrentDataToBrowser());
  }

  loadFromBrowserData() {
    return deepFreeze(this.persistenceCoordinator.loadFromBrowserData());
  }

  deleteBrowserSavedData() {
    return deepFreeze(this.persistenceCoordinator.deleteBrowserSavedData());
  }

  createBackupJson() {
    return deepFreeze(this.persistenceCoordinator.createBackupJson());
  }

  restoreBackupJson({ jsonText } = {}) {
    return deepFreeze(
      this.persistenceCoordinator.restoreBackupJson({ jsonText })
    );
  }
}
