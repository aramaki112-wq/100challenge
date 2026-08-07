export class ConstraintReason {
  constructor({ code, targetType, targetId, date = null, shiftId = null, message = "", data = {} }) {
    this.code = String(code);
    this.targetType = String(targetType);
    this.targetId = String(targetId);
    this.date = date == null ? null : String(date);
    this.shiftId = shiftId == null ? null : String(shiftId);
    this.message = String(message);
    this.data = Object.freeze({ ...data });
    Object.freeze(this);
  }
  toPlainObject() { return { ...this, data: { ...this.data } }; }
}
