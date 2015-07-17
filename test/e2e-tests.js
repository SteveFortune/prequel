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
