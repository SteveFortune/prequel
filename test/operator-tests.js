/* eslint dot-notation: [0] */

import test from "tape";
import { binaryPredicates as binary, unaryPredicates as unary, binaryBoolean, unaryBoolean } from "../src/operators";

test("=", (t) => {
  const eq = binary["="];
  t.true(eq("test", "test"));
  t.false(eq(undefined, null));
  t.end();
});

test("!=", (t) => {
  const ne = binary["!="];
  t.false(ne("test", "test"));
  t.true(ne(undefined, null));
  t.end();
});

test("<> is the same as !=", (t) => {
  const ne = binary["!="];
  const ne2 = binary["<>"];

  t.equal(ne("test", "test"), ne2("test", "test"));
  t.equal(ne(undefined, null), ne2(undefined, null));
  t.end();
});

test(">", (t) => {
  const gt = binary[">"];
  t.true(gt(2, 1));
  t.false(gt(1, 1));
  t.end();
});

test(">=", (t) => {
  const gte = binary[">="];
  t.true(gte(2, 1));
  t.true(gte(1, 1));
  t.end();
});

test("<", (t) => {
  const lt = binary["<"];
  t.true(lt(1, 2));
  t.false(lt(1, 1));
  t.end();
});

test("<=", (t) => {
  const lte = binary["<="];
  t.true(lte(1, 2));
  t.true(lte(1, 1));
  t.end();
});

test("IS NULL", (t) => {
  const isNull = unary["IS NULL"];
  t.true(isNull(undefined));
  t.true(isNull(null));
  t.false(isNull(0));
  t.false(isNull(false));
  t.false(isNull(""));
  t.false(isNull([]));
  t.end();
});

test("IS NOT NULL", (t) => {
  const isNotNull = unary["IS NOT NULL"];
  t.false(isNotNull(undefined));
  t.false(isNotNull(null));
  t.true(isNotNull(0));
  t.true(isNotNull(1));
  t.true(isNotNull(false));
  t.true(isNotNull(""));
  t.true(isNotNull([]));
  t.end();
});

test("AND", (t) => {
  const and = binaryBoolean["AND"];
  t.true(and(1, 1));
  t.false(and(1, 0));
  t.false(and(0, 1));
  t.false(and(0, 0));
  t.end();
});

test("&& is the same as AND", (t) => {
  const ampAmp = binaryBoolean["&&"];
  t.true(ampAmp(1, 1));
  t.false(ampAmp(1, 0));
  t.false(ampAmp(0, 1));
  t.false(ampAmp(0, 0));
  t.end();
});

test("OR", (t) => {
  const or = binaryBoolean["OR"];
  t.true(or(1, 1));
  t.true(or(1, 0));
  t.true(or(0, 1));
  t.false(or(0, 0));
  t.end();
});

test("|| is the same as OR", (t) => {
  const pipePipe = binaryBoolean["||"];
  t.true(pipePipe(1, 1));
  t.true(pipePipe(1, 0));
  t.true(pipePipe(0, 1));
  t.false(pipePipe(0, 0));
  t.end();
});

test("NOT", (t) => {
  const not = unaryBoolean["NOT"];
  t.true(not(0));
  t.false(not(1));
  t.end();
});

test("! is the same as NOT", (t) => {
  const bang = unaryBoolean["!"];
  t.true(bang(0));
  t.false(bang(1));
  t.end();
});
