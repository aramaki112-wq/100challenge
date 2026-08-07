import {
  getWorkerAssignments
} from "./WorkerAssignmentState.js";

function parseDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Invalid date: ${value}`);
  }
  return date;
}

export function evaluateWorkerTemporalAvailability({
  worker,
  factoryState,
  targetTime
}) {
  const target = parseDate(targetTime);
  const shift = factoryState.workerShifts[worker.workerId] ?? null;
  const withinShift = Boolean(
    shift &&
    parseDate(shift.startAt) <= target &&
    target < parseDate(shift.endAt)
  );

  const absences = factoryState.workerAbsences[worker.workerId] ?? [];
  const absent = absences.some((absence) => {
    const start = parseDate(absence.startAt);
    const end = absence.endAt ? parseDate(absence.endAt) : null;
    return start <= target && (!end || target < end);
  });

  const assignments = getWorkerAssignments({
    workerAssignments: factoryState.workerAssignments,
    workerId: worker.workerId
  });

  const reasons = [];
  if (!withinShift) {
    reasons.push({
      code: "WORKER_OUTSIDE_SHIFT",
      workerId: worker.workerId
    });
  }
  if (absent) {
    reasons.push({
      code: "WORKER_ABSENT",
      workerId: worker.workerId
    });
  }

  return {
    workerId: worker.workerId,
    targetTime,
    withinShift,
    absent,
    available: withinShift && !absent,
    assignedEquipmentIds: assignments.map((item) => item.equipmentId),
    reasons
  };
}
