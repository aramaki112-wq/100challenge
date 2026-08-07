import test from "node:test";
import assert from "node:assert/strict";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";
import { ProductionPlan } from "./ProductionPlan.js";
import {
  InMemoryProductionPlanRepository
} from "./InMemoryDiagnosisRepositories.js";

function plan(planId = "PLAN-0001", overrides = {}) {
  return new ProductionPlan({
    planId,
    name: `Plan ${planId}`,
    targetMonth: "2026-08",
    primaryFactoryId: "F-01",
    createdAt: "2026-08-02T05:00:00+09:00",
    ...overrides
  });
}

test("add・find・get・exists・countが成立する", () => {
  const repository = new InMemoryProductionPlanRepository();
  const entity = plan();

  repository.add(entity);

  assert.equal(repository.findById(entity.planId), entity);
  assert.equal(repository.getById(entity.planId), entity);
  assert.equal(repository.existsById(entity.planId), true);
  assert.equal(repository.count(), 1);
  assert.equal(repository.revision, 1);
});

test("addは同一IDの二重登録を拒否する", () => {
  const repository = new InMemoryProductionPlanRepository();
  repository.add(plan());

  assert.throws(
    () => repository.add(plan()),
    (error) => hasErrorCode(error, ERROR_CODES.DUPLICATE_ENTITY)
  );
});

test("saveは同一IDを置換し同一InstanceならRevisionを増やさない", () => {
  const repository = new InMemoryProductionPlanRepository();
  const first = plan();
  const replacement = plan("PLAN-0001", { name: "Replacement" });

  repository.add(first);
  repository.save(replacement);
  assert.equal(repository.getById("PLAN-0001"), replacement);
  assert.equal(repository.revision, 2);

  repository.save(replacement);
  assert.equal(repository.revision, 2);
});

test("findAllはID順の変更不能配列を返す", () => {
  const repository = new InMemoryProductionPlanRepository();
  repository.add(plan("PLAN-0002"));
  repository.add(plan("PLAN-0001"));

  const all = repository.findAll();
  assert.deepEqual(all.map((item) => item.planId), ["PLAN-0001", "PLAN-0002"]);
  assert.equal(Object.isFrozen(all), true);
  assert.throws(() => all.push(plan("PLAN-0003")), TypeError);
});

test("addAllは途中失敗時に全件Rollbackする", () => {
  const repository = new InMemoryProductionPlanRepository();
  repository.add(plan("PLAN-0001"));
  const revision = repository.revision;

  assert.throws(
    () => repository.addAll([plan("PLAN-0002"), plan("PLAN-0001")]),
    (error) => hasErrorCode(error, ERROR_CODES.DUPLICATE_ENTITY)
  );

  assert.equal(repository.count(), 1);
  assert.equal(repository.existsById("PLAN-0002"), false);
  assert.equal(repository.revision, revision);
});

test("getByIdは未登録Entityを明示Errorにする", () => {
  const repository = new InMemoryProductionPlanRepository();
  assert.throws(
    () => repository.getById("PLAN-9999"),
    (error) => hasErrorCode(error, ERROR_CODES.ENTITY_NOT_FOUND)
  );
});

test("delete・clear・State復元がRevisionを含めて成立する", () => {
  const repository = new InMemoryProductionPlanRepository();
  repository.add(plan("PLAN-0001"));
  const saved = repository.captureState();

  repository.add(plan("PLAN-0002"));
  repository.deleteById("PLAN-0001");
  assert.equal(repository.count(), 1);

  repository.restoreState(saved);
  assert.equal(repository.count(), 1);
  assert.equal(repository.existsById("PLAN-0001"), true);
  assert.equal(repository.existsById("PLAN-0002"), false);
  assert.equal(repository.revision, 1);

  repository.clear();
  assert.equal(repository.count(), 0);
  assert.equal(repository.revision, 2);
});
