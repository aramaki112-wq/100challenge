import { Day29Controller } from "./Day29Controller.js";
import { Day29View } from "./Day29View.js";
import { LocalStorageScenarioRepository } from "./LocalStorageScenarioRepository.js";
import { createSampleScenarios } from "./sampleDay29Data.js";

const repository = new LocalStorageScenarioRepository();
const view = new Day29View();
const controller = new Day29Controller({ repository, view, sampleScenarioFactory: createSampleScenarios });
controller.initialize();
