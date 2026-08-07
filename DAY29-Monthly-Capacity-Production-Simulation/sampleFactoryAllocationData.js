import { Skill } from "./Skill.js";
import { Worker } from "./Worker.js";
import { Equipment } from "./Equipment.js";
import { EVENT_TYPES } from "./applyFactoryEvent.js";
import { createInitialFactoryState } from "./FactoryState.js";

export const skills = [
  new Skill({ skillId: "OPERATOR", name: "オペレーター" }),
  new Skill({ skillId: "CRANE", name: "クレーン担当" }),
  new Skill({ skillId: "INSPECTOR", name: "検査担当" })
];

const WORKER_DEFINITIONS = {
  A: { workerId: "WORKER_A", name: "Worker A", skillIds: ["OPERATOR"] },
  C: { workerId: "WORKER_C", name: "Worker C", skillIds: ["CRANE"] },
  E: { workerId: "WORKER_E", name: "Worker E", skillIds: ["OPERATOR", "CRANE"] },
  F: { workerId: "WORKER_F", name: "Worker F", skillIds: ["OPERATOR"] },
  G: { workerId: "WORKER_G", name: "Worker G", skillIds: [] },
  H: { workerId: "WORKER_H", name: "Worker H", skillIds: ["INSPECTOR"] }
};

function workers(...keys) {
  return keys.map((key) => new Worker(WORKER_DEFINITIONS[key]));
}

function equipment({
  equipmentId,
  name = equipmentId.replace("_", " "),
  requiredWorkerCount,
  requiredSkillRequirements
}) {
  return new Equipment({
    equipmentId,
    name,
    requiredWorkerCount,
    requiredSkillRequirements
  });
}

function event(scenarioId, eventId, type, occurredAt, payload) {
  return { scenarioId, eventId, type, occurredAt, payload };
}

function buildEvents({
  scenarioId,
  targetDate = "2026-07-27",
  workers: scenarioWorkers,
  equipment: scenarioEquipment,
  assignments,
  operable = {},
  material = {},
  shifts = {},
  absences = []
}) {
  const events = [];
  for (const [index, worker] of scenarioWorkers.entries()) {
    const shift = shifts[worker.workerId] ?? {
      startAt: `${targetDate}T08:00:00`,
      endAt: `${targetDate}T17:00:00`
    };
    events.push(event(
      scenarioId,
      `${scenarioId}_SHIFT_${index + 1}`,
      EVENT_TYPES.WORKER_SHIFT_ASSIGNED,
      `${targetDate}T07:00:00`,
      { workerId: worker.workerId, ...shift }
    ));
  }
  for (const [index, item] of scenarioEquipment.entries()) {
    events.push(event(
      scenarioId,
      `${scenarioId}_STATUS_${index + 1}`,
      EVENT_TYPES.EQUIPMENT_STATUS_CHANGED,
      `${targetDate}T07:10:00`,
      {
        equipmentId: item.equipmentId,
        operable: operable[item.equipmentId] ?? true
      }
    ));
    events.push(event(
      scenarioId,
      `${scenarioId}_MATERIAL_${index + 1}`,
      EVENT_TYPES.MATERIAL_STATUS_CHANGED,
      `${targetDate}T07:11:00`,
      {
        equipmentId: item.equipmentId,
        available: material[item.equipmentId] ?? true
      }
    ));
  }
  assignments.forEach((assignment, index) => {
    events.push(event(
      scenarioId,
      `${scenarioId}_ASSIGN_${index + 1}`,
      EVENT_TYPES.WORKER_ASSIGNED_TO_EQUIPMENT,
      `${targetDate}T07:${20 + index}:00`,
      assignment
    ));
  });
  absences.forEach((absence, index) => {
    events.push(event(
      scenarioId,
      `${scenarioId}_ABSENCE_${index + 1}`,
      EVENT_TYPES.WORKER_ABSENCE_STARTED,
      absence.startAt,
      {
        workerId: absence.workerId,
        absenceId: absence.absenceId ?? `${scenarioId}_ABS_${index + 1}`
      }
    ));
  });
  return events;
}

function scenario({
  scenarioId,
  label,
  description,
  targetTime = "2026-07-27T10:00:00",
  equipment: scenarioEquipment,
  workers: scenarioWorkers,
  priorities,
  assignments,
  operable,
  material,
  shifts,
  absences
}) {
  return {
    scenarioId,
    label,
    description,
    targetTime,
    equipment: scenarioEquipment,
    workers: scenarioWorkers,
    priorities,
    initialFactoryState: createInitialFactoryState(),
    events: buildEvents({
      scenarioId,
      workers: scenarioWorkers,
      equipment: scenarioEquipment,
      assignments,
      operable,
      material,
      shifts,
      absences
    })
  };
}

