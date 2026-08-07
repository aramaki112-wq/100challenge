import { REASON_CODES } from "./Day29Constants.js";
import { ManualAssignment } from "./ManualAssignment.js";
import { WorkerCalendarEntry } from "./WorkerCalendarEntry.js";
import { WorkerSkillQualification } from "./WorkerSkillQualification.js";
import { durationMinutes, formatLocalDateTime, overlaps, parseDateTime } from "./Day29DateTime.js";

function buildRoleSlots(requirement) {
  const slots = [];
  for (const role of requirement.roleRequirements) {
    for (let index = 0; index < role.requiredCount; index += 1) {
      slots.push({ slotId: `${role.skillId}-${index + 1}`, skillId: role.skillId });
    }
  }
  const generalCount = requirement.requiredWorkerCount - slots.length;
  for (let index = 0; index < generalCount; index += 1) {
    slots.push({ slotId: `GENERAL-${index + 1}`, skillId: "GENERAL" });
  }
  return slots;
}

function buildOptions({ requirement, candidates }) {
  const slots = buildRoleSlots(requirement);
  if (slots.length === 0) return [[]];
  const results = [];
  function visit(index, usedWorkers, selected) {
    if (index >= slots.length) {
      results.push(selected.map((item) => ({ ...item })));
      return;
    }
    const slot = slots[index];
    for (const candidate of candidates) {
      if (usedWorkers.has(candidate.workerId)) continue;
      const canFill = slot.skillId === "GENERAL" || candidate.roleSkillId === slot.skillId;
      if (!canFill) continue;
      usedWorkers.add(candidate.workerId);
      selected.push({ ...candidate, roleSlotId: slot.slotId, allocatedRoleSkillId: slot.skillId });
      visit(index + 1, usedWorkers, selected);
      selected.pop();
      usedWorkers.delete(candidate.workerId);
    }
  }
  visit(0, new Set(), []);
  const unique = new Map();
  for (const option of results) {
    const key = option.map((item) => `${item.roleSlotId}:${item.workerId}`).sort().join("|");
    unique.set(key, option);
  }
  return [...unique.values()].sort((a, b) => {
    const aKey = a.map((item) => item.workerId).sort().join("|");
    const bKey = b.map((item) => item.workerId).sort().join("|");
    return aKey.localeCompare(bKey);
  });
}

function compareScore(a, b, priorityLevels) {
  for (const level of priorityLevels) {
    const diff = (a.byPriority[level] ?? 0) - (b.byPriority[level] ?? 0);
    if (diff !== 0) return diff;
  }
  if (a.total !== b.total) return a.total - b.total;
  return b.signature.localeCompare(a.signature) * -1;
}

function chooseFactorySolution(equipmentCandidates) {
  const priorityLevels = [...new Set(equipmentCandidates.map((item) => item.priority))].sort((a, b) => a - b);
  const ordered = [...equipmentCandidates].sort((a, b) => a.priority - b.priority || a.equipmentId.localeCompare(b.equipmentId));
  let best = null;
  function visit(index, usedWorkers, selections) {
    if (index >= ordered.length) {
      const running = selections.filter((item) => item.option != null);
      const score = {
        byPriority: Object.fromEntries(priorityLevels.map((level) => [level, running.filter((item) => item.priority === level).length])),
        total: running.length,
        signature: running.map((item) => item.equipmentId).sort().join("|")
      };
      if (!best || compareScore(score, best.score, priorityLevels) > 0) {
        best = { score, selections: selections.map((item) => ({ ...item, option: item.option ? item.option.map((x) => ({ ...x })) : null })) };
      }
      return;
    }
    const equipment = ordered[index];
    for (const option of equipment.options) {
      const workerIds = option.map((item) => item.workerId);
      if (workerIds.some((workerId) => usedWorkers.has(workerId))) continue;
      workerIds.forEach((workerId) => usedWorkers.add(workerId));
      selections.push({ equipmentId: equipment.equipmentId, priority: equipment.priority, option });
      visit(index + 1, usedWorkers, selections);
      selections.pop();
      workerIds.forEach((workerId) => usedWorkers.delete(workerId));
    }
    selections.push({ equipmentId: equipment.equipmentId, priority: equipment.priority, option: null });
    visit(index + 1, usedWorkers, selections);
    selections.pop();
  }
  visit(0, new Set(), []);
  return best?.selections ?? [];
}

