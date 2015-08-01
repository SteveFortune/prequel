const and = (a, b) => a && b;
const or = (a, b) => a || b;
const not = (a) => !a;

const operators = {
  "=": (a, b) => a === b,
  "!=": (a, b) => a !== b,
  "<>": (a, b) => a !== b,
  "<": (a, b) => a < b,
  "<=": (a, b) => a <= b,
  ">": (a, b) => a > b,
  ">=": (a, b) => a >= b,
  "IS NULL": a => a == null,
  "IS NOT NULL": a => a != null,
  "AND": and,
  "&&": and,
  "OR": or,
  "||": or,
  "NOT": not,
  "!": not
};

export default operators;
