import test from "tape";
import _ from "lodash";
import { groupBy, indexBy, isFunction, isArray, mapObject, pickKeys, objectValues, exists, result, sortByOrder } from "../../src/util";

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

test("isArray", (t) => {
  t.true(isArray([]));
  t.true(isArray([[]]));
  t.false(isArray());
  t.false(isArray(null));
  t.false(isArray({}));
  t.false(isArray(1));
  t.false(isArray("1"));

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

test("objectValues", (t) => {
  const input = { a: 1, b: 2, c: 3, d: 4 };
  t.deepEqual(objectValues(input), [1, 2, 3, 4]);
  t.end();
});

test("exists", (t) => {
  t.true(exists(1));
  t.true(exists({}));
  t.true(exists([]));
  t.true(exists(0));
  t.true(exists(false));
  t.true(exists(null));
  t.false(exists(undefined));
  t.false(exists());
  t.end();
});

test("result", (t) => {
  t.equal(result(1), 1);
  t.equal(result(() => "hi"), "hi");
  t.equal(result((x) => x), undefined);
  t.end();
});

// Test against lodash's implementation
// (ignoring un-sorted columns)
test.only("sortByOrder", (t) => {
  const input = [];
  for (let a = 0; a < 3; a ++) {
    for (let b = 0; b < 3; b ++) {
      for (let c = 0; c < 3; c ++) {
        for (let d = 0; d < 3; d ++) {
          input.push({ a, b, c, d });
        }
      }
    }
  }

  const fields = ["a", "b", "c", "d"];
  const orders = ["asc"];
  const orderSpec = _.zip(fields, orders);

  const result = sortByOrder(input, orderSpec);
  const lodashResult = _.sortByOrder(input, fields, orders);
  t.deepEqual(result, lodashResult);

  t.end();
});
