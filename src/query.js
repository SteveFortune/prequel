import { groupBy, mapObject, pickKeys, sortByOrder } from "./util";
import operators from "./operators";
import getAggregateFunction from "./aggregates";
import { getAggregateFieldName } from "./field-names";
import enrichQuery from "./enrich";

const DEFAULT_SORT_ORDER = "asc";

export default function executeQuery(parsedQuery, data) {
  const input = [...data[parsedQuery.source]];
  const query = enrichQuery(parsedQuery, data);

  const filtered = where(input, query);
  const aggregated = group(filtered, query);
  const postFiltered = having(aggregated, query);
  const ordered = order(postFiltered, query);
  const limited = limit(ordered, query);
  const projected = select(limited, query);

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
  for(const field of fields) {
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
  } else if (expr.aggregate) {
    const identifier = getAggregateFieldName(expr);
    return (row, rowNum) => resolve(identifier, row, rowNum);
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

function aggregateByGroup(input, { fields, aggregations, group: groupOptions }) {
  const rowGroups = groupBy(input, row => getGroupKey(row, groupOptions.fields));
  return mapObject(rowGroups, rows => getGroupOutputRow(rows, { fields, aggregations }));
}

function aggregateOverall(input, query) {
  return [getGroupOutputRow(input, query)];
}

function getGroupKey(row, groupFields) {
  return JSON.stringify(pickKeys(row, groupFields));
}

function getGroupOutputRow(groupRows, { fields, aggregations }) {
  // Non-aggregated values are included:
  // - GROUP BY fields have the same value for each row in a group
  // - Non-grouped, non-aggregated fields are implicitly aggregated.
  // The same default aggregation covers both cases.
  const nonAggregatedValues = fields
    .filter(field => !field.aggregate)
    .reduce((row, field) => {
      row[field.outputName] = getDefaultGroupValue(groupRows, field);
      return row;
    }, {});

  const aggregatedValues = aggregations.reduce((row, agg) => {
    // Aggregations can have several output field names
    // (e.g. SELECT COUNT(name) AS a HAVING COUNT(name) > 10 uses
    //  the same COUNT(name) as the default name and `a`.
    const values = aggregate(groupRows, agg.source, agg.aggregate);
    agg.outputFields.forEach(outputField => { row[outputField] = values; });

    return row;
  }, {});

  return Object.assign({}, nonAggregatedValues, aggregatedValues);
}

function aggregate(groupRows, fieldName, aggregateName) {
  const inputValues = groupRows.map(row => row[fieldName]);
  const func = getAggregateFunction(aggregateName);
  return func(inputValues);
}

function getDefaultGroupValue(groupRows, field) {
  return groupRows[0][field.name];
}

function having(input, { having: condition, resolve }) {
  if(condition) {
    return filter(input, condition, resolve);
  } else {
    return input;
  }
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
