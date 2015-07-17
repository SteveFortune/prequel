import test from "tape";
import q from "../src/tag";

test("Tagged template uses data from interpolated values", (t) => {
  const rows = [
    { a: 1, b: 2, c: 3 },
    { a: 3, b: 4, c: 5 }
  ];

  const result = q`SELECT a, b FROM ${rows}`;
  t.deepEqual([{ a: 1, b: 2 }, { a: 3, b: 4 }], result);
  t.end();
});
