import { groupBy, mapObject, pickKeys, sortByOrder, exists, isArray, result } from "./util";
import operators from "./operators";
import getAggregateFunction from "./aggregates";
import { getAggregateFieldName } from "./field-names";
import compileQuery from "./compile";

const ASC = "asc";
const DESC = "desc";
const DEFAULT_SORT_ORDER = ASC;
const WHERE = "WHERE";
const HAVING = "HAVING";

export default function executeQuery(parsedQuery, data) {
  const input = [...data[parsedQuery.source]];
  const query = compileQuery(parsedQuery, data);

  const filtered = where(input, query);
  const aggregated = group(filtered, query);
  const postFiltered = having(aggregated, query);
  const ordered = order(postFiltered, query);
  const limited = limit(ordered, query);
  const projected = select(limited, query);

  return projected;
}

function select(target, query) {
  return query.fields.length === 0
    ? selectAll(target)
    : selectFields(target, query);
}

function selectFields(target, query) {
  return target.map(row => projectFields(row, query));
}

function projectFields(row, { fields, resolve }) {
  const out = {};
  for(const field of fields) {
    out[field.outputName] = resolve(field.outputName, row);
  }

  return out;
}

function selectAll(target) {
  return target;
}

function where(input, { where: condition, resolve }) {
  if(condition) {
    return filter(input, condition, WHERE, resolve);
  } else {
    return input;
  }
}

function filter(input, condition, context, resolve) {
  const predicate = buildExpression(condition, context, resolve);
  return input.filter(predicate);
}

// Return a function that evaluates an expression for the given input
function buildExpression(expr, context, resolve) {
  if("op" in expr) {
    const func = buildOperatorExpression(expr, context, resolve);
    return (row, rowNum) => {
      return func(row, rowNum);
    };
  } else if ("identifier" in expr) {
    return (row, rowNum) => resolve(expr.identifier, row, rowNum);
  } else if("literal" in expr) {
    return () => expr.literal;
  } else if ("aggregate" in expr) {
    if (context !== HAVING ) {
      throw new Error(`Could not use aggregate function ${expr.aggregate} in ${context}. Did you mean HAVING?`);
    }
    const identifier = getAggregateFieldName(expr);
    return (row, rowNum) => resolve(identifier, row, rowNum);
  } else if (isArray(expr)) {
    const memberExprs = expr.map(e => buildExpression(e, context, resolve));
    return (row, rowNum) => memberExprs.map(memberExpr => memberExpr(row, rowNum));
  }  else {
    throw new Error(`unexpected expression: ${JSON.stringify(expr)}`);
  }
}

function buildOperatorExpression(expr, context, resolve) {
  const evaluateOperator = getOperator(expr.op);
  const childNames = ["lhs", "rhs", "ths"];

  // ths: "third hand side" for ternary operators
  const children = childNames
    .map(arg => {
      if (exists(expr[arg])) return buildExpression(expr[arg], context, resolve);
    });

  return (row, rowNum) => {
    const childResults = children
      .map(child => {
        if (exists(child)) return child(row, rowNum);
      });

    return evaluateOperator(...childResults);
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

function aggregateByGroup(input, { fields, aggregations, resolve, group: groupOptions }) {
  const rowGroups = groupBy(input, row => getGroupKey(row, groupOptions.fields, resolve));
  return mapObject(rowGroups, rows => getGroupOutputRow(rows, { fields, aggregations, resolve }));
}

function aggregateOverall(input, query) {
  return [getGroupOutputRow(input, query)];
}

function getGroupKey(row, groupFields, resolve) {
  // return JSON.stringify(pickKeys(row, groupFields));
  return JSON.stringify(groupFields.map(field => resolve(field, row)));
}

function getGroupOutputRow(groupRows, { fields, aggregations, resolve }) {
  // Non-aggregated values are included:
  // - GROUP BY fields have the same value for each row in a group
  // - Non-grouped, non-aggregated fields are implicitly aggregated.
  // The same default aggregation covers both cases.
  const nonAggregatedValues = fields
    .filter(field => !field.aggregate)
    .reduce((row, field) => {
      row[field.outputName] = getDefaultGroupValue(groupRows, field.name, resolve);
      return row;
    }, {});

  const aggregatedValues = aggregations.reduce((row, agg) => {
    // Aggregations can have several output field names
    // (e.g. SELECT COUNT(name) AS a HAVING COUNT(name) > 10 uses
    //  the same COUNT(name) as the default name and `a`.
    const values = aggregate(groupRows, agg.source, agg.aggregate, resolve);
    agg.outputFields.forEach(outputField => { row[outputField] = values; });

    return row;
  }, {});

  return Object.assign({}, nonAggregatedValues, aggregatedValues);
}

function aggregate(groupRows, fieldName, aggregateName, resolve) {
  const inputValues = groupRows.map((row, i) => resolve(fieldName, row, i));
  const func = getAggregateFunction(aggregateName);
  return func(inputValues);
}

function getDefaultGroupValue(groupRows, fieldName, resolve) {
  return resolve(fieldName, groupRows[0], 0);
}

function having(input, { group, having: condition, resolve }) {
  if(condition) {
    if (!exists(group)) {
      throw new Error("Cannot use HAVING without groups. Did you mean to GROUP BY some fields?");
    }

    return filter(input, condition, HAVING, resolve);
  } else {
    return input;
  }
}

function order(input, query) {
  if(query.order) {
    const orders = query.order.map(order => getSortOrder(query, order));
    const getFields = query.order
      .map(order =>
        row => query.resolve(order.field, row)
      );

    return sortByOrder(input, getFields, orders);
  } else {
    return input;
  }
}

function getSortOrder(query, orderTuple) {
  const resolvedOrder = resolveSortOrder(query, orderTuple);
  if (resolvedOrder) {
    const normalizedOrder = resolvedOrder.toLowerCase();
    if (isSortDirection(normalizedOrder)) {
      return normalizedOrder;
    } else {
      throw new Error(`Unexpected sort order: ${resolvedOrder}`);
    }
  }

  return DEFAULT_SORT_ORDER;
}

function isSortDirection(dir) {
  return !dir || dir === ASC || dir === DESC;
}

function resolveSortOrder(query, orderTuple) {
  const value = orderTuple.order;
  if (!value) {
    return DEFAULT_SORT_ORDER;
  } else if(exists(value.literal)) {
    return value.literal;
  } else if (exists(value.reference)) {
    const resolved =  query.resolveData(value.reference);
    return result(resolved);
  } else {
    throw new Error(`Unexpected sort order: ${JSON.stringify(orderValue)}`);
  }
}

function limit(input, query) {
  if(query.limit) {
    const offset = resolveLimitParam(query, query.limit.offset);
    const count = resolveLimitParam(query, query.limit.count);

    return input.slice(offset, offset + count);
  } else {
    return input;
  }
}

function resolveLimitParam(query, param) {
  if(!param) {
    return 0;
  } else if(exists(param.literal)) {
    return param.literal;
  } else if (exists(param.reference)) {
    const datum = query.resolveData(param.reference);
    return result(datum);
  } else {
    throw new Error(`Unexpected limit parameter: [[${JSON.stringify(param.literal)}]]`);
  }
}
