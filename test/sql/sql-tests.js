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

// * Allow the keys COUNT(DISTINCT a) and count_distinct_a to be treated as the same
// * Some of these cases also need order-independent matching...
// FIXME

// function matchGroups(t, prequelResults, dbResults) {
//   const valuesMatch = prequelResults.every((result, i) =>
//     t.deepEqual(_.values(result), _.values(dbResults[i])));
//
//   const keysMatch = prequelResults.every((prequelResult, i) => {
//     const dbResult = dbResults[i];
//
//     return _(dbResult).keys().all(key => {
//       if(prequelResult[key]) return true;
//       const prequelKey = key.replace(/\(| /g, "_").slice(0, -1);
//       return prequelResult[prequelKey];
//     }).value();
//   });
//
//   t.true(valuesMatch);
//   t.true(keysMatch);
//
//   t.end();
// }

// SELECT
testQuery(`SELECT name FROM ${table}`);
testQuery(`SELECT name, age FROM ${table}`);
testQuery(`SELECT name, age, greeting AS msg FROM ${table}`);
testQuery(`SELECT * FROM ${table}`);
testQuery(`SELECT name AS nom, age FROM ${table}`);
testQuery(`select name as nom, age FROM ${table}`);

// WHERE
testQuery(`SELECT name, greeting FROM ${table} WHERE unread > 20`);

// Overall aggregation
testQuery(`SELECT COUNT(DISTINCT age) AS n_ages FROM ${table}`);
testQuery(`SELECT AVG(age) AS avg_age FROM ${table}`);
// testQuery(`SELECT COUNT(DISTINCT age), greeting FROM ${table}`, { test: matchGroups});
// testQuery(`SELECT COUNT(*) FROM ${table}`, { test: matchGroups });


// ORDER BY
testQuery(`SELECT name, age FROM ${table} ORDER BY age`);
testQuery(`SELECT name, isActive FROM ${table} ORDER BY age ASC`);
testQuery(`SELECT greeting FROM ${table} ORDER BY greeting DESC`);
testQuery(`SELECT * FROM ${table} ORDER BY age, company DESC, isActive ASC`);

// GROUP BY
// testQuery(`SELECT fruit AS food, age FROM ${table} GROUP BY fruit, age`, { test: matchGroups });
// testQuery(`SELECT company, COUNT(name), MAX(age) FROM ${table} GROUP BY company`, { test: matchGroups });
// testQuery(`SELECT company, COUNT(age), COUNT(DISTINCT age) FROM ${table} GROUP BY company`, { test: matchGroups });
// testQuery(`SELECT COUNT(*) FROM ${table} GROUP BY fruit`, { test: matchGroups });
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

// TODO:
// * sorting, grouping by alias
// * write test function for matching COUNT(DISTINCT a) and count_distinct_a
// * test for matching with/without strict order (e.h. GROUP BY without ORDER BY)