const scenarioAWorkers = workers("A", "C");
const scenarioAEquipment = [
  equipment({ equipmentId: "EQUIPMENT_A", requiredWorkerCount: 1, requiredSkillRequirements: [{ skillId: "OPERATOR", requiredCount: 1 }] }),
  equipment({ equipmentId: "EQUIPMENT_B", requiredWorkerCount: 1, requiredSkillRequirements: [{ skillId: "CRANE", requiredCount: 1 }] })
];

const scenarioBWorkers = workers("E");
const scenarioBEquipment = [
  equipment({ equipmentId: "EQUIPMENT_A", requiredWorkerCount: 1, requiredSkillRequirements: [{ skillId: "CRANE", requiredCount: 1 }] }),
  equipment({ equipmentId: "EQUIPMENT_B", requiredWorkerCount: 1, requiredSkillRequirements: [{ skillId: "OPERATOR", requiredCount: 1 }] })
];

const scenarioDWorkers = workers("E", "F");
const scenarioDEquipment = [
  equipment({ equipmentId: "EQUIPMENT_A", requiredWorkerCount: 1, requiredSkillRequirements: [{ skillId: "OPERATOR", requiredCount: 1 }] }),
  equipment({ equipmentId: "EQUIPMENT_B", requiredWorkerCount: 1, requiredSkillRequirements: [{ skillId: "CRANE", requiredCount: 1 }] })
];

const scenarioFWorkers = workers("A", "F");
const scenarioFEquipment = [
  equipment({
    equipmentId: "EQUIPMENT_A",
    requiredWorkerCount: 2,
    requiredSkillRequirements: [
      { skillId: "OPERATOR", requiredCount: 1 },
      { skillId: "CRANE", requiredCount: 1 }
    ]
  })
];

const scenarioGWorkers = workers("A");
const scenarioGEquipment = [
  equipment({ equipmentId: "EQUIPMENT_A", requiredWorkerCount: 1, requiredSkillRequirements: [{ skillId: "OPERATOR", requiredCount: 1 }] })
];

const scenarioIWorkers = workers("E", "C");
const scenarioIEquipment = [
  equipment({ equipmentId: "EQUIPMENT_A", requiredWorkerCount: 1, requiredSkillRequirements: [{ skillId: "OPERATOR", requiredCount: 1 }] }),
  equipment({ equipmentId: "EQUIPMENT_B", requiredWorkerCount: 1, requiredSkillRequirements: [{ skillId: "CRANE", requiredCount: 1 }] })
];

