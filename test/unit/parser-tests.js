import test from "tape";
import parse, { SyntaxError } from "../../src/parser";

// Test that `upperCaseQuery` parses the same in upper and lower case
//  and returns the parse result.
// `upperCaseQuery` parameters must be lower case.
function parseInsensitive(t, upperCaseQuery) {
  const lowerCaseQuery = upperCaseQuery.toLowerCase();
  const upperCaseParsed = parse(upperCaseQuery);
  t.deepEqual(upperCaseParsed, parse(lowerCaseQuery));

  return upperCaseParsed;
}

test("SELECT one field", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat");
  t.deepEqual(out.fields, [{ name: "f1" }]);
  t.end();
});

test("SELECT two fields", (t) => {
  const out = parseInsensitive(t, "SELECT f1, f2 FROM wat");
  t.deepEqual(out.fields, ["f1", "f2"].map(name => ({ name })));
  t.end();
});

test("SELECT more than two fields", (t) => {
  const out = parseInsensitive(t, "SELECT f1, f2, f3, f4 FROM wat");
  t.deepEqual(out.fields, ["f1", "f2", "f3", "f4"].map(name => ({ name })));
  t.end();
});

test("SELECT * produces empty field list", (t) => {
  const out = parseInsensitive(t, "SELECT * FROM wat");
  t.deepEqual(out.fields, []);
  t.end();
});

test("SELECT AS", (t) => {
  const out = parseInsensitive(t, "SELECT f1, f2 AS g FROM wat");
  t.deepEqual(out.fields, [{ name: "f1" }, { name: "f2", as: "g" }]);
  t.end();
});

test("FROM", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat");
  t.deepEqual(out.source, "wat");
  t.end();
});


test("Upper, lower and mixed case queries can be parsed", (t) => {
  const upper = "SELECT f1 AS f FROM wat";
  const mixed = "Select f1 As f From wat";
  const lower = "select f1 as f from wat";

  t.deepEqual(parseInsensitive(t, upper), parseInsensitive(t, lower));
  t.deepEqual(parseInsensitive(t, upper), parseInsensitive(t, mixed));
  t.end();
});

test("WHERE binary condition with literal", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat WHERE f1 <> 9");
  t.deepEqual(out.where, { lhs: { identifier: "f1" }, op: "<>", rhs: { literal: 9 } });
  t.end();
});

test("WHERE unary condition", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat WHERE f1 IS NOT NULL");
  t.deepEqual(out.where, { lhs: { identifier: "f1" }, op: "IS NOT NULL" });
  t.end();
});

test("WHERE BETWEEN", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat WHERE a BETWEEN b AND c");
  t.deepEqual(out.where, { lhs: { identifier: "a" }, op: "BETWEEN", rhs: { identifier: "b" }, ths: { identifier: "c" } });
  t.end();
});

test("WHERE IN", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat WHERE a IN (1, 2)");
  t.deepEqual(out.where, { lhs: { identifier: "a" }, op: "IN", rhs: [{ literal: 1 }, { literal: 2 }] });
  t.end();
});

// NOT's argument is parsed as LHS because it simplifies evaluation semantics
test("WHERE NOT", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat WHERE NOT a = 2");
  t.deepEqual(out.where, { lhs: { lhs: { identifier: "a" }, op: "=", rhs: { literal: 2 } }, op: "NOT" });
  t.end();
});

test("WHERE !", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat WHERE ! a = 2");
  t.deepEqual(out.where, { lhs: { lhs: { identifier: "a" }, op: "=", rhs: { literal: 2 } }, op: "!" });
  t.end();
});

test("WHERE binary boolean condition", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat WHERE f1 = 10 AND f2 > 5");
  t.deepEqual(out.where, {
    op: "AND",
    lhs: { lhs: { identifier: "f1" }, op: "=", rhs: { literal: 10 } },
    rhs: { lhs: { identifier: "f2" }, op: ">", rhs: { literal: 5 } }
  });
  t.end();
});

test("Boolean conditions are left-associative", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat WHERE f1 = 1 AND f2 > 2 AND f3 IS NOT NULL");

  const e1 = { lhs: { identifier: "f1" }, op: "=", rhs: { literal: 1 } };
  const e2 = { lhs: { identifier: "f2" }, op: ">", rhs: { literal: 2 } };
  const e3 = { lhs: { identifier: "f3" }, op: "IS NOT NULL" };

  const expected = { op: "AND", lhs: { op: "AND", lhs: e1, rhs: e2 }, rhs: e3 };

  t.deepEqual(out.where, expected);
  t.end();
});

test("AND has higher precedence than OR", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat WHERE f1 = 1 OR f2 > 2 AND f3 IS NOT NULL");

  const e1 = { lhs: { identifier: "f1" }, op: "=", rhs: { literal: 1 } };
  const e2 = { lhs: { identifier: "f2" }, op: ">", rhs: { literal: 2 } };
  const e3 = { lhs: { identifier: "f3" }, op: "IS NOT NULL" };

  const expected = { op: "OR", lhs: e1, rhs: { op: "AND", lhs: e2, rhs: e3 } };

  t.deepEqual(out.where, expected);
  t.end();
});

test("NOT has higher precedence than AND", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat WHERE f1 = 1 AND NOT f2 > 2");

  const e1 = { lhs: { identifier: "f1" }, op: "=", rhs: { literal: 1 } };
  const e2 = { lhs: { identifier: "f2" }, op: ">", rhs: { literal: 2 } };

  const expected = { op: "AND", lhs: e1, rhs: { op: "NOT", lhs: e2 } };

  t.deepEqual(out.where, expected);
  t.end();
});

