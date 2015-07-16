import parse from "./src/parser";
import exec from "./src/query";
import oql from "./src/tag";

// Quick demos
console.log(parse("SELECT f1 FROM wat"));
console.log(parse("SELECT f1, f2 FROM wat"));

const rows = [
  { a: 1, b: 2, c: 3 },
  { d: 2, e: 3, f: 4 },
  { a: 5, b: 6, c: 7 },
  { d: 8, e: 9, c: 10 }
];

function testManual(query, data) {
  const parsed = parse(query);
  const out = exec(parsed, data);
  console.log(out);
}

testManual("SELECT a, c FROM d", { d: rows });

console.log(oql`SELECT b FROM ${rows}`);
console.log(oql`SELECT * FROM ${rows}`);
