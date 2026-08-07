import { ApplicationError, ERROR_CODES } from "./errors.js";
export class JsonDataAdapter {
  parse(text) { try { const value = JSON.parse(String(text)); if (!Array.isArray(value)) throw new TypeError("JSON import must be an array."); return value; } catch (error) { throw new ApplicationError(ERROR_CODES.IMPORT_VALIDATION_FAILED, "JSON import is invalid.", { cause: error.message }); } }
  stringify(rows) { return JSON.stringify(rows, null, 2); }
}
