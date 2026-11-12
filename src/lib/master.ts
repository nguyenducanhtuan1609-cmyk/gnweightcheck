import rawPlkl from "@/data/plkl-master.json";
import rawSample from "@/data/sample-rows.json";
import type { Master, RawRow } from "@/lib/types";

function parseMaster(raw: unknown): Master {
  const out: Master = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [code, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;
    const kg = typeof value[1] === "number" ? value[1] : Number.parseFloat(String(value[1]));
    if (!Number.isFinite(kg) || kg <= 0) continue;
    out[code] = [String(value[0] ?? "").slice(0, 80), Math.round(kg * 1000) / 1000];
  }
  return out;
}

const embedded = parseMaster(rawPlkl);
let current: Master = embedded;

export function getMaster(): Master {
  return current;
}

export function replaceMaster(next: Master) {
  current = next;
}

export function masterSize(): number {
  return Object.keys(current).length;
}

export function embeddedSize(): number {
  return Object.keys(embedded).length;
}

export function sampleRows(): RawRow[] {
  if (!Array.isArray(rawSample)) return [];
  return rawSample as RawRow[];
}
