export function evaluateWorkerRequirement({
  equipmentId,
  requiredWorkerCount,
  assignedWorkerCount,
  availableWorkerCount
}) {
  const shortageWorkerCount = Math.max(
    requiredWorkerCount - availableWorkerCount,
    0
  );
  const satisfied = shortageWorkerCount === 0;

  return {
    equipmentId,
    requiredWorkerCount,
    assignedWorkerCount,
    availableWorkerCount,
    shortageWorkerCount,
    satisfied,
    reasons: satisfied
      ? []
      : [{
          code: "WORKER_SHORTAGE",
          equipmentId,
          requiredWorkerCount,
          availableWorkerCount,
          shortageWorkerCount
        }]
  };
}
