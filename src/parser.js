import { readFileSync as read } from "fs";
import { join } from "path";
import peg from "pegjs";

const grammar = read(join(__dirname, "sql.peg"), "utf-8");
const parser = peg.buildParser(grammar);

export default function(query) {
  return parser.parse(query);
}
