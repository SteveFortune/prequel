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

const like = (value, wildcardPattern) => {
  let inEscape = false;

  const patternTokens = wildcardPattern.split("")
    .reduce((tokens, c) => {
      if (inEscape) {
        if(c === "%" || c === "_") {
          tokens.push(c);
        } else {
          tokens.push(`\\${c}`);
        }
        inEscape = false;
      } else if(c === "\\") {
          inEscape = true;
      } else if (c === "%") {
        tokens.push(".*?");
      } else if (c === "_") {
        tokens.push(".");
      } else {
        tokens.push(c);
      }

      return tokens;
    }, []);

    const pattern = new RegExp(patternTokens.join(""), "i");
    return pattern.test(value);
};

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
  "BETWEEN": (a, b, c) => a >= b && a <= c,
  "AND": and,
  "&&": and,
  "OR": or,
  "||": or,
  "NOT": not,
  "!": not,
  "LIKE": like,
  "REGEXP": matches,
  "RLIKE": matches,
  "=~": matches,
  "~": matches,
};

export default operators;
