/*eslint-disable*/
var test = require('tape');
var parse = require("../../dist/parser").default;
var execute = require("../../dist/execute").default;

require("babel-polyfill");

//
// Test that the non-template-string API works in ES5 environments
// Needs babel-polyfill but no transpilation.
//
test("Run a query without ES6 syntax", function(t) {
  var input = [1, 2, 3, 4, 5].map(function(i) { return { a: i } });
  var query = "SELECT a FROM $1 WHERE a > 3";
  var result = execute(parse(query), { "$1": input });

  t.deepEqual(result, [{ a: 4 }, { a: 5 }]);
  t.end();
});
