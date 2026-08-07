import {
  ApplicationError,
  ERROR_CODES
} from "./errors.js";
import {
  addWorkerAssignment,
  removeWorkerAssignment,
  removeAllWorkerAssignments
} from "./WorkerAssignmentState.js";

export const EVENT_TYPES = Object.freeze({
  WORKER_ASSIGNED_TO_EQUIPMENT: "WORKER_ASSIGNED_TO_EQUIPMENT",
  WORKER_UNASSIGNED_FROM_EQUIPMENT: "WORKER_UNASSIGNED_FROM_EQUIPMENT",
  WORKER_SHIFT_ASSIGNED: "WORKER_SHIFT_ASSIGNED",
  WORKER_ABSENCE_STARTED: "WORKER_ABSENCE_STARTED",
  WORKER_ABSENCE_ENDED: "WORKER_ABSENCE_ENDED",
  EQUIPMENT_STATUS_CHANGED: "EQUIPMENT_STATUS_CHANGED",
  MATERIAL_STATUS_CHANGED: "MATERIAL_STATUS_CHANGED",
  PRODUCTION_COMPLETED: "PRODUCTION_COMPLETED",
  WIP_MOVED: "WIP_MOVED"
});

function requirePayload(event) {
  if (!event || typeof event !== "object" || !event.payload) {
    throw new ApplicationError(
      ERROR_CODES.INVALID_FACTORY_EVENT,
      "Factory event payload is required.",
      { event }
    );
  }
}

export function applyFactoryEvent(state, event) {
  requirePayload(event);
  const next = structuredClone(state);
  const p = event.payload;

  switch (event.type) {
    case EVENT_TYPES.WORKER_ASSIGNED_TO_EQUIPMENT:
      next.workerAssignments = addWorkerAssignment({
        workerAssignments: next.workerAssignments,
        workerId: p.workerId,
        equipmentId: p.equipmentId,
        assignedAt: event.occurredAt
      });
      return next;

    case EVENT_TYPES.WORKER_UNASSIGNED_FROM_EQUIPMENT:
      next.workerAssignments = p.equipmentId
        ? removeWorkerAssignment({
            workerAssignments: next.workerAssignments,
            workerId: p.workerId,
            equipmentId: p.equipmentId
          })
        : removeAllWorkerAssignments({
            workerAssignments: next.workerAssignments,
            workerId: p.workerId
          });
      return next;

    case EVENT_TYPES.WORKER_SHIFT_ASSIGNED:
      next.workerShifts[p.workerId] = {
        startAt: p.startAt,
        endAt: p.endAt
      };
      return next;

    case EVENT_TYPES.WORKER_ABSENCE_STARTED: {
      const absences = next.workerAbsences[p.workerId] ?? [];
      absences.push({
        absenceId: p.absenceId,
        startAt: event.occurredAt,
        endAt: null
      });
      next.workerAbsences[p.workerId] = absences;
      return next;
    }

    case EVENT_TYPES.WORKER_ABSENCE_ENDED: {
      const absences = next.workerAbsences[p.workerId] ?? [];
      const target = absences.find(
        (absence) => absence.absenceId === p.absenceId
      );
      if (target) target.endAt = event.occurredAt;
      next.workerAbsences[p.workerId] = absences;
      return next;
    }

    case EVENT_TYPES.EQUIPMENT_STATUS_CHANGED:
      next.equipmentStates[p.equipmentId] = {
        operable: Boolean(p.operable)
      };
      return next;

    case EVENT_TYPES.MATERIAL_STATUS_CHANGED:
      next.materialStates[p.equipmentId] = {
        available: Boolean(p.available)
      };
      return next;

    case EVENT_TYPES.PRODUCTION_COMPLETED: {
      const currentWip = next.wipByProcess[p.processId] ?? 0;
      const currentBuffer = next.completedBuffers[p.processId] ?? 0;
      next.wipByProcess[p.processId] = currentWip - p.quantity;
      next.completedBuffers[p.processId] = currentBuffer + p.quantity;
      return next;
    }

    case EVENT_TYPES.WIP_MOVED: {
      const sourceBuffer = next.completedBuffers[p.fromProcessId] ?? 0;
      const destinationWip = next.wipByProcess[p.toProcessId] ?? 0;
      next.completedBuffers[p.fromProcessId] = sourceBuffer - p.quantity;
      next.wipByProcess[p.toProcessId] = destinationWip + p.quantity;
      return next;
    }

    default:
      return next;
  }
}
