import parse from "./parser";
import execute from "./execute";

//
// Main API entry point. Expose a tagged template function.
//
export default function prequel(chunks, ...values) {
  const dataMap = {};

  const query = chunks.map((chunk, i) => {
    const value = values[i];
    const id = getId(value);
    dataMap[id] = value;

    return chunk + id;
  }).join("");

  const parsed = parse(query);
  return execute(parsed, dataMap);
}

let nextId = 0;
function getId(value) {
  return value
    ? `$${nextId++}`
    : "";
}
