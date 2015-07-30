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
  t.equal(resolve("a"), fields[0]);
  t.equal(resolve("b"), fields[1]);
  t.equal(resolve("c"), fields[2]);
  t.equal(resolve("d"), fields[2]);
  t.equal(resolve("e"), data.e);
  t.end();
});
