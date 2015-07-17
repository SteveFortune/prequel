export const binaryPredicates = {
  "=": (a, b) => a === b,
  "!=": (a, b) => a !== b,
  "<>": (a, b) => a !== b,
  "<": (a, b) => a < b,
  "<=": (a, b) => a <= b,
  ">": (a, b) => a > b,
  ">=": (a, b) => a >= b
};

export const unaryPredicates = {
  "IS NULL": a => a == null,
  "IS NOT NULL": a => a != null
};
