import { groupBy, mapObject, pickKeys, sortByOrder } from "./util";
import operators from "./operators";
import getAggregateFunction from "./aggregates";
import buildResolve from "./resolve";

const DEFAULT_SORT_ORDER = "asc";

export default function executeQuery(parsedQuery, data) {
  const input = [...data[parsedQuery.source]];
  const query = enrichQuery(parsedQuery, data);

  const filtered = where(input, query);
  const aggregated = group(filtered, query);
  const ordered = order(aggregated, query);
  const limited = limit(ordered, query);
  const projected = select(limited, query);

  return projected;
}

function enrichQuery(parsedQuery, data) {
  return Object.assign({}, parsedQuery, {
    fields: getOutputFields(parsedQuery),
    resolve: buildResolve(parsedQuery, data)
  });
}

function getOutputFields({ fields }) {
  return fields.map(field => Object.assign({}, field, {
    outputName: getOutputFieldName(field)
  }));
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
    out[field.outputName] = getOutputValue(field, row);
  }

  return out;
}

function getOutputValue(field, row) {
  if(field.name) {
    return row[field.name];
  } else if(field.aggregate) {
    return row[field.outputName];
  } else {
    throw new Error(`Unexpected output field: ${JSON.stringify(field)}`);
  }
}

function getOutputFieldName(field) {
  if(field.as) {
    return field.as;
  } else if(field.aggregate) {
    return getAggregateOutputFieldName(field);
  } else {
    return field.name;
  }
}

function getAggregateOutputFieldName(field) {
  return `${field.aggregate.toLowerCase()}_${field.source}`;
}

function selectAll(target) {
  return target;
}

function where(input, { where: condition, resolve }) {
  if(condition) {
    return filter(input, condition, resolve);
  } else {
    return input;
  }
}

function filter(input, condition, resolve) {
  const predicate = buildExpression(condition, resolve);
  return input.filter(predicate);
}

// Return a function that evaluates an expression for the given input

function buildExpression(expr, resolve) {
  if(expr.op) {
    const func = buildOperatorExpression(expr, resolve);
    return (row, rowNum) => {
      return func(row, rowNum);
    };
  } else if (expr.identifier) {
    return (row, rowNum) => resolve(expr.identifier, row, rowNum);
  } else if(expr.literal) {
    return () => expr.literal;
  } else if (expr.reference) {
    return (row, rowNum) => resolve(expr.reference, row, rowNum);
  } else {
    throw new Error(`unexpected expression: ${JSON.stringify(expr)}`);
  }
}

function buildOperatorExpression(expr, resolve) {
  const evaluateOperator = getOperator(expr.op);

  const lhs = buildExpression(expr.lhs, resolve);
  const rhs = expr.rhs
    ? buildExpression(expr.rhs, resolve)
    : undefined;

  return (row, rowNum) => {
    const lhsResult = lhs(row, rowNum);
    const rhsResult = rhs ? rhs(row, rowNum) : undefined;
    return evaluateOperator(lhsResult, rhsResult);
  };
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

function aggregateByGroup(input, { fields: outputFields, group: groupOptions }) {
  const rowGroups = groupBy(input, row => getGroupKey(row, groupOptions.fields));
  return mapObject(rowGroups, rows => getGroupOutputRow(rows, outputFields));
}

function aggregateOverall(input, { fields }) {
  return [getGroupOutputRow(input, fields)];
}

function getGroupKey(row, groupFields) {
  return JSON.stringify(pickKeys(row, groupFields));
}

function getGroupOutputRow(groupRows, outputFields) {
  return outputFields.reduce((row, field) => {

    const outputValue = field.aggregate
      ? aggregate(groupRows, field, field.aggregate)
      : getDefaultGroupValue(groupRows, field);

    row[field.outputName] = outputValue;
    return row;
  }, {});
}

function aggregate(groupRows, field, aggregateName) {
  const inputValues = groupRows.map(row => row[field.source]);
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

    return sortByOrder(input, fields, orders);
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
