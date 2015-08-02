import parser from "../build/parser";

export default function(query) {
  return parser.parse(query);
}
