import {
  ERROR_CODES,
  createRepositoryError
} from "./DiagnosisErrors.js";

const BASE_METHODS = Object.freeze([
  "add",
  "addAll",
  "save",
  "findById",
  "getById",
  "existsById",
  "findAll",
  "deleteById",
  "count",
  "clear"
]);

function createContract(name, extraMethods = []) {
  return Object.freeze({
    name,
    methods: Object.freeze([...BASE_METHODS, ...extraMethods])
  });
}

export const PRODUCTION_PLAN_REPOSITORY_CONTRACT = createContract(
  "ProductionPlanRepository",
  ["findByTargetMonth", "findByPrimaryFactoryId", "findActive"]
);

export const PRODUCTION_PLAN_VERSION_REPOSITORY_CONTRACT = createContract(
  "ProductionPlanVersionRepository",
  ["findByPlanId", "findByStatus", "findLatestByPlanId"]
);

export const PLANNED_OPERATION_REPOSITORY_CONTRACT = createContract(
  "PlannedOperationRepository",
  ["findByPlanVersionId", "findByOrderId", "findByEquipmentAndDate"]
);

export const ASSUMPTION_REPOSITORY_CONTRACT = createContract(
  "AssumptionRepository",
  ["findByTarget", "findByStatus", "findBlocking"]
);

export const DIAGNOSIS_SCENARIO_REPOSITORY_CONTRACT = createContract(
  "DiagnosisScenarioRepository",
  ["findByPlanVersionId", "findActiveByPlanVersionId"]
);

export const SCENARIO_ASSUMPTION_RELATION_REPOSITORY_CONTRACT = createContract(
  "ScenarioAssumptionRelationRepository",
  ["findByScenarioId", "findByAssumptionId", "findActiveByScenarioId"]
);

export const DIAGNOSIS_RESULT_REPOSITORY_CONTRACT = createContract(
  "DiagnosisResultRepository",
  ["findByScenarioId", "findByPlanVersionId", "findLatestByScenarioId"]
);

export const REPOSITORY_CONTRACTS = Object.freeze({
  PRODUCTION_PLAN_REPOSITORY_CONTRACT,
  PRODUCTION_PLAN_VERSION_REPOSITORY_CONTRACT,
  PLANNED_OPERATION_REPOSITORY_CONTRACT,
  ASSUMPTION_REPOSITORY_CONTRACT,
  DIAGNOSIS_SCENARIO_REPOSITORY_CONTRACT,
  SCENARIO_ASSUMPTION_RELATION_REPOSITORY_CONTRACT,
  DIAGNOSIS_RESULT_REPOSITORY_CONTRACT
});

export function assertRepositoryContract(repository, contract) {
  if (repository === null || typeof repository !== "object") {
    throw createRepositoryError(
      ERROR_CODES.INVALID_REPOSITORY,
      `${contract?.name ?? "Repository"} must be an object.`,
      { repository, contractName: contract?.name ?? null }
    );
  }

  if (
    contract === null ||
    typeof contract !== "object" ||
    !Array.isArray(contract.methods)
  ) {
    throw createRepositoryError(
      ERROR_CODES.REPOSITORY_CONTRACT_VIOLATION,
      "contract must define a methods array.",
      { contract }
    );
  }

  const missingMethods = contract.methods.filter(
    (methodName) => typeof repository[methodName] !== "function"
  );

  if (missingMethods.length > 0) {
    throw createRepositoryError(
      ERROR_CODES.REPOSITORY_CONTRACT_VIOLATION,
      `${contract.name} contract is not satisfied.`,
      {
        contractName: contract.name,
        missingMethods
      }
    );
  }

  return repository;
}

export function assertProductionPlanRepository(repository) {
  return assertRepositoryContract(
    repository,
    PRODUCTION_PLAN_REPOSITORY_CONTRACT
  );
}

export function assertProductionPlanVersionRepository(repository) {
  return assertRepositoryContract(
    repository,
    PRODUCTION_PLAN_VERSION_REPOSITORY_CONTRACT
  );
}

export function assertPlannedOperationRepository(repository) {
  return assertRepositoryContract(
    repository,
    PLANNED_OPERATION_REPOSITORY_CONTRACT
  );
}

export function assertAssumptionRepository(repository) {
  return assertRepositoryContract(
    repository,
    ASSUMPTION_REPOSITORY_CONTRACT
  );
}

export function assertDiagnosisScenarioRepository(repository) {
  return assertRepositoryContract(
    repository,
    DIAGNOSIS_SCENARIO_REPOSITORY_CONTRACT
  );
}

export function assertScenarioAssumptionRelationRepository(repository) {
  return assertRepositoryContract(
    repository,
    SCENARIO_ASSUMPTION_RELATION_REPOSITORY_CONTRACT
  );
}

export function assertDiagnosisResultRepository(repository) {
  return assertRepositoryContract(
    repository,
    DIAGNOSIS_RESULT_REPOSITORY_CONTRACT
  );
}
