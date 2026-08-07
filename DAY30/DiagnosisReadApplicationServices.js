import { assertDiagnosisReadModel } from "./DiagnosisReadModel.js";

class ReadService {
  constructor({ diagnosisReadModel } = {}) {
    this.diagnosisReadModel = assertDiagnosisReadModel(diagnosisReadModel);
    Object.freeze(this);
  }
}

export class ListProductionPlanSummaries extends ReadService {
  execute(query = {}) { return this.diagnosisReadModel.listPlanSummaries(query); }
}

export class ListDiagnosisScenarioSummaries extends ReadService {
  execute(query = {}) { return this.diagnosisReadModel.listScenarioSummaries(query); }
}

export class GetLatestDiagnosisOverview extends ReadService {
  execute(query = {}) { return this.diagnosisReadModel.getLatestDiagnosisOverview(query); }
}

export class GetDiagnosisResultDetail extends ReadService {
  execute(query = {}) { return this.diagnosisReadModel.getDiagnosisResultDetail(query); }
}

export class ListDiagnosisActionItems extends ReadService {
  execute(query = {}) { return this.diagnosisReadModel.listActionItems(query); }
}

export class GetScenarioComparison extends ReadService {
  execute(query = {}) { return this.diagnosisReadModel.getScenarioComparison(query); }
}
