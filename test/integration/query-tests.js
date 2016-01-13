/* eslint camelcase:[0] */
import test from "tape";
import prequel from "../../src";
import _ from "lodash";
import { testData } from "./test-harness";

// End-to-end tests for prequel features that cannot be tested directly against sqlite.
// Ideally these tests would run against array and iterable input, and use the
//  query string as the test name like sql-tests, but I can't figure out how
//  to do that at the moment (eval fails on iojs 2.x).

function* iterableInput() {
  for(const value of testData) {
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

test("prequel`SELECT AVG(${(row) => row.age + 4}) AS avg_skewed_age FROM ${table}`", (t) => {
  const result = prequel`SELECT AVG(${(row) => row.age + 4}) AS avg_skewed_age FROM ${testData}`;
  t.deepEqual(result, [{ avg_skewed_age: 33.1 }]);
  t.end();
});

test("SELECT MAX(age) FROM ${testData} GROUP BY ${row => row.fruit}", (t) => {
  const result = prequel`SELECT fruit, MAX(age) FROM ${testData} GROUP BY ${row => row.fruit}`;
  t.deepEqual(result, [{ fruit: "strawberry", max_age: 39 }, { fruit: "apple", max_age: 40 }, { fruit: "banana", max_age: 38 }]);
  t.end();
});

test("SELECT fruit, COUNT(DISTINCT ${row => row.name[0]}) as initials FROM ${testData} GROUP BY ${row => row.fruit} HAVING initials > 4", (t) => {
  // result2 re-specifies the aggregation in HAVING
  const result = prequel`SELECT fruit, COUNT(DISTINCT ${row => row.name[0]}) as initials FROM ${testData} GROUP BY ${row => row.fruit} HAVING initials > 4`;
  const result2 = prequel`SELECT fruit, COUNT(DISTINCT ${row => row.name[0]}) as initials FROM ${testData} GROUP BY ${row => row.fruit} HAVING COUNT(DISTINCT ${row => row.name[0]}) > 4`;

  t.deepEqual(result, [{ fruit: "strawberry", initials: 5 }, { fruit: "apple", initials: 11 }]);
  t.deepEqual(result2, result);
  t.end();
});

test("SELECT age FROM ${testData} ORDER BY ${row => -1 * row.age} LIMIT 3", (t) => {
  const result = prequel`SELECT age FROM ${testData} ORDER BY ${row => -1 * row.age} LIMIT 3`;
  t.deepEqual(result.map(r => r.age), [40, 39, 38]);
  t.end();
});

test("SELECT age FROM ${testData} ORDER BY age ${'DESC'} LIMIT 3", (t) => {
  const result = prequel`SELECT age FROM ${testData} ORDER BY age ${"DESC"} LIMIT 3`;
  t.deepEqual(result.map(r => r.age), [40, 39, 38]);
  t.end();
});

test("SELECT age FROM ${testData} ORDER BY age ${() => 'DESC'} LIMIT 3", (t) => {
  const result = prequel`SELECT age FROM ${testData} ORDER BY age ${() => "DESC"} LIMIT 3`;
  t.deepEqual(result.map(r => r.age), [40, 39, 38]);
  t.end();
});

test("SELECT age FROM ${testData} ORDER BY age ${() => 'wat'}", (t) => {
  try {
    prequel`SELECT age FROM ${testData} ORDER BY age ${() => "wat"}`;
    t.fail();
  } catch (e) {
    t.true(e.message.match(/unexpected sort order/i));
  }
  t.end();
});

test("SELECT unread FROM ${testData} ORDER BY ${row => -1 * row.unread} DESC LIMIT 3", (t) => {
  const result = prequel`SELECT unread FROM ${testData} ORDER BY ${row => -1 * row.unread} DESC LIMIT 3`;
  t.deepEqual(result.map(r => r.unread), [1, 1, 3]);
  t.end();
});

test("SELECT name FROM ${testData} LIMIT ${3}", (t) => {
  const result = prequel`SELECT name FROM ${testData} LIMIT ${3}`;
  t.deepEqual(result.map(r => r.name), ["Strickland Montoya", "Margie Duffy", "Thelma Johnston"]);
  t.end();
});

test("SELECT name FROM ${testData} LIMIT ${() => 1}, ${2}", (t) => {
  const result = prequel`SELECT name FROM ${testData} LIMIT ${() => 1}, ${2}`;
  t.deepEqual(result.map(r => r.name), ["Margie Duffy", "Thelma Johnston"]);
  t.end();
});

test("prequel`SELECT name FROM ${testData} WHERE STRCMP(name, 'Margie Duffy')`", (t) => {
  const result = prequel`SELECT name FROM ${testData} WHERE STRCMP(name, 'Margie Duffy')`;
  t.notOk(_.includes(result, "Margie Duffy"));
  t.end();
});

// sqlite does not support REGEXP et al
test("prequel`SELECT name FROM ${testData} WHERE name REGEXP 'i'`", (t) => {
  const result = prequel`SELECT name FROM ${testData} WHERE name REGEXP '[ou]ff'`;
  t.deepEqual(["Margie Duffy", "Hoffman Grant"], result.map(r => r.name));
  t.end();
});

// ~ alias and JS regexp with flags
test("prequel`SELECT name FROM ${testData} WHERE name ~ ${/[mn] [gd]/i}`", (t) => {
  const result = prequel`SELECT name FROM ${testData} WHERE name ~ ${/[mn] [gd]/i}`;
  t.deepEqual(["Ellen Gould", "Chapman Gibbs", "Hoffman Grant"], result.map(r => r.name));
  t.end();
});

// SQL does not allow missing SELECT fields
test("prequel`SELECT not, there FROM ${testData}`", (t) => {
  const result = prequel`SELECT not, there FROM ${testData} LIMIT 1`;
  t.deepEqual([{ not: undefined, there: undefined }], result);
  t.end();
});

// Mixed identifier types in an operator argument
test("prequel`SELECT name FROM ${testData} WHERE age IN (unread, 28)`", (t) => {
  const result = prequel`SELECT name FROM ${testData} WHERE age IN (id, 28, ${29}, ${row => row + 5})`;
  t.deepEqual(["Thelma Johnston", "Corine Hale", "Vaughan Stevens", "King Farley", "Rocha Shepard"], result.map(r => r.name));
  t.end();
});

// sqlite counts string literals as falsy
test("prequel`SELECT name FROM ${testData} WHERE \"wat\" LIMIT 2`", (t) => {
  const result = prequel`SELECT name FROM ${testData} WHERE "wat" LIMIT 2`;
  t.deepEqual(["Strickland Montoya", "Margie Duffy"], result.map(r => r.name));
  t.end();
});

// Error conditions
// Aggregation function in WHERE
test("prequel`SELECT name FROM ${testData} WHERE AVG(age) > 20`", (t) => {
  try {
    const t = prequel`SELECT name FROM ${testData} WHERE AVG(age) > 20`;
    t.fail();
  } catch(e) {
    t.true(e.message.match(/Could not use aggregate function AVG in WHERE. Did you mean HAVING?/i));
  }
  t.end();
});

test("prequel`SELECT name FROM ${testData} WHERE isActive AND COUNT(DISTINCT age) > 20`", (t) => {
  try {
    const t = prequel`SELECT name FROM ${testData} WHERE isActive AND COUNT(DISTINCT age) > 20`;
    t.fail();
  } catch(e) {
    t.true(e.message.match(/Could not use aggregate function COUNT_DISTINCT in WHERE. Did you mean HAVING?/i));
  }
  t.end();
});

// HAVING without GROUP BY
test("prequel`SELECT name FROM ${testData} HAVING name = 'Sven'`", (t) => {
  try {
    const t = prequel`SELECT name FROM ${testData} HAVING name = 'Sven'`;
    t.fail();
  } catch(e) {
    t.true(e.message.match(/Cannot use HAVING without groups. Did you mean to GROUP BY some fields?/i));
  }
  t.end();
});
