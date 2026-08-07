import { CapacityRuleSelector } from "./CapacityRuleSelector.js";
import { EquipmentCapacityRule } from "./EquipmentCapacityRule.js";
import { EquipmentCalendarEntry } from "./EquipmentCalendarEntry.js";
import { EquipmentMasterRecord } from "./EquipmentMasterRecord.js";
import { EquipmentRequirementDefinition } from "./EquipmentRequirementDefinition.js";
import { FactoryCalendarEntry } from "./FactoryCalendarEntry.js";
import { FactoryDefinition } from "./FactoryDefinition.js";
import { ProcessDefinition } from "./ProcessDefinition.js";
import { ShiftDefinition } from "./ShiftDefinition.js";
import { ResolveManualAssignments } from "./ResolveManualAssignments.js";
import { FACTORY_DAY_TYPES, REASON_CODES, SHIFT_CAPACITY_STATES } from "./Day29Constants.js";
import { monthDateKeys } from "./Day29DateTime.js";

function reasonRank(code) {
  const order = [REASON_CODES.FACTORY_HOLIDAY, REASON_CODES.EQUIPMENT_STOPPED, REASON_CODES.MISSING_REQUIRED_SKILL_SETTING, REASON_CODES.SKILL_SHORTAGE, REASON_CODES.WORKER_COUNT_SHORTAGE, REASON_CODES.ASSIGNMENT_CONFLICT, REASON_CODES.UNASSIGNED, REASON_CODES.OPERABLE];
  const index = order.indexOf(code);
  return index < 0 ? 999 : index;
}

function aggregateReason(blockedMinutesByReason) {
  return [...blockedMinutesByReason.entries()].sort((a, b) => b[1] - a[1] || reasonRank(a[0]) - reasonRank(b[0]))[0]?.[0] ?? REASON_CODES.OPERABLE;
}

export class CalculateMonthlyCapacity {
  constructor({ resolveManualAssignments = new ResolveManualAssignments(), capacityRuleSelector = new CapacityRuleSelector() } = {}) {
    this.resolveManualAssignments = resolveManualAssignments;
    this.capacityRuleSelector = capacityRuleSelector;
  }

