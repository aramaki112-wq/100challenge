import { SystemClock } from "./Clock.js";

export class ExportObservationCardAsMarkdown {
  constructor({ getGameReview, formatter, clock = new SystemClock() } = {}) {
    if (!getGameReview || typeof getGameReview.execute !== "function") throw new TypeError("getGameReviewを指定してください。");
    if (!formatter || typeof formatter.format !== "function") throw new TypeError("formatterを指定してください。");
    if (!clock || typeof clock.now !== "function") throw new TypeError("clockを指定してください。");
    this.getGameReview = getGameReview;
    this.formatter = formatter;
    this.clock = clock;
  }

  execute({ reviewId } = {}) {
    const found = this.getGameReview.execute({ reviewId });
    return this.formatter.format({ gameReview: found.gameReview, exportedAt: this.clock.now() });
  }
}
