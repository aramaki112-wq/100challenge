import {
  ID_NAMESPACE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  assertCodeValue,
  assertNonNegativeInteger,
  assertPlainObject,
  assertPositiveInteger,
  createDomainError
} from "./DiagnosisErrors.js";

import {
  IdGenerator
} from "./IdGenerator.js";

export const DEFAULT_ID_PREFIXES = Object.freeze({
  [ID_NAMESPACE.PRODUCTION_PLAN]: "PLAN",
  [ID_NAMESPACE.PLAN_VERSION]: "PV",
  [ID_NAMESPACE.PLANNED_OPERATION]: "POP",
  [ID_NAMESPACE.ASSUMPTION]: "ASM",
  [ID_NAMESPACE.DIAGNOSIS_SCENARIO]: "DGS",
  [ID_NAMESPACE.IMPORT_BATCH]: "IMP",
  [ID_NAMESPACE.EVENT]: "EVT",
  [ID_NAMESPACE.CORRELATION]: "COR",
  [ID_NAMESPACE.CAPACITY_ALLOCATION]: "CAL",
  [ID_NAMESPACE.CONSTRAINT_FINDING]: "CF",
  [ID_NAMESPACE.ASSUMPTION_FINDING]: "AF",
  [ID_NAMESPACE.NEXT_CHECK]: "NC",
  [ID_NAMESPACE.OPERATION_DIAGNOSIS_RESULT]: "ODR",
  [ID_NAMESPACE.DIAGNOSIS_SUMMARY]: "DS",
  [ID_NAMESPACE.DIAGNOSIS_RESULT]: "DR"
});

const PREFIX_PATTERN = /^[A-Z][A-Z0-9]*$/;

function validatePrefixes(prefixes) {
  const validPrefixes = assertPlainObject(
    prefixes,
    ERROR_CODES.INVALID_PLAIN_OBJECT,
    "prefixes"
  );

  const normalized = {};
  const usedPrefixes = new Map();

  for (const namespace of Object.values(ID_NAMESPACE)) {
    const prefix = validPrefixes[namespace];

    if (
      typeof prefix !== "string" ||
      !PREFIX_PATTERN.test(prefix)
    ) {
      throw createDomainError(
        ERROR_CODES.INVALID_ID_PREFIX,
        `${namespace} prefix must contain uppercase letters and digits only.`,
        { namespace, prefix }
      );
    }

    if (usedPrefixes.has(prefix)) {
      throw createDomainError(
        ERROR_CODES.DUPLICATE_ID_PREFIX,
        "ID prefixes must be unique across namespaces.",
        {
          prefix,
          namespaces: [
            usedPrefixes.get(prefix),
            namespace
          ]
        }
      );
    }

    usedPrefixes.set(prefix, namespace);
    normalized[namespace] = prefix;
  }

  const unknownKeys = Object.keys(validPrefixes)
    .filter(
      (key) =>
        !Object.values(ID_NAMESPACE).includes(key)
    );

  if (unknownKeys.length > 0) {
    throw createDomainError(
      ERROR_CODES.INVALID_ID_NAMESPACE,
      "prefixes contains unknown ID namespaces.",
      { unknownKeys }
    );
  }

  return Object.freeze(normalized);
}

function createCounters(
  prefixes,
  initialCounters
) {
  const validInitialCounters = assertPlainObject(
    initialCounters,
    ERROR_CODES.INVALID_PLAIN_OBJECT,
    "initialCounters"
  );

  const unknownKeys = Object.keys(validInitialCounters)
    .filter((key) => !(key in prefixes));

  if (unknownKeys.length > 0) {
    throw createDomainError(
      ERROR_CODES.INVALID_ID_NAMESPACE,
      "initialCounters contains unknown ID namespaces.",
      { unknownKeys }
    );
  }

  const counters = new Map();

  for (const namespace of Object.keys(prefixes)) {
    const counter =
      validInitialCounters[namespace] ?? 0;

    counters.set(
      namespace,
      assertNonNegativeInteger(
        counter,
        ERROR_CODES.INVALID_ID_COUNTER,
        `initialCounters.${namespace}`
      )
    );
  }

  return counters;
}

/**
 * Test・Demo・再現可能なScenario向けの連番ID Generator。
 *
 * Browser再起動後も永続Entityへ使用する場合は、Repositoryに保存した
 * Counterまたは既存最大番号からinitialCountersを復元する必要がある。
 */
export class SequentialIdGenerator extends IdGenerator {
  #prefixes;
  #counters;
  #width;

  constructor({
    prefixes = DEFAULT_ID_PREFIXES,
    initialCounters = {},
    width = 4
  } = {}) {
    super();

    this.#prefixes = validatePrefixes(prefixes);
    this.#counters = createCounters(
      this.#prefixes,
      initialCounters
    );
    this.#width = assertPositiveInteger(
      width,
      ERROR_CODES.INVALID_ID_COUNTER,
      "width"
    );

    Object.freeze(this);
  }

  next(namespace) {
    const validNamespace =
      this.#assertNamespace(namespace);

    const nextCounter =
      this.#counters.get(validNamespace) + 1;

    this.#counters.set(
      validNamespace,
      nextCounter
    );

    return this.#format(
      validNamespace,
      nextCounter
    );
  }

  peek(namespace) {
    const validNamespace =
      this.#assertNamespace(namespace);

    return this.#format(
      validNamespace,
      this.#counters.get(validNamespace) + 1
    );
  }

  getCurrentCounter(namespace) {
    const validNamespace =
      this.#assertNamespace(namespace);

    return this.#counters.get(validNamespace);
  }

  toSnapshot() {
    const counters = {};

    for (const [namespace, counter]
      of this.#counters.entries()) {
      counters[namespace] = counter;
    }

    return Object.freeze({
      width: this.#width,
      counters: Object.freeze(counters)
    });
  }

  #assertNamespace(namespace) {
    const validNamespace = assertCodeValue(
      namespace,
      ID_NAMESPACE,
      ERROR_CODES.INVALID_ID_NAMESPACE,
      "namespace"
    );

    if (!(validNamespace in this.#prefixes)) {
      throw createDomainError(
        ERROR_CODES.INVALID_ID_NAMESPACE,
        "No prefix is configured for the ID namespace.",
        { namespace: validNamespace }
      );
    }

    return validNamespace;
  }

  #format(namespace, counter) {
    const prefix = this.#prefixes[namespace];
    const serial = String(counter)
      .padStart(this.#width, "0");

    return `${prefix}-${serial}`;
  }
}
