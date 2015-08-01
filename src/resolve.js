import _ from "lodash";

export default function makeResolve(query, data) {
  const withAlias = query.fields.filter(f => f.as);
  const aliases = _.indexBy(withAlias, "as");

  return function resolve(identifier, row, rowNumber) {
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
      return _.isFunction(datum) ? datum(row, rowNumber) : datum;
    }

    return undefined;
  };
}
