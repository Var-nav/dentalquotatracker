export interface ParsedRow {
  email: string;
  name: string;
  batch: string;
}

export function parseSheetData(input: string): ParsedRow[] {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const delimiter = lines[0].includes("\t") ? "\t" : ",";

  const rows: ParsedRow[] = [];
  const headerCandidates = lines[0].toLowerCase().split(delimiter).map((h) => h.trim());
  const headerLooksLikeHeader = headerCandidates.some((h) =>
    ["email", "e-mail", "mail", "name", "batch"].some((key) => h.includes(key)),
  );

  const startIndex = headerLooksLikeHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(delimiter).map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) continue;

    if (parts.length === 1) {
      rows.push({
        email: parts[0],
        name: "Student",
        batch: "Batch A",
      });
      continue;
    }

    const [col1, col2, col3] = parts;
    let email = "";
    let name = "";
    let batch = "";

    const looksLikeEmail = (value: string) => /@/.test(value);

    if (looksLikeEmail(col1)) {
      email = col1;
      name = col2 || "Student";
      batch = col3 || "Batch A";
    } else if (looksLikeEmail(col2 || "")) {
      name = col1;
      email = col2!;
      batch = col3 || "Batch A";
    } else {
      email = col1;
      name = col2 || "Student";
      batch = col3 || "Batch A";
    }

    if (!email) continue;

    rows.push({ email, name, batch });
  }

  return rows;
}
