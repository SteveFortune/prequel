import tape from "tape";
import _ from "lodash";

import execute from "../../src/execute";
import prequelParse from "../../src/parser";
import createDb, { testData } from "./test-harness";

//
// Automatic SQL query tests
// Run queries against prequel and an in-memory sqlite database. Verify that
//  we get (approximately, according to test) the same result.
//

const table = "test";
const db = createDb(table);

function executePrequel(sql) {
  const parsed = prequelParse(sql);
  return execute(parsed, { [table]: testData });
}

function testQuery(sql, { test=deepEqual, log=false, only=false, skip=false } = {}) {
  if (skip) return;
  const tapeFunc = only ? tape.only : tape;

  tapeFunc(sql, (t) => {
    const dbResult = db.query(sql);
    const prequelResult = executePrequel(sql);

    if(log) {
      t.comment(JSON.stringify(dbResult));
    }

    test(t, prequelResult, dbResult);
  });
}

// Test that sqlite and prequel both throw an error
function testError(sql, only=false, skip=false) {
  if (skip) return;
  const tapeFunc = only ? tape.only : tape;

  tapeFunc(sql, (t) => {
    let dbError;
    let prequelError;
    let dbResult;
    let prequelResult;

    try { dbResult = db.query(sql); }
    catch (e) { dbError = e; }

    try { prequelResult = executePrequel(sql); }
    catch (e) { prequelError = e; }

    if (dbError && prequelError) {
      t.pass();
    } else if (!dbError) {
      t.fail(`Expected sqlite and prequel to throw. Only prequel threw. sqlite result: ${JSON.stringify(dbResult)}`);
    } else if (!prequelError) {
      t.fail(`Expected sqlite and prequel to throw. Only sqlite threw. prequel result: ${JSON.stringify(prequelResult)}`);
    } else {
      t.fail("Expected sqlite and prequel to throw. Neither threw.");
    }

    t.end();
  });
}

function deepEqual(t, prequelResult, dbResult) {
  t.deepEqual(prequelResult, dbResult);
  t.end();
}

// Normalise sqlite results to cope with expected differences:
//  - prequel uses non-standard default aggregation field names:
//    COUNT(f) => count_f
// Don't use parenthesies for non-group field aliases to avoid confusing
//  this normalisation!
function normalizeDbResults(inputResults) {
  return inputResults
    .map(inputRow => {
      const outputRow = {};
      for (const field in inputRow) {
        const outputField = (field.match(/\(.+\)/))
          ? normalizeGroupName(field)
          : field;

        outputRow[outputField] = inputRow[field];
      }

      return outputRow;
    });
}

function normalizeGroupName(sqlName) {
  return sqlName
    .toLowerCase()
    .replace(/\s|\(/g, "_")
    .replace(/\)/g, "");
}

// Match the output of GROUP BY queries:
//  - normalise aggregation field name
// Group order must match. By default prequel does not order groups
//  (unlike many SQL engines, which implicitly ORDER BY the GROUP BY columns).
//  use matchGroupsInAnyOrder to allow order-insensitive matching.
function matchGroups(t, prequelResults, dbResults, normalize=_.identity) {
  return deepEqual(t, normalize(prequelResults), normalize(normalizeDbResults(dbResults)));
}

// Match GROUP BY results in any order.
function matchGroupsInAnyOrder(t, prequelResults, dbResults) {
  return matchGroups(t, prequelResults, dbResults, (results) => results.map(row => JSON.stringify(row)).sort());
}

// SELECT
testQuery(`SELECT name FROM ${table}`);
testQuery(`SELECT name, age FROM ${table}`);
testQuery(`SELECT name, age, greeting AS msg FROM ${table}`);
testQuery(`SELECT * FROM ${table}`);
testQuery(`SELECT name AS nom, age FROM ${table}`);
testQuery(`select name as nom, age FROM ${table}`);

// WHERE
testQuery(`SELECT name, greeting FROM ${table} WHERE unread > 20`);
testQuery(`SELECT name FROM ${table} WHERE name LIKE "%"`);
testQuery(`SELECT name FROM ${table} WHERE name LIKE "_arg%"`);
testQuery(`SELECT name FROM ${table} WHERE name LIKE "\\%"`);
testQuery(`SELECT name FROM ${table} WHERE name LIKE "%ole_a%"`);
testQuery(`SELECT name FROM ${table} WHERE NOT name LIKE "%a%"`);
testQuery(`SELECT name FROM ${table} WHERE age > 20 AND isActive = 1`);
testQuery(`SELECT name FROM ${table} WHERE NOT age > 20 AND isActive = 1 OR (name LIKE "%a%" AND NOT name LIKE "%e%")`);
testQuery(`SELECT name FROM ${table} WHERE age BETWEEN 20 and 22`);
testQuery(`SELECT name FROM ${table} WHERE NOT age BETWEEN 20 and 22`);
testQuery(`SELECT name FROM ${table} WHERE age IN (30, 35, 40)`);
testQuery(`SELECT name FROM ${table} WHERE age IN (22, id, "test")`);
testQuery(`SELECT name FROM ${table} WHERE 0`);
testQuery(`SELECT name FROM ${table} WHERE 1`);
testQuery(`SELECT name FROM ${table} WHERE 1 AND age = 22`);

