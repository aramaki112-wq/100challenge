export function createInitialFactoryState() {
  return {
    equipmentStates: {},
    materialStates: {},
    workerAssignments: {},
    workerShifts: {},
    workerAbsences: {},
    wipByProcess: {},
    completedBuffers: {}
  };
}

export function cloneFactoryState(state) {
  return structuredClone(state);
}
