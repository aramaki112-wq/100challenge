import {
  isWorkerAssignedToEquipment
} from "./WorkerAssignmentState.js";

function parseDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Invalid date: ${value}`);
  }
  return date;
}

export function evaluateWorkerAvailability({
  worker,
  equipmentId,
  factoryState,
  targetTime
}) {
  const target = parseDate(targetTime);
  const assigned = isWorkerAssignedToEquipment({
    workerAssignments: factoryState.workerAssignments,
    workerId: worker.workerId,
    equipmentId
  });

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

  const available = assigned && withinShift && !absent;

  const reasons = [];
  if (!assigned) {
    reasons.push({ code: "WORKER_NOT_ASSIGNED", workerId: worker.workerId });
  }
  if (!withinShift) {
    reasons.push({ code: "WORKER_OUTSIDE_SHIFT", workerId: worker.workerId });
  }
  if (absent) {
    reasons.push({ code: "WORKER_ABSENT", workerId: worker.workerId });
  }

  return {
    workerId: worker.workerId,
    equipmentId,
    assigned,
    withinShift,
    absent,
    available,
    reasons
  };
}
