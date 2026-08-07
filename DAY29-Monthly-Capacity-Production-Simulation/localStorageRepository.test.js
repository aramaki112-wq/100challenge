import { test, assertEqual, assertThrows } from "./testRunner.js";
import { DAY26_STORAGE_KEY, DAY27_STORAGE_KEY, LocalStorageFactoryEventRepository } from "./LocalStorageFactoryEventRepository.js";
import { MemoryStorage } from "./testSupport.js";

export function registerLocalStorageRepositoryTests() {
  test("D27-REPO-001", "DAY27専用LocalStorage KeyをDefault使用する", () => {
    const repository = new LocalStorageFactoryEventRepository({ storage: new MemoryStorage() });
    assertEqual(repository.storageKey, DAY27_STORAGE_KEY);
  });

  test("D27-REG-008", "DAY26 Keyを明示指定して維持できる", () => {
    const repository = new LocalStorageFactoryEventRepository({ storage: new MemoryStorage(), storageKey: DAY26_STORAGE_KEY });
    assertEqual(repository.storageKey, DAY26_STORAGE_KEY);
  });

  test("D27-REPO-002", "Event Logを保存して読み込める", async () => {
    const repository = new LocalStorageFactoryEventRepository({ storage: new MemoryStorage() });
    await repository.saveAll([{ eventId: "E1" }]);
    assertEqual((await repository.findAll()).length, 1);
  });

  test("D27-REPO-003", "DAY27保存でDAY26 Keyを上書きしない", async () => {
    const storage = new MemoryStorage();
    storage.setItem(DAY26_STORAGE_KEY, JSON.stringify([{eventId:"OLD"}]));
    const repository = new LocalStorageFactoryEventRepository({ storage });
    await repository.saveAll([{eventId:"NEW"}]);
    assertEqual(JSON.parse(storage.getItem(DAY26_STORAGE_KEY))[0].eventId, "OLD");
  });

  test("D27-REPO-004", "壊れたJSONをApplicationErrorとして扱う", async () => {
    const storage = new MemoryStorage();
    storage.setItem(DAY27_STORAGE_KEY, "{");
    const repository = new LocalStorageFactoryEventRepository({ storage });
    let code = null;
    try { await repository.findAll(); } catch (error) { code = error.code; }
    assertEqual(code, "STORAGE_DATA_INVALID");
  });
}
