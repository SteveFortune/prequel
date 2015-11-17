import { indexBy, isFunction } from "./util";
import { getOutputFieldName } from "./field-names";

function getOutputFields({ fields }) {
  return fields.map(field => Object.assign({}, field, {
    outputName: getOutputFieldName(field)
  }));
}

// TODO
function getAggregations() {
  return [];
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
