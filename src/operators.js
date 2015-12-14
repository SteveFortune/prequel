const and = (a, b) => a && b;
const or = (a, b) => a || b;
const not = (a) => !a;

const matches = (value, pattern) => {
  const regexp = compileRegExp(pattern);
  return regexp.test(value);
};

function compileRegExp(pattern) {
  if(pattern instanceof RegExp) {
    return pattern;
  }

  return new RegExp(pattern);
}

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
  "!": not,
  "REGEXP": matches,
  "RLIKE": matches,
  "=~": matches,
  "~": matches
};

export default operators;
