import _ from "lodash";

export default function query(parsedQuery, data) {
  const target = data[parsedQuery.source];
  return select(target, parsedQuery.fields);
}

function select(target, fields) {
  return fields.length === 0
    ? selectAll(target)
    : selectFields(target, fields);
}

function selectFields(target, fields) {
  return target.map(row => _.pick(row, fields));
}

function selectAll(target) {
  return target;
}
