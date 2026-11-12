import type { AppConfig, Product, QaReport, Trip } from "@/lib/types";
import { DEFAULT_SHEET_URL } from "@/lib/types";

const KEY_SESSION = "gnfoods_web_session_v1";
const KEY_QA = "gnfoods_web_qa_v1";
const KEY_CONFIG = "gnfoods_web_config_v1";

export type SessionPayload = {
  fileName: string;
  products: Product[];
  trips: Trip[];
};

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function defaultConfig(): AppConfig {
  return {
    sheetUrl: DEFAULT_SHEET_URL,
    sheetName: "plkl list",
    scriptUrl: "",
    upperTolPercent: 15,
    lowerTolPercent: 5,
  };
}

export function readConfig(): AppConfig {
  const base = defaultConfig();
  const raw = storage()?.getItem(KEY_CONFIG);
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return {
      sheetUrl: parsed.sheetUrl || base.sheetUrl,
      sheetName: parsed.sheetName || base.sheetName,
      scriptUrl: parsed.scriptUrl || "",
      upperTolPercent:
        typeof parsed.upperTolPercent === "number" && parsed.upperTolPercent > 0
          ? parsed.upperTolPercent
          : base.upperTolPercent,
      lowerTolPercent:
        typeof parsed.lowerTolPercent === "number" && parsed.lowerTolPercent > 0
          ? parsed.lowerTolPercent
          : base.lowerTolPercent,
    };
  } catch {
    return base;
  }
}

export function readSession(): SessionPayload | null {
  const raw = storage()?.getItem(KEY_SESSION);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionPayload;
    if (!parsed || !Array.isArray(parsed.products) || parsed.products.length === 0) return null;
    return {
      fileName: parsed.fileName || "Dữ liệu đã lưu",
      products: parsed.products,
      trips: Array.isArray(parsed.trips) ? parsed.trips : [],
    };
  } catch {
    return null;
  }
}

export function readReports(): QaReport[] {
  const raw = storage()?.getItem(KEY_QA);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as QaReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocal(session: SessionPayload, reports: QaReport[], config: AppConfig) {
  const box = storage();
  if (!box) return;
  try {
    box.setItem(KEY_SESSION, JSON.stringify(session));
    box.setItem(KEY_QA, JSON.stringify(reports));
    box.setItem(KEY_CONFIG, JSON.stringify(config));
  } catch {
    /* quota or private mode */
  }
}
