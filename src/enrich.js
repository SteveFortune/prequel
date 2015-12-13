import { indexBy, isFunction } from "./util";
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

function getAggregations(query) {
  const fieldAggs = query.fields
    .filter(field => field.aggregate);

  // TODO don't include aggs that are already computed in fieldAggs
  const havingAggs = query.having
    ? collectAggs(query.having)
    : [];

  return fieldAggs.concat(...havingAggs)
    .map(agg => Object.assign({}, agg, { outputName: getOutputFieldName(agg) }));

}

export default function enrich(query, data) {
  const withAlias = query.fields.filter(f => f.as);
  const aliases = indexBy(withAlias, "as");

  function resolve(identifier, row, rowNumber) {
    // Field with name `identifier`
    if(row[identifier]) {
      return row[identifier];
    }

    // Field with alias `identifier`
    if(aliases[identifier]) {
      return row[aliases[identifier].name];
    }

    // Referenced datum with key `identifier`
    const datum = data[identifier];
    if(datum) {
      return isFunction(datum) ? datum(row, rowNumber) : datum;
    }

    return undefined;
  }

  // TODO query should be a property
  return Object.assign(query, {
    resolve,
    aggregations: getAggregations(query),
    fields: getOutputFields(query)
  });
}
