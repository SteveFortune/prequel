export function getOutputFieldName(field) {
  if(field.as) {
    return field.as;
  } else if(field.aggregate) {
    return getAggregateFieldName(field);
  } else {
    return field.name;
  }
}

export function getAggregateFieldName(field) {
  return `${field.aggregate.toLowerCase()}_${field.source}`;
}
