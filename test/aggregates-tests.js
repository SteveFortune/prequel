import test from "tape";
import lookup, * as aggs from "../src/aggregates";

test("Count", (t) => {
  t.equal(aggs.count([1, 2, 3]), 3);
  t.end();
});

test("Max", (t) => {
  t.equal(aggs.max([54, 97, 2, -100]), 97);
  t.end();
});

test("Min", (t) => {
  t.equal(aggs.min([54, 97, 2, -100]), -100);
  t.end();
});

test("Sum", (t) => {
  t.equal(aggs.sum([1, 2, 3, 4]), 10);
  t.end();
});

test("Mean", (t) => {
  t.equal(aggs.mean([1, 2, 3, 6]), 3);
  t.end();
});

test("Count distinct", (t) => {
  t.equal(aggs.countDistinct([1, 1, 1, 8, 9, 9, 10]), 4);
  t.end();
});

test("Aggregation name lookup", (t) => {
  t.equal(lookup("COUNT"), aggs.count);
  t.equal(lookup("MIN"), aggs.min);
  t.equal(lookup("MAX"), aggs.max);
  t.equal(lookup("SUM"), aggs.sum);
  t.equal(lookup("AVG"), aggs.mean);
  t.equal(lookup("COUNT_DISTINCT"), aggs.countDistinct);
  t.end();
});
