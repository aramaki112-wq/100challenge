import test from "node:test";
import assert from "node:assert/strict";

import { PLAN_VERSION_STATUS } from "./DiagnosisCodes.js";
import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";
import { ProductionPlan } from "./ProductionPlan.js";
import { ProductionPlanVersion } from "./ProductionPlanVersion.js";
import {
  createInMemoryDiagnosisRepositories
} from "./InMemoryDiagnosisRepositories.js";
import {
  InMemoryRepositoryTransactionManager,
  assertInMemoryRepositoryTransactionManager
} from "./InMemoryRepositoryTransactionManager.js";

function plan() {
  return new ProductionPlan({
    planId: "PLAN-0001",
    name: "August Plan",
    targetMonth: "2026-08",
    primaryFactoryId: "F-01",
    createdAt: "2026-08-02T05:00:00+09:00"
  });
}

function version() {
  return new ProductionPlanVersion({
    planVersionId: "PV-0001",
    planId: "PLAN-0001",
    versionNumber: 1,
    versionName: "Version 1",
    status: PLAN_VERSION_STATUS.DRAFT,
    createdAt: "2026-08-02T05:05:00+09:00"
  });
}

test("複数RepositoryへのwriteをCommitする", async () => {
  const repositories = createInMemoryDiagnosisRepositories();
  const manager = new InMemoryRepositoryTransactionManager({ repositories });

  const result = await manager.execute(async (repos) => {
    repos.productionPlans.add(plan());
    repos.planVersions.add(version());
    return "committed";
  });

  assert.equal(result, "committed");
  assert.equal(repositories.productionPlans.count(), 1);
  assert.equal(repositories.planVersions.count(), 1);
  assert.equal(manager.active, false);
});

test("途中Error時は全RepositoryとRevisionをRollbackする", async () => {
  const repositories = createInMemoryDiagnosisRepositories();
  const manager = new InMemoryRepositoryTransactionManager({ repositories });

  await assert.rejects(
    manager.execute(async (repos) => {
      repos.productionPlans.add(plan());
      repos.planVersions.add(version());
      throw new Error("stop");
    }),
    /stop/
  );

  assert.equal(repositories.productionPlans.count(), 0);
  assert.equal(repositories.planVersions.count(), 0);
  assert.equal(repositories.productionPlans.revision, 0);
  assert.equal(repositories.planVersions.revision, 0);
  assert.equal(manager.active, false);
});

test("Repositoryが投げた重複Errorでも全体をRollbackする", async () => {
  const repositories = createInMemoryDiagnosisRepositories();
  const manager = new InMemoryRepositoryTransactionManager({ repositories });

  await assert.rejects(
    manager.execute(async (repos) => {
      repos.productionPlans.add(plan());
      repos.productionPlans.add(plan());
    }),
    (error) => hasErrorCode(error, ERROR_CODES.DUPLICATE_ENTITY)
  );

  assert.equal(repositories.productionPlans.count(), 0);
});

test("Nested Transactionを拒否して外側もRollbackする", async () => {
  const repositories = createInMemoryDiagnosisRepositories();
  const manager = new InMemoryRepositoryTransactionManager({ repositories });

  await assert.rejects(
    manager.execute(async (repos) => {
      repos.productionPlans.add(plan());
      await manager.execute(async () => {});
    }),
    (error) => hasErrorCode(error, ERROR_CODES.TRANSACTION_ALREADY_ACTIVE)
  );

  assert.equal(repositories.productionPlans.count(), 0);
  assert.equal(manager.active, false);
});

test("不正なManager設定とassertを拒否する", () => {
  assert.throws(
    () => new InMemoryRepositoryTransactionManager({ repositories: {} }),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_TRANSACTION_MANAGER)
  );
  assert.throws(
    () => assertInMemoryRepositoryTransactionManager({}),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_TRANSACTION_MANAGER)
  );
});
