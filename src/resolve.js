import { indexBy, isFunction } from "./util";

export default function makeResolve(query, data) {
  const withAlias = query.fields.filter(f => f.as);
  const aliases = indexBy(withAlias, "as");

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
      return isFunction(datum) ? datum(row, rowNumber) : datum;
    }

    return undefined;
  };
}
