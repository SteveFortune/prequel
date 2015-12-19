/* eslint camelcase:[0] */
import test from "tape";
import query from "../../src/query";

function* wrap(inputArray) {
  for(const value of inputArray) {
    yield value;
  }
}

// Wrapper function to test array and iterable
//  input produce identical output
// Uses key $1 for data.
function testQuery(t, q, inputArray, otherData={}) {
  const arrayResult = query(q, Object.assign({ $1: inputArray }, otherData));
  const iterableResult = query(q, Object.assign({ $1: wrap(inputArray) }, otherData));
  t.deepEqual(arrayResult, iterableResult);

  return arrayResult;
}

test("SELECT fields", (t) => {
  const input = [{ a: 1, b: 2, c: 3 }];
  const q = { fields: [{ name: "a" }, { name: "b" }], source: "$1" };

  const result = testQuery(t, q, input);

  t.deepEqual([{ a: 1, b: 2 }], result);
  t.end();
});

test("SELECT AS", (t) => {
  const input = [{ a: 1, b: 2, c: 3 }];
  const q = { fields: [{ name: "a" }, { name: "b", as: "z" }], source: "$1" };

  const result = testQuery(t, q, input);
  t.deepEqual([{ a: 1, z: 2 }], result);
  t.end();
});

test("SELECT *", (t) => {
  const input = [{ a: 1, b: 2, c: 3 }];
  const q = { fields: [], source: "$1" };

  const result = testQuery(t, q, input);
  t.deepEqual([{ a: 1, b: 2, c: 3 }], result);
  t.end();
});

test("WHERE binary predicate", (t) => {
  const input = [{ a: 1 }, { a: 3 }];

  const condition = { op: ">", lhs: { identifier: "a" }, rhs: { literal: 2 } };
  const q = { where: condition, fields: [], source: "$1" };

  const result = testQuery(t, q, input);
  t.deepEqual([{ a: 3 }], result);
  t.end();
});

test("WHERE unary predicate", (t) => {
  const input = [{ a: 1 }, { a: 3 }];

  const condition = { lhs: { identifier: "a" }, op: "IS NOT NULL" };
  const q = { where: condition, fields: [], source: "$1" };

  const result = testQuery(t, q, input);
  t.deepEqual([{ a: 1 }, { a: 3 }], result);
  t.end();
});

test("WHERE referenced falsy value", (t) => {
  const input = [{ a: 1 }, { a: 3 }];
  const otherData = { $2: null };

  const condition = { identifier: "$2" };
  const q = { where: condition, fields: [], source: "$1" };

  const result = testQuery(t, q, input, otherData);
  t.deepEqual([], result);
  t.end();
});

test("WHERE referenced truthy value", (t) => {
  const input = [{ a: 1 }, { a: 3 }];
  const otherData = { $2: 1 };

  const condition = { identifier: "$2" };
  const q = { where: condition, fields: [], source: "$1" };

  const result = testQuery(t, q, input, otherData);
  t.deepEqual(input, result);
  t.end();
});

test("WHERE referenced function is called with each row and row number", (t) => {
  // check row number values
  const seenRows = [];
  const predicate = (row, n) => {
    seenRows.push(n);
    return row.a % 2;
  };

  const data = { $1: [1, 2, 3, 4, 5, 6].map(a => ({ a })), $2: predicate };

  const condition = { identifier: "$2" };
  const q = { where: condition, fields: [], source: "$1" };

  // Only test array input, since other tests check that WHERE works
  //  with arrays and iterables
  const result = query(q, data);
  t.deepEqual([1, 3, 5], result.map(r => r.a));
  t.deepEqual([0, 1, 2, 3, 4, 5], seenRows);

  t.end();
});

test("SELECT a FROM x WHERE a IN [1, 2]", (t) => {
  const input = [1, 2, 3, 4, 5].map(a => ({ a }));

  const fields = [{ name: "a" }];
  const where = { lhs: { identifier: "a" }, op: "IN", rhs: [{ literal: 1 }, { literal: 2 }] };
  const q = { fields, where, source: "$1" };

  const result = testQuery(t, q, input);
  t.deepEqual(result, [{ a: 1 }, { a: 2 }]);
  t.end();
});

