import test from "tape";
import parse from "../src/parser";

test("SELECT one field", (t) => {
  const out = parse("SELECT f1 FROM wat");
  t.deepEqual(out.fields, ["f1"]);
  t.end();
});

test("SELECT two fields", (t) => {
  const out = parse("SELECT f1, f2 FROM wat");
  t.deepEqual(out.fields, ["f1", "f2"]);
  t.end();
});

test("SELECT more than two fields", (t) => {
  const out = parse("SELECT f1, f2, f3, f4 FROM wat");
  t.deepEqual(out.fields, ["f1", "f2", "f3", "f4"]);
  t.end();
});

test("SELECT * produces empty field list", (t) => {
  const out = parse("SELECT * FROM wat");
  t.deepEqual(out.fields, []);
  t.end();
});

test("FROM", (t) => {
  const out = parse("SELECT f1 FROM wat");
  t.deepEqual(out.source, "wat");
  t.end();
});

test("ORDER BY", (t) => {
  const out = parse("SELECT f1 FROM wat ORDER BY f1");
  t.deepEqual(out.order, [{ field: "f1" }]);
  t.end();
});

test("ORDER BY explicit ASC", (t) => {
  const out = parse("SELECT f1 FROM wat ORDER BY f1 ASC");
  t.deepEqual(out.order, [{ field: "f1", order: "ASC" }]);
  t.end();
});

test("ORDER BY DESC", (t) => {
  const out = parse("SELECT f1 FROM wat ORDER BY f1 DESC");
  t.deepEqual(out.order, [{ field: "f1", order: "DESC" }]);
  t.end();
});

test("ORDER BY several fields", (t) => {
  const out = parse("SELECT f1 FROM wat ORDER BY f1 DESC, f2, f3 ASC");
  t.deepEqual(out.order, [
    { field: "f1", order: "DESC" },
    { field: "f2" },
    { field: "f3", order: "ASC" }
  ]);
  t.end();
});
