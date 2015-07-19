import _ from "lodash";
import { binaryPredicates, unaryPredicates } from "./predicates";

export default function query(parsedQuery, data) {
  const target = data[parsedQuery.source];

  // TODO compose a lazily evaluated function
  const mapped = select(target, parsedQuery.fields);
  const filtered = parsedQuery.where
    ? where(mapped, parsedQuery.where)
    : mapped;

    console.log(parsedQuery.order);

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
  return target.map(row => _.pick(row, fields));
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

function order(input, orderOptions) {
  const sorted = _.sortBy(input, orderOptions.field);

  if(orderOptions.reverse) {
    sorted.reverse();
  }

  return sorted;
}
