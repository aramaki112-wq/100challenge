import { test, assertEqual, assertTrue } from "./testRunner.js";
import { InMemoryScenarioRepository } from "./InMemoryScenarioRepository.js";
import { LocalStorageScenarioRepository } from "./LocalStorageScenarioRepository.js";
import { PreviewMasterImport } from "./PreviewMasterImport.js";
import { CsvDataAdapter } from "./CsvDataAdapter.js";
import { JsonDataAdapter } from "./JsonDataAdapter.js";
import { MemoryStorage } from "./testSupport.js";
import { createMinimalData, scenarioFromData } from "./day29TestFixtures.js";

async function repositoryContract(repository) {
  const scenario = scenarioFromData(createMinimalData());
  await repository.save(scenario);
  assertEqual((await repository.findAll()).length, 1);
  assertEqual((await repository.findById("TEST")).scenarioId, "TEST");
  await repository.remove("TEST");
  assertEqual((await repository.findAll()).length, 0);
}
export function registerDay29RepositoryImportTests() {
  test("D29-REPO-001", "InMemory Scenario Repository Contract", async () => repositoryContract(new InMemoryScenarioRepository()));
  test("D29-REPO-002", "LocalStorage Scenario Repository Contract", async () => repositoryContract(new LocalStorageScenarioRepository({ storage: new MemoryStorage() })));
  test("D29-REPO-003", "Reload相当のRepository再生成後も保存Dataを維持する", async () => { const storage = new MemoryStorage(); const first = new LocalStorageScenarioRepository({ storage }); await first.save(scenarioFromData(createMinimalData())); const second = new LocalStorageScenarioRepository({ storage }); assertEqual((await second.findById("TEST")).scenarioId, "TEST"); });
  test("D29-IMPORT-001", "CSVを行番号付きでParseする", () => { const rows = new CsvDataAdapter().parse("equipmentId,factoryId,processId,name,equipmentType,priority,planningTarget,usable,capacityUnit,displayOrder,active,startDate,endDate\nE2,F1,P1,Equipment 2,GENERAL,2,true,true,PIECE,2,true,2026-01-01,2099-12-31"); assertEqual(rows[0].__rowNumber, 2); });
  test("D29-IMPORT-002", "JSON配列をParseする", () => assertEqual(new JsonDataAdapter().parse('[{"equipmentId":"E2"}]')[0].equipmentId, "E2"));
  test("D29-IMPORT-003", "Import Previewで新規追加件数を返す", () => { const data = createMinimalData(); const rows = [{ __rowNumber: 2, ...data.equipmentMasters[0], equipmentId: "E2", name: "Equipment 2" }]; const preview = new PreviewMasterImport().execute({ type: "equipmentMasters", rows, currentData: data }); assertEqual(preview.addCount, 1); });
  test("D29-IMPORT-004", "Import Previewで更新件数を返す", () => { const data = createMinimalData(); const rows = [{ __rowNumber: 2, ...data.equipmentMasters[0], name: "Changed" }]; const preview = new PreviewMasterImport().execute({ type: "equipmentMasters", rows, currentData: data }); assertEqual(preview.updateCount, 1); });
  test("D29-IMPORT-005", "Import内重複を検出する", () => { const data = createMinimalData(); const rows = [{ __rowNumber: 2, ...data.equipmentMasters[0] }, { __rowNumber: 3, ...data.equipmentMasters[0] }]; const preview = new PreviewMasterImport().execute({ type: "equipmentMasters", rows, currentData: data }); assertEqual(preview.duplicateCount, 1); });
  test("D29-IMPORT-006", "不正単位を行Errorとして返す", () => { const data = createMinimalData(); const row = { __rowNumber: 2, ...data.capacityRules[0], capacityRuleId: "BAD", unit: "INVALID" }; const preview = new PreviewMasterImport().execute({ type: "capacityRules", rows: [row], currentData: data }); assertEqual(preview.errorCount, 1); assertTrue(preview.results[0].errors.length > 0); });
}
