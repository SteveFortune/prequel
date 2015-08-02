{
  // Roll up unrolled "recursive" rules for left-associative expressions
  // HT http://stackoverflow.com/a/30798758/2806996
  var reduce = function(first, rest) {
    if(!rest) return first;

    return rest.reduce(function(lhs, curr) {
      return { op: curr.op, lhs, rhs: curr.rhs }
    }, first);
  }
}

start
  = query

query
  = select:select where:where? group:group? order:order? limit:limit? {
    if(where) select.where = where;
    if(group) select.group = group;
    if(order) select.order = order;
    if(limit) select.limit = limit;
    return select;
  }

select
  = "SELECT" _ fields:field_list _ "FROM" _ source:source { return { fields, source } }

where
  = _ "WHERE" _ condition:where_condition { return condition }

where_condition
  = expression

group
  = _ "GROUP BY" _ fields:identifier_list { return { fields } }

order
  = _ "ORDER BY" _ order:order_tuple_list { return order }

order_tuple_list
  = head:order_tuple_delim tail:order_tuple_list { return [head].concat(tail) }
  / only:order_tuple { return [only] }

order_tuple_delim
  = tuple:order_tuple list_delim { return tuple }

order_tuple
  = field:identifier _ order:order_dir { return { field, order } }
  / field:identifier { return { field } }

order_dir
  = "ASC"
  / "DESC"

limit
  = _ "LIMIT" _ limit:limit_parameters { return limit }

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
  = expr:field_expression _ "AS" _ as:identifier { expr.as = as; return expr }
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
  / aggregate:aggregate_function "(" name:identifier ")" { return { aggregate, name } }

special_aggregated_field
  = "COUNT(DISTINCT" _ name:identifier ")" { return { aggregate: "COUNT_DISTINCT", name } }

aggregate_function
  = "AVG" / "COUNT" / "FIRST" / "LAST" / "MAX" / "MIN" / "SUM"

// Expressions use unrolled recursion
// HT http://stackoverflow.com/a/30798758/2806996

expression
  = or_expression

or_expression
  = first:and_expression rest:(_ op:or_operator _ rhs:and_expression { return { op, rhs }  })* { return reduce(first, rest) }

and_expression
  = first:base_expression rest:(_ op:and_operator _ rhs:base_expression { return { op, rhs } })* { return reduce(first, rest) }

operator_expression
  = lhs:operand _ op:unary_operator { return { lhs, op } }
  / lhs:operand _ op:binary_operator _ rhs:operand { return { lhs, op, rhs } }
  / reference:identifier { return { reference } }

base_expression
  = operator_expression
  / lp expr:expression rp { return expr }

operand
  = literal:literal { return { literal } }
  / identifier:identifier { return { identifier } }


binary_operator
  = "=" / ">=" / "<>" / ">" / "<=" / "<" / "!="

unary_operator
  = "IS NULL"
  / "IS NOT NULL"

and_operator
  = "AND" / "&&"

or_operator
  = "OR" / "||"

unary_boolean_operator
  = "NOT" / "!"

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
