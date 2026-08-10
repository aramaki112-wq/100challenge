function compactDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError("reviewId生成には有効な日時が必要です。");
  }
  return date.toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z")
    .replace("T", "-")
    .replace("Z", "");
}

export class ReviewIdGenerator {
  constructor({ clock, random = () => Math.random() } = {}) {
    this.clock = clock ?? { now: () => new Date().toISOString() };
    this.random = random;
  }

  generate() {
    const suffix = Math.floor(this.random() * 0x10000)
      .toString(16)
      .padStart(4, "0")
      .toUpperCase();
    return `REV-${compactDate(this.clock.now())}-${suffix}`;
  }
}