function primaryFailure({ allAssignments, invalidAssignments, validCandidates, requirement }) {
  if (allAssignments.length === 0) return REASON_CODES.UNASSIGNED;
  if (validCandidates.length < requirement.requiredWorkerCount) {
    if (invalidAssignments.some((item) => item.reasonCode === REASON_CODES.SKILL_EXPIRED || item.reasonCode === REASON_CODES.SKILL_SHORTAGE)) return REASON_CODES.SKILL_SHORTAGE;
    if (invalidAssignments.some((item) => item.reasonCode === REASON_CODES.CROSS_FACTORY_ASSIGNMENT)) return REASON_CODES.CROSS_FACTORY_ASSIGNMENT;
    if (invalidAssignments.some((item) => item.reasonCode === REASON_CODES.OUTSIDE_WORKING_TIME)) return REASON_CODES.OUTSIDE_WORKING_TIME;
    return REASON_CODES.WORKER_COUNT_SHORTAGE;
  }
  return REASON_CODES.SKILL_SHORTAGE;
}

export class ResolveManualAssignments {
  execute({ date, shift, equipmentMasters, equipmentRequirements, workerCalendars, assignments, qualifications }) {
    const shiftStartAt = shift.startAt(date);
    const shiftEndAt = shift.endAt(date);
    const normalizedWorkerCalendars = workerCalendars.map((item) => item instanceof WorkerCalendarEntry ? item : new WorkerCalendarEntry(item));
    const normalizedAssignments = assignments.map((item) => item instanceof ManualAssignment ? item : new ManualAssignment(item));
    const normalizedQualifications = qualifications.map((item) => item instanceof WorkerSkillQualification ? item : new WorkerSkillQualification(item));
    const boundaries = new Set([parseDateTime(shiftStartAt), parseDateTime(shiftEndAt)]);
    for (const entry of normalizedWorkerCalendars) {
      if (entry.date === date && entry.shiftId === shift.shiftId && overlaps(entry.startAt, entry.endAt, shiftStartAt, shiftEndAt)) {
        boundaries.add(Math.max(parseDateTime(entry.startAt), parseDateTime(shiftStartAt)));
        boundaries.add(Math.min(parseDateTime(entry.endAt), parseDateTime(shiftEndAt)));
      }
    }
    for (const assignment of normalizedAssignments) {
      if (assignment.date === date && assignment.shiftId === shift.shiftId && overlaps(assignment.startAt, assignment.endAt, shiftStartAt, shiftEndAt)) {
        boundaries.add(Math.max(parseDateTime(assignment.startAt), parseDateTime(shiftStartAt)));
        boundaries.add(Math.min(parseDateTime(assignment.endAt), parseDateTime(shiftEndAt)));
      }
    }
    const sorted = [...boundaries].sort((a, b) => a - b);
    const segments = [];
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const startAt = formatLocalDateTime(sorted[index]);
      const endAt = formatLocalDateTime(sorted[index + 1]);
      if (durationMinutes(startAt, endAt) <= 0) continue;
      const equipmentCandidates = [];
      const diagnosticByEquipment = new Map();
      for (const equipment of equipmentMasters) {
        const requirement = equipmentRequirements.find((item) => item.equipmentId === equipment.equipmentId) ?? null;
        if (!requirement) {
          equipmentCandidates.push({ equipmentId: equipment.equipmentId, priority: equipment.priority, options: [] });
          diagnosticByEquipment.set(equipment.equipmentId, { primaryReasonCode: REASON_CODES.MISSING_REQUIRED_SKILL_SETTING, invalidAssignments: [] });
          continue;
        }
        const relevantAssignments = normalizedAssignments.filter((item) =>
          item.date === date && item.shiftId === shift.shiftId && item.equipmentId === equipment.equipmentId && overlaps(item.startAt, item.endAt, startAt, endAt)
        );
        const invalidAssignments = [];
        const validCandidates = [];
        for (const assignment of relevantAssignments) {
          if (assignment.factoryId !== equipment.factoryId) {
            invalidAssignments.push({ assignmentId: assignment.assignmentId, workerId: assignment.workerId, reasonCode: REASON_CODES.CROSS_FACTORY_ASSIGNMENT });
            continue;
          }
          const workerEntry = normalizedWorkerCalendars.find((entry) =>
            entry.workerId === assignment.workerId && entry.date === date && entry.shiftId === shift.shiftId && entry.placementFactoryId === equipment.factoryId && entry.isWorking() && parseDateTime(entry.startAt) <= parseDateTime(startAt) && parseDateTime(entry.endAt) >= parseDateTime(endAt)
          );
          if (!workerEntry) {
            invalidAssignments.push({ assignmentId: assignment.assignmentId, workerId: assignment.workerId, reasonCode: REASON_CODES.OUTSIDE_WORKING_TIME });
            continue;
          }
          if (assignment.roleSkillId !== "GENERAL") {
            const qualificationsForSkill = normalizedQualifications.filter((item) => item.workerId === assignment.workerId && item.skillId === assignment.roleSkillId);
            const valid = qualificationsForSkill.some((item) => item.isValid(date));
            if (!valid) {
              invalidAssignments.push({ assignmentId: assignment.assignmentId, workerId: assignment.workerId, reasonCode: qualificationsForSkill.length > 0 ? REASON_CODES.SKILL_EXPIRED : REASON_CODES.SKILL_SHORTAGE });
              continue;
            }
          }
          validCandidates.push({ assignmentId: assignment.assignmentId, workerId: assignment.workerId, roleSkillId: assignment.roleSkillId });
        }
        const options = buildOptions({ requirement, candidates: validCandidates });
        const primaryReasonCode = options.length > 0 ? null : primaryFailure({ allAssignments: relevantAssignments, invalidAssignments, validCandidates, requirement });
        equipmentCandidates.push({ equipmentId: equipment.equipmentId, priority: equipment.priority, options });
        diagnosticByEquipment.set(equipment.equipmentId, { primaryReasonCode, invalidAssignments, validCandidateCount: validCandidates.length });
      }
      const solution = chooseFactorySolution(equipmentCandidates);
      const results = equipmentMasters.map((equipment) => {
        const selection = solution.find((item) => item.equipmentId === equipment.equipmentId);
        const diagnostic = diagnosticByEquipment.get(equipment.equipmentId);
        const hadFeasibleOption = equipmentCandidates.find((item) => item.equipmentId === equipment.equipmentId)?.options.length > 0;
        if (selection?.option) {
          return { equipmentId: equipment.equipmentId, state: "RUNNING", allocations: selection.option, reasonCode: REASON_CODES.OPERABLE, diagnostic };
        }
        return {
          equipmentId: equipment.equipmentId,
          state: "BLOCKED",
          allocations: [],
          reasonCode: hadFeasibleOption ? REASON_CODES.ASSIGNMENT_CONFLICT : diagnostic.primaryReasonCode,
          diagnostic
        };
      });
      segments.push({ startAt, endAt, durationMinutes: durationMinutes(startAt, endAt), equipmentResults: results });
    }
    return { date, shiftId: shift.shiftId, startAt: shiftStartAt, endAt: shiftEndAt, segments };
  }
}