  execute({ month, data }) {
    const factories = (data.factories ?? []).map((item) => item instanceof FactoryDefinition ? item : new FactoryDefinition(item));
    const processes = (data.processes ?? []).map((item) => item instanceof ProcessDefinition ? item : new ProcessDefinition(item));
    const equipmentMasters = (data.equipmentMasters ?? []).map((item) => item instanceof EquipmentMasterRecord ? item : new EquipmentMasterRecord(item));
    const shifts = (data.shifts ?? []).map((item) => item instanceof ShiftDefinition ? item : new ShiftDefinition(item));
    const requirements = (data.equipmentRequirements ?? []).map((item) => item instanceof EquipmentRequirementDefinition ? item : new EquipmentRequirementDefinition(item));
    const rules = (data.capacityRules ?? []).map((item) => item instanceof EquipmentCapacityRule ? item : new EquipmentCapacityRule(item));
    const factoryCalendar = (data.factoryCalendar ?? []).map((item) => item instanceof FactoryCalendarEntry ? item : new FactoryCalendarEntry(item));
    const equipmentCalendar = (data.equipmentCalendar ?? []).map((item) => item instanceof EquipmentCalendarEntry ? item : new EquipmentCalendarEntry(item));
    const dates = monthDateKeys(month);
    const shiftResults = [];
    const capacityBuckets = [];

    for (const date of dates) {
      for (const factory of factories.filter((item) => item.active)) {
        const factoryEntry = factoryCalendar.find((item) => item.factoryId === factory.factoryId && item.date === date) ?? new FactoryCalendarEntry({ factoryId: factory.factoryId, date, dayType: FACTORY_DAY_TYPES.FACTORY_HOLIDAY, plannedShiftIds: [] });
        const factoryShifts = shifts.filter((item) => item.factoryId === factory.factoryId && item.active).sort((a, b) => a.displayOrder - b.displayOrder);
        const factoryEquipment = equipmentMasters.filter((item) => item.factoryId === factory.factoryId && item.planningTarget && item.isEffective(date)).sort((a, b) => a.displayOrder - b.displayOrder);
        for (const shift of factoryShifts) {
          const planned = factoryEntry.isOperating() && factoryEntry.plannedShiftIds.includes(shift.shiftId);
          if (!planned) {
            for (const equipment of factoryEquipment) {
              const reasonCode = factoryEntry.isOperating() ? REASON_CODES.SHIFT_NOT_PLANNED : REASON_CODES.FACTORY_HOLIDAY;
              shiftResults.push({ date, factoryId: factory.factoryId, processId: equipment.processId, equipmentId: equipment.equipmentId, shiftId: shift.shiftId, plannedMinutes: 0, availableMinutes: 0, state: SHIFT_CAPACITY_STATES.BLOCKED, appliedCapacityRuleId: null, capacityMultiplier: 0, availableCapacity: 0, usedCapacity: 0, remainingCapacity: 0, unprocessedQuantity: 0, reasonCode, allocations: [] });
            }
            continue;
          }
          const allocation = this.resolveManualAssignments.execute({
            date,
            shift,
            equipmentMasters: factoryEquipment,
            equipmentRequirements: requirements,
            workerCalendars: data.workerCalendar ?? [],
            assignments: data.assignments ?? [],
            qualifications: data.workerSkillQualifications ?? []
          });
          for (const equipment of factoryEquipment) {
            const equipmentEntry = equipmentCalendar.find((item) => item.equipmentId === equipment.equipmentId && item.date === date && item.shiftId === shift.shiftId) ?? new EquipmentCalendarEntry({ equipmentId: equipment.equipmentId, date, shiftId: shift.shiftId });
            const plannedMinutes = shift.durationMinutes(date);
            let availableMinutes = 0;
            const blockedMinutesByReason = new Map();
            const allocations = [];
            for (const segment of allocation.segments) {
              const result = segment.equipmentResults.find((item) => item.equipmentId === equipment.equipmentId);
              let segmentAvailable = false;
              let reasonCode = result?.reasonCode ?? REASON_CODES.INVALID_INPUT;
              if (!equipment.usable || !equipmentEntry.isAvailable()) {
                reasonCode = REASON_CODES.EQUIPMENT_STOPPED;
              } else if (result?.state === "RUNNING") {
                segmentAvailable = true;
              }
              if (segmentAvailable) {
                availableMinutes += segment.durationMinutes;
                allocations.push(...result.allocations.map((item) => ({ ...item, startAt: segment.startAt, endAt: segment.endAt })));
                capacityBuckets.push({
                  bucketId: `${date}:${shift.shiftId}:${equipment.equipmentId}:${segment.startAt}`,
                  date,
                  shiftId: shift.shiftId,
                  factoryId: factory.factoryId,
                  processId: equipment.processId,
                  equipmentId: equipment.equipmentId,
                  startAt: segment.startAt,
                  endAt: segment.endAt,
                  availableMinutes: segment.durationMinutes,
                  remainingMinutes: segment.durationMinutes,
                  shiftMinutes: plannedMinutes,
                  standardDailyMinutes: factory.standardDailyMinutes,
                  calendarMultiplier: equipmentEntry.capacityMultiplier
                });
              } else {
                blockedMinutesByReason.set(reasonCode, (blockedMinutesByReason.get(reasonCode) ?? 0) + segment.durationMinutes);
              }
            }
            let selectedRule = null;
            let availableCapacity = 0;
            let reasonCode = aggregateReason(blockedMinutesByReason);
            try {
              selectedRule = this.capacityRuleSelector.select({ rules, equipment, date, context: {} });
            } catch (error) {
              reasonCode = error.code ?? REASON_CODES.INVALID_INPUT;
            }
            if (selectedRule) {
              availableCapacity = selectedRule.calculateQuantity({ availableMinutes, shiftMinutes: plannedMinutes, standardDailyMinutes: factory.standardDailyMinutes, calendarMultiplier: equipmentEntry.capacityMultiplier });
            } else if (availableMinutes > 0) {
              reasonCode = REASON_CODES.MISSING_CAPACITY_RULE;
            }
            const state = availableMinutes === 0 ? SHIFT_CAPACITY_STATES.BLOCKED : availableMinutes >= plannedMinutes ? SHIFT_CAPACITY_STATES.RUNNING : SHIFT_CAPACITY_STATES.PARTIAL;
            if (state === SHIFT_CAPACITY_STATES.RUNNING && selectedRule) reasonCode = REASON_CODES.OPERABLE;
            if (state === SHIFT_CAPACITY_STATES.PARTIAL && reasonCode === REASON_CODES.OPERABLE) reasonCode = REASON_CODES.PARTIAL_OPERATION;
            shiftResults.push({
              date,
              factoryId: factory.factoryId,
              processId: equipment.processId,
              equipmentId: equipment.equipmentId,
              shiftId: shift.shiftId,
              plannedMinutes,
              availableMinutes,
              state,
              appliedCapacityRuleId: selectedRule?.capacityRuleId ?? null,
              capacityMultiplier: equipmentEntry.capacityMultiplier * (selectedRule?.capacityMultiplier ?? 1),
              availableCapacity,
              usedCapacity: 0,
              remainingCapacity: availableCapacity,
              unprocessedQuantity: 0,
              reasonCode,
              allocations
            });
          }
        }
      }
    }

    const dailyResults = [];
    for (const equipment of equipmentMasters) {
      for (const date of dates) {
        const rows = shiftResults.filter((item) => item.equipmentId === equipment.equipmentId && item.date === date);
        if (rows.length === 0) continue;
        const factory = factories.find((item) => item.factoryId === equipment.factoryId);
        const availableMinutes = rows.reduce((sum, item) => sum + item.availableMinutes, 0);
        const plannedMinutes = rows.reduce((sum, item) => sum + item.plannedMinutes, 0);
        dailyResults.push({
          date,
          factoryId: equipment.factoryId,
          processId: equipment.processId,
          equipmentId: equipment.equipmentId,
          shiftStates: Object.fromEntries(rows.map((item) => [item.shiftId, item.state])),
          dailyState: availableMinutes === 0 ? "NONE" : availableMinutes >= plannedMinutes && plannedMinutes > 0 ? "FULL" : "PARTIAL",
          plannedShiftCount: rows.filter((item) => item.plannedMinutes > 0).length,
          availableShiftCount: rows.filter((item) => item.availableMinutes > 0).length,
          plannedMinutes,
          availableMinutes,
          operatingDayEquivalent: availableMinutes / factory.standardDailyMinutes,
          availableCapacity: rows.reduce((sum, item) => sum + item.availableCapacity, 0),
          usedCapacity: 0,
          remainingCapacity: rows.reduce((sum, item) => sum + item.availableCapacity, 0),
          unprocessedQuantity: 0,
          reasonCode: aggregateReason(new Map(rows.filter((item) => item.reasonCode !== REASON_CODES.OPERABLE).map((item) => [item.reasonCode, item.plannedMinutes - item.availableMinutes])))
        });
      }
    }

    const monthlyResults = equipmentMasters.map((equipment) => {
      const rows = shiftResults.filter((item) => item.equipmentId === equipment.equipmentId);
      const daily = dailyResults.filter((item) => item.equipmentId === equipment.equipmentId);
      const factory = factories.find((item) => item.factoryId === equipment.factoryId);
      const plannedMinutes = rows.reduce((sum, item) => sum + item.plannedMinutes, 0);
      const availableMinutes = rows.reduce((sum, item) => sum + item.availableMinutes, 0);
      return {
        month,
        factoryId: equipment.factoryId,
        processId: equipment.processId,
        equipmentId: equipment.equipmentId,
        calendarDays: dates.length,
        plannedOperatingDays: daily.filter((item) => item.plannedMinutes > 0).length,
        atLeastOneRunningDays: daily.filter((item) => item.availableMinutes > 0).length,
        plannedShiftCount: rows.filter((item) => item.plannedMinutes > 0).length,
        availableShiftCount: rows.filter((item) => item.availableMinutes > 0).length,
        plannedMinutes,
        availableMinutes,
        operatingDayEquivalent: availableMinutes / factory.standardDailyMinutes,
        availableCapacity: rows.reduce((sum, item) => sum + item.availableCapacity, 0),
        usedCapacity: 0,
        remainingCapacity: rows.reduce((sum, item) => sum + item.availableCapacity, 0),
        unprocessedQuantity: 0,
        workerShortageShiftCount: rows.filter((item) => item.reasonCode === REASON_CODES.WORKER_COUNT_SHORTAGE || item.reasonCode === REASON_CODES.UNASSIGNED).length,
        skillShortageShiftCount: rows.filter((item) => item.reasonCode === REASON_CODES.SKILL_SHORTAGE || item.reasonCode === REASON_CODES.SKILL_EXPIRED).length,
        assignmentConflictShiftCount: rows.filter((item) => item.reasonCode === REASON_CODES.ASSIGNMENT_CONFLICT).length,
        equipmentStopShiftCount: rows.filter((item) => item.reasonCode === REASON_CODES.EQUIPMENT_STOPPED).length,
        factoryHolidayCount: daily.filter((item) => item.reasonCode === REASON_CODES.FACTORY_HOLIDAY).length,
        operatingSuccessRate: plannedMinutes === 0 ? 0 : availableMinutes / plannedMinutes
      };
    });

    const factoryMonthlyResults = factories.map((factory) => {
      const rows = shiftResults.filter((item) => item.factoryId === factory.factoryId);
      return {
        month,
        factoryId: factory.factoryId,
        equipmentCount: equipmentMasters.filter((item) => item.factoryId === factory.factoryId).length,
        plannedEquipmentMinutes: rows.reduce((sum, item) => sum + item.plannedMinutes, 0),
        availableEquipmentMinutes: rows.reduce((sum, item) => sum + item.availableMinutes, 0),
        availableCapacity: rows.reduce((sum, item) => sum + item.availableCapacity, 0),
        runningEquipmentShiftCount: rows.filter((item) => item.availableMinutes > 0).length,
        blockedEquipmentShiftCount: rows.filter((item) => item.plannedMinutes > 0 && item.availableMinutes === 0).length,
        simultaneousOperatingRate: rows.reduce((sum, item) => sum + item.plannedMinutes, 0) === 0 ? 0 : rows.reduce((sum, item) => sum + item.availableMinutes, 0) / rows.reduce((sum, item) => sum + item.plannedMinutes, 0)
      };
    });

    return { month, factories: factories.map((item) => item.toPlainObject()), processes: processes.map((item) => item.toPlainObject()), equipmentMasters: equipmentMasters.map((item) => item.toPlainObject()), shiftResults, dailyResults, monthlyResults, factoryMonthlyResults, capacityBuckets, capacityRules: rules.map((item) => item.toPlainObject()) };
  }
}
