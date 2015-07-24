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
  = offset:int _ count:int { return { offset: +offset, count: +count } }
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

// Super simplified for now
expression
  = field:identifier _ op:binary_operator _ value:literal { return { field, op, value } }
  / field:identifier _ op:unary_operator { return { field, op } }

binary_operator
  = "=" / ">=" / "<>" / ">" / "<=" / "<" / "!="

unary_operator
  = "IS NULL"
  / "IS NOT NULL"

literal
  = int
  / string

source
  = identifier

list_delim
  = ", "

int = digits:[0-9]+ { return parseInt(digits.join("")) }

string = sq chars:[^']* sq { return chars.join("") }
string = dq chars:[^"]* dq { return chars.join("") }

sq = "'"
dq = '"'

_
  = [ ]+
