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

test("SELECT a, b FROM ${rows} WHERE b < 3", (t) => {
  const rows = [
    { a: 1, b: 2, c: 3 },
    { a: 3, b: 4, c: 5 }
  ];

  const result = oql`SELECT a, b FROM ${rows} WHERE b < 3`;
  t.deepEqual([{ a: 1, b: 2 }], result);
  t.end();
});

test("SELECT a, b FROM ${rows} ORDER BY a", (t) => {
  const rows = [5, 4, 3].map(x => ({ a: x }));
  const result = oql`SELECT a, b FROM ${rows} ORDER BY a`;

  t.deepEqual([3, 4, 5], result.map(r => r.a));
  t.end();
});
