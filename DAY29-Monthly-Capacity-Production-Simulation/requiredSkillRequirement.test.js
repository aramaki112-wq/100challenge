import { test, assertEqual, assertThrows } from "./testRunner.js";
import { ERROR_CODES } from "./errors.js";
import { RequiredSkillRequirement } from "./RequiredSkillRequirement.js";

export function registerRequiredSkillRequirementTests() {
  test("正常なRequiredSkillRequirementを生成できる", () => {
    const requirement = new RequiredSkillRequirement({
      skillId: " OPERATOR ",
      requiredCount: 1
    });
    assertEqual(requirement.skillId, "OPERATOR");
    assertEqual(requirement.requiredCount, 1);
  });

  test("requiredCountが0なら拒否する", () => {
    assertThrows(
      () => new RequiredSkillRequirement({
        skillId: "OPERATOR",
        requiredCount: 0
      }),
      ERROR_CODES.INVALID_REQUIRED_SKILL_COUNT
    );
  });

  test("requiredCountが小数なら拒否する", () => {
    assertThrows(
      () => new RequiredSkillRequirement({
        skillId: "OPERATOR",
        requiredCount: 1.5
      }),
      ERROR_CODES.INVALID_REQUIRED_SKILL_COUNT
    );
  });
}
