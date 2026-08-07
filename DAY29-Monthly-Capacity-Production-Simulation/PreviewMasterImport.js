import { EquipmentCapacityRule } from "./EquipmentCapacityRule.js";
import { EquipmentMasterRecord } from "./EquipmentMasterRecord.js";

const CONFIG = Object.freeze({
  equipmentMasters: { idField: "equipmentId", constructor: EquipmentMasterRecord },
  capacityRules: { idField: "capacityRuleId", constructor: EquipmentCapacityRule }
});

function coerce(type, row) {
  const value = { ...row }; delete value.__rowNumber;
  for (const key of ["priority", "displayOrder", "capacityValue", "capacityMultiplier"]) if (value[key] !== undefined && value[key] !== "") value[key] = Number(value[key]);
  for (const key of ["active", "planningTarget", "usable", "isDefault"]) if (typeof value[key] === "string") value[key] = value[key].toLowerCase() === "true";
  if (value.startDate || value.endDate) { value.effectivePeriod = { startDate: value.startDate || "0001-01-01", endDate: value.endDate || "9999-12-31" }; delete value.startDate; delete value.endDate; }
  if (typeof value.conditions === "string") { try { value.conditions = JSON.parse(value.conditions); } catch {} }
  return value;
}

export class PreviewMasterImport {
  execute({ type, rows, currentData }) {
    const config = CONFIG[type];
    if (!config) throw new Error(`Unsupported import type: ${type}`);
    const existing = new Map((currentData[type] ?? []).map((item) => [item[config.idField], item]));
    const seen = new Set();
    const results = [];
    for (const row of rows) {
      const normalized = coerce(type, row);
      const id = normalized[config.idField];
      if (!id || seen.has(id)) { results.push({ rowNumber: row.__rowNumber ?? null, status: "DUPLICATE", id: id ?? "", errors: ["ID is missing or duplicated in import file."], value: normalized }); continue; }
      seen.add(id);
      try {
        const entity = new config.constructor(normalized).toPlainObject();
        results.push({ rowNumber: row.__rowNumber ?? null, status: existing.has(id) ? "UPDATE" : "ADD", id, errors: [], value: entity });
      } catch (error) {
        results.push({ rowNumber: row.__rowNumber ?? null, status: "ERROR", id, errors: [error.message], errorCode: error.code ?? null, value: normalized });
      }
    }
    return {
      type,
      addCount: results.filter((item) => item.status === "ADD").length,
      updateCount: results.filter((item) => item.status === "UPDATE").length,
      duplicateCount: results.filter((item) => item.status === "DUPLICATE").length,
      errorCount: results.filter((item) => item.status === "ERROR").length,
      results,
      canCommit: results.every((item) => ["ADD", "UPDATE"].includes(item.status))
    };
  }

  commit({ preview, currentData }) {
    if (!preview.canCommit) throw new Error("Import preview contains errors.");
    const config = CONFIG[preview.type];
    const next = structuredClone(currentData);
    const map = new Map((next[preview.type] ?? []).map((item) => [item[config.idField], item]));
    for (const result of preview.results) map.set(result.id, structuredClone(result.value));
    next[preview.type] = [...map.values()];
    return next;
  }
}
