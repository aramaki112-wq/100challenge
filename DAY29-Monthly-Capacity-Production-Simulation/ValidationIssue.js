export class ValidationIssue {
  constructor({ severity = "ERROR", code, targetType, targetId, date = null, shiftId = null, message, suggestion = "" }) {
    this.severity = String(severity);
    this.code = String(code);
    this.targetType = String(targetType);
    this.targetId = String(targetId);
    this.date = date == null ? null : String(date);
    this.shiftId = shiftId == null ? null : String(shiftId);
    this.message = String(message);
    this.suggestion = String(suggestion);
    Object.freeze(this);
  }
  toPlainObject() { return { ...this }; }
}
