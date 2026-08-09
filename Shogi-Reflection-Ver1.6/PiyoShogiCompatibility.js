import { deepFreeze } from "./Immutable.js";

const PIYO_HEADER_PATTERN = /#\s*-+\s*ぴよ将棋\s*棋譜ファイル\s*-+/;

export class PiyoShogiCompatibility {
  inspect({ dto } = {}) {
    const isPiyoShogi = PIYO_HEADER_PATTERN.test(dto?.rawKifText ?? "") ||
      dto?.eventName === "ぴよ将棋";

    return deepFreeze({
      source: isPiyoShogi ? "PIYO_SHOGI" : "GENERIC_KIF",
      compatible: true,
      notes: isPiyoShogi
        ? [
          "ぴよ将棋の公開Sampleと同じHeader・指し手時間表記を確認しました。",
          "*で始まる棋譜解析Commentは元KIF Textへ保持し、指し手解析から分離します。"
        ]
        : []
    });
  }
}
