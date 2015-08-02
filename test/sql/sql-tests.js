import test from "tape";
import prequelQuery from "../../src/query";
import prequelParse from "../../src/parser";
import createDb, { testData } from "./test-harness";

const table = "test";
const db = createDb(table);

function testQuery(sql, testFunction) {
  test(sql, function(t) {
    const parsed = prequelParse(sql);
    const prequelResult = prequelQuery(parsed, { [table]: testData });
    const dbResult = db.query(sql);

    if(testFunction) {
      testFunction(t, prequelResult, dbResult);
    } else {
      t.deepEqual(prequelResult, dbResult);
      t.end();
    }
  });
}

testQuery(`SELECT name FROM ${table}`);
testQuery(`SELECT * FROM ${table}`);
testQuery(`SELECT * FROM ${table} LIMIT 1`);
testQuery(`SELECT name, greeting AS message, age FROM ${table} LIMIT 10, 100`);
testQuery(`SELECT COUNT(DISTINCT age) AS ages FROM ${table}`);
testQuery(`SELECT AVG(age) AS avg_age FROM ${table}`);
testQuery(`SELECT age, COUNT(DISTINCT name) AS names FROM ${table} GROUP BY age ORDER BY age`);

// TODO...
