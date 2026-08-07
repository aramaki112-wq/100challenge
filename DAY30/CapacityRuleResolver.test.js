import test from "node:test";
import assert from "node:assert/strict";

import {
  CAPACITY_RATE_BASIS,
  CAPACITY_RULE_RESOLUTION_STATUS,
  CAPACITY_RULE_SOURCE,
  QUANTITY_UNIT
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  PlannedOperation
} from "./PlannedOperation.js";

import {
  CapacityRuleResolver
} from "./CapacityRuleResolver.js";

const resolver = new CapacityRuleResolver();

function operation(overrides = {}) {
  return new PlannedOperation({
    plannedOperationId: "POP-0001",
    planVersionId: "PV-0001",
    orderId: "ORDER-001",
    routingOperationId: "ROUTE-010",
    equipmentId: "EQ-A",
    plannedDate: "2026-08-03",
    shiftId: "S1",
    plannedQuantity: 60,
    quantityUnit: QUANTITY_UNIT.PIECE,
    productGroup: "PIPE",
    materialGroup: "SUS304",
    ...overrides
  });
}

function rule(overrides = {}) {
  return {
    capacityRuleId: "CR-001",
    equipmentId: "EQ-A",
    source: CAPACITY_RULE_SOURCE.DEFAULT_RULE,
    active: true,
    priority: 100,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    capacityValue: 10,
    quantityUnit: QUANTITY_UNIT.PIECE,
    capacityBasis: CAPACITY_RATE_BASIS.HOUR,
    capacityMultiplier: 1,
    ...overrides
  };
}

function resolve(capacityRules, overrides = {}) {
  return resolver.resolve({
    plannedOperation: operation(),
    equipment: { equipmentId: "EQ-A" },
    capacityRules,
    ...overrides
  });
}

test("Operation Overrideを他のRuleより優先する", () => {
  const result = resolve([
    rule({ capacityRuleId: "CR-DEFAULT" }),
    rule({
      capacityRuleId: "CR-ORDER",
      source: CAPACITY_RULE_SOURCE.ORDER_ATTRIBUTE,
      productGroup: "PIPE",
      priority: 1
    }),
    rule({
      capacityRuleId: "CR-OVERRIDE",
      source: CAPACITY_RULE_SOURCE.OPERATION_OVERRIDE,
      plannedOperationId: "POP-0001",
      priority: 100
    })
  ]);

  assert.equal(result.status, CAPACITY_RULE_RESOLUTION_STATUS.RESOLVED);
  assert.equal(result.capacityRule.capacityRuleId, "CR-OVERRIDE");
  assert.equal(result.source, CAPACITY_RULE_SOURCE.OPERATION_OVERRIDE);
});

test("Order Attribute RuleをDefault Ruleより優先する", () => {
  const result = resolve([
    rule({ capacityRuleId: "CR-DEFAULT" }),
    rule({
      capacityRuleId: "CR-ORDER",
      source: CAPACITY_RULE_SOURCE.ORDER_ATTRIBUTE,
      materialGroup: "SUS304"
    })
  ]);

  assert.equal(result.capacityRule.capacityRuleId, "CR-ORDER");
});

test("条件数が多いRuleを優先する", () => {
  const result = resolve([
    rule({
      capacityRuleId: "CR-ONE",
      source: CAPACITY_RULE_SOURCE.ORDER_ATTRIBUTE,
      productGroup: "PIPE"
    }),
    rule({
      capacityRuleId: "CR-TWO",
      source: CAPACITY_RULE_SOURCE.ORDER_ATTRIBUTE,
      productGroup: "PIPE",
      materialGroup: "SUS304"
    })
  ]);

  assert.equal(result.capacityRule.capacityRuleId, "CR-TWO");
});

