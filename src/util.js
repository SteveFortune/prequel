function reduceToObject(inputArray, getKey, getValue) {
  const keyFunc = isFunction(getKey) ? getKey : obj => obj[getKey];

  return inputArray.reduce((grouped, e) => {
    const key = keyFunc(e);
    grouped[key] = getValue(grouped[key], key, e);
    return grouped;
  }, {});
}

export function groupBy(inputArray, getKey) {
  return reduceToObject(inputArray, getKey, (valuesWithKey, key, e) => {
    const group = valuesWithKey || [];
    group.push(e);
    return group;
  });
}

export function indexBy(inputArray, getKey) {
  return reduceToObject(inputArray, getKey, (valueWithKey, key, e) => e);
}

export function isFunction(maybeFunction) {
  return typeof maybeFunction === "function";
}

export function isArray(maybeArray) {
  return maybeArray instanceof Array;
}

export function mapObject(inputObject, func) {
  return Object.keys(inputObject).map(key => func(inputObject[key], key));
}

export function pickKeys(inputObject, keys) {
  const output = {};
  for(const key of keys) {
    if(inputObject.hasOwnProperty(key)) {
      output[key] = inputObject[key];
    }
  }

  return output;
}

export function objectValues(inputObject) {
  return Object.keys(inputObject).map(key => inputObject[key]);
}

export function exists(value) {
  return typeof value !== "undefined";
}

export function result(expr) {
  return isFunction(expr)
    ? expr()
    : expr;
}

export function sortByOrder(input, orders) {
  if (!orders || orders.length === 0) {
    return input;
  }
  
  const index = Symbol("index");

  function comparator(a, b) {
    for (const [field, dir] of orders) {
      const compared = compareValues(a[field], b[field]);
      if(compared !== 0) {
        return (dir === "desc")
          ? -1 * compared
          : compared;
      }
    }

    return compareOrdinals(a[index], b[index]);
  }

  // Hack - add index to each input row to mimic stable [].sort
  return input
    // .map((row, i) => {
    //   row[index] = i;
    //   return row;
    // })
    .sort(comparator);
}

function compareValues (a, b) {
  return (isFunction(a.localeCompare))
    ? a.localeCompare(b)
    : compareOrdinals(a, b);
}

function compareOrdinals(a, b) {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  } else {
    return 0;
  }
}
