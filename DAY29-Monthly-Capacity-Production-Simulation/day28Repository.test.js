import { test, assertEqual } from "./testRunner.js";
import {
  LocalStorageFactoryEventRepository,
  DAY27_STORAGE_KEY,
  DAY28_STORAGE_KEY
} from "./LocalStorageFactoryEventRepository.js";
import { MemoryStorage } from "./testSupport.js";

export function registerDay28RepositoryTests() {
  test("D28-REPO-001", "DAY28は専用Storage Keyを明示使用できる", async () => {
    const storage = new MemoryStorage();
    const repository = new LocalStorageFactoryEventRepository({
      storage,
      storageKey: DAY28_STORAGE_KEY
    });
    await repository.saveAll([{ eventId: "D28" }]);
    assertEqual(storage.getItem(DAY27_STORAGE_KEY), null);
    assertEqual(JSON.parse(storage.getItem(DAY28_STORAGE_KEY))[0].eventId, "D28");
  });
}
