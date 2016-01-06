#!/usr/bin/env babel-node
/*eslint-disable no-console*/
import path from "path";
import fs from "fs";
import createTestDb from "./test-harness";

// Script to write test data to a sqlite file for testing
const filePath = process.argv[2] || "test-data.sqlite";
const table = process.argv[3] || "testdata";
const absolutePath = path.resolve(filePath);

try {
  fs.statSync(absolutePath);
  console.log(`${absolutePath} exists. Not writing.`);
} catch (e) {
  createTestDb().write(absolutePath);
  console.log(`Wrote test data to ${absolutePath}`);
}
