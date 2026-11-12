import { createServerFn } from "@tanstack/react-start";
import type { AppConfig, Product, QaReport, Trip } from "@/lib/types";

export type WorkspacePayload = AppConfig & {
  fileName: string;
  qcName: string;
  products: Product[];
  trips: Trip[];
  reports: QaReport[];
  updatedAt: string;
};

function asPayload(input: unknown): Omit<WorkspacePayload, "updatedAt"> {
  if (!input || typeof input !== "object") throw new Error("Dữ liệu không hợp lệ");
  const raw = input as Partial<WorkspacePayload>;
  if (!Array.isArray(raw.products) || !Array.isArray(raw.trips) || !Array.isArray(raw.reports)) {
    throw new Error("Dữ liệu không hợp lệ");
  }
  return {
    fileName: String(raw.fileName || "Ca làm việc").slice(0, 180),
    qcName: String(raw.qcName || "QC trực ca").slice(0, 80),
    products: raw.products,
    trips: raw.trips,
    reports: raw.reports,
    sheetUrl: String(raw.sheetUrl || ""),
    sheetName: String(raw.sheetName || "plkl list").slice(0, 80),
    scriptUrl: String(raw.scriptUrl || ""),
    upperTolPercent: Number(raw.upperTolPercent) > 0 ? Number(raw.upperTolPercent) : 15,
    lowerTolPercent: Number(raw.lowerTolPercent) > 0 ? Number(raw.lowerTolPercent) : 5,
  };
}

function readPayload(value: unknown): WorkspacePayload | null {
  const parsed = typeof value === "string" ? (JSON.parse(value) as unknown) : value;
  if (!parsed || typeof parsed !== "object") return null;
  const body = asPayload(parsed);
  const updatedAt = String((parsed as { updatedAt?: unknown }).updatedAt || "");
  return { ...body, updatedAt };
}

function reportStamp(report: QaReport) {
  const time = Date.parse(report.createdAt || report.handledAt || "");
  return Number.isNaN(time) ? 0 : time;
}

function mergeReports(previous: QaReport[], incoming: QaReport[]) {
  const map = new Map<string, QaReport>();
  for (const report of previous) {
    if (report?.id) map.set(report.id, report);
  }
  for (const report of incoming) {
    if (!report?.id) continue;
    const old = map.get(report.id);
    map.set(report.id, old ? { ...old, ...report, id: old.id } : report);
  }
  return [...map.values()].sort((a, b) => reportStamp(b) - reportStamp(a));
}

export const loadWorkspace = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ payload: unknown }>`select payload from workspace where id = 'main'`;
  if (!rows[0]) return null;
  return readPayload(rows[0].payload);
});

export const saveWorkspace = createServerFn({ method: "POST" })
  .validator(asPayload)
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const updatedAt = new Date().toISOString();
    const existing = await sql<{ payload: unknown }>`select payload from workspace where id = 'main'`;
    const previous = existing[0] ? readPayload(existing[0].payload) : null;
    const payload: WorkspacePayload = {
      ...data,
      reports: mergeReports(previous?.reports ?? [], data.reports),
      updatedAt,
    };
    await sql`
      insert into workspace (id, payload, updated_at)
      values ('main', ${JSON.stringify(payload)}::jsonb, now())
      on conflict (id) do update
        set payload = excluded.payload,
            updated_at = now()
    `;
    return { updatedAt, reports: payload.reports };
  });
