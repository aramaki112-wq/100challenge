function parseLine(line) {
  const values = []; let current = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { current += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { values.push(current); current = ""; }
    else current += char;
  }
  values.push(current);
  return values;
}
function encode(value) { const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
export class CsvDataAdapter {
  parse(text) {
    const lines = String(text).replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim() !== "");
    if (lines.length === 0) return [];
    const headers = parseLine(lines[0]).map((item) => item.trim());
    return lines.slice(1).map((line, index) => {
      const values = parseLine(line);
      const row = { __rowNumber: index + 2 };
      headers.forEach((header, column) => { const value = values[column] ?? ""; row[header] = value.startsWith("{") || value.startsWith("[") ? (() => { try { return JSON.parse(value); } catch { return value; } })() : value; });
      return row;
    });
  }
  stringify(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return "";
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row).filter((key) => key !== "__rowNumber")))];
    return [headers.map(encode).join(","), ...rows.map((row) => headers.map((header) => encode(row[header])).join(","))].join("\n");
  }
}
