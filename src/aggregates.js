/* eslint "camelcase": [0] */
const mapping = {
  count,
  min,
  max,
  sum,
  avg: mean,
  count_distinct: countDistinct
};

export default function getAggregateFunction(op) {
  return mapping[op.toLowerCase()];
}

export function max(input) {
  return Math.max(...input);
}

export function count(values) {
 return values.length;
}

export function min(input) {
  return Math.min(...input);
}

export function sum(input) {
  return input.reduce((total, e) => total + e);
}

export function mean(input) {
  return sum(input) / count(input);
}

export function countDistinct(input) {
  return new Set(input).size;
}