test("WHERE aggregate throws an error", (t) => {
  const data = { $1: {} };
  const q = { fields: [], where: { aggregate: "MAX", source: "age" }, source: "$1" };

  try {
    query(q, data);
    t.fail();
  } catch (e) {
    t.true(e.message.match(/could not use aggregate function/i));
  }
  t.end();
});

test("ORDER BY ascending", (t) => {
  const input = [{ a: 5 }, { a: 3 }, { a: 4 }];
  const q = { fields: [], source: "$1", order: [{ field: "a" }] };

  const result = testQuery(t, q, input);
  t.deepEqual([{ a: 3 }, { a: 4 }, { a: 5 }], result);
  t.end();
});

test("ORDER BY descending", (t) => {
  const input = [{ a: 5 }, { a: 3 }, { a: 4 }];
  const q = { fields: [], source: "$1", order: [{ field: "a", order: "DESC" }] };

  const result = testQuery(t, q, input);
  t.deepEqual([{ a: 5 }, { a: 4 }, { a: 3 }], result);
  t.end();
});

test("ORDER BY several fields", (t) => {
  const input = [{ a: 1, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 2 }];
  const q = { fields: [], source: "$1", order: [{ field: "a", order: "DESC" }, { field: "b" }] };

  const result = testQuery(t, q, input);
  t.deepEqual([2, 1, 2], result.map(r => r.b));
  t.end();
});

test("GROUP BY one field", (t) => {
  const input = [{ a: 3 }, { a: 3 }, { a: 4 }];
  const q = { fields: [{ name: "a" }], source: "$1", group: { fields: ["a"] } };

  const result = testQuery(t, q, input);
  t.deepEqual([{ a: 3 }, { a: 4 }], result);
  t.end();
});

test("SELECT a FROM x GROUP BY a, b", (t) => {
  const input = [
    { a: 1, b: 1, c: 9 },
    { a: 2, b: 1, c: 9 },
    { a: 2, b: 2, c: 7 },
    { a: 2, b: 2, c: 6 }
  ];

  const q = { fields: [{ name: "a" }], source: "$1", group: { fields: ["a", "b"] } };

  const result = testQuery(t, q, input);
  t.deepEqual([{ a: 1 }, { a: 2 }, { a: 2 }], result);
  t.end();
});

test("SELECT a, b FROM x GROUP BY a, b", (t) => {
  const input = [
    { a: 1, b: 1, c: 9 },
    { a: 2, b: 1, c: 9 },
    { a: 2, b: 2, c: 7 },
    { a: 2, b: 2, c: 6 }
  ];

  const q = { fields: [{ name: "a" }, { name: "b" }], source: "$1", group: { fields: ["a", "b"] } };

  const result = testQuery(t, q, input);
  t.deepEqual([{ a: 1, b: 1 }, { a: 2, b: 1 }, { a: 2, b: 2 }], result);
  t.end();
});

test("SELECT COUNT(b) FROM x GROUP BY a", (t) => {
  const input = [
    { a: 1, b: 1 },
    { a: 2, b: 1 },
    { a: 2, b: 2 },
    { a: 2, b: 3 }
  ];

  const q = { fields: [{ source: "b", aggregate: "COUNT" }], source: "$1", group: { fields: ["a"] } };

  const result = testQuery(t, q, input);
  t.deepEqual([{ count_b: 1 }, { count_b: 3 }], result);
  t.end();
});

test("SELECT a, MAX(b) FROM x GROUP BY a", (t) => {
  const input = [
    { a: 1, b: 1 },
    { a: 2, b: 1 },
    { a: 2, b: 2 },
    { a: 2, b: 3 }
  ];

  const q = { fields: [{ name: "a" }, { source: "b", aggregate: "MAX" }], source: "$1", group: { fields: ["a"] } };

  const result = testQuery(t, q, input);
  t.deepEqual([{ a: 1, max_b: 1 }, { a: 2, max_b: 3 }], result);
  t.end();
});

