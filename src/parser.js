import parser from "../dist/pegjs-parser";
import { getSyntaxErrorMessage } from "./error-reporter";

export default function parse(query) {
  try {
    return parser.parse(query);
  } catch (e) {
    if (e instanceof parser.SyntaxError) {
      e.message = getSyntaxErrorMessage(e, query);
    }

    throw e;
  }
}

export const SyntaxError = parser.SyntaxError;
