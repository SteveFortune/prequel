/* eslint camelcase:[0] */
import test from "tape";
import query from "../src/query";

test("SELECT fields", (t) => {
  const data = { f: [{ a: 1, b: 2, c: 3 }] };
  const q = { fields: [{ name: "a" }, { name: "b" }], source: "f" };

  const result = query(q, data);
  t.deepEqual([{ a: 1, b: 2 }], result);
  t.end();
});

test("SELECT AS", (t) => {
  const data = { f: [{ a: 1, b: 2, c: 3 }] };
  const q = { fields: [{ name: "a" }, { name: "b", as: "z" }], source: "f" };

  const result = query(q, data);
  t.deepEqual([{ a: 1, z: 2 }], result);
  t.end();
});

test("SELECT *", (t) => {
  const data = { f: [{ a: 1, b: 2, c: 3 }] };
  const q = { fields: [], source: "f" };

  const result = query(q, data);
  t.deepEqual([{ a: 1, b: 2, c: 3 }], result);
  t.end();
});

test("WHERE binary predicate", (t) => {
  const data = { f: [{ a: 1 }, { a: 3 }] };

  const condition = { op: ">", field: "a", value: 2 };
  const q = { where: condition, fields: [], source: "f" };

  const result = query(q, data);
  t.deepEqual([{ a: 3 }], result);
  t.end();
});

test("WHERE unary predicate", (t) => {
  const data = { f: [{ a: 1 }, { a: 3 }] };

  const condition = { op: "IS NOT NULL", field: "a" };
  const q = { where: condition, fields: [], source: "f" };

  const result = query(q, data);
  t.deepEqual([{ a: 1 }, { a: 3 }], result);
  t.end();
});

test("ORDER BY ascending", (t) => {
  const data = { f: [{ a: 5 }, { a: 3 }, { a: 4 }] };
  const q = { fields: [], source: "f", order: [{ field: "a" }] };

  const result = query(q, data);
  t.deepEqual([{ a: 3 }, { a: 4 }, { a: 5 }], result);
  t.end();
});

test("ORDER BY descending", (t) => {
  const data = { f: [{ a: 5 }, { a: 3 }, { a: 4 }] };
  const q = { fields: [], source: "f", order: [{ field: "a", order: "DESC" }] };

  const result = query(q, data);
  t.deepEqual([{ a: 5 }, { a: 4 }, { a: 3 }], result);
  t.end();
});

test("ORDER BY several fields", (t) => {
  const data = { f: [{ a: 1, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 2 }] };
  const q = { fields: [], source: "f", order: [{ field: "a", order: "DESC" }, { field: "b" }] };

  const result = query(q, data);
  t.deepEqual([2, 1, 2], result.map(r => r.b));
  t.end();
});

test("GROUP BY one field", (t) => {
  const data = { f: [{ a: 3 }, { a: 3 }, { a: 4 }] };
  const q = { fields: [{ name: "a" }], source: "f", group: { fields: ["a"] } };

  const result = query(q, data);
  t.deepEqual([{ a: 3 }, { a: 4 }], result);
  t.end();
});

test("SELECT a FROM x GROUP BY a, b", (t) => {
  const rows = [
    { a: 1, b: 1, c: 9 },
    { a: 2, b: 1, c: 9 },
    { a: 2, b: 2, c: 7 },
    { a: 2, b: 2, c: 6 }
  ];

  const data = { f: rows };
  const q = { fields: [{ name: "a" }], source: "f", group: { fields: ["a", "b"] } };

  const result = query(q, data);
  t.deepEqual([{ a: 1 }, { a: 2 }, { a: 2 }], result);
  t.end();
});

test("SELECT a, b FROM x GROUP BY a, b", (t) => {
  const rows = [
    { a: 1, b: 1, c: 9 },
    { a: 2, b: 1, c: 9 },
    { a: 2, b: 2, c: 7 },
    { a: 2, b: 2, c: 6 }
  ];

  const data = { f: rows };
  const q = { fields: [{ name: "a" }, { name: "b" }], source: "f", group: { fields: ["a", "b"] } };

  const result = query(q, data);
  t.deepEqual([{ a: 1, b: 1 }, { a: 2, b: 1 }, { a: 2, b: 2 }], result);
  t.end();
});

test("SELECT COUNT(b) FROM x GROUP BY a", (t) => {
  const rows = [
    { a: 1, b: 1 },
    { a: 2, b: 1 },
    { a: 2, b: 2 },
    { a: 2, b: 3 }
  ];

  const data = { f: rows };
  const q = { fields: [{ name: "b", aggregate: "COUNT" }], source: "f", group: { fields: ["a"] } };

  const result = query(q, data);
  t.deepEqual([{ count_b: 1 }, { count_b: 3 }], result);
  t.end();
});

test("SELECT a, MAX(b) FROM x GROUP BY a", (t) => {
  const rows = [
    { a: 1, b: 1 },
    { a: 2, b: 1 },
    { a: 2, b: 2 },
    { a: 2, b: 3 }
  ];

  const data = { f: rows };
  const q = { fields: [{ name: "a" }, { name: "b", aggregate: "MAX" }], source: "f", group: { fields: ["a"] } };

  const result = query(q, data);
  t.deepEqual([{ a: 1, max_b: 1 }, { a: 2, max_b: 3 }], result);
  t.end();
});
