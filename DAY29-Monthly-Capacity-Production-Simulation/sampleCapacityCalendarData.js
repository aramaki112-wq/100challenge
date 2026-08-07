import { Worker } from "./Worker.js";
import { Equipment } from "./Equipment.js";
import { EVENT_TYPES } from "./applyFactoryEvent.js";
import { createInitialFactoryState } from "./FactoryState.js";

const operatorA = new Worker({
  workerId: "WORKER_A",
  name: "Worker A",
  skillIds: ["OPERATOR"]
});
const craneC = new Worker({
  workerId: "WORKER_C",
  name: "Worker C",
  skillIds: ["CRANE"]
});
const multiE = new Worker({
  workerId: "WORKER_E",
  name: "Worker E",
  skillIds: ["OPERATOR", "CRANE"]
});
const craneF = new Worker({
  workerId: "WORKER_F",
  name: "Worker F",
  skillIds: ["CRANE"]
});

const equipmentA = new Equipment({
  equipmentId: "EQUIPMENT_A",
  name: "押出機 A",
  requiredWorkerCount: 1,
  requiredSkillRequirements: [
    { skillId: "OPERATOR", requiredCount: 1 }
  ]
});
const equipmentB = new Equipment({
  equipmentId: "EQUIPMENT_B",
  name: "圧延機 B",
  requiredWorkerCount: 1,
  requiredSkillRequirements: [
    { skillId: "CRANE", requiredCount: 1 }
  ]
});

function event(scenarioId, eventId, type, occurredAt, payload) {
  return { scenarioId, eventId, type, occurredAt, payload };
}

function baseEvents({ scenarioId, workers, equipment, assignments, shifts }) {
  const events = [];
  workers.forEach((worker, index) => {
    const shift = shifts?.[worker.workerId] ?? {
      startAt: "2026-07-28T08:00:00",
      endAt: "2026-07-28T17:00:00"
    };
    events.push(event(
      scenarioId,
      `${scenarioId}_SHIFT_${index + 1}`,
      EVENT_TYPES.WORKER_SHIFT_ASSIGNED,
      "2026-07-28T07:00:00",
      { workerId: worker.workerId, ...shift }
    ));
  });
  equipment.forEach((item, index) => {
    events.push(event(
      scenarioId,
      `${scenarioId}_EQUIPMENT_${index + 1}`,
      EVENT_TYPES.EQUIPMENT_STATUS_CHANGED,
      "2026-07-28T07:10:00",
      { equipmentId: item.equipmentId, operable: true }
    ));
    events.push(event(
      scenarioId,
      `${scenarioId}_MATERIAL_${index + 1}`,
      EVENT_TYPES.MATERIAL_STATUS_CHANGED,
      "2026-07-28T07:11:00",
      { equipmentId: item.equipmentId, available: true }
    ));
  });
  assignments.forEach((assignment, index) => {
    events.push(event(
      scenarioId,
      `${scenarioId}_ASSIGN_${index + 1}`,
      EVENT_TYPES.WORKER_ASSIGNED_TO_EQUIPMENT,
      `2026-07-28T07:${20 + index}:00`,
      assignment
    ));
  });
  return events;
}

function scenario({
  scenarioId,
  label,
  description,
  workers,
  equipment,
  assignments,
  priorities,
  shifts,
  additionalEvents = []
}) {
  return {
    scenarioId,
    label,
    description,
    startAt: "2026-07-28T08:00:00",
    endAt: "2026-07-28T17:00:00",
    intervalMinutes: 120,
    workers,
    equipment,
    priorities,
    initialFactoryState: createInitialFactoryState(),
    events: [
      ...baseEvents({
        scenarioId,
        workers,
        equipment,
        assignments,
        shifts
      }),
      ...additionalEvents
    ]
  };
}

