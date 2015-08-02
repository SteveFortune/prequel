import test from "tape";
import prequelQuery from "../../src/query";
import prequelParse from "../../src/parser";
import createDb, { testData } from "./test-harness";

const table = "test";
const db = createDb(table);

function testQuery(sql) {
  test(sql, function(t) {
    const parsed = prequelParse(sql);
    const prequelResult = prequelQuery(parsed, { [table]: testData });
    const dbResult = db.query(sql);

    t.deepEqual(prequelResult, dbResult);
    t.end();
  });
}

// TODO write the tests!
testQuery(`SELECT name FROM ${table}`);
