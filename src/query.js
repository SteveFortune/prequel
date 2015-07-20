import _ from "lodash";
import { binaryPredicates, unaryPredicates } from "./predicates";

const DEFAULT_SORT_ORDER = "asc";

export default function query(parsedQuery, data) {
  const target = data[parsedQuery.source];

  // TODO compose a lazily evaluated function
  const mapped = select(target, parsedQuery.fields);

  const filtered = parsedQuery.where
    ? where(mapped, parsedQuery.where)
    : mapped;

  const ordered = parsedQuery.order
    ? order(filtered, parsedQuery.order)
    : filtered;

  return ordered;
}

function select(target, fields) {
  return fields.length === 0
    ? selectAll(target)
    : selectFields(target, fields);
}

function selectFields(target, fields) {
  return target.map(row => projectFields(row, fields));
}

function projectFields(row, fields) {
  const out = {};
  for(let field of fields) {
    let projectedName = field.as || field.name;
    out[projectedName] = row[field.name];
  }

  return out;
}

function selectAll(target) {
  return target;
}

function where(input, condition) {
  const predicate = getPredicate(condition.op);
  return input.filter((row) => predicate(row[condition.field], condition.value));
}

function getPredicate(op) {
  const predicate = binaryPredicates[op] || unaryPredicates[op];
  if(!predicate) {
    throw new Error(`Unrecognised operation: ${op}`);
  }

  return predicate;
}

function order(input, fieldOrders) {
  const fields = fieldOrders.map(o => o.field);
  const orders = fieldOrders.map(getSortOrder);

  return _.sortByOrder(input, fields, orders);
}

function getSortOrder(orderTuple) {
  return orderTuple.order
    ? orderTuple.order.toLowerCase()
    : DEFAULT_SORT_ORDER;
}
