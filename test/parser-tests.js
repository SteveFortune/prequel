import test from "tape";
import parse from "../src/parser";

test("SELECT one field", (t) => {
  const out = parse("SELECT f1 FROM wat");
  t.deepEqual(out.fields, [{ name: "f1" }]);
  t.end();
});

test("SELECT two fields", (t) => {
  const out = parse("SELECT f1, f2 FROM wat");
  t.deepEqual(out.fields, ["f1", "f2"].map(name => ({ name })));
  t.end();
});

test("SELECT more than two fields", (t) => {
  const out = parse("SELECT f1, f2, f3, f4 FROM wat");
  t.deepEqual(out.fields, ["f1", "f2", "f3", "f4"].map(name => ({ name })));
  t.end();
});

test("SELECT * produces empty field list", (t) => {
  const out = parse("SELECT * FROM wat");
  t.deepEqual(out.fields, []);
  t.end();
});

test("SELECT AS", (t) => {
  const out = parse("SELECT f1, f2 AS g FROM wat");
  t.deepEqual(out.fields, [{ name: "f1" }, { name: "f2", as: "g" }]);
  t.end();
});

test("FROM", (t) => {
  const out = parse("SELECT f1 FROM wat");
  t.deepEqual(out.source, "wat");
  t.end();
});

test("WHERE binary condition with literal", (t) => {
  const out = parse("SELECT f1 FROM wat WHERE f1 <> 9");
  t.deepEqual(out.where, { field: "f1", op: "<>", value: 9 });
  t.end();
});

test("WHERE unary condition", (t) => {
  const out = parse("SELECT f1 FROM wat WHERE f1 IS NOT NULL");
  t.deepEqual(out.where, { field: "f1", op: "IS NOT NULL" });
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

test("GROUP BY one field", t => {
  const out = parse("SELECT f1 FROM wat GROUP BY f1");
  t.deepEqual(out.group, { fields: ["f1"] });
  t.end();
});

test("GROUP BY several fields", t => {
  const out = parse("SELECT f1, f2 FROM wat GROUP BY f1, f2");
  t.deepEqual(out.group, { fields: ["f1", "f2"] });
  t.end();
});
