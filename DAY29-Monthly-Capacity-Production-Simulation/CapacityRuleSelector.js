import { ApplicationError, ERROR_CODES } from "./errors.js";
import { EquipmentCapacityRule } from "./EquipmentCapacityRule.js";

export class CapacityRuleSelector {
  select({ rules = [], equipment, date, context = {} }) {
    const normalized = rules
      .map((item) => item instanceof EquipmentCapacityRule ? item : new EquipmentCapacityRule(item))
      .filter((rule) => rule.equipmentId === equipment.equipmentId && rule.isEffective(date));
    const matchedSpecific = normalized.filter((rule) => !rule.isDefault && rule.matches(context));
    const candidates = matchedSpecific.length > 0
      ? matchedSpecific
      : normalized.filter((rule) => rule.capacityRuleId === equipment.defaultCapacityRuleId || rule.isDefault);
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.specificity() - a.specificity() || a.priority - b.priority || a.capacityRuleId.localeCompare(b.capacityRuleId));
    const first = candidates[0];
    const conflicts = candidates.filter((candidate) =>
      candidate !== first && candidate.specificity() === first.specificity() && candidate.priority === first.priority
    );
    if (conflicts.length > 0) {
      throw new ApplicationError(ERROR_CODES.CAPACITY_RULE_CONFLICT, "Capacity rule selection is ambiguous.", {
        equipmentId: equipment.equipmentId,
        ruleIds: [first, ...conflicts].map((item) => item.capacityRuleId)
      });
    }
    return first;
  }
}
