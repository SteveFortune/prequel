export function getSyntaxErrorMessage(syntaxError, query) {
  const headline = getHeadline(syntaxError, query);
  const snippet = getSnippet(syntaxError.location, query);
  const indicator = getIndicator(syntaxError.location, query);

  return [headline, snippet, indicator].join("\n");
}

// The number of input chars to print before and after the error
const contextSize = 30;

function getHeadline(e, query) {
  if (e.found !== null) {
    const positionMessage = (getErrorLines(query).length > 1)
      ? `on line ${getErrorLineNum(e.location)}:`
      : "in:";
    return `Unexpected token ${e.found} ${positionMessage}`;
  }

  return "Unexpected end of query:";
}

function getErrorLine(loc, query) {
  const index = getErrorLineNum(loc) - 1;
  return getErrorLines(query)[index];
}

function getErrorLineNum(loc) {
  return loc.start.line;
}

function getErrorLines(query) {
  return query.split(/[\r\n]+/g);
}

function getQueryOffsets(loc, line) {
  const start = Math.max(loc.start.column - 1 - contextSize, 0);
  const stop = Math.min(loc.end.column - 1 + contextSize, line.length);
  return [start, stop];
}

function getSnippetPrefix(startOffset) {
  return startOffset > 0 ? "…" : "";
}

function getSnippetSuffix(stopOffset, query) {
  return stopOffset < query.length ? "…" : "";
}

function getSnippet(loc, query) {
  const line = getErrorLine(loc, query);
  const [start, stop] = getQueryOffsets(loc, line);
  const prefix = getSnippetPrefix(start);
  const suffix = getSnippetSuffix(stop, query);

  return prefix + line.slice(start, stop) + suffix;
}

function getIndicator(loc, query) {
  const line = getErrorLine(loc, query);
  const [start, stop] = getQueryOffsets(loc, line);
  const prefix = getSnippetPrefix(start);

  const errorStart = loc.start.column - 1 - start;
  const errorEnd = loc.end.column - 1 - start;
  const errorWidth = Math.max(errorEnd - errorStart, 1);

  return " ".repeat(errorStart + prefix.length) + "^".repeat(errorWidth);
}
