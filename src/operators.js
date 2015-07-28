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

const and = (a, b) => a && b;
const or = (a, b) => a || b;
const not = (a) => !a;

export const binaryBoolean = {
  "AND": and,
  "&&": and,
  "OR": or,
  "||": or
};

export const unaryBoolean = {
  "NOT": not,
  "!": not
};