export const capacityCalendarScenarios = [
  scenario({
    scenarioId: "CAPACITY_A",
    label: "A：欠勤でCapacityが変化",
    description: "08:00〜10:00は二設備、10:00〜13:00はSkill不足で一設備、13:00〜17:00は二設備へ戻ります。",
    workers: [operatorA, craneC],
    equipment: [equipmentA, equipmentB],
    assignments: [
      { workerId: "WORKER_A", equipmentId: "EQUIPMENT_A" },
      { workerId: "WORKER_C", equipmentId: "EQUIPMENT_B" }
    ],
    priorities: [
      { equipmentId: "EQUIPMENT_A", value: 1 },
      { equipmentId: "EQUIPMENT_B", value: 2 }
    ],
    additionalEvents: [
      event(
        "CAPACITY_A",
        "CAPACITY_A_ABSENCE_START",
        EVENT_TYPES.WORKER_ABSENCE_STARTED,
        "2026-07-28T10:00:00",
        { workerId: "WORKER_C", absenceId: "ABSENCE_C" }
      ),
      event(
        "CAPACITY_A",
        "CAPACITY_A_ABSENCE_END",
        EVENT_TYPES.WORKER_ABSENCE_ENDED,
        "2026-07-28T13:00:00",
        { workerId: "WORKER_C", absenceId: "ABSENCE_C" }
      )
    ]
  }),
  scenario({
    scenarioId: "CAPACITY_B",
    label: "B：同じWorkerの同時利用競合",
    description: "Worker Eは両設備へAssignmentされていますが、同じ時間に寄与できるのは一設備だけです。",
    workers: [multiE],
    equipment: [equipmentA, equipmentB],
    assignments: [
      { workerId: "WORKER_E", equipmentId: "EQUIPMENT_A" },
      { workerId: "WORKER_E", equipmentId: "EQUIPMENT_B" }
    ],
    priorities: [
      { equipmentId: "EQUIPMENT_A", value: 1 },
      { equipmentId: "EQUIPMENT_B", value: 2 }
    ]
  }),
  scenario({
    scenarioId: "CAPACITY_C",
    label: "C：Shiftの切替と空白",
    description: "Worker CのShiftは12:00で終了し、交替Worker Fは13:00から開始します。12:00〜13:00は設備BのCapacityがありません。",
    workers: [operatorA, craneC, craneF],
    equipment: [equipmentA, equipmentB],
    assignments: [
      { workerId: "WORKER_A", equipmentId: "EQUIPMENT_A" },
      { workerId: "WORKER_C", equipmentId: "EQUIPMENT_B" },
      { workerId: "WORKER_F", equipmentId: "EQUIPMENT_B" }
    ],
    priorities: [
      { equipmentId: "EQUIPMENT_A", value: 1 },
      { equipmentId: "EQUIPMENT_B", value: 2 }
    ],
    shifts: {
      WORKER_A: {
        startAt: "2026-07-28T08:00:00",
        endAt: "2026-07-28T17:00:00"
      },
      WORKER_C: {
        startAt: "2026-07-28T08:00:00",
        endAt: "2026-07-28T12:00:00"
      },
      WORKER_F: {
        startAt: "2026-07-28T13:00:00",
        endAt: "2026-07-28T17:00:00"
      }
    }
  }),
  scenario({
    scenarioId: "CAPACITY_D",
    label: "D：時間枠途中の設備停止",
    description: "10:30の停止と11:15の復旧を境界として、2時間Bucketを自動分割します。",
    workers: [operatorA, craneC],
    equipment: [equipmentA, equipmentB],
    assignments: [
      { workerId: "WORKER_A", equipmentId: "EQUIPMENT_A" },
      { workerId: "WORKER_C", equipmentId: "EQUIPMENT_B" }
    ],
    priorities: [
      { equipmentId: "EQUIPMENT_A", value: 1 },
      { equipmentId: "EQUIPMENT_B", value: 2 }
    ],
    additionalEvents: [
      event(
        "CAPACITY_D",
        "CAPACITY_D_STOP",
        EVENT_TYPES.EQUIPMENT_STATUS_CHANGED,
        "2026-07-28T10:30:00",
        { equipmentId: "EQUIPMENT_B", operable: false }
      ),
      event(
        "CAPACITY_D",
        "CAPACITY_D_RESTART",
        EVENT_TYPES.EQUIPMENT_STATUS_CHANGED,
        "2026-07-28T11:15:00",
        { equipmentId: "EQUIPMENT_B", operable: true }
      )
    ]
  })
];

export function findCapacityScenario(scenarioId) {
  return capacityCalendarScenarios.find((item) => item.scenarioId === scenarioId);
}

export function findSkillName(skillId) {
  return {
    OPERATOR: "オペレーター",
    CRANE: "クレーン担当",
    INSPECTOR: "検査担当"
  }[skillId] ?? skillId;
}
