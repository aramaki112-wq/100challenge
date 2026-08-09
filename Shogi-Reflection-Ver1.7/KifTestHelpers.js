import fs from "node:fs";

export function fixtureText(fileName) {
  return fs.readFileSync(new URL(`./fixtures/${fileName}`, import.meta.url), "utf8");
}

export function fixtureBytes(fileName) {
  return fs.readFileSync(new URL(`./fixtures/${fileName}`, import.meta.url));
}

export function createFileLike(fileName, value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
  return {
    name: fileName,
    size: bytes.byteLength,
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    }
  };
}
