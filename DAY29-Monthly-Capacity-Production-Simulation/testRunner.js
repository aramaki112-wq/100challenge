const tests = [];

export function test(idOrName, nameOrCallback, maybeCallback) {
  if (typeof nameOrCallback === "function") {
    tests.push({ id: null, name: idOrName, callback: nameOrCallback });
    return;
  }
  tests.push({ id: idOrName, name: nameOrCallback, callback: maybeCallback });
}

export function assertEqual(actual, expected) {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, actual ${JSON.stringify(actual)}`
    );
  }
}

export function assertDeepEqual(actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`Expected ${e}, actual ${a}`);
}

export function assertTrue(value, message = "Expected value to be true.") {
  if (!value) throw new Error(message);
}

export function assertIncludes(array, predicate, message = "Expected item was not found.") {
  if (!array.some(predicate)) throw new Error(message);
}

export function assertThrows(callback, expectedCode) {
  let thrown = null;
  try { callback(); } catch (error) { thrown = error; }
  if (!thrown) throw new Error("Expected an error to be thrown.");
  if (expectedCode && thrown.code !== expectedCode) {
    throw new Error(`Expected error code ${expectedCode}, actual ${thrown.code}`);
  }
}

export async function runTests() {
  const results = [];
  for (const item of tests) {
    try {
      await item.callback();
      results.push({ id: item.id, name: item.name, passed: true });
    } catch (error) {
      results.push({
        id: item.id,
        name: item.name,
        passed: false,
        message: error.stack ?? error.message
      });
    }
  }
  return results;
}
