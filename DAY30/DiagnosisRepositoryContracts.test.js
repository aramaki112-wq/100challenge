import test from "node:test";
import assert from "node:assert/strict";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";
import {
  PRODUCTION_PLAN_REPOSITORY_CONTRACT,
  assertRepositoryContract,
  assertProductionPlanRepository
} from "./DiagnosisRepositoryContracts.js";
import {
  InMemoryProductionPlanRepository
} from "./InMemoryDiagnosisRepositories.js";

test("正式InMemory RepositoryはProductionPlan契約を満たす", () => {
  const repository = new InMemoryProductionPlanRepository();
  assert.equal(assertProductionPlanRepository(repository), repository);
});

test("不足Methodを持つRepositoryを拒否する", () => {
  assert.throws(
    () => assertRepositoryContract({}, PRODUCTION_PLAN_REPOSITORY_CONTRACT),
    (error) =>
      hasErrorCode(error, ERROR_CODES.REPOSITORY_CONTRACT_VIOLATION) &&
      error.details.missingMethods.includes("save")
  );
});

test("null Repositoryを拒否する", () => {
  assert.throws(
    () => assertProductionPlanRepository(null),
    (error) => hasErrorCode(error, ERROR_CODES.INVALID_REPOSITORY)
  );
});
