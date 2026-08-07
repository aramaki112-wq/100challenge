import { test, assertEqual, assertThrows, assertTrue } from "./testRunner.js";
import { FactoryDefinition } from "./FactoryDefinition.js";
import { ProcessDefinition } from "./ProcessDefinition.js";
import { EquipmentMasterRecord } from "./EquipmentMasterRecord.js";
import { EquipmentCapacityRule } from "./EquipmentCapacityRule.js";
import { CapacityRuleSelector } from "./CapacityRuleSelector.js";
import { ValidateSimulationInput } from "./ValidateSimulationInput.js";
import { ERROR_CODES } from "./errors.js";
import { createMinimalData } from "./day29TestFixtures.js";

export function registerDay29MasterTests() {
  test("D29-MASTER-001", "工場Masterを生成できる", () => { const factory = new FactoryDefinition({ factoryId: "F1", name: "Factory", standardDailyMinutes: 480 }); assertEqual(factory.factoryId, "F1"); });
  test("D29-MASTER-002", "工程Masterを工場IDで接続できる", () => { const process = new ProcessDefinition({ processId: "P1", factoryId: "F1", name: "Process" }); assertEqual(process.factoryId, "F1"); });
  test("D29-MASTER-003", "設備Masterを追加できる", () => { const equipment = new EquipmentMasterRecord(createMinimalData().equipmentMasters[0]); assertEqual(equipment.processId, "P1"); });
  test("D29-MASTER-004", "設備Masterを変更したPlain Objectから再生成できる", () => { const source = createMinimalData().equipmentMasters[0]; const equipment = new EquipmentMasterRecord({ ...source, name: "Changed" }); assertEqual(equipment.name, "Changed"); });
  test("D29-MASTER-005", "設備を無効化すると有効判定がfalse", () => { const source = createMinimalData().equipmentMasters[0]; const equipment = new EquipmentMasterRecord({ ...source, active: false }); assertEqual(equipment.isEffective("2026-08-03"), false); });
  test("D29-RULE-001", "Capacity Ruleを追加できる", () => { const rule = new EquipmentCapacityRule(createMinimalData().capacityRules[0]); assertEqual(rule.capacityValue, 10); });
  test("D29-RULE-002", "条件なしではDefault Ruleを選ぶ", () => { const data = createMinimalData(); const rule = new CapacityRuleSelector().select({ rules: data.capacityRules, equipment: new EquipmentMasterRecord(data.equipmentMasters[0]), date: "2026-08-03", context: {} }); assertEqual(rule.capacityRuleId, "R1"); });
  test("D29-RULE-003", "Product Group条件別Ruleを選ぶ", () => { const data = createMinimalData(); const rule = new CapacityRuleSelector().select({ rules: data.capacityRules, equipment: new EquipmentMasterRecord(data.equipmentMasters[0]), date: "2026-08-03", context: { productGroup: "SPECIAL" } }); assertEqual(rule.capacityRuleId, "R1_SPECIAL"); });
  test("D29-RULE-004", "Rule Priorityが小さいRuleを優先する", () => { const data = createMinimalData(); data.capacityRules.push({ ...data.capacityRules[1], capacityRuleId: "R1_SPECIAL_LOW", priority: 2 }); const rule = new CapacityRuleSelector().select({ rules: data.capacityRules, equipment: new EquipmentMasterRecord(data.equipmentMasters[0]), date: "2026-08-03", context: { productGroup: "SPECIAL" } }); assertEqual(rule.capacityRuleId, "R1_SPECIAL"); });
  test("D29-RULE-005", "不正Capacity Unitを拒否する", () => { const source = createMinimalData().capacityRules[0]; assertThrows(() => new EquipmentCapacityRule({ ...source, unit: "INVALID" }), ERROR_CODES.INVALID_CAPACITY_UNIT); });
  test("D29-RULE-006", "同条件同PriorityのRule競合を拒否する", () => { const data = createMinimalData(); data.capacityRules.push({ ...data.capacityRules[1], capacityRuleId: "R1_SPECIAL_DUP" }); assertThrows(() => new CapacityRuleSelector().select({ rules: data.capacityRules, equipment: new EquipmentMasterRecord(data.equipmentMasters[0]), date: "2026-08-03", context: { productGroup: "SPECIAL" } }), ERROR_CODES.CAPACITY_RULE_CONFLICT); });
  test("D29-MASTER-006", "不存在Factoryを整合性Checkで検出する", () => { const data = createMinimalData(); data.processes[0].factoryId = "NO_FACTORY"; const result = new ValidateSimulationInput().execute(data); assertTrue(result.issues.some((item) => item.code === "FACTORY_NOT_FOUND")); });
}
