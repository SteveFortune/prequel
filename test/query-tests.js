import test from "tape";
import query from "../src/query";

test("SELECT a, b FROM f", (t) => {
  var data = { f: [{ a: 1, b: 2, c: 3 }] };
  var q = { fields: ["a", "b"], source: "f" };

  var result = query(q, data);
  t.deepEqual([{ a: 1, b: 2 }], result);
  t.end();
});

test("SELECT * FROM f", (t) => {
  var data = { f: [{ a: 1, b: 2, c: 3 }] };
  var q = { fields: [], source: "f" };

  var result = query(q, data);
  t.deepEqual([{ a: 1, b: 2, c: 3 }], result);
  t.end();
});
