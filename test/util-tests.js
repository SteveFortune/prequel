import test from "tape";
import { groupBy, indexBy, isFunction, mapObject, pickKeys } from "../src/util";

test("groupBy key name", (t) => {
  const input = [{ a: 1, b: 2 }, { a: 1, b: 3 }, { a: 2, b: 3 }, { a: 2, b: 4}];
  const result = groupBy(input, "a");

  t.deepEqual(result, {
    1: [input[0], input[1]],
    2: [input[2], input[3]]
  });

  t.end();
});

test("groupBy key function", (t) => {
  const input = [{ a: 1, b: 2 }, { a: 1, b: 3 }, { a: 2, b: 3 }, { a: 2, b: 4}];
  const result = groupBy(input, e => `a:${e.a}`);

  t.deepEqual(result, {
    "a:1": [input[0], input[1]],
    "a:2": [input[2], input[3]]
  });

  t.end();
});

test("indexBy key name", (t) => {
  const input = [{ a: 1, b: 2 }, { a: 1, b: 3 }, { a: 2, b: 3 }, { a: 2, b: 4}];
  const result = indexBy(input, "a");

  t.deepEqual(result, {
    1: input[1],
    2: input[3]
  });

  t.end();
});

test("indexBy key function", (t) => {
  const input = [{ a: 1, b: 2 }, { a: 1, b: 3 }, { a: 2, b: 3 }, { a: 2, b: 4}];
  const result = indexBy(input, e => `a:${e.a}`);

  t.deepEqual(result, {
    "a:1": input[1],
    "a:2": input[3]
  });

  t.end();
});

test("isFunction", (t) => {
  t.true(isFunction(function() {}));
  t.true(isFunction(x => x));
  t.true(isFunction(t.true));
  t.false(isFunction({}));
  t.false(isFunction([]));
  t.end();
});

test("mapObject", (t) => {
  const input = { a: 1, b: 2, c: 3, d: 4 };
  const result = mapObject(input, (value, key) => `${key}:${value}`);

  t.deepEqual(result, ["a:1", "b:2", "c:3", "d:4"]);
  t.end();
});

test("pickKeys", (t) => {
  const input = { a: 1, b: 2, c: 3, d: 4 };
  t.deepEqual(pickKeys(input, ["a", "b"]), { a: 1, b: 2 });
  t.end();
});
