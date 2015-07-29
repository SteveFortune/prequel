/* eslint dot-notation: [0] */

import test from "tape";
import { operators, types } from "../src/operators";

const {
  comparisonBinary: cb,
  comparisonUnary: cu,
  booleanBinary: bb,
  booleanUnary: bu
} = types;

test("=", (t) => {
  const [eq, type] = operators["="];
  t.equal(type, cb);

  t.true(eq("test", "test"));
  t.false(eq(undefined, null));
  t.end();
});

test("!=", (t) => {
  const [ne, type] = operators["!="];
  t.equal(type, cb);

  t.false(ne("test", "test"));
  t.true(ne(undefined, null));
  t.end();
});

test("<> is the same as !=", (t) => {
  const [ne, type] = operators["!="];
  const [ne2, type2] = operators["<>"];
  t.equal(type, cb);
  t.equal(type2, cb);

  t.equal(ne("test", "test"), ne2("test", "test"));
  t.equal(ne(undefined, null), ne2(undefined, null));
  t.end();
});

test(">", (t) => {
  const [gt, type] = operators[">"];
  t.equal(type, cb);

  t.true(gt(2, 1));
  t.false(gt(1, 1));
  t.end();
});

test(">=", (t) => {
  const [gte, type] = operators[">="];
  t.equal(type, cb);

  t.true(gte(2, 1));
  t.true(gte(1, 1));
  t.end();
});

test("<", (t) => {
  const [lt, type] = operators["<"];
  t.equal(type, cb);

  t.true(lt(1, 2));
  t.false(lt(1, 1));
  t.end();
});

test("<=", (t) => {
  const [lte, type] = operators["<="];
  t.equal(type, cb);

  t.true(lte(1, 2));
  t.true(lte(1, 1));
  t.end();
});

test("IS NULL", (t) => {
  const [isNull, type] = operators["IS NULL"];
  t.equal(type, cu);

  t.true(isNull(undefined));
  t.true(isNull(null));
  t.false(isNull(0));
  t.false(isNull(false));
  t.false(isNull(""));
  t.false(isNull([]));
  t.end();
});

test("IS NOT NULL", (t) => {
  const [isNotNull, type] = operators["IS NOT NULL"];
  t.equal(type, cu);

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
  const [and, type] = operators["AND"];
  t.equal(type, bb);

  t.true(and(1, 1));
  t.false(and(1, 0));
  t.false(and(0, 1));
  t.false(and(0, 0));
  t.end();
});

test("&& is the same as AND", (t) => {
  const [ampAmp, type] = operators["&&"];
  t.equal(type, bb);

  t.true(ampAmp(1, 1));
  t.false(ampAmp(1, 0));
  t.false(ampAmp(0, 1));
  t.false(ampAmp(0, 0));
  t.end();
});

test("OR", (t) => {
  const [or, type] = operators["OR"];
  t.equal(type, bb);

  t.true(or(1, 1));
  t.true(or(1, 0));
  t.true(or(0, 1));
  t.false(or(0, 0));
  t.end();
});

test("|| is the same as OR", (t) => {
  const [pipePipe, type] = operators["||"];
  t.equal(type, bb);

  t.true(pipePipe(1, 1));
  t.true(pipePipe(1, 0));
  t.true(pipePipe(0, 1));
  t.false(pipePipe(0, 0));
  t.end();
});

test("NOT", (t) => {
  const [not, type] = operators["NOT"];
  t.equal(type, bu);

  t.true(not(0));
  t.false(not(1));
  t.end();
});

test("! is the same as NOT", (t) => {
  const [bang, type] = operators["!"];
  t.equal(type, bu);

  t.true(bang(0));
  t.false(bang(1));
  t.end();
});
