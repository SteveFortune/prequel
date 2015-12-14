import tape from "tape";
import _ from "lodash";

import prequelQuery from "../../src/query";
import prequelParse from "../../src/parser";
import createDb, { testData } from "./test-harness";

const table = "test";
const db = createDb(table);

function testQuery(sql, { test=deepEqual, log=false, only=false } = {}) {
  const tapeFunc = only ? tape.only : tape;

  tapeFunc(sql, function(t) {
    const dbResult = db.query(sql);
    if(log) {
      t.comment(JSON.stringify(dbResult));
    }

    const parsed = prequelParse(sql);
    const prequelResult = prequelQuery(parsed, { [table]: testData });

    test(t, prequelResult, dbResult);
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


// Overall aggregation
testQuery(`SELECT COUNT(DISTINCT age) AS n_ages FROM ${table}`);
testQuery(`SELECT AVG(age) AS avg_age FROM ${table}`);
// testQuery(`SELECT COUNT(DISTINCT age), greeting FROM ${table}`, { test: matchGroups}); // FIXME fails on default agg - sqlite seems to use LAST
testQuery(`SELECT COUNT(*) FROM ${table}`, { test: matchGroupsInAnyOrder });


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



// LIMIT
testQuery(`SELECT * FROM ${table} LIMIT 1`);
testQuery(`SELECT name, greeting AS message, age FROM ${table} LIMIT 10, 100`);
testQuery(`SELECT * FROM ${table} ORDER BY name DESC LIMIT 4`);

// Mixture
testQuery(`SELECT age, COUNT(name) AS count, COUNT(DISTINCT company) AS distinct_companies FROM ${table} GROUP BY age ORDER BY age DESC LIMIT 1, 1`);
testQuery(`select age, count(name) AS count, count(distinct company) AS distinct_companies FROM ${table} group by age order by age desc limit 1, 1`);

// TODO more!
