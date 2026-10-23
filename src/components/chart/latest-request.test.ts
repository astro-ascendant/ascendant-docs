import { describe, expect, test } from "bun:test";
import { createLatestRequest } from "./latest-request";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

describe("createLatestRequest", () => {
  test("aborts the previous signal and only the newest id is current", () => {
    const gate = createLatestRequest();
    const first = gate.begin();
    const second = gate.begin();

    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);
    expect(gate.isCurrent(first.id)).toBe(false);
    expect(gate.isCurrent(second.id)).toBe(true);
  });

  test("ignores an older response that resolves after a newer one", async () => {
    const gate = createLatestRequest();
    const first = gate.begin();
    const second = gate.begin();
    const older = deferred<string>();
    const newer = deferred<string>();

    const firstResult = older.promise.then((value) => (gate.isCurrent(first.id) ? value : null));
    const secondResult = newer.promise.then((value) => (gate.isCurrent(second.id) ? value : null));

    newer.resolve("newer");
    older.resolve("older");

    expect(await secondResult).toBe("newer");
    expect(await firstResult).toBeNull();
  });

  test("cancel aborts and invalidates the current request", () => {
    const gate = createLatestRequest();
    const request = gate.begin();

    gate.cancel();

    expect(request.signal.aborted).toBe(true);
    expect(gate.isCurrent(request.id)).toBe(false);
  });
});
