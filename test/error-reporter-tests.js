import test from "tape";
import parser from "../build/parser.js";
import { getSyntaxErrorMessage } from "../src/error-reporter";

// Test errors by generating a pegjs SyntaxError
function testError(t, query, testFn) {
  try {
    parser.parse(query);
    t.fail();
  } catch (e) {
    const message = getSyntaxErrorMessage(e, query);
    testFn(message);
  }
}

// TODO assert on marker position
test("end of input error", (t) => {
  const query = "SELECT * FROM ";
  testError(t, query, (message) => {
    t.comment(message);
    t.true(message.match(/^Unexpected end of query/));
    t.end();
  });
});

test("single line syntax error", (t) => {
  const query = "SELECT * FROM sdfsdfs>>> fds4rwesfd ";
  testError(t, query, (message) => {
    t.comment(message);
    t.true(message.match(/^Unexpected token >/));
    t.end();
  });
});

test("long query syntax error", (t) => {
  const query = "SELECT * FROM t WHERE x = y AND z > 10 OR (name != 'bob' AND NOT >>,) GROUP BY color HAVING COUNT(something) > 10 ORDER BY name DESC";
  testError(t, query, (message) => {
    t.comment(message);
    t.true(message.match(/^Unexpected token >/));
    t.end();
  });
});

test("multi line syntax error", (t) => {
  const query = `SELECT * FROM
    sdfsdfs>>> fds4rwesfd
    GROUP BY legit`;

  testError(t, query, (message) => {
    t.comment(message);
    t.true(message.match(/^Unexpected token > on line 2/));
    t.end();
  });
});
