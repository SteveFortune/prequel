import test from "tape";
import oql from "../";

test("SELECT a, b FROM ${rows}", (t) => {
  const rows = [
    { a: 1, b: 2, c: 3 },
    { a: 3, b: 4, c: 5 }
  ];

  const result = oql`SELECT a, b FROM ${rows}`;
  t.deepEqual([{ a: 1, b: 2 }, { a: 3, b: 4 }], result);
  t.end();
});

test("SELECT a AS x, b AS y FROM ${rows}", (t) => {
  const rows = [
    { a: 1, b: 2, c: 3 },
    { a: 3, b: 4, c: 5 }
  ];

  const result = oql`SELECT a AS x, b FROM ${rows}`;
  t.deepEqual([{ x: 1, b: 2 }, { x: 3, b: 4 }], result);
  t.end();
});

test("SELECT a, b FROM ${rows} WHERE b <> 2", (t) => {
  const rows = [
    { a: 1, b: 2, c: 3 },
    { a: 3, b: 4, c: 5 }
  ];

  const result = oql`SELECT a, b FROM ${rows} WHERE b < 3`;
  t.deepEqual([{ a: 1, b: 2 }], result);
  t.end();
});

test("SELECT a, b FROM ${rows} ORDER BY a", (t) => {
  const rows = [5, 4, 7].map(x => ({ a: x }));
  const implicitResult = oql`SELECT a, b FROM ${rows} ORDER BY a`;
  const explicitResult = oql`SELECT a, b FROM ${rows} ORDER BY a ASC`;

  t.deepEqual([4, 5, 7], implicitResult.map(r => r.a));
  t.deepEqual(implicitResult, explicitResult);
  t.end();
});

test("SELECT a, b FROM ${rows} ORDER BY a DESC", (t) => {
  const rows = [5, 4, 7].map(x => ({ a: x }));
  const result = oql`SELECT a, b FROM ${rows} ORDER BY a DESC`;

  t.deepEqual([7, 5, 4], result.map(r => r.a));
  t.end();
});

test("SELECT * FROM ${rows} ORDER BY  ORDER BY a, b DESC, c ASC", (t) => {
  const rows = [
    { a: 1, b: 1, c: 1 },
    { a: 1, b: 2, c: 2 },
    { a: 1, b: 2, c: 3 },
    { a: 2, b: 1, c: 4 },
    { a: 2, b: 2, c: 5 },
    { a: 2, b: 2, c: 6 }
  ];

  const result = oql`SELECT * FROM ${rows} ORDER BY a, b DESC, c ASC`;

  t.deepEqual([2, 3, 1, 5, 6, 4], result.map(r => r.c));
  t.end();
});
