const mapping = {
  "COUNT": count,
  "MAX": max
};

export default function getAggregateFunction(op) {
  return mapping[op];
}

export function count(values) {
 return values.length;
}

export function max(input) {
  return Math.max(...input);
}
