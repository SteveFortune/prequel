import { indexBy, isFunction, objectValues, exists } from "./util";
import { getOutputFieldName, getAggregateFieldName } from "./field-names";
import getAggregateFunction from "./aggregates";

function getOutputFields({ fields }) {
  return fields.map(field => Object.assign({}, field, {
    outputName: getOutputFieldName(field)
  }));
}

// Return flat array of aggregations from a having expression
function collectAggs(expr) {
  const aggs = [];
  if(expr.aggregate) aggs.push(expr);
  if(expr.lhs) aggs.push(...collectAggs(expr.lhs));
  if(expr.rhs) aggs.push(...collectAggs(expr.rhs));

  return aggs;
}

// Deduplicate aggregations with the same aggregation function
//  and source field. Each grouped aggregation has a Set of
//  output field names.
function mergeAggs(inputAggs) {
  const aggsByKey = inputAggs.reduce((merged, agg) => {
    const key = getAggregateFieldName(agg);
    const mergedKeyAgg = merged[key] || (merged[key] = {
      aggregate: agg.aggregate,
      source: agg.source,
      outputFields: new Set()
    });

    const outputField = getOutputFieldName(agg);
    mergedKeyAgg.outputFields.add(outputField);

    return merged;
  }, {});

  return objectValues(aggsByKey);
}

function getAggregations(query) {
  const fieldAggs = query.fields
    .filter(field => field.aggregate);

  const havingAggs = query.having
    ? collectAggs(query.having)
    : [];

  return mergeAggs(fieldAggs.concat(...havingAggs));
}

export default function compile(query, data) {
  const withAlias = query.fields.filter(f => f.as);
  const aliases = indexBy(withAlias, "as");

  function resolve(identifier, row, rowNumber) {
    // Field with name `identifier`
    if(exists(row[identifier])) {
      return row[identifier];
    }

    // Field with alias `identifier`
    if(exists(aliases[identifier])) {
      const name = aliases[identifier].name;
      if (exists(row[name])) {
        return row[name];
      }
    }

    // Referenced datum with key `identifier`
    const datum = resolveData(identifier);
    if(exists(datum)) {
      return isFunction(datum) ? datum(row, rowNumber) : datum;
    }

    return undefined;
  }

  function resolveData(key) {
    return data[key];
  }

  // TODO query should be a property
  return Object.assign(query, {
    resolve,
    resolveData,
    aggregations: getAggregations(query),
    fields: getOutputFields(query)
  });
}
