import {
  ApplicationError,
  ERROR_CATEGORY,
  ERROR_CODES,
  assertNonEmptyString,
  isApplicationError,
  wrapUnexpectedError
} from "./DiagnosisErrors.js";

/**
 * Entity・Result・Event IDを生成するPort。
 *
 * Domain Entity自身はIDの形式や採番方式を決定しない。
 */
export class IdGenerator {
  next(namespace) {
    throw new ApplicationError(
      ERROR_CODES.INVALID_ARGUMENT,
      "IdGenerator.next() must be implemented by a concrete IdGenerator.",
      {
        category: ERROR_CATEGORY.APPLICATION,
        details: {
          contract: "IdGenerator",
          method: "next",
          namespace
        }
      }
    );
  }
}

/**
 * IdGenerator Portの契約を検証する。
 *
 * @param {unknown} idGenerator
 * @returns {{ next: Function }}
 */
export function assertIdGenerator(idGenerator) {
  const validGenerator =
    idGenerator !== null &&
    (typeof idGenerator === "object" ||
      typeof idGenerator === "function") &&
    typeof idGenerator.next === "function";

  if (!validGenerator) {
    throw new ApplicationError(
      ERROR_CODES.INVALID_ARGUMENT,
      "idGenerator must implement next(namespace).",
      {
        category: ERROR_CATEGORY.APPLICATION,
        details: {
          contract: "IdGenerator",
          requiredMethod: "next"
        }
      }
    );
  }

  return idGenerator;
}

/**
 * GeneratorからIDを取得し、空文字や不正な空白を拒否する。
 *
 * @param {unknown} idGenerator
 * @param {string} namespace
 * @returns {string}
 */
export function generateId(
  idGenerator,
  namespace
) {
  const validGenerator =
    assertIdGenerator(idGenerator);

  const validNamespace =
    assertNonEmptyString(
      namespace,
      ERROR_CODES.INVALID_ID_NAMESPACE,
      "namespace"
    );

  let generatedId;

  try {
    generatedId =
      validGenerator.next(validNamespace);
  } catch (error) {
    if (isApplicationError(error)) {
      throw error;
    }

    throw wrapUnexpectedError(error, {
      component: "IdGenerator",
      operation: "next",
      namespace: validNamespace
    });
  }

  if (
    typeof generatedId !== "string" ||
    generatedId.trim() === "" ||
    generatedId !== generatedId.trim() ||
    /\s/.test(generatedId)
  ) {
    throw new ApplicationError(
      ERROR_CODES.INVALID_GENERATED_ID,
      "IdGenerator returned an invalid ID.",
      {
        category: ERROR_CATEGORY.APPLICATION,
        details: {
          namespace: validNamespace,
          generatedId
        }
      }
    );
  }

  return generatedId;
}
