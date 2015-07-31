import _ from "lodash";

// Return a function that resolves identifiers
export default function makeResolve(query, data) {
  const fields = _.indexBy(query.fields, "name");

  const withAlias = query.fields.filter(f => f.as);
  const aliases = _.indexBy(withAlias, "as");

  return function resolve(identifier, row) {
    console.log(identifier)
    console.log(row)
    if(fields[identifier]) return row[identifier];
    if(aliases[identifier]) return row[aliases[identifier].name];
    return data[identifier];
  };
}