testError(`SELECT select FROM ${table} id = 1`);
testError(`SELECT WHERE FROM ${table} id = 1`);
testError(`SELECT GROUP FROM ${table} id = 1`);
testError(`SELECT HAVING FROM ${table} id = 1`);
testError(`SELECT ORDER FROM ${table} id = 1`);

// Overall aggregation
testQuery(`SELECT COUNT(DISTINCT age) AS n_ages FROM ${table}`);
testQuery(`SELECT AVG(age) AS avg_age FROM ${table}`);
testQuery(`SELECT COUNT(DISTINCT age), greeting FROM ${table}`, { test: matchGroups, skip: 1 }); // FIXME fails on default agg - sqlite seems to use LAST
testQuery(`SELECT COUNT(*) FROM ${table}`, { test: matchGroups });
testQuery(`SELECT COUNT(DISTINCT age) AS uniq_age FROM ${table}`);
testQuery(`SELECT AVG(age) FROM ${table}`, { test: matchGroups });
testQuery(`SELECT MAX(age), * FROM ${table}`, { test: matchGroups, skip: 1 }); // FIXME #55
testQuery(`SELECT age, age AS a2, age AS a3, * FROM ${table}`, { skip: 1 }); // FIXME #55

// ORDER BY
testQuery(`SELECT name, age FROM ${table} ORDER BY age`);
testQuery(`SELECT name, isActive FROM ${table} ORDER BY age ASC`);
testQuery(`SELECT greeting FROM ${table} ORDER BY greeting DESC`);
testQuery(`SELECT * FROM ${table} ORDER BY age, company DESC, isActive ASC`);
testQuery(`SELECT name, age AS a FROM ${table} ORDER BY age`);
testQuery(`SELECT name, age AS a FROM ${table} ORDER BY a`);

// GROUP BY
testQuery(`SELECT fruit AS food, MAX(age) FROM ${table} GROUP BY food`, { test: matchGroupsInAnyOrder });
testQuery(`SELECT fruit AS food, MAX(age) FROM ${table} GROUP BY fruit`, { test: matchGroupsInAnyOrder });
testQuery(`SELECT fruit AS food, age AS oldness FROM ${table} GROUP BY food, age`, { test: matchGroupsInAnyOrder });
testQuery(`SELECT company, COUNT(name), MAX(age) FROM ${table} GROUP BY company`, { test: matchGroupsInAnyOrder });
testQuery(`SELECT company, COUNT(age), COUNT(DISTINCT age) FROM ${table} GROUP BY company`, { test: matchGroupsInAnyOrder });
testQuery(`SELECT COUNT(*) FROM ${table} GROUP BY fruit`, { test: matchGroupsInAnyOrder });
testQuery(`SELECT age, COUNT(DISTINCT name) AS names FROM ${table} GROUP BY age ORDER BY age`);

// HAVING
testQuery(`SELECT age, COUNT(DISTINCT name) AS names, AVG(unread) as u FROM ${table} GROUP BY age HAVING names > 1 AND u < 10 ORDER BY age`);
testQuery(`SELECT age, COUNT(DISTINCT name) AS names FROM ${table} GROUP BY age HAVING names = 1 ORDER BY age`);
testQuery(`SELECT age, COUNT(DISTINCT name) AS names FROM ${table} GROUP BY age HAVING COUNT(name) = 1 ORDER BY age`);
testQuery(`SELECT age, COUNT(DISTINCT name) AS names FROM ${table} GROUP BY age HAVING COUNT(name) = 1 AND AVG(unread) > 1 ORDER BY age`);
testQuery(`SELECT age, COUNT(DISTINCT name) AS names FROM ${table} GROUP BY age HAVING COUNT(name) < age`, { test: matchGroupsInAnyOrder });
testQuery(`SELECT age as age2, COUNT(DISTINCT name) AS names FROM ${table} GROUP BY age HAVING names < age2`, { test: matchGroupsInAnyOrder });
testQuery(`SELECT fruit FROM ${table} GROUP BY fruit HAVING COUNT(name) = COUNT(DISTINCT name)`, { test: matchGroupsInAnyOrder });
testQuery(`SELECT age, COUNT(name) FROM test GROUP BY age HAVING 1`, { test: matchGroupsInAnyOrder });
testQuery(`SELECT age, COUNT(name) FROM test GROUP BY age HAVING (1 OR 0) AND COUNT(NAME) > 2`, { test: matchGroupsInAnyOrder });


// LIMIT
testQuery(`SELECT * FROM ${table} LIMIT 1`);
testQuery(`SELECT name, greeting AS message, age FROM ${table} LIMIT 10, 100`);
testQuery(`SELECT * FROM ${table} ORDER BY name DESC LIMIT 4`);

// Mixture
testQuery(`SELECT age, COUNT(name) AS count, COUNT(DISTINCT company) AS distinct_companies FROM ${table} GROUP BY age ORDER BY age DESC LIMIT 1, 1`);
testQuery(`select age, count(name) AS count, count(distinct company) AS distinct_companies FROM ${table} group by age order by age desc limit 1, 1`);

// TODO more!
