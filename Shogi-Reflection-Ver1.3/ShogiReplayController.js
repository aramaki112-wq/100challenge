import {
  SHOGI_REPLAY_ERROR_CODES,
  ShogiReplayError,
  toReplayErrorViewModel
} from "./ShogiReplayErrors.js";

export class ShogiReplayController {
  constructor({
    parser,
    historyBuilder,
    replayService,
    viewModel,
    view
  } = {}) {
    this.parser = parser;
    this.historyBuilder = historyBuilder;
    this.replayService = replayService;
    this.viewModel = viewModel;
    this.view = view;
  }

  loadKifText(kifuText, { sourceFileName = "" } = {}) {
    const text = String(kifuText ?? "");
    if (!text.trim()) {
      const error = new ShogiReplayError(
        SHOGI_REPLAY_ERROR_CODES.SHOGI_REPLAY_NOT_AVAILABLE,
        "棋譜Textが空です。"
      );
      this.view.showUnavailable(error.userMessage);
      return Object.freeze({ status: "REJECTED", error });
    }

    try {
      const parsed = this.parser.parse({
        text,
        sourceFileName,
        byteLength: new TextEncoder().encode(text).byteLength,
        encoding: "BROWSER_TEXT",
        readerWarnings: []
      });
      return this.loadParsedKif(parsed);
    } catch (error) {
      const replayError = error instanceof ShogiReplayError
        ? error
        : new ShogiReplayError(
          SHOGI_REPLAY_ERROR_CODES.SHOGI_MOVE_PARSE_FAILED,
          error?.message ?? "KIF ParserでErrorが発生しました。",
          {
            moveNumber: error?.context?.moveNumber ?? null,
            moveText: error?.context?.notation ?? error?.context?.line ?? "",
            detail: {
              parserErrorCode: error?.code ?? error?.name ?? "UNKNOWN"
            },
            cause: error
          }
        );
      this.view.renderError(toReplayErrorViewModel(replayError));
      return Object.freeze({ status: "REJECTED", error: replayError });
    }
  }

  loadParsedKif(parsedKif) {
    const history = this.historyBuilder.build(parsedKif);
    if (history.positions.length === 0) {
      this.view.renderError(toReplayErrorViewModel(history.failure));
      return Object.freeze({
        status: "REJECTED",
        history,
        error: history.failure
      });
    }

    const state = this.replayService.load(history);
    const rendered = this.#render(state);
    return Object.freeze({ status: history.status, history, rendered });
  }

  first() {
    return this.#renderSafely(() => this.replayService.first());
  }

  previous() {
    return this.#renderSafely(() => this.replayService.previous());
  }

  next() {
    return this.#renderSafely(() => this.replayService.next());
  }

  last() {
    return this.#renderSafely(() => this.replayService.last());
  }

  jump(moveNumber) {
    return this.#renderSafely(() => this.replayService.jump(moveNumber));
  }

  toggleFlip() {
    return this.#renderSafely(() => this.replayService.toggleFlip());
  }

  getCurrentState() {
    return this.replayService.getState();
  }

  #renderSafely(action) {
    try {
      return this.#render(action());
    } catch (error) {
      this.view.renderError(toReplayErrorViewModel(error));
      return null;
    }
  }

  #render(state) {
    const model = this.viewModel.create(state);
    this.view.render(model);
    return model;
  }
}
