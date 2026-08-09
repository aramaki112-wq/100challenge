import { UsiEngineAdapter } from "./UsiEngineAdapter.js";

export class YaneuraOuEngineAdapter extends UsiEngineAdapter {
  constructor({ transport, engineVersion = "external", evaluationModel = "external", evaluationModelVersion = "external", timeoutMs } = {}) {
    super({
      transport,
      timeoutMs,
      engineInfo: {
        engineName: "YaneuraOu compatible USI Engine",
        engineVersion,
        evaluationModel,
        evaluationModelVersion,
        adapter: "YaneuraOuEngineAdapter"
      }
    });
  }
}
