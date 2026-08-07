function isLegacyAssignment(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof value.equipmentId === "string"
  );
}

export function getWorkerAssignments({ workerAssignments, workerId }) {
  const value = workerAssignments?.[workerId];
  if (!value) return [];

  if (isLegacyAssignment(value)) {
    return [{ ...value }];
  }

  return Object.values(value)
    .filter(isLegacyAssignment)
    .map((assignment) => ({ ...assignment }))
    .sort((a, b) => a.equipmentId.localeCompare(b.equipmentId));
}

export function isWorkerAssignedToEquipment({
  workerAssignments,
  workerId,
  equipmentId
}) {
  return getWorkerAssignments({ workerAssignments, workerId })
    .some((assignment) => assignment.equipmentId === equipmentId);
}

export function addWorkerAssignment({
  workerAssignments,
  workerId,
  equipmentId,
  assignedAt
}) {
  const next = structuredClone(workerAssignments ?? {});
  const current = getWorkerAssignments({
    workerAssignments: next,
    workerId
  });

  const normalized = Object.fromEntries(
    current.map((assignment) => [assignment.equipmentId, assignment])
  );
  normalized[equipmentId] = { equipmentId, assignedAt };
  next[workerId] = normalized;
  return next;
}

export function removeWorkerAssignment({
  workerAssignments,
  workerId,
  equipmentId
}) {
  const next = structuredClone(workerAssignments ?? {});
  const current = getWorkerAssignments({
    workerAssignments: next,
    workerId
  });
  const remaining = current.filter(
    (assignment) => assignment.equipmentId !== equipmentId
  );

  if (remaining.length === 0) {
    delete next[workerId];
  } else {
    next[workerId] = Object.fromEntries(
      remaining.map((assignment) => [assignment.equipmentId, assignment])
    );
  }
  return next;
}

export function removeAllWorkerAssignments({ workerAssignments, workerId }) {
  const next = structuredClone(workerAssignments ?? {});
  delete next[workerId];
  return next;
}
