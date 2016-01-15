import { negate } from "./util";

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

const isNull = (a) => a == null;
const isNotNull = negate(isNull);

const coalesce = (list) => {
  for (const value of list) {
    if (isNotNull(value)) {
      return value;
    }
  }
  return null;
};

const operators = {
  "=": (a, b) => a === b,
  "!=": (a, b) => a !== b,
  "<>": (a, b) => a !== b,
  "<": (a, b) => a < b,
  "<=": (a, b) => a <= b,
  ">": (a, b) => a > b,
  ">=": (a, b) => a >= b,
  "IS NULL": isNull,
  "IS NOT NULL": isNotNull,
  "BETWEEN": (a, b, c) => a >= b && a <= c,
  "IN": (a, b) =>  b.indexOf(a) >= 0,
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
  "STRCMP": (a, b) => a.localeCompare(b),
  "COALESCE": coalesce,
};

export default operators;
