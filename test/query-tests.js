import test from "tape";
import query from "../src/query";

test("SELECT fields", (t) => {
  const data = { f: [{ a: 1, b: 2, c: 3 }] };
  const q = { fields: ["a", "b"], source: "f" };

  const result = query(q, data);
  t.deepEqual([{ a: 1, b: 2 }], result);
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
  const q = { fields: [], source: "f", order: { field: "a" } };

  const result = query(q, data);
  t.deepEqual([{ a: 3 }, { a: 4 }, { a: 5 }], result);
  t.end();
});

test("ORDER BY descending", (t) => {
  const data = { f: [{ a: 5 }, { a: 3 }, { a: 4 }] };
  const q = { fields: [], source: "f", order: { field: "a", reverse: true } };

  const result = query(q, data);
  t.deepEqual([{ a: 5 }, { a: 4 }, { a: 3 }], result);
  t.end();
});
