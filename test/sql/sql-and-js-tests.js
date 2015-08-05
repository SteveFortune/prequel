/* eslint camelcase:[0] */
import test from "tape";
import prequel from "../../";
import { testData } from "./test-harness";

// End-to-end tests for interpolated JavaScript and iterable input,
//  since these features cannot be tested against sqljs.
// Ideally these tests would run against array and iterable input, and use the
//  query string as the test name like sql-tests, but I can't figure out how
//  to do that at the moment (eval fails on iojs 2.x).

function* iterableInput() {
  for(let value of testData) {
    yield value;
  }
}

test("prequel`SELECT id, age, isActive, unread FROM ${iterableInput()} WHERE ${row => row.age + row.isActive <= row.unread}`", (t) => {
  // DRY with eval fails on iojs 2
  // const result = eval(t.name); // fails
  const result = prequel`SELECT id, age, isActive, unread FROM ${iterableInput()} WHERE ${row => row.age + row.isActive <= row.unread}`;
  t.deepEqual(result, [
    { id: 25, age: 21, isActive: 1, unread: 22 },
    { id: 28, age: 24, isActive: 0, unread: 25 }
  ]);

  t.end();
});

test("SELECT * FROM ${iterableInput()} WHERE ${(row, n) => n % 2}", (t) => {
  const result = prequel`SELECT * FROM ${iterableInput()} WHERE ${(row, n) => n % 2}`;
  t.deepEqual(result, testData.filter((row, i) => i % 2));
  t.end();
});

test("SELECT * FROM ${iterableInput()} WHERE ${row => row.name.length > 15} AND (${row => !row.isActive} OR ${'id'} <> 4) AND notThere IS NULL AND age >= ${1 + 2}", (t) => {
  const result = prequel`SELECT * FROM ${iterableInput()} WHERE ${row => row.name.length > 15} AND (${row => !row.isActive} OR ${"id"} <> 4) AND notThere IS NULL AND age >= ${1 + 2}`;
  t.deepEqual([ 0, 15, 17, 23 ], result.map(r => r.id));
  t.end();
});


test("prequel`SELECT id FROM ${prequel`SELECT * FROM ${testData} WHERE id > 25`}`", (t) => {
  const result = prequel`SELECT id FROM ${prequel`SELECT * FROM ${testData} WHERE id > 25`}`;
  t.deepEqual([26, 27, 28, 29], result.map(r => r.id));
  t.end();
});
