import {
  ApplicationError,
  ERROR_CODES
} from "./errors.js";

export function createWorkerReservation() {
  return new Map();
}

export function canReserveWorker({ reservation, workerId }) {
  return !reservation.has(workerId);
}

export function reserveWorker({ reservation, allocation }) {
  if (!canReserveWorker({ reservation, workerId: allocation.workerId })) {
    throw new ApplicationError(
      ERROR_CODES.WORKER_ALREADY_RESERVED,
      "A worker cannot be reserved by multiple equipment at the same target time.",
      {
        workerId: allocation.workerId,
        existing: reservation.get(allocation.workerId),
        attempted: allocation
      }
    );
  }
  reservation.set(allocation.workerId, { ...allocation });
}

export function releaseWorker({ reservation, workerId }) {
  reservation.delete(workerId);
}

export function getReservedAllocation({ reservation, workerId }) {
  const allocation = reservation.get(workerId);
  return allocation ? { ...allocation } : null;
}

export function reservationToArray(reservation) {
  return [...reservation.values()]
    .map((item) => ({ ...item }))
    .sort((a, b) => a.workerId.localeCompare(b.workerId));
}