test("Parentheses have higher precendence than AND", (t) => {
  const out = parseInsensitive(t, "SELECT * FROM wat WHERE (f1 = 1 OR f2 > 2) AND f3 IS NOT NULL");

  const e1 = { lhs: { identifier: "f1" }, op: "=", rhs: { literal: 1 } };
  const e2 = { lhs: { identifier: "f2" }, op: ">", rhs: { literal: 2 } };
  const e3 = { lhs: { identifier: "f3" }, op: "IS NOT NULL" };

  const expected = { op: "AND", lhs: { op: "OR", lhs: e1, rhs: e2 }, rhs: e3 };

  t.deepEqual(out.where, expected);
  t.end();
});

test("WHERE reference", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat WHERE $ref");
  t.deepEqual(out.where, { identifier: "$ref"});
  t.end();
});

test("ORDER BY", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat ORDER BY f1");
  t.deepEqual(out.order, [{ field: "f1" }]);
  t.end();
});

test("ORDER BY explicit ASC", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat ORDER BY f1 ASC");
  t.deepEqual(out.order, [{ field: "f1", order: "ASC" }]);
  t.end();
});

test("ORDER BY DESC", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat ORDER BY f1 DESC");
  t.deepEqual(out.order, [{ field: "f1", order: "DESC" }]);
  t.end();
});

test("ORDER BY several fields", (t) => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat ORDER BY f1 DESC, f2, f3 ASC");
  t.deepEqual(out.order, [
    { field: "f1", order: "DESC" },
    { field: "f2" },
    { field: "f3", order: "ASC" }
  ]);
  t.end();
});

test("GROUP BY one field", t => {
  const out = parseInsensitive(t, "SELECT f1 FROM wat GROUP BY f1");
  t.deepEqual(out.group, { fields: ["f1"] });
  t.end();
});

test("GROUP BY several fields", t => {
  const out = parseInsensitive(t, "SELECT f1, f2 FROM wat GROUP BY f1, f2");
  t.deepEqual(out.group, { fields: ["f1", "f2"] });
  t.end();
});

test("SELECT regular aggregate function", t => {
  const out = parseInsensitive(t, "SELECT COUNT(f1) FROM wat");
  t.deepEqual(out.fields, [{ source: "f1", aggregate: "COUNT" }]);
  t.end();
});

test("SELECT COUNT(DISTINCT x)", t => {
  const out = parseInsensitive(t, "SELECT COUNT(DISTINCT x) FROM wat");
  t.deepEqual(out.fields, [{ source: "x", aggregate: "COUNT_DISTINCT" }]);
  t.end();
});

test("SELECT COUNT(*)", t => {
  const out = parseInsensitive(t, "SELECT COUNT(*) FROM wat");
  t.deepEqual(out.fields, [{ source: "*", aggregate: "COUNT" }]);
  t.end();
});

test("SELECT mixed fields and aggregate fields", t => {
  const out = parseInsensitive(t, "SELECT f1, FIRST(f2), COUNT(DISTINCT f3) FROM wat");
  t.deepEqual(out.fields, [{ name: "f1" }, { source: "f2", aggregate: "FIRST" }, { source: "f3", aggregate: "COUNT_DISTINCT" }]);
  t.end();
});

test("LIMIT count", t => {
  const out = parseInsensitive(t, "SELECT * FROM x LIMIT 1");
  t.deepEqual(out.limit, { count: 1 });
  t.end();
});

test("LIMIT offset count", t => {
  const out = parseInsensitive(t, "SELECT * FROM x LIMIT 5, 10");
  t.deepEqual(out.limit, { offset: 5, count: 10 });
  t.end();
});

test("HAVING COUNT(x) > 10", t => {
  const out = parseInsensitive(t, "SELECT f, COUNT(x) FROM x GROUP BY y HAVING COUNT(x) > 10");
  t.deepEqual(out.having, { lhs: { source: "x", aggregate: "COUNT" }, op: ">", rhs: { literal: 10 } });
  t.end();
});

// Most whitespace is mandatory
test("Mandatory whitespace", t => {
  const q1 = "SELECT * FROM x WHERE y = z AND y IN (1, 2, 3)";
  const q2 = `SELECT
    *   FROM  x   WHERE
     y = z
      AND    y    in    (1, 2, 3)`;

  const out1 = parseInsensitive(t, q1);
  const out2 = parseInsensitive(t, q2);
  t.deepEqual(out1, out2);
  t.end();
});

// List delimiters, parentheses and most binary operators have optional whitespace
test("Optional whitespace", t => {
  const q1 = "SELECT a FROM x WHERE (y = z AND x < 2) OR (z > 3  AND y IN (1, 2))";
  const q2 = `SELECT a FROM x WHERE (y=z AND x
         <   2    ) OR (      z  >3 AND y IN (     1,2
         )
       )`;

  const out1 = parseInsensitive(t, q1);
  const out2 = parseInsensitive(t, q2);
  t.deepEqual(out1, out2);
  t.end();
});

test("Parsing an invalid query throws SyntaxError", t => {
  const badQuery = "SELECT * FROM )";
  try {
    parse(badQuery);
    t.fail();
  } catch (e) {
    // Testing some of the pegjs SyntaxError properties
    //  that the prequel error reporter will depend on
    t.true(e instanceof SyntaxError);
    t.equal(e.found, ")");
    t.ok(e.expected);
    t.equal(e.location.start.offset, 14);
    t.equal(e.location.end.offset, 15);
  }

  t.end();
});
