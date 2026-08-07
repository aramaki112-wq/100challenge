import test from "node:test";
import assert from "node:assert/strict";

import {
  ID_NAMESPACE
} from "./DiagnosisCodes.js";

import {
  ERROR_CODES,
  hasErrorCode
} from "./DiagnosisErrors.js";

import {
  IdGenerator,
  assertIdGenerator,
  generateId
} from "./IdGenerator.js";

import {
  DEFAULT_ID_PREFIXES,
  SequentialIdGenerator
} from "./SequentialIdGenerator.js";

test(
  "IdGenerator基底Classはnext未実装を明示的に拒否する",
  () => {
    const generator = new IdGenerator();

    assert.throws(
      () => generator.next(
        ID_NAMESPACE.PLANNED_OPERATION
      ),
      (error) =>
        hasErrorCode(
          error,
          ERROR_CODES.INVALID_ARGUMENT
        )
    );
  }
);

test(
  "assertIdGeneratorはnext Methodを持つGeneratorを受け付ける",
  () => {
    const generator =
      new SequentialIdGenerator();

    assert.equal(
      assertIdGenerator(generator),
      generator
    );
  }
);

test(
  "assertIdGeneratorは契約を満たさない値を拒否する",
  () => {
    for (const value of [
      null,
      {},
      { next: "not-function" }
    ]) {
      assert.throws(
        () => assertIdGenerator(value),
        (error) =>
          hasErrorCode(
            error,
            ERROR_CODES.INVALID_ARGUMENT
          )
      );
    }
  }
);

test(
  "SequentialIdGeneratorはNamespace別の正式Prefixで連番IDを生成する",
  () => {
    const generator =
      new SequentialIdGenerator();

    assert.equal(
      generator.next(
        ID_NAMESPACE.PLANNED_OPERATION
      ),
      "POP-0001"
    );

    assert.equal(
      generator.next(
        ID_NAMESPACE.PLANNED_OPERATION
      ),
      "POP-0002"
    );

    assert.equal(
      generator.next(
        ID_NAMESPACE.ASSUMPTION
      ),
      "ASM-0001"
    );
  }
);

test(
  "peekは次のIDを返すがCounterを進めない",
  () => {
    const generator =
      new SequentialIdGenerator();

    assert.equal(
      generator.peek(
        ID_NAMESPACE.DIAGNOSIS_SCENARIO
      ),
      "DGS-0001"
    );

    assert.equal(
      generator.peek(
        ID_NAMESPACE.DIAGNOSIS_SCENARIO
      ),
      "DGS-0001"
    );

    assert.equal(
      generator.getCurrentCounter(
        ID_NAMESPACE.DIAGNOSIS_SCENARIO
      ),
      0
    );
  }
);

test(
  "初期Counterと桁数を指定して採番を再開できる",
  () => {
    const generator =
      new SequentialIdGenerator({
        width: 6,
        initialCounters: {
          [ID_NAMESPACE.PRODUCTION_PLAN]: 41
        }
      });

    assert.equal(
      generator.next(
        ID_NAMESPACE.PRODUCTION_PLAN
      ),
      "PLAN-000042"
    );
  }
);

test(
  "不正Namespace・Counter・Widthを拒否する",
  () => {
    const generator =
      new SequentialIdGenerator();

    assert.throws(
      () => generator.next("UNKNOWN_TYPE"),
      (error) =>
        hasErrorCode(
          error,
          ERROR_CODES.INVALID_ID_NAMESPACE
        )
    );

    assert.throws(
      () => new SequentialIdGenerator({
        width: 0
      }),
      (error) =>
        hasErrorCode(
          error,
          ERROR_CODES.INVALID_ID_COUNTER
        )
    );

    assert.throws(
      () => new SequentialIdGenerator({
        initialCounters: {
          [ID_NAMESPACE.EVENT]: -1
        }
      }),
      (error) =>
        hasErrorCode(
          error,
          ERROR_CODES.INVALID_ID_COUNTER
        )
    );
  }
);

test(
  "不正Prefixと重複Prefixを拒否する",
  () => {
    assert.throws(
      () => new SequentialIdGenerator({
        prefixes: {
          ...DEFAULT_ID_PREFIXES,
          [ID_NAMESPACE.EVENT]: "event"
        }
      }),
      (error) =>
        hasErrorCode(
          error,
          ERROR_CODES.INVALID_ID_PREFIX
        )
    );

    assert.throws(
      () => new SequentialIdGenerator({
        prefixes: {
          ...DEFAULT_ID_PREFIXES,
          [ID_NAMESPACE.EVENT]: "ASM"
        }
      }),
      (error) =>
        hasErrorCode(
          error,
          ERROR_CODES.DUPLICATE_ID_PREFIX
        )
    );
  }
);

test(
  "generateIdはGeneratorの戻り値を検証し予期しないErrorを保持する",
  () => {
    assert.equal(
      generateId(
        new SequentialIdGenerator(),
        ID_NAMESPACE.NEXT_CHECK
      ),
      "NC-0001"
    );

    assert.throws(
      () => generateId(
        { next: () => " invalid id " },
        ID_NAMESPACE.EVENT
      ),
      (error) =>
        hasErrorCode(
          error,
          ERROR_CODES.INVALID_GENERATED_ID
        )
    );

    const cause = new Error("ID source failed");

    assert.throws(
      () => generateId(
        {
          next: () => {
            throw cause;
          }
        },
        ID_NAMESPACE.EVENT
      ),
      (error) => {
        assert.equal(
          hasErrorCode(
            error,
            ERROR_CODES.UNEXPECTED_ERROR
          ),
          true
        );
        assert.equal(error.cause, cause);
        return true;
      }
    );
  }
);

test(
  "Snapshotは現在Counterを外部変更できない形で返す",
  () => {
    const generator =
      new SequentialIdGenerator();

    generator.next(ID_NAMESPACE.EVENT);

    const snapshot = generator.toSnapshot();

    assert.equal(snapshot.width, 4);
    assert.equal(
      snapshot.counters[ID_NAMESPACE.EVENT],
      1
    );
    assert.equal(Object.isFrozen(snapshot), true);
    assert.equal(
      Object.isFrozen(snapshot.counters),
      true
    );

    assert.throws(
      () => {
        snapshot.counters[ID_NAMESPACE.EVENT] = 999;
      },
      TypeError
    );
  }
);
