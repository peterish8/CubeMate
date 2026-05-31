import type { Solve } from "./types";

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function dateTag(): string {
  return new Date().toISOString().slice(0, 10);
}

export function exportJSON(solves: Solve[]): void {
  const payload = {
    app: "CubeRoom",
    version: "0.1.0",
    exportedAt: new Date().toISOString(),
    solves,
  };
  downloadBlob(
    JSON.stringify(payload, null, 2),
    `cuberoom-session-${dateTag()}.json`,
    "application/json"
  );
}

export function exportCSV(solves: Solve[]): void {
  const header = "event,scramble,timeMs,penalty,finalTimeMs,dateISO,comment";
  const rows = solves.map((s) => {
    const fields = [
      s.event,
      `"${s.scramble.replace(/"/g, '""')}"`,
      String(s.rawTimeMs),
      s.penalty,
      s.finalTimeMs !== null ? String(s.finalTimeMs) : "",
      s.dateISO,
      s.comment ? `"${s.comment.replace(/"/g, '""')}"` : "",
    ];
    return fields.join(",");
  });
  downloadBlob(
    [header, ...rows].join("\n"),
    `cuberoom-session-${dateTag()}.csv`,
    "text/csv"
  );
}
