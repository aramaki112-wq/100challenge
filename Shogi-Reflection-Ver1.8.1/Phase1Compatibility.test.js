import test from "node:test";
import assert from "node:assert/strict";
import { REFLECTION_ERROR_CODES } from "./ReflectionErrors.js";

test("Phase1で公開済みのReflection Error Codeをすべて維持する", () => {
  assert.deepEqual(
    Object.keys(REFLECTION_ERROR_CODES),
    [
      "INVALID_REVIEW_ID",
      "INVALID_GAME_DATE",
      "INVALID_SIDE",
      "INVALID_RESULT",
      "INVALID_KIFU_TEXT",
      "INVALID_KEY_POSITION",
      "TOO_MANY_KEY_POSITIONS",
      "TOO_FEW_KEY_POSITIONS",
      "INVALID_OBSERVATION_THEME",
      "INVALID_ACTION_RULE",
      "TOO_MANY_ACTION_RULES"
    ]
  );
});
