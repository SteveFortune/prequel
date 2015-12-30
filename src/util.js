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

export function sortByOrder(input, spec) {
  if (!spec || spec.length === 0) {
    return input;
  }

  const directions = spec.map(([field, dir]) => dir === "desc" ? -1 : 1);

  function comparator(a, b) {
    for (let i = 0; i < a.criteria.length; i ++) {
      const compared = compareValues(a.criteria[i], b.criteria[i]);
      if(compared !== 0) {
        return compared * directions[i];
      }
    }

    return a.index - b.index;
  }

  function wrap(value, index) {
    return {
      index,
      value,
      criteria: spec.map(([field]) => value[field])
    };
  }


  // Sort a wrapped form of in the input to make Array.sort stable
  return input
    .map(wrap)
    .sort(comparator)
    .map(unwrapForSort);
}

function unwrapForSort(wrappedValue) {
  return wrappedValue.value;
}

function compareValues(a, b) {
  if (a < b || !exists(a)) {
    return -1;
  } else if (a > b || !exists(b)) {
    return 1;
  } else {
    return 0;
  }
}
