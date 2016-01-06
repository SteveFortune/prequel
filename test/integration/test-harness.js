import { readFileSync as read, writeFileSync } from "fs";
import { join } from "path";

import sqljs from "sql.js";
import { mapObject } from "../../src/util";

export const testData = JSON.parse(read(join(__dirname, "..", "data", "data.json")));

export default function init(tableName = "test") {
  const db = new sqljs.Database();

  createTable();
  insertData();

  function createTable() {
    const columns = mapObject(testData[0], (v, k) => `${k} ${getSqlType(v)}`);
    const ddl = `CREATE TABLE "${tableName}" (${columns.join(", ")});`;

    db.run(ddl);
  }

  function insertData() {
    const columns = Object.keys(testData[0]);

    testData.forEach(row => {
      const values = columns.map(key => getSqlValue(row[key]));
      const sql = `INSERT INTO "${tableName}" (${columns.join(", ")}) VALUES (${values.join(", ")})`;

      db.exec(sql);
    });
  }

  function getSqlType(jsValue) {
    const type = typeof jsValue;

    if(type === "string") return "STRING";
    else if(type === "number") return Number.isInteger(jsValue) ? "INT" : "REAL";
    else if (type === "boolean") return "INT";
    else if (!jsValue) return "NULL";
    else throw Error(`Unexpected input value: ${jsValue}`);
  }

  function getSqlValue(jsValue) {
    const type = typeof jsValue;

    if(type === "string") return `"${jsValue}"`;
    else if(type === "boolean") return +jsValue;
    else if(type === "number") return jsValue;
    else return "null";
  }

  return {
    testData,
    query(sql) {
      const stmt = db.prepare(sql);
      const results = [];
      while(stmt.step()) {
        results.push(stmt.getAsObject());
      }

      return results;
    },
    write(filePath) {
      const data = db.export();
      const buffer = new Buffer(data);
      writeFileSync(filePath, buffer);
    }
  };

}
