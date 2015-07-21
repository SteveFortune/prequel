start
  = query

query
  = select:select where:where? order:order?  {
    if(where) select.where = where;
    if(order) select.order = order;
    return select;
  }

select
  = "SELECT" _ fields:field_list _ "FROM" _ source:source { return { fields, source } }

where
  = _ "WHERE" _ condition:where_condition { return condition }

where_condition
  = expression

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

field_list
  = head:field_delim tail:field_list { return [head].concat(tail) }
  / only:field { return [only] }
  / "*" { return [] }

field_delim
  = field:field list_delim { return field }

field
  = name:identifier _ "AS" _ as:identifier { return { name, as } }
  / name:identifier { return { name } }

identifier_list
  = head:identifier_delim tail:identifier_list { return [head].concat(tail) }
  / only:identifier { return [only] }

identifier_delim
  = identifier:identifier list_delim { return identifier }

identifier
  = chars:[$_a-zA-Z0-9]+  { return chars.join("") }

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
