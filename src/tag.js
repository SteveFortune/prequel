import parse from "./parser";
import exec from "./query";

export default function oql(chunks, ...values) {
  const dataMap = {};

  const query = chunks.map((chunk, i) => {
    const value = values[i];
    const id = getId(value);
    dataMap[id] = value;

    return chunk + id;
  }).join("");

  const parsed = parse(query);
  return exec(parsed, dataMap);
}

let nextId = 0;
function getId(value) {
  return value
    ? `$${nextId++}`
    : "";
}
