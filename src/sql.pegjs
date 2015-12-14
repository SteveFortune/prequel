{
  // Roll up unrolled "recursive" rules for left-associative expressions
  // HT http://stackoverflow.com/a/30798758/2806996
  var reduce = function(first, rest) {
    if(!rest) return first;

    return rest.reduce(function(lhs, curr) {
      return { op: curr.op, lhs, rhs: curr.rhs }
    }, first);
  }

  // Return the text of the matched rule in upper case
  var T = function() {
    return text().toUpperCase();
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
  = select _ fields:field_list _ from _ source:source { return { fields, source } }

where_clause
  = _ where _ condition:where_condition { return condition }

where_condition
  = expression

group_clause
  = _ group_by _ fields:identifier_list { return { fields } }

having_clause
  = _ having _ condition:having_condition { return condition }

having_condition
  = expression

order_clause
  = _ order_by _ order:order_tuple_list { return order }

order_tuple_list
  = head:order_tuple_delim tail:order_tuple_list { return [head].concat(tail) }
  / only:order_tuple { return [only] }

order_tuple_delim
  = tuple:order_tuple list_delim { return tuple }

order_tuple
  = field:identifier _ order:order_dir { return { field, order } }
  / field:identifier { return { field } }

order_dir = asc / desc

limit_clause
  = _ limit _ limit:limit_parameters { return limit }

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
  = offset:int list_delim count:int { return { offset: +offset, count: +count } }
  / count:int { return { count: +count } }

field_list
  = head:field_delim tail:field_list { return [head].concat(tail) }
  / only:field { return [only] }
  / "*" { return [] }

field_delim
  = field:field list_delim { return field }

field
  = expr:field_expression _ as _ as:identifier { expr.as = as; return expr }
  / expr:field_expression { return expr }

field_expression
  = agg:aggregated_field { return agg }
  / name:identifier { return { name } }

identifier_list
  = head:identifier_delim tail:identifier_list { return [head].concat(tail) }
  / only:identifier { return [only] }

identifier_delim
  = identifier:identifier list_delim { return identifier }

identifier
  = chars:[$_a-zA-Z0-9]+  { return chars.join("") }

aggregated_field
  = special_aggregated_field
  / aggregate:aggregate_function "(" name:identifier ")" { return { aggregate, source: name } }

special_aggregated_field
  = count "(" distinct _ name:identifier ")" { return { aggregate: "COUNT_DISTINCT", source: name } }
  / aggregate:count lp name:"*" rp { return { aggregate, source: name } }

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

// Expressions use unrolled recursion
// HT http://stackoverflow.com/a/30798758/2806996

expression
  = or_expression

or_expression
  = first:and_expression rest:(_ op:or_operator _ rhs:and_expression { return { op, rhs }  })* { return reduce(first, rest) }

and_expression
  = first:base_expression rest:(_ op:and_operator _ rhs:base_expression { return { op, rhs } })* { return reduce(first, rest) }

operator_expression
  = not:not_expression { return not }
  / lhs:operand _ op:unary_operator { return { lhs, op } }
  / lhs:operand _ op:binary_operator _ rhs:operand { return { lhs, op, rhs } }
  / between:between_expression { return between }
  / reference:identifier { return { reference } }

base_expression
  = operator_expression
  / lp expr:expression rp { return expr }

operand
  = agg:aggregated_field { return agg }
  / literal:literal { return { literal } }
  / identifier:identifier { return { identifier } }

// modelling the operand as lhs makes evaluation simpler
// since it can be assumed that all operators have at least an LHS argument.
not_expression
  = op:not_operator _ lhs:base_expression { return { op, lhs } }

// use "ths" for "third-hand-side" operand of ternary operator. Perhaps an ordered
//  argument list would be clearer.
between_expression
  = lhs:operand _ op:between _ rhs:operand _ and _ ths:operand { return { op, lhs, rhs, ths } }

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
  = ", "

int = digits:[0-9]+ { return parseInt(digits.join("")) }

string
  = sq chars:[^']* sq { return chars.join("") }
  / dq chars:[^"]* dq { return chars.join("") }

sq = "'"
dq = '"'

lp = "(" { return "(" }
rp = ")" { return ")"}

_
  = [ ]+
