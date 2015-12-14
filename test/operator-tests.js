/* eslint dot-notation: [0] */
import test from "tape";
import operators from "../src/operators";

test("=", (t) => {
  const eq = operators["="];

  t.true(eq("test", "test"));
  t.false(eq(undefined, null));
  t.end();
});

test("!=", (t) => {
  const ne = operators["!="];

  t.false(ne("test", "test"));
  t.true(ne(undefined, null));
  t.end();
});

test("<> is the same as !=", (t) => {
  const ne = operators["!="];
  const ne2 = operators["<>"];

  t.equal(ne("test", "test"), ne2("test", "test"));
  t.equal(ne(undefined, null), ne2(undefined, null));
  t.end();
});

test(">", (t) => {
  const gt = operators[">"];

  t.true(gt(2, 1));
  t.false(gt(1, 1));
  t.end();
});

test(">=", (t) => {
  const gte = operators[">="];

  t.true(gte(2, 1));
  t.true(gte(1, 1));
  t.end();
});

test("<", (t) => {
  const lt = operators["<"];

  t.true(lt(1, 2));
  t.false(lt(1, 1));
  t.end();
});

test("<=", (t) => {
  const lte = operators["<="];

  t.true(lte(1, 2));
  t.true(lte(1, 1));
  t.end();
});

test("IS NULL", (t) => {
  const isNull = operators["IS NULL"];

  t.true(isNull(undefined));
  t.true(isNull(null));
  t.false(isNull(0));
  t.false(isNull(false));
  t.false(isNull(""));
  t.false(isNull([]));
  t.end();
});

test("IS NOT NULL", (t) => {
  const isNotNull = operators["IS NOT NULL"];

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
  const and = operators["AND"];

  t.true(and(1, 1));
  t.false(and(1, 0));
  t.false(and(0, 1));
  t.false(and(0, 0));
  t.end();
});

test("&& is the same as AND", (t) => {
  const ampAmp = operators["&&"];

  t.true(ampAmp(1, 1));
  t.false(ampAmp(1, 0));
  t.false(ampAmp(0, 1));
  t.false(ampAmp(0, 0));
  t.end();
});

test("OR", (t) => {
  const or = operators["OR"];

  t.true(or(1, 1));
  t.true(or(1, 0));
  t.true(or(0, 1));
  t.false(or(0, 0));
  t.end();
});

test("|| is the same as OR", (t) => {
  const pipePipe = operators["||"];

  t.true(pipePipe(1, 1));
  t.true(pipePipe(1, 0));
  t.true(pipePipe(0, 1));
  t.false(pipePipe(0, 0));
  t.end();
});

test("NOT", (t) => {
  const not = operators["NOT"];

  t.true(not(0));
  t.false(not(1));
  t.end();
});

test("! is the same as NOT", (t) => {
  const bang = operators["!"];

  t.true(bang(0));
  t.false(bang(1));
  t.end();
});

test("REGEXP", (t) => {
  const rlike = operators["REGEXP"];
  t.true(rlike("hello", "ll"));
  t.false(rlike("hello", "LL"));
  t.true(rlike("hello", new RegExp("LL", "i")));
  // TODO inline /pattern/flags strings
  t.end();
});

test("RLIKE is the same as REGEXP", (t) => {
  t.equal(operators["RLIKE"], operators["REGEXP"]);
  t.end();
});

test("=~ is the same as REGEXP", (t) => {
  t.equal(operators["RLIKE"], operators["REGEXP"]);
  t.end();
});

test("~ is the same as REGEXP", (t) => {
  t.equal(operators["RLIKE"], operators["REGEXP"]);
  t.end();
});
