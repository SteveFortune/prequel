start
  = query

query
  = select_order
  / select

select
  = select_where
  / select_simple

select_order
  = select:select _ order:order { select.order = order; return select }

select_base
  = "SELECT" _ fields:fields _ "FROM" _ source:source { return { fields, source } }

select_simple
  = select_base

select_where
  = select:select_base _ where:where {
    select.where = where;
    return select;
  }

where
  = "WHERE" _ condition:where_condition { return condition }

where_condition
  = expression

order_base = "ORDER BY" _ order:order_tuple_list { return order }

order_tuple_list
  = head:order_tuple_delim tail:order_tuple_list { return [head].concat(tail) }
  / only:order_tuple { return [only] }

order_tuple
  = field:identifier _ order:order_dir { return { field, order } }
  / field:identifier { return { field } }

order_tuple_delim
  = tuple:order_tuple list_delim { return tuple }

order_dir
  = "ASC"
  / "DESC"

order
  = order_desc
  / order_asc
  / order_base

order_asc
 = order:order_base _ "ASC" { return order }

order_desc
  = order:order_base _ "DESC" { order.reverse = true; return order }

// Super simplified for now
expression
  = field:identifier _ op:binary_operator _ value:literal { return { field, op, value } }
  / field:identifier _ op:unary_operator { return { field, op } }

binary_operator
  = "=" / ">=" / "<>" / ">" / "<=" / "<" / "!="

unary_operator
  = "IS NULL"
  / "IS NOT NULL"

fields
  = head:field_and_delim tail:fields {
    // no es6 in node yet - peg needs native support for eval
    // [head, ...tail]
    return [head].concat(tail);
  }
  / only:field { return [only] }
  / "*" { return [] }

field_and_delim
  = field:field list_delim { return field }

field
  = name:identifier _ "AS" _ as:identifier { return { name, as } }
  / name:identifier { return { name } }

literal
  = int
  / string

identifier
  = chars:[$_a-zA-Z0-9]+  { return chars.join("") }

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
