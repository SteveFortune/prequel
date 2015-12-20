import test from "tape";
import compile from "../../src/compile";

const fields = [
  { "name": "a" },
  { "name": "b", "as": "a" },
  { "name": "c", "as": "d" },
  { "name": "x", "as": "y" },
];

const data = {
  a: "datum a",
  b: "datum a",
  c: "datum a",
  d: "datum d",
  e: "datum e"
};

test("resolve precendence", (t) => {
  const { resolve } = compile({ fields }, data);
  const row = { a: "A", b: "B", c: "C" };

  t.equal(resolve("a", row), "A");
  t.equal(resolve("b", row), "B");
  t.equal(resolve("c", row), "C");
  t.equal(resolve("d", row), "C");
  t.equal(resolve("e", row), "datum e");
  t.end();
});

test("when a field is missing, look for it in data", (t) => {
  const { resolve } = compile({ fields }, data);
  const row = { };

  t.equal(resolve("a", row), "datum a");
  t.end();
});

test("missing values resolve to undefined", (t) => {
  const data = {};
  const row = {};
  const { resolve } = compile({ fields }, data);

  t.equal(resolve("a", row), undefined);
  t.equal(resolve("b", row), undefined);
  t.equal(resolve("x", row), undefined);
  t.equal(resolve("y", row), undefined);
  t.end();
});
