import {
  Skill
} from "./Skill.js";
import {
  Worker
} from "./Worker.js";
import {
  Equipment
} from "./Equipment.js";
import {
  EVENT_TYPES
} from "./applyFactoryEvent.js";
import {
  createInitialFactoryState
} from "./FactoryState.js";

export const skills = [
  new Skill({ skillId: "OPERATOR", name: "オペレーター" }),
  new Skill({ skillId: "CRANE", name: "クレーン担当" }),
  new Skill({ skillId: "INSPECTOR", name: "検査担当" })
];

export const workers = [
  new Worker({ workerId: "WORKER_A", name: "Worker A", skillIds: ["OPERATOR"] }),
  new Worker({ workerId: "WORKER_B", name: "Worker B", skillIds: ["OPERATOR"] }),
  new Worker({ workerId: "WORKER_C", name: "Worker C", skillIds: ["CRANE"] }),
  new Worker({ workerId: "WORKER_D", name: "Worker D", skillIds: ["INSPECTOR"] }),
  new Worker({ workerId: "WORKER_E", name: "Worker E", skillIds: ["OPERATOR", "CRANE"] }),
  new Worker({ workerId: "WORKER_F", name: "Worker F", skillIds: ["CRANE", "INSPECTOR"] }),
  new Worker({ workerId: "WORKER_G", name: "Worker G", skillIds: [] })
];

export const equipment = [
  new Equipment({
    equipmentId: "EQUIPMENT_A",
    name: "Equipment A",
    requiredWorkerCount: 2,
    requiredSkillRequirements: [
      { skillId: "OPERATOR", requiredCount: 1 }
    ]
  }),
  new Equipment({
    equipmentId: "EQUIPMENT_B",
    name: "Equipment B",
    requiredWorkerCount: 2,
    requiredSkillRequirements: [
      { skillId: "OPERATOR", requiredCount: 1 },
      { skillId: "CRANE", requiredCount: 1 }
    ]
  }),
  new Equipment({
    equipmentId: "EQUIPMENT_C",
    name: "Equipment C",
    requiredWorkerCount: 3,
    requiredSkillRequirements: [
      { skillId: "OPERATOR", requiredCount: 1 },
      { skillId: "CRANE", requiredCount: 1 },
      { skillId: "INSPECTOR", requiredCount: 1 }
    ]
  })
];

export const initialFactoryState = {
  ...createInitialFactoryState(),
  wipByProcess: {
    PROCESS_A: 10,
    PROCESS_B: 0
  },
  completedBuffers: {
    PROCESS_A: 0
  }
};

function event(eventId, type, occurredAt, payload) {
  return { eventId, type, occurredAt, payload };
}

const shiftEvents = workers.map((worker, index) =>
  event(
    `EVT_SHIFT_${index + 1}`,
    EVENT_TYPES.WORKER_SHIFT_ASSIGNED,
    "2026-07-26T07:50:00",
    {
      workerId: worker.workerId,
      startAt: "2026-07-26T08:00:00",
      endAt: "2026-07-26T17:00:00"
    }
  )
);

export const sampleEvents = [
  ...shiftEvents,
  event("EVT_C_STATUS", EVENT_TYPES.EQUIPMENT_STATUS_CHANGED, "2026-07-26T07:55:00", {
    equipmentId: "EQUIPMENT_C",
    operable: true
  }),
  event("EVT_C_MATERIAL", EVENT_TYPES.MATERIAL_STATUS_CHANGED, "2026-07-26T07:56:00", {
    equipmentId: "EQUIPMENT_C",
    available: true
  }),
  event("EVT_C_A", EVENT_TYPES.WORKER_ASSIGNED_TO_EQUIPMENT, "2026-07-26T08:10:00", {
    workerId: "WORKER_A",
    equipmentId: "EQUIPMENT_C"
  }),
  event("EVT_C_B", EVENT_TYPES.WORKER_ASSIGNED_TO_EQUIPMENT, "2026-07-26T08:11:00", {
    workerId: "WORKER_B",
    equipmentId: "EQUIPMENT_C"
  }),
  event("EVT_C_C", EVENT_TYPES.WORKER_ASSIGNED_TO_EQUIPMENT, "2026-07-26T08:12:00", {
    workerId: "WORKER_C",
    equipmentId: "EQUIPMENT_C"
  }),
  event("EVT_C_D", EVENT_TYPES.WORKER_ASSIGNED_TO_EQUIPMENT, "2026-07-26T10:00:00", {
    workerId: "WORKER_D",
    equipmentId: "EQUIPMENT_C"
  }),
  event("EVT_C_ABSENCE", EVENT_TYPES.WORKER_ABSENCE_STARTED, "2026-07-26T11:00:00", {
    workerId: "WORKER_C",
    absenceId: "ABSENCE_C_1"
  }),
  event("EVT_C_F", EVENT_TYPES.WORKER_ASSIGNED_TO_EQUIPMENT, "2026-07-26T12:00:00", {
    workerId: "WORKER_F",
    equipmentId: "EQUIPMENT_C"
  }),
  event("EVT_B_STATUS", EVENT_TYPES.EQUIPMENT_STATUS_CHANGED, "2026-07-26T12:50:00", {
    equipmentId: "EQUIPMENT_B",
    operable: true
  }),
  event("EVT_B_MATERIAL", EVENT_TYPES.MATERIAL_STATUS_CHANGED, "2026-07-26T12:51:00", {
    equipmentId: "EQUIPMENT_B",
    available: true
  }),
  event("EVT_B_E", EVENT_TYPES.WORKER_ASSIGNED_TO_EQUIPMENT, "2026-07-26T13:00:00", {
    workerId: "WORKER_E",
    equipmentId: "EQUIPMENT_B"
  }),
  event("EVT_B_A", EVENT_TYPES.WORKER_ASSIGNED_TO_EQUIPMENT, "2026-07-26T14:00:00", {
    workerId: "WORKER_A",
    equipmentId: "EQUIPMENT_B"
  }),
  event("EVT_A_STATUS", EVENT_TYPES.EQUIPMENT_STATUS_CHANGED, "2026-07-26T14:50:00", {
    equipmentId: "EQUIPMENT_A",
    operable: true
  }),
  event("EVT_A_MATERIAL", EVENT_TYPES.MATERIAL_STATUS_CHANGED, "2026-07-26T14:51:00", {
    equipmentId: "EQUIPMENT_A",
    available: true
  }),
  event("EVT_A_A", EVENT_TYPES.WORKER_ASSIGNED_TO_EQUIPMENT, "2026-07-26T15:00:00", {
    workerId: "WORKER_A",
    equipmentId: "EQUIPMENT_A"
  }),
  event("EVT_A_G", EVENT_TYPES.WORKER_ASSIGNED_TO_EQUIPMENT, "2026-07-26T15:01:00", {
    workerId: "WORKER_G",
    equipmentId: "EQUIPMENT_A"
  })
];

export const scenarioTimes = [
  { label: "09:00 Skill不足", value: "2026-07-26T09:00" },
  { label: "10:00 Skill充足", value: "2026-07-26T10:00" },
  { label: "11:00 欠勤", value: "2026-07-26T11:00" },
  { label: "12:00 代替配置", value: "2026-07-26T12:00" },
  { label: "13:00 二重計上", value: "2026-07-26T13:00" },
  { label: "14:00 Backtracking", value: "2026-07-26T14:00" },
  { label: "15:01 一般補助", value: "2026-07-26T15:01" }
];

export function findSkillName(skillId) {
  return skills.find((skill) => skill.skillId === skillId)?.name ?? skillId;
}
