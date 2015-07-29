import _ from "lodash";
import { operators, operatorTypes } from "./operators";
import getAggregateFunction from "./aggregates";

const DEFAULT_SORT_ORDER = "asc";

export default function executeQuery(parsedQuery, data) {
  const input = data[parsedQuery.source];

  const filtered = where(input, parsedQuery, data);
  const aggregated = group(filtered, parsedQuery);
  const ordered = order(aggregated, parsedQuery);
  const limited = limit(ordered, parsedQuery);
  const projected = select(limited, parsedQuery);

  return projected;
}

function select(target, { fields }) {
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

function where(input, { where: condition }, data={}) {
  if(condition) {
    return evaluateCondition(input, condition, data);
  } else {
    return input;
  }
}

function evaluateCondition(input, condition, data) {
  if(condition.op) {
    return evaluateOperatorPredicate(input, condition, data);
  } else if(condition.reference) {
    const referencedDatum = data[condition.reference];
    return evaluateReferencePredicate(input, referencedDatum);
  } else {
    throw new Error(`Invalid WHERE condition: ${JSON.stringify(condition)}`);
  }
}

function evaluateOperatorPredicate(input, condition, data) {
  const [predicate, type] = getOperator(condition.op);
  return input.filter((row) => predicate(row[condition.field], condition.value));
}

function evaluateReferencePredicate(input, referenced) {
  const predicate = _.isFunction(referenced) ? referenced : () => referenced;
  return input.filter(predicate);
}

function getOperator(op) {
  return operators[op];
}

function group(input, query) {
  if(query.group) {
    return aggregateByGroup(input, query);
  } else if(query.fields.some(field => field.aggregate)) {
    return aggregateOverall(input, query);
  } else {
    return input;
  }
}

function aggregateByGroup(input, { fields: outputFields, group: groupBy }) {
  const rowGroups = _.groupBy(input, row => getGroupKey(row, groupBy.fields));
  return _.map(rowGroups, rows => getGroupOutputRow(rows, outputFields));
}

function aggregateOverall(input, { fields }) {
  return [getGroupOutputRow(input, fields)];
}

function getGroupKey(row, groupFields) {
  return JSON.stringify(_.pick(row, groupFields));
}

function getGroupOutputRow(groupRows, outputFields) {
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

function order(input, { order: fieldOrders }) {
  if(fieldOrders) {
    const fields = fieldOrders.map(o => o.field);
    const orders = fieldOrders.map(getSortOrder);

    return _.sortByOrder(input, fields, orders);
  } else {
    return input;
  }
}

function getSortOrder(orderTuple) {
  return orderTuple.order
    ? orderTuple.order.toLowerCase()
    : DEFAULT_SORT_ORDER;
}

function limit(input, { limit: limitParams }) {
  if(limitParams) {
    const offset = limitParams.offset || 0;

    return input.slice(offset, offset + limitParams.count);
  } else {
    return input;
  }
}
