export const types = {
  comparisonBinary: Symbol("binary comparison"),
  comparisonUnary: Symbol("unary comparison"),
  booleanBinary: Symbol("binary boolean"),
  booleanUnary: Symbol("unary boolean")
};

const and = (a, b) => a && b;
const or = (a, b) => a || b;
const not = (a) => !a;

export const operators = {
  "=": [(a, b) => a === b, types.comparisonBinary],
  "!=": [(a, b) => a !== b, types.comparisonBinary],
  "<>": [(a, b) => a !== b, types.comparisonBinary],
  "<": [(a, b) => a < b, types.comparisonBinary],
  "<=": [(a, b) => a <= b, types.comparisonBinary],
  ">": [(a, b) => a > b, types.comparisonBinary],
  ">=": [(a, b) => a >= b, types.comparisonBinary],
  "IS NULL": [a => a == null, types.comparisonUnary],
  "IS NOT NULL": [a => a != null, types.comparisonUnary],
  "AND": [and, types.booleanBinary],
  "&&": [and, types.booleanBinary],
  "OR": [or, types.booleanBinary],
  "||": [or, types.booleanBinary],
  "NOT": [not, types.booleanUnary],
  "!": [not, types.booleanUnary]
};
