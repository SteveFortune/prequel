import test from "tape";
import makeResolve from "../src/resolve";

const fields = [
  { "name": "a" },
  { "name": "b", "as": "a" },
  { "name": "c", "as": "d" }
];

const data = {
  a: "datum a",
  b: "datum a",
  c: "datum a",
  d: "datum d",
  e: "datum e"
};

test("resolve precendence", (t) => {
  const resolve = makeResolve({ fields }, data);
  const row = { a: "A", b: "B", c: "C" };

  t.equal(resolve("a", row), "A");
  t.equal(resolve("b", row), "B");
  t.equal(resolve("c", row), "C");
  t.equal(resolve("d", row), "C");
  t.equal(resolve("e", row), "datum e");
  t.end();
});