test("同じ具体性ではpriorityが小さいRuleを優先する", () => {
  const result = resolve([
    rule({
      capacityRuleId: "CR-LOW",
      source: CAPACITY_RULE_SOURCE.ORDER_ATTRIBUTE,
      productGroup: "PIPE",
      priority: 20
    }),
    rule({
      capacityRuleId: "CR-HIGH",
      source: CAPACITY_RULE_SOURCE.ORDER_ATTRIBUTE,
      productGroup: "PIPE",
      priority: 10
    })
  ]);

  assert.equal(result.capacityRule.capacityRuleId, "CR-HIGH");
});

test("Operationにない属性はOrder情報から補完して照合する", () => {
  const result = resolver.resolve({
    plannedOperation: operation({ materialGroup: null }),
    equipment: { equipmentId: "EQ-A" },
    order: {
      orderId: "ORDER-001",
      materialGroup: "SUS316L"
    },
    capacityRules: [
      rule({
        capacityRuleId: "CR-ORDER",
        source: CAPACITY_RULE_SOURCE.ORDER_ATTRIBUTE,
        materialGroup: "SUS316L"
      })
    ]
  });

  assert.equal(result.status, CAPACITY_RULE_RESOLUTION_STATUS.RESOLVED);
});

test("Inactive・期間外・別設備Ruleを候補から除外する", () => {
  const result = resolve([
    rule({ capacityRuleId: "CR-INACTIVE", active: false }),
    rule({
      capacityRuleId: "CR-OLD",
      validTo: "2026-07-31"
    }),
    rule({ capacityRuleId: "CR-OTHER", equipmentId: "EQ-B" })
  ]);

  assert.equal(result.status, CAPACITY_RULE_RESOLUTION_STATUS.NOT_FOUND);
  assert.equal(result.source, CAPACITY_RULE_SOURCE.NOT_FOUND);
  assert.equal(result.capacityRule, null);
});

test("条件不一致の場合はNOT_FOUNDにする", () => {
  const result = resolve([
    rule({
      capacityRuleId: "CR-OTHER-MATERIAL",
      source: CAPACITY_RULE_SOURCE.ORDER_ATTRIBUTE,
      materialGroup: "SUS316L"
    })
  ]);

  assert.equal(result.status, CAPACITY_RULE_RESOLUTION_STATUS.NOT_FOUND);
});

test("同一Source・具体性・priorityのRuleはCONFLICTにする", () => {
  const result = resolve([
    rule({
      capacityRuleId: "CR-A",
      source: CAPACITY_RULE_SOURCE.ORDER_ATTRIBUTE,
      productGroup: "PIPE",
      priority: 10
    }),
    rule({
      capacityRuleId: "CR-B",
      source: CAPACITY_RULE_SOURCE.ORDER_ATTRIBUTE,
      productGroup: "PIPE",
      priority: 10
    })
  ]);

  assert.equal(result.status, CAPACITY_RULE_RESOLUTION_STATUS.CONFLICT);
  assert.equal(result.source, CAPACITY_RULE_SOURCE.CONFLICT);
  assert.equal(result.capacityRule, null);
  assert.deepEqual(
    result.candidates.map((candidate) => candidate.capacityRuleId),
    ["CR-A", "CR-B"]
  );
});

test("Default Ruleへ条件を設定した場合は拒否する", () => {
  assert.throws(
    () => resolve([
      rule({ productGroup: "PIPE" })
    ]),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.INVALID_CAPACITY_RULE
    )
  );
});

test("Resolverへ渡すEquipmentがOperationと異なる場合は拒否する", () => {
  assert.throws(
    () => resolver.resolve({
      plannedOperation: operation(),
      equipment: { equipmentId: "EQ-B" },
      capacityRules: []
    }),
    (error) => hasErrorCode(
      error,
      ERROR_CODES.DIAGNOSIS_SOURCE_INCONSISTENT
    )
  );
});

test("解決結果とRule候補は外部から変更できない", () => {
  const result = resolve([rule()]);

  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.capacityRule), true);
  assert.equal(Object.isFrozen(result.candidates), true);
  assert.throws(() => {
    result.capacityRule.capacityValue = 999;
  }, TypeError);
});