export const factoryAllocationScenarios = [
  scenario({
    scenarioId: "SCENARIO_A",
    label: "A：競合なし",
    description: "異なるWorkerが異なるEquipmentを担当し、二台ともRUNNINGになります。",
    equipment: scenarioAEquipment,
    workers: scenarioAWorkers,
    priorities: [
      { equipmentId: "EQUIPMENT_A", value: 1 },
      { equipmentId: "EQUIPMENT_B", value: 2 }
    ],
    assignments: [
      { workerId: "WORKER_A", equipmentId: "EQUIPMENT_A" },
      { workerId: "WORKER_C", equipmentId: "EQUIPMENT_B" }
    ]
  }),
  scenario({
    scenarioId: "SCENARIO_B",
    label: "B：同じWorkerが二設備で必要",
    description: "Worker EをPriority 1のEquipment AへAllocationし、BをBLOCKEDにします。",
    equipment: scenarioBEquipment,
    workers: scenarioBWorkers,
    priorities: [
      { equipmentId: "EQUIPMENT_A", value: 1 },
      { equipmentId: "EQUIPMENT_B", value: 2 }
    ],
    assignments: [
      { workerId: "WORKER_E", equipmentId: "EQUIPMENT_A" },
      { workerId: "WORKER_E", equipmentId: "EQUIPMENT_B" }
    ]
  }),
  scenario({
    scenarioId: "SCENARIO_C",
    label: "C：Priority変更",
    description: "Scenario BのPriorityを逆転し、Equipment BをRUNNINGにします。",
    equipment: scenarioBEquipment,
    workers: scenarioBWorkers,
    priorities: [
      { equipmentId: "EQUIPMENT_A", value: 2 },
      { equipmentId: "EQUIPMENT_B", value: 1 }
    ],
    assignments: [
      { workerId: "WORKER_E", equipmentId: "EQUIPMENT_A" },
      { workerId: "WORKER_E", equipmentId: "EQUIPMENT_B" }
    ]
  }),
  scenario({
    scenarioId: "SCENARIO_D",
    label: "D：単純Greedyの失敗",
    description: "Worker FをAへ、Multi-skilled Worker EをBへ残す全体探索を確認します。",
    equipment: scenarioDEquipment,
    workers: scenarioDWorkers,
    priorities: [
      { equipmentId: "EQUIPMENT_A", value: 1 },
      { equipmentId: "EQUIPMENT_B", value: 2 }
    ],
    assignments: [
      { workerId: "WORKER_E", equipmentId: "EQUIPMENT_A" },
      { workerId: "WORKER_E", equipmentId: "EQUIPMENT_B" },
      { workerId: "WORKER_F", equipmentId: "EQUIPMENT_A" }
    ]
  }),
  scenario({
    scenarioId: "SCENARIO_E",
    label: "E：単体では両方実行可能",
    description: "個別評価では両設備が実行可能ですが、Factory全体では一台だけRUNNINGになります。",
    equipment: scenarioBEquipment,
    workers: scenarioBWorkers,
    priorities: [
      { equipmentId: "EQUIPMENT_A", value: 1 },
      { equipmentId: "EQUIPMENT_B", value: 2 }
    ],
    assignments: [
      { workerId: "WORKER_E", equipmentId: "EQUIPMENT_A" },
      { workerId: "WORKER_E", equipmentId: "EQUIPMENT_B" }
    ]
  }),
  scenario({
    scenarioId: "SCENARIO_F",
    label: "F：Skill不足",
    description: "人数は二人ですがCRANE Skillがなく、Skill Requirement Shortageになります。",
    equipment: scenarioFEquipment,
    workers: scenarioFWorkers,
    priorities: [{ equipmentId: "EQUIPMENT_A", value: 1 }],
    assignments: [
      { workerId: "WORKER_A", equipmentId: "EQUIPMENT_A" },
      { workerId: "WORKER_F", equipmentId: "EQUIPMENT_A" }
    ]
  }),
  scenario({
    scenarioId: "SCENARIO_G",
    label: "G：Equipment停止",
    description: "WorkerとMaterialが揃っていてもEquipmentが停止中ならBLOCKEDです。",
    equipment: scenarioGEquipment,
    workers: scenarioGWorkers,
    priorities: [{ equipmentId: "EQUIPMENT_A", value: 1 }],
    assignments: [{ workerId: "WORKER_A", equipmentId: "EQUIPMENT_A" }],
    operable: { EQUIPMENT_A: false }
  }),
  scenario({
    scenarioId: "SCENARIO_H",
    label: "H：Material不足",
    description: "EquipmentとWorkerが利用可能でもMaterialがなければBLOCKEDです。",
    equipment: scenarioGEquipment,
    workers: scenarioGWorkers,
    priorities: [{ equipmentId: "EQUIPMENT_A", value: 1 }],
    assignments: [{ workerId: "WORKER_A", equipmentId: "EQUIPMENT_A" }],
    material: { EQUIPMENT_A: false }
  }),
  scenario({
    scenarioId: "SCENARIO_I",
    label: "I：Shift・Absence",
    description: "Assignment済みでもShift外・欠勤中のWorkerは候補から外れます。",
    equipment: scenarioIEquipment,
    workers: scenarioIWorkers,
    priorities: [
      { equipmentId: "EQUIPMENT_A", value: 1 },
      { equipmentId: "EQUIPMENT_B", value: 2 }
    ],
    assignments: [
      { workerId: "WORKER_E", equipmentId: "EQUIPMENT_A" },
      { workerId: "WORKER_C", equipmentId: "EQUIPMENT_B" }
    ],
    shifts: {
      WORKER_E: {
        startAt: "2026-07-27T08:00:00",
        endAt: "2026-07-27T09:00:00"
      }
    },
    absences: [{
      workerId: "WORKER_C",
      startAt: "2026-07-27T09:30:00",
      absenceId: "ABSENCE_C"
    }]
  })
];

export function findScenario(scenarioId) {
  return factoryAllocationScenarios.find(
    (item) => item.scenarioId === scenarioId
  );
}

export function findSkillName(skillId) {
  if (!skillId) return "一般作業";
  return skills.find((skill) => skill.skillId === skillId)?.name ?? skillId;
}
