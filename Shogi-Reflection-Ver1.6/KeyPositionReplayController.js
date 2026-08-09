import { toKeyPositionReplayErrorViewModel } from "./KeyPositionReplayErrors.js";

export class KeyPositionReplayController {
  constructor({ addCurrentPosition, formView, replayController, viewModel } = {}) {
    this.addCurrentPosition = addCurrentPosition;
    this.formView = formView;
    this.replayController = replayController;
    this.viewModel = viewModel;
  }

  add({ sourceGameId, sourceKifText } = {}) {
    try {
      const result = this.addCurrentPosition.execute({
        replayState: this.replayController.getCurrentState(),
        existingKeyPositions: this.formView.readInput().keyPositions,
        sourceGameId,
        sourceKifText
      });
      const index = this.formView.addReplayCandidate(result.candidate);
      this.formView.focusKeyPosition(index);
      return Object.freeze({ ...result, index });
    } catch (error) {
      const viewError = toKeyPositionReplayErrorViewModel(error);
      const duplicateIndex = error?.context?.duplicateIndex;
      if (Number.isInteger(duplicateIndex)) this.formView.focusKeyPosition(duplicateIndex);
      return Object.freeze({ status: "REJECTED", error, viewError, duplicateIndex });
    }
  }

  preview(reference, options = {}) {
    return this.viewModel.create(reference.snapshot, options);
  }
}
