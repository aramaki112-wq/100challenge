import {
  ERROR_CODES,
  createRepositoryError
} from "./DiagnosisErrors.js";
import { assertProductionPlan } from "./ProductionPlan.js";
import { assertProductionPlanVersion } from "./ProductionPlanVersion.js";
import { assertPlannedOperation } from "./PlannedOperation.js";
import { assertAssumption } from "./Assumption.js";
import { assertDiagnosisScenario } from "./DiagnosisScenario.js";
import { assertScenarioAssumptionRelation } from "./ScenarioAssumptionRelation.js";
import { assertDiagnosisResult } from "./DiagnosisResult.js";
import { InMemoryEntityRepository } from "./InMemoryEntityRepository.js";

function assertNoDuplicateBy(items, predicate, entityName, details) {
  if (items.some(predicate)) {
    throw createRepositoryError(
      ERROR_CODES.DUPLICATE_UNIQUE_KEY,
      `${entityName} violates a repository unique constraint.`,
      details
    );
  }
}

export class InMemoryProductionPlanRepository extends InMemoryEntityRepository {
  constructor() {
    super({
      entityName: "ProductionPlan",
      idSelector: (entity) => entity.planId,
      assertEntity: assertProductionPlan
    });
  }

  findByTargetMonth(targetMonth) {
    return this.filter((plan) => plan.targetMonth === targetMonth);
  }

  findByPrimaryFactoryId(primaryFactoryId) {
    return this.filter(
      (plan) => plan.primaryFactoryId === primaryFactoryId
    );
  }

  findActive() {
    return this.filter((plan) => plan.active);
  }
}

export class InMemoryProductionPlanVersionRepository extends InMemoryEntityRepository {
  constructor() {
    super({
      entityName: "ProductionPlanVersion",
      idSelector: (entity) => entity.planVersionId,
      assertEntity: assertProductionPlanVersion
    });
  }

  assertUniqueConstraints(entity, replacingId) {
    assertNoDuplicateBy(
      this.findAll(),
      (candidate) =>
        candidate.planVersionId !== replacingId &&
        candidate.planId === entity.planId &&
        candidate.versionNumber === entity.versionNumber,
      "ProductionPlanVersion",
      {
        planId: entity.planId,
        versionNumber: entity.versionNumber
      }
    );
  }

  findByPlanId(planId) {
    return Object.freeze(
      [...this.filter((version) => version.planId === planId)].sort(
        (left, right) => left.versionNumber - right.versionNumber
      )
    );
  }

  findByStatus(status) {
    return this.filter((version) => version.status === status);
  }

  findLatestByPlanId(planId) {
    const versions = this.findByPlanId(planId);
    return versions.length === 0 ? null : versions.at(-1);
  }
}

export class InMemoryPlannedOperationRepository extends InMemoryEntityRepository {
  constructor() {
    super({
      entityName: "PlannedOperation",
      idSelector: (entity) => entity.plannedOperationId,
      assertEntity: assertPlannedOperation
    });
  }

  findByPlanVersionId(planVersionId) {
    return this.filter(
      (operation) => operation.planVersionId === planVersionId
    );
  }

  findByOrderId(orderId) {
    return this.filter((operation) => operation.orderId === orderId);
  }

  findByEquipmentAndDate(equipmentId, plannedDate) {
    return this.filter(
      (operation) =>
        operation.equipmentId === equipmentId &&
        operation.plannedDate === plannedDate
    );
  }
}

export class InMemoryAssumptionRepository extends InMemoryEntityRepository {
  constructor() {
    super({
      entityName: "Assumption",
      idSelector: (entity) => entity.assumptionId,
      assertEntity: assertAssumption
    });
  }

  findByTarget(targetType, targetId) {
    return this.filter(
      (assumption) =>
        assumption.targetType === targetType &&
        assumption.targetId === targetId
    );
  }

  findByStatus(status) {
    return this.filter((assumption) => assumption.status === status);
  }

  findBlocking() {
    return this.filter((assumption) => assumption.blocking);
  }
}

export class InMemoryDiagnosisScenarioRepository extends InMemoryEntityRepository {
  constructor() {
    super({
      entityName: "DiagnosisScenario",
      idSelector: (entity) => entity.diagnosisScenarioId,
      assertEntity: assertDiagnosisScenario
    });
  }

  findByPlanVersionId(planVersionId) {
    return this.filter(
      (scenario) => scenario.planVersionId === planVersionId
    );
  }

  findActiveByPlanVersionId(planVersionId) {
    return this.filter(
      (scenario) =>
        scenario.planVersionId === planVersionId && scenario.active
    );
  }
}

export class InMemoryScenarioAssumptionRelationRepository extends InMemoryEntityRepository {
  constructor() {
    super({
      entityName: "ScenarioAssumptionRelation",
      idSelector: (entity) => entity.relationId,
      assertEntity: assertScenarioAssumptionRelation
    });
  }

  assertUniqueConstraints(entity, replacingId) {
    assertNoDuplicateBy(
      this.findAll(),
      (candidate) =>
        candidate.relationId !== replacingId &&
        candidate.diagnosisScenarioId === entity.diagnosisScenarioId &&
        candidate.assumptionId === entity.assumptionId,
      "ScenarioAssumptionRelation",
      {
        diagnosisScenarioId: entity.diagnosisScenarioId,
        assumptionId: entity.assumptionId
      }
    );
  }

  findByScenarioId(diagnosisScenarioId) {
    return this.filter(
      (relation) => relation.diagnosisScenarioId === diagnosisScenarioId
    );
  }

  findByAssumptionId(assumptionId) {
    return this.filter(
      (relation) => relation.assumptionId === assumptionId
    );
  }

  findActiveByScenarioId(diagnosisScenarioId) {
    return this.filter(
      (relation) =>
        relation.diagnosisScenarioId === diagnosisScenarioId &&
        relation.active
    );
  }
}

export class InMemoryDiagnosisResultRepository extends InMemoryEntityRepository {
  constructor() {
    super({
      entityName: "DiagnosisResult",
      idSelector: (entity) => entity.diagnosisResultId,
      assertEntity: assertDiagnosisResult
    });
  }

  findByScenarioId(diagnosisScenarioId) {
    return Object.freeze(
      [...this.filter(
        (result) => result.diagnosisScenarioId === diagnosisScenarioId
      )].sort((left, right) =>
        left.diagnosedAt.localeCompare(right.diagnosedAt)
      )
    );
  }

  findByPlanVersionId(planVersionId) {
    return Object.freeze(
      [...this.filter(
        (result) => result.planVersionId === planVersionId
      )].sort((left, right) =>
        left.diagnosedAt.localeCompare(right.diagnosedAt)
      )
    );
  }

  findLatestByScenarioId(diagnosisScenarioId) {
    const results = this.findByScenarioId(diagnosisScenarioId);
    return results.length === 0 ? null : results.at(-1);
  }
}

export function createInMemoryDiagnosisRepositories() {
  return Object.freeze({
    productionPlans: new InMemoryProductionPlanRepository(),
    planVersions: new InMemoryProductionPlanVersionRepository(),
    plannedOperations: new InMemoryPlannedOperationRepository(),
    assumptions: new InMemoryAssumptionRepository(),
    diagnosisScenarios: new InMemoryDiagnosisScenarioRepository(),
    scenarioAssumptionRelations:
      new InMemoryScenarioAssumptionRelationRepository(),
    diagnosisResults: new InMemoryDiagnosisResultRepository()
  });
}
