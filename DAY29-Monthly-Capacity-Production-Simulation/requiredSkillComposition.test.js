import { test, assertEqual, assertThrows } from "./testRunner.js";
import { ERROR_CODES } from "./errors.js";
import { RequiredSkillComposition } from "./RequiredSkillComposition.js";

export function registerRequiredSkillCompositionTests() {
  test("Role Slot合計を計算できる", () => {
    const composition = new RequiredSkillComposition([
      { skillId: "OPERATOR", requiredCount: 1 },
      { skillId: "CRANE", requiredCount: 2 }
    ]);
    assertEqual(composition.getRequiredRoleSlotCount(), 3);
  });

  test("同じSkill IDの重複を拒否する", () => {
    assertThrows(
      () => new RequiredSkillComposition([
        { skillId: "OPERATOR", requiredCount: 1 },
        { skillId: "OPERATOR", requiredCount: 2 }
      ]),
      ERROR_CODES.DUPLICATE_REQUIRED_SKILL
    );
  });

  test("未設定は空Compositionとして扱う", () => {
    const composition = new RequiredSkillComposition();
    assertEqual(composition.isEmpty(), true);
  });
}