test("SELECT AVG(a) FROM x", (t) => {
  const input = [1, 2, 3, 4, 5].map(a => ({ a }));

  const q = { fields: [{ source: "a", aggregate: "AVG" }], source: "$1" };
  const result = testQuery(t, q, input);

  t.deepEqual([{ avg_a: 3 }], result);
  t.end();
});

test("SELECT AVG(a), b FROM x", (t) => {
  const input = [1, 2, 3, 4, 5].map(a => ({ a, b: 2 * a }));

  const q = { fields: [{ source: "a", aggregate: "AVG" }, { name: "b" }], source: "$1" };
  const result = testQuery(t, q, input);

  t.deepEqual([{ avg_a: 3, b: 2 }], result);
  t.end();
});

test("SELECT AVG(a), b FROM x", (t) => {
  const input = [1, 2, 3, 4, 5].map(a => ({ a, b: 2 * a }));

  const q = { fields: [{ source: "a", aggregate: "AVG" }, { name: "b" }], source: "$1" };
  const result = testQuery(t, q, input);

  t.deepEqual([{ avg_a: 3, b: 2 }], result);
  t.end();
});

test("SELECT COUNT(*) FROM x", (t) => {
  const input = [1, 2, 3, 4, 5].map(a => ({ a }));

  const q = { fields: [{ source: "*", aggregate: "COUNT" }], source: "$1" };
  const result = testQuery(t, q, input);

  t.deepEqual([{ "count_*": 5 }], result);
  t.end();
});

test("SELECT * FROM x LIMIT 3", (t) => {
  const input = [1, 2, 3, 4, 5].map(a => ({ a }));

  const q = { fields: [], limit: { count: 3 }, source: "$1" };
  const result = testQuery(t, q, input);

  t.equal(3, result.length);
  t.end();
});

test("SELECT * FROM x LIMIT 0", (t) => {
  const input = [1, 2, 3, 4, 5].map(a => ({ a }));

  const q = { fields: [], limit: { count: 0 }, source: "$1" };
  const result = testQuery(t, q, input);

  t.equal(0, result.length);
  t.end();
});

test("SELECT * FROM x LIMIT 1, 3", (t) => {
  const input = [1, 2, 3, 4, 5].map(a => ({ a }));

  const q = { fields: [], limit: { offset: 1, count: 3 }, source: "$1" };
  const result = testQuery(t, q, input);

  t.equal(3, result.length);
  t.equal(2, result[0].a);
  t.end();
});

test("SELECT b FROM x GROUP BY b HAVING COUNT(a) > 2", (t) => {
  const input = [1, 2, 3, 4, 5].map(a => ({ a, b: a % 2 }));

  const fields = [{ name: "b" }];
  const having = { lhs: { aggregate: "COUNT", source: "a" }, op: ">", rhs: { literal: 2 }};
  const group = { fields: ["b"] };

  const q = { fields, having, group, source: "$1" };
  const result = testQuery(t, q, input);

  t.deepEqual(result, [{ b: 1 }]);
  t.end();
});

test("HAVING without GROUP BY throws an error", (t) => {
  const fields = [{ name: "a" }];
  const having = { lhs: { aggregate: "COUNT", source: "a" }, op: ">", rhs: { literal: 2 }};
  const q = { fields, having, source: "$1" };

  try {
    const result = testQuery(t, q, []);
    t.fail();
  } catch (e) {
    t.true(e.message.match(/cannot use having without groups/i));
  }

  t.end();
});

test("Unexpected expression type throws an error", (t) => {
  const where = { unknown: "wat" };
  const q = { fields: [], where, source: "$1" };

  try {
    const result = testQuery(t, q, []);
    t.fail();
  } catch (e) {
    t.true(e.message.match(/unexpected expression/i));
  }

  t.end();
});
