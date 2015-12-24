//
// PegJS SQL (subset) grammar
// ES5 only because the built JS parser is called with `eval` and
//  is not transpiled (#53)
//

{
  // Roll up unrolled "recursive" rules for left-associative expressions
  // HT http://stackoverflow.com/a/30798758/2806996
  var reduce = function(first, rest) {
    if(!rest) return first;

    return rest.reduce(function(lhs, curr) {
      return { op: curr.op, lhs: lhs, rhs: curr.rhs }
    }, first);
  }

  // Return the text of the matched rule in upper case
  var T = function() {
    return text().toUpperCase();
  }

  // Return an obect describing an operation call
  //  with left-, right-, and "third"-hand arguments
  var OP = function(op, lhs, rhs, ths) {
    var result = { op: op }
    if (lhs != null) result.lhs = lhs;
    if (rhs != null) result.rhs = rhs;
    if (ths != null) result.ths = ths;

    return result;
  }

  var reservedWords = [
    "SELECT", "WHERE", "GROUP", "HAVING", "ORDER", "LIMIT"
  ];

  // Returns true if `s` is a reserved word
  var RESERVED = function(s) {
    return reservedWords.indexOf(s) >= 0;
  }
}

start
  = query

query
  = select:select_clause where:where_clause? group:group_clause? having:having_clause? order:order_clause? limit:limit_clause? {
    if(where) select.where = where;
    if(group) select.group = group;
    if(having) select.having = having;
    if(order) select.order = order;
    if(limit) select.limit = limit;
    return select;
  }

select_clause
  = select __ fields:field_list __ from __ source:source { return { fields: fields, source: source } }

where_clause
  = __ where __ condition:where_condition { return condition }

where_condition
  = expression

group_clause
  = __ group_by __ fields:identifier_list { return { fields: fields } }

having_clause
  = __ having __ condition:having_condition { return condition }

having_condition
  = expression

order_clause
  = __ order_by __ order:order_tuple_list { return order }

order_tuple_list
  = head:order_tuple_delim tail:order_tuple_list { return [head].concat(tail) }
  / only:order_tuple { return [only] }

order_tuple_delim
  = tuple:order_tuple list_delim { return tuple }

order_tuple
  = field:identifier __ order:order_dir { return { field: field, order: order } }
  / field:identifier { return { field: field } }

order_dir
  = literal:literal_order_dir { return { literal: literal } }
  / ref:identifier { return { reference: ref } }

literal_order_dir = asc / desc

limit_clause
  = __ limit __ limit:limit_parameters { return limit }

select = "SELECT"i
from = "FROM"i
where = "WHERE"i
group_by = "GROUP BY"i
having = "HAVING"i
order_by = "ORDER BY"i
limit = "LIMIT"i
as = "AS"i
asc = "ASC"i { return T() }
desc = "DESC"i { return T() }

limit_parameters
  = offset:limit_parameter list_delim count:limit_parameter { return { offset: offset, count: count } }
  / count:limit_parameter { return { count: count } }

limit_parameter
  = n:int { return { literal: n } }
  / ref:identifier { return { reference: ref } }

field_list
  = head:field_delim tail:field_list { return [head].concat(tail) }
  / only:field { return [only] }
  / star { return [] }

field_delim
  = field:field list_delim { return field }

field
  = expr:field_expression __ as __ as:identifier { expr.as = as; return expr }
  / expr:field_expression { return expr }

field_expression
  = agg:aggregated_field { return agg }
  / name:identifier { return { name: name } }

identifier_list
  = head:identifier_delim tail:identifier_list { return [head].concat(tail) }
  / only:identifier { return [only] }

identifier_delim
  = identifier:identifier list_delim { return identifier }

identifier
  = chars:identifier_chars !{ return RESERVED(chars) } { return chars }

identifier_chars
  = head:identifier_start tail:identifier_rest* { return head + tail.join("") }

