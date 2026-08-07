import { ApplicationError, ERROR_CODES } from "./errors.js";

export function assertScenarioRepository(repository) {
  const required = ["findAll", "findById", "save", "remove", "clear"];
  if (!repository || required.some((name) => typeof repository[name] !== "function")) {
    throw new ApplicationError(ERROR_CODES.REPOSITORY_CONTRACT_VIOLATION, "ScenarioRepository contract is not satisfied.", { required });
  }
  return repository;
}
