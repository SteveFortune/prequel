import _ from "lodash";
import { binaryPredicates, unaryPredicates } from "./predicates";
import getAggregateFunction from "./aggregates";

const DEFAULT_SORT_ORDER = "asc";

export default function query(parsedQuery, data) {
  const input = data[parsedQuery.source];

  const filtered = parsedQuery.where
    ? where(input, parsedQuery.where)
    : input;

  const grouped = parsedQuery.group
    ? group(filtered, parsedQuery.fields, parsedQuery.group)
    : filtered;

  const ordered = parsedQuery.order
    ? order(grouped, parsedQuery.order)
    : grouped;

  const projected = select(ordered, parsedQuery.fields);

  return projected;
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
    let projectedName = getOutputFieldName(field);

    // TODO this is a hack - we need some better way of
    //  the projection knowing that a field has a constructed
    //  name (e.g. from a function).
    out[projectedName] = row[field.outputName || field.name];
  }

  return out;
}

function getOutputFieldName(field) {
  if(field.as) return field.as;
  if(field.aggregate) {
    return `${field.aggregate.toLowerCase()}_${field.name}`;
  }

  return field.name;
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

function group(input, outputFields, { fields: groupFields }) {
  const rowGroups = _.groupBy(input, row => getGroupKey(row, groupFields));
  return _.map(rowGroups, (rows, key) => getGroupOutputRow(key, rows, outputFields));
}

function getGroupKey(row, groupFields) {
  return JSON.stringify(_.pick(row, groupFields));
}

function getGroupOutputRow(key, groupRows, outputFields) {
  return outputFields.reduce((row, field) => {
    const outputName = getOutputFieldName(field);

    // TODO this is a hack - it should be possible to pass through constructed
    //  output field names witout mutating here. Could we label all fields
    //  with their output name before running any query steps?
    field.outputName = outputName;

    const outputValue = field.aggregate
      ? aggregate(groupRows, field, field.aggregate)
      : getDefaultGroupValue(groupRows, field);

    row[outputName] = outputValue;
    return row;
  }, {});
}

function aggregate(groupRows, field, aggregateName) {
  const inputValues = _.pluck(groupRows, field.name);
  const func = getAggregateFunction(aggregateName);
  return func(inputValues);
}

function getDefaultGroupValue(groupRows, field) {
  return groupRows[0][field.name];
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