identifier_start
  = char:[$_a-zA-Z] { return char }

identifier_rest
  = char:[$_a-zA-Z0-9] { return char }

aggregated_field
  = special_aggregated_field
  / aggregate:aggregate_function lp name:identifier rp { return { aggregate: aggregate, source: name } }

special_aggregated_field
  = count lp distinct __ name:identifier rp { return { aggregate: "COUNT_DISTINCT", source: name } }
  / aggregate:count lp name:star rp { return { aggregate: aggregate, source: name } }

aggregate_function
  = avg / count / first / last / max / min / sum

avg = t:"AVG"i { return T() }
count = t:"COUNT"i { return T() }
first = t:"FIRST"i { return T() }
last = t:"LAST"i { return T() }
max = t:"MAX"i { return T() }
min = t:"MIN"i { return T() }
sum = t:"SUM"i { return T() }
distinct = t:"DISTINCT"i { return T() }
star = "*";

is_null = "IS NULL"i { return T() }
is_not_null = "IS NOT NULL"i { return T() }
and = "AND"i { return T() }
or = "OR"i { return T() }
not = "NOT"i { return T() }
between = "BETWEEN"i { return T() }
in = "IN"i { return T() }

// Expressions use unrolled recursion
// HT http://stackoverflow.com/a/30798758/2806996

expression
  = or_expression

or_expression
  = first:and_expression rest:(__ op:or_operator __ rhs:and_expression { return OP(op, null, rhs) })* { return reduce(first, rest) }

and_expression
  = first:base_expression rest:(__ op:and_operator __ rhs:base_expression { return OP(op, null, rhs) })* { return reduce(first, rest) }

operator_expression
  = not:not_expression { return not }
  / lhs:operand __ op:unary_operator { return OP(op, lhs) }
  / lhs:operand _ op:binary_operator _ rhs:operand { return OP(op, lhs, rhs) }
  / between:between_expression { return between }
  / in_expr:in_expression { return in_expr }
  / identifier:identifier { return { identifier: identifier } }

base_expression
  = operator_expression
  / lp expr:expression rp { return expr }

operand
  = agg:aggregated_field { return agg }
  / literal:literal { return { literal: literal } }
  / identifier:identifier { return { identifier: identifier } }

operand_list
  = head:operand_delim tail:operand_list { return [head].concat(tail) }
  / only:operand { return [only] }

operand_delim
  = operand:operand list_delim { return operand }

// modelling the operand as lhs makes evaluation simpler
// since it can be assumed that all operators have at least an LHS argument.
not_expression
  = op:not_operator __ lhs:base_expression { return OP(op, lhs) }

// use "ths" for "third-hand-side" operand of ternary operator. Perhaps an ordered
//  argument list would be clearer.
between_expression
  = lhs:operand __ op:between __ rhs:operand __ and __ ths:operand { return OP(op, lhs, rhs, ths) }

in_expression
  = lhs:operand __ op:in __ lp rhs:operand_list rp { return OP(op, lhs, rhs) }

binary_operator
  = "=" / ">=" / "<>" / ">" / "<=" / "<" / "!=" / like / rlike

like = "LIKE"i { return T() }

rlike
  = "RLIKE"i { return T() }
  / "REGEXP"i { return T() }
  / "=~"
  / "~"

unary_operator
  = is_null / is_not_null

and_operator
  = and / "&&"

or_operator
  = or / "||"

not_operator
  = not / "!"

literal
  = int
  / string

source
  = identifier

list_delim
  = "," _

int = digits:[0-9]+ { return parseInt(digits.join(""), 10) }

string
  = sq chars:[^']* sq { return chars.join("") }
  / dq chars:[^"]* dq { return chars.join("") }

sq = "'"
dq = '"'

lp = "(" _ { return "(" }
rp = _ ")" { return ")"}


// mandatory whitespace
__ = [ \t\r\n]+

// optional whitespace
_ = [ \t\r\n]*
