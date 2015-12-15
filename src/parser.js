import parser from "../build/parser";

export default function parse(query) {
  return parser.parse(query);
}

export const SyntaxError = parser.SyntaxError;
