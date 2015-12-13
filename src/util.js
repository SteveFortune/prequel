import sortByOrder from "lodash.sortbyorder";
export { sortByOrder };

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
