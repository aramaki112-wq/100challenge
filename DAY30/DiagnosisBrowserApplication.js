import { RepositoryDiagnosisReadModel } from "./RepositoryDiagnosisReadModel.js";
import {
  ListProductionPlanSummaries,
  ListDiagnosisScenarioSummaries,
  GetLatestDiagnosisOverview,
  GetDiagnosisResultDetail,
  ListDiagnosisActionItems,
  GetScenarioComparison
} from "./DiagnosisReadApplicationServices.js";
import { DiagnosisDashboardViewModel } from "./DiagnosisDashboardViewModel.js";
import { DiagnosisBrowserController } from "./DiagnosisBrowserController.js";
import { DiagnosisDashboardDomRenderer } from "./DiagnosisDashboardDomRenderer.js";
import { PlannedOperationCsvImportController } from "./PlannedOperationCsvImportController.js";
import { EntityCsvImportController } from "./EntityCsvImportController.js";
import { DiagnosisBackupController } from "./DiagnosisBackupController.js";
import {
  ERROR_CODES,
  createApplicationError
} from "./DiagnosisErrors.js";

function assertServicePair(preview, commit, label) {
  const hasPreview = preview !== null;
  const hasCommit = commit !== null;
  if (hasPreview !== hasCommit) {
    throw createApplicationError(
      ERROR_CODES.INVALID_ENTITY_CSV_IMPORT_CONTROLLER,
      `${label} CSV Import Preview and Commit services must be provided together.`,
      { label, hasPreview, hasCommit }
    );
  }
  return hasPreview;
}

export function createDiagnosisBrowserApplication({
  document,
  repositories,
  runPlanDiagnosis,
  previewPlannedOperationCsvImport = null,
  commitPlannedOperationCsvImport = null,
  previewAssumptionCsvImport = null,
  commitAssumptionCsvImport = null,
  previewDiagnosisScenarioCsvImport = null,
  commitDiagnosisScenarioCsvImport = null,
  previewScenarioAssumptionRelationCsvImport = null,
  commitScenarioAssumptionRelationCsvImport = null,
  executionDataImportController = null,
  persistenceCoordinator = null,
  rootSelector = "#app"
} = {}) {
  const hasPlannedOperationImport = assertServicePair(
    previewPlannedOperationCsvImport,
    commitPlannedOperationCsvImport,
    "Planned Operation"
  );
  const hasAssumptionImport = assertServicePair(
    previewAssumptionCsvImport,
    commitAssumptionCsvImport,
    "Assumption"
  );
  const hasDiagnosisScenarioImport = assertServicePair(
    previewDiagnosisScenarioCsvImport,
    commitDiagnosisScenarioCsvImport,
    "Diagnosis Scenario"
  );
  const hasScenarioAssumptionRelationImport = assertServicePair(
    previewScenarioAssumptionRelationCsvImport,
    commitScenarioAssumptionRelationCsvImport,
    "Scenario–Assumption Relation"
  );

  const diagnosisReadModel = new RepositoryDiagnosisReadModel({ repositories });
  const dashboardViewModel = new DiagnosisDashboardViewModel();
  const controller = new DiagnosisBrowserController({
    dashboardViewModel,
    listProductionPlanSummaries: new ListProductionPlanSummaries({ diagnosisReadModel }),
    listDiagnosisScenarioSummaries: new ListDiagnosisScenarioSummaries({ diagnosisReadModel }),
    getLatestDiagnosisOverview: new GetLatestDiagnosisOverview({ diagnosisReadModel }),
    getDiagnosisResultDetail: new GetDiagnosisResultDetail({ diagnosisReadModel }),
    listDiagnosisActionItems: new ListDiagnosisActionItems({ diagnosisReadModel }),
    getScenarioComparison: new GetScenarioComparison({ diagnosisReadModel }),
    runPlanDiagnosis
  });

  const importController = hasPlannedOperationImport
    ? new PlannedOperationCsvImportController({
        previewPlannedOperationCsvImport,
        commitPlannedOperationCsvImport
      })
    : null;
  const assumptionImportController = hasAssumptionImport
    ? new EntityCsvImportController({
        importType: "ASSUMPTION",
        previewService: previewAssumptionCsvImport,
        commitService: commitAssumptionCsvImport,
        idleMessage: "Assumption CSVを選択すると、保存前のPreviewを表示します。"
      })
    : null;
  const diagnosisScenarioImportController = hasDiagnosisScenarioImport
    ? new EntityCsvImportController({
        importType: "DIAGNOSIS_SCENARIO",
        previewService: previewDiagnosisScenarioCsvImport,
        commitService: commitDiagnosisScenarioCsvImport,
        idleMessage: "Diagnosis Scenario CSVを選択すると、保存前のPreviewを表示します。"
      })
    : null;
  const scenarioAssumptionRelationImportController = hasScenarioAssumptionRelationImport
    ? new EntityCsvImportController({
        importType: "SCENARIO_ASSUMPTION_RELATION",
        previewService: previewScenarioAssumptionRelationCsvImport,
        commitService: commitScenarioAssumptionRelationCsvImport,
        idleMessage: "Scenario–Assumption Relation CSVを選択すると、保存前のPreviewを表示します。"
      })
    : null;
  const backupController = persistenceCoordinator === null
    ? null
    : new DiagnosisBackupController({ persistenceCoordinator });

  const renderer = new DiagnosisDashboardDomRenderer({
    document,
    controller,
    importController,
    assumptionImportController,
    diagnosisScenarioImportController,
    scenarioAssumptionRelationImportController,
    executionDataImportController,
    backupController,
    rootSelector
  });

  return Object.freeze({
    diagnosisReadModel,
    dashboardViewModel,
    controller,
    importController,
    assumptionImportController,
    diagnosisScenarioImportController,
    scenarioAssumptionRelationImportController,
    executionDataImportController,
    backupController,
    renderer,
    start(filters = {}) {
      backupController?.restoreOnStart();
      return renderer.start(filters);
    }
  });
}
