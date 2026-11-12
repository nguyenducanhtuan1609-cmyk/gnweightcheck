import { toast } from "sonner";
import { create } from "zustand";
import { auditProducts } from "@/lib/audit";
import { exportReport, exportShift, masterFromSheetCsv, parseMasterFile, parsePackingList } from "@/lib/excel";
import { embeddedSize, getMaster, masterSize, replaceMaster, sampleRows } from "@/lib/master";
import { readConfig, readReports, readSession, writeLocal } from "@/lib/storage";
import type { AppConfig, FilterKey, Product, QaReport, Role, TabKey, Trip } from "@/lib/types";
import { loadWorkspace, saveWorkspace, type WorkspacePayload } from "@/lib/workspace";

type State = AppConfig & {
  role: Role;
  tab: TabKey;
  filter: FilterKey;
  search: string;
  qcName: string;
  fileName: string;
  products: Product[];
  trips: Trip[];
  reports: QaReport[];
  sourceLabel: string;
  syncLabel: string;
  cloudUpdatedAt: string;
  syncing: boolean;
  hydrated: boolean;
  chartCode: string;
};

type Actions = {
  hydrate: () => Promise<void>;
  setRole: (role: Role) => void;
  setTab: (tab: TabKey) => void;
  setFilter: (filter: FilterKey) => void;
  setSearch: (search: string) => void;
  setQcName: (qcName: string) => void;
  setChartCode: (code: string) => void;
  patchProduct: (code: string, patch: Partial<Product>) => void;
  confirmPending: () => void;
  loadSample: () => void;
  clearShift: () => void;
  importPacking: (file: File) => Promise<void>;
  importMaster: (file: File) => Promise<void>;
  syncSheet: (silent?: boolean) => Promise<boolean>;
  saveConfig: (config: AppConfig) => void;
  submitToQa: () => void;
  confirmLive: (qaName: string) => void;
  approveReport: (id: string, qaName: string) => void;
  toggleApproval: (id: string) => void;
  downloadShift: () => Promise<void>;
  downloadReport: (id: string) => Promise<void>;
  pushCloud: () => Promise<void>;
  pullCloud: () => Promise<void>;
};

const boot = auditProducts(sampleRows(), getMaster(), 5, 15);

function configOf(state: State): AppConfig {
  return {
    sheetUrl: state.sheetUrl,
    sheetName: state.sheetName,
    scriptUrl: state.scriptUrl,
    upperTolPercent: state.upperTolPercent,
    lowerTolPercent: state.lowerTolPercent,
  };
}

let suppressPush = false;
let pushTimer: ReturnType<typeof setTimeout> | undefined;
let cloudDirty = false;
let cloudBusy = false;

function syncStamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Đã nối kho chung";
  return `Đồng bộ ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
}

function toPayload(state: State): Omit<WorkspacePayload, "updatedAt"> {
  return {
    ...configOf(state),
    fileName: state.fileName,
    qcName: state.qcName,
    products: state.products,
    trips: state.trips,
    reports: state.reports,
  };
}

function fromPayload(state: State, payload: WorkspacePayload): State {
  const chartCode = payload.products.some((product) => product.code === state.chartCode)
    ? state.chartCode
    : (payload.products[0]?.code ?? "");
  return {
    ...state,
    ...configOf({ ...state, ...payload }),
    fileName: payload.fileName,
    qcName: payload.qcName,
    products: payload.products,
    trips: payload.trips,
    reports: keepReports(state.reports, payload.reports),
    chartCode,
    cloudUpdatedAt: payload.updatedAt,
    syncLabel: syncStamp(payload.updatedAt),
    hydrated: true,
  };
}

function keepReports(local: QaReport[], remote: QaReport[]) {
  const map = new Map<string, QaReport>();
  for (const report of local) {
    if (report?.id) map.set(report.id, report);
  }
  for (const report of remote) {
    if (report?.id) map.set(report.id, report);
  }
  return [...map.values()].sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""));
}

function makeReport(state: State): QaReport {
  const now = new Date();
  return {
    id: `RPT-${now.getTime()}`,
    createdAt: now.toISOString(),
    timestamp: `${now.toLocaleDateString("vi-VN")} ${now.toTimeString().slice(0, 5)}`,
    fileName: state.fileName,
    qcInspector: state.qcName.trim() || "QC trực ca",
    qaStatus: "Chờ QA duyệt",
    totalProducts: state.products.length,
    passProductsCount: state.products.filter((product) => product.isGreen).length,
    failProductsCount: state.products.filter((product) => !product.isGreen).length,
    totalBoxes: state.products.reduce((sum, product) => sum + product.totalBoxes, 0),
    productsSummary: state.products.map((product) => ({
      code: product.code,
      name: product.name,
      totalBoxes: product.totalBoxes,
      avg: product.avg,
      plkl: product.plkl,
      status: product.status,
      statusLabel: product.statusLabel,
      isGreen: product.isGreen,
      failedSegmentsText: product.failedSegments
        .map((seg) => `${seg.packedOn ? `${seg.packedOn} · ` : ""}Thùng ${seg.from_box}-${seg.to_box} (${seg.reason})`)
        .join("; "),
      qcResolution: product.qcResolution,
      qcNote: product.qcNote,
      qcTime: product.qcTime,
    })),
  };
}

function filedReport(state: State) {
  const key = state.products
    .filter((product) => !product.isGreen && product.qcConfirmed)
    .map((product) => product.code)
    .sort()
    .join("~");
  if (!key) return undefined;
  return state.reports.find((report) => {
    if (report.fileName !== state.fileName) return false;
    const filed = report.productsSummary
      .filter((item) => !item.isGreen && item.qcTime)
      .map((item) => item.code)
      .sort()
      .join("~");
    return filed === key;
  });
}

function withArchive(state: State) {
  if (filedReport(state) || !state.products.some((product) => !product.isGreen && product.qcConfirmed)) return state;
  return { ...state, reports: [makeReport(state), ...state.reports] };
}

function scheduleCloudPush() {
  if (suppressPush) return;
  cloudDirty = true;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = undefined;
    void flushCloud();
  }, 400);
}

async function flushCloud() {
  if (cloudBusy) return;
  cloudBusy = true;
  try {
    let savedAt = "";
    do {
      cloudDirty = false;
      const saved = await saveWorkspace({ data: toPayload(useQcStore.getState()) });
      savedAt = saved.updatedAt;
      const current = useQcStore.getState();
      useQcStore.setState({ reports: keepReports(current.reports, saved.reports) });
    } while (cloudDirty);
    useQcStore.setState({ cloudUpdatedAt: savedAt, syncLabel: syncStamp(savedAt) });
  } catch {
    cloudDirty = true;
    useQcStore.setState({ syncLabel: "Chưa đồng bộ được — sẽ thử lại" });
  } finally {
    cloudBusy = false;
  }
}

function persist(state: State) {
  writeLocal(
    { fileName: state.fileName, products: state.products, trips: state.trips },
    state.reports,
    configOf(state),
  );
  scheduleCloudPush();
  if (!state.scriptUrl) return;
  const url = state.scriptUrl;
  void fetch(url, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "SAVE_STATE",
      currentFileName: state.fileName,
      processedRows: state.trips,
      productList: state.products,
      qaReports: state.reports,
      updatedAt: new Date().toISOString(),
    }),
  }).catch(() => undefined);
}

function applyAudit(
  rows: Parameters<typeof auditProducts>[0],
  fileName: string,
  state: State,
  keepQc: boolean,
): Pick<State, "products" | "trips" | "fileName" | "chartCode"> {
  const previous = new Map(state.products.map((product) => [product.code, product]));
  const audited = auditProducts(rows, getMaster(), state.lowerTolPercent, state.upperTolPercent);
  const products = audited.products.map((product) => {
    if (!keepQc || product.isGreen) return product;
    const old = previous.get(product.code);
    if (!old || old.isGreen) return product;
    return {
      ...product,
      qcConfirmed: old.qcConfirmed,
      qcResolution: old.qcResolution || product.qcResolution,
      qcNote: old.qcNote,
      qcTime: old.qcTime,
    };
  });
  const chartCode = products.some((product) => product.code === state.chartCode)
    ? state.chartCode
    : (products[0]?.code ?? "");
  return { products, trips: audited.trips, fileName, chartCode };
}

export const useQcStore = create<State & Actions>((set, get) => ({
  role: "QC",
  tab: "detail",
  filter: "all",
  search: "",
  qcName: "QC trực ca",
  fileName: "Packing list mẫu",
  products: boot.products,
  trips: boot.trips,
  reports: [],
  sheetUrl: "https://docs.google.com/spreadsheets/d/1YA0j-kh_m3mJMvxtDp2oHkgNpG9BsqPBnCPk_3Q413I/edit",
  sheetName: "plkl list",
  scriptUrl: "",
  upperTolPercent: 15,
  lowerTolPercent: 5,
  sourceLabel: `Bản nhúng · ${embeddedSize().toLocaleString("vi-VN")} mã`,
  syncLabel: "Đang nối kho chung",
  cloudUpdatedAt: "",
  syncing: false,
  hydrated: false,
  chartCode: boot.products[0]?.code ?? "",

  hydrate: async () => {
    suppressPush = true;
    const config = readConfig();
    const session = readSession();
    const reports = readReports();
    const base = { ...get(), ...config, reports };
    const local = session
      ? {
          ...base,
          fileName: session.fileName,
          products: session.products,
          trips: session.trips,
          chartCode: session.products[0]?.code ?? "",
          hydrated: true,
        }
      : { ...base, hydrated: true };

    let remote: WorkspacePayload | null = null;
    try {
      remote = await loadWorkspace();
    } catch {
      remote = null;
    }

    if (remote?.updatedAt) {
      const next = fromPayload(local, remote);
      set(next);
      writeLocal(
        { fileName: next.fileName, products: next.products, trips: next.trips },
        next.reports,
        configOf(next),
      );
      suppressPush = false;
      void get().syncSheet(true);
      return;
    }

    suppressPush = false;
    set(local);
    persist(local);
    void get().syncSheet(true);
  },

  setRole: (role) => set({ role, tab: role === "QA" ? "qa" : "detail" }),
  setTab: (tab) => set({ tab }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  setQcName: (qcName) => {
    const next = { ...get(), qcName };
    set({ qcName });
    persist(next);
  },
  setChartCode: (chartCode) => set({ chartCode }),

  patchProduct: (code, patch) => {
    const products = get().products.map((product) =>
      product.code === code ? { ...product, ...patch } : product,
    );
    const next = { ...get(), products };
    set({ products });
    persist(next);
    if (patch.qcConfirmed) toast.success("QA đã thấy mã này trong Báo cáo QA.");
  },

  confirmPending: () => {
    const time = new Date().toTimeString().slice(0, 5);
    let count = 0;
    const products = get().products.map((product) => {
      if (product.isGreen || product.qcConfirmed) return product;
      count += 1;
      return { ...product, qcConfirmed: true, qcTime: time };
    });
    if (!count) {
      toast("Không còn mã nào chờ xác nhận.");
      return;
    }
    const next = { ...get(), products };
    set({ products });
    persist(next);
    toast.success(`Đã xác nhận ${count} mã lệch. QA thấy trong Báo cáo QA.`);
  },

  loadSample: () => {
    const archived = withArchive(get());
    const nextAudit = applyAudit(sampleRows(), "Packing list mẫu", archived, false);
    const next = { ...archived, ...nextAudit, filter: "all" as const, tab: "detail" as const };
    set(next);
    persist(next);
    toast.success(`Đã nạp ${next.products.length} mã mẫu.`);
  },

  clearShift: () => {
    const archived = withArchive(get());
    const next = {
      ...archived,
      products: [] as Product[],
      trips: [] as Trip[],
      fileName: "Chưa nạp file",
      chartCode: "",
    };
    set(next);
    persist(next);
    toast(archived === get() ? "Đã xóa ca QC. Báo cáo QA vẫn giữ." : "Đã xóa ca QC và lưu báo cáo QA.");
  },

  importPacking: async (file) => {
    try {
      const rows = await parsePackingList(file);
      if (!rows.length) {
        toast.error("Không đọc được dòng nào trong file.");
        return;
      }
      const archived = withArchive(get());
      if (archived.reports.length !== get().reports.length) {
        set(archived);
        persist(archived);
      }
      await get().syncSheet(true);
      const nextAudit = applyAudit(rows, file.name, get(), false);
      const next = { ...get(), ...nextAudit, filter: "all" as const, tab: "detail" as const, role: "QC" as const };
      set(next);
      persist(next);
      toast.success(`Đã tổng hợp ${next.products.length} mã từ ${file.name}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không đọc được file.");
    }
  },

  importMaster: async (file) => {
    try {
      const master = await parseMasterFile(file);
      const count = Object.keys(master).length;
      if (!count) {
        toast.error("File phụ lục không có mã hợp lệ ở cột khối lượng.");
        return;
      }
      replaceMaster(master);
      const state = get();
      const nextAudit =
        state.trips.length > 0
          ? applyAudit(state.trips, state.fileName, state, true)
          : { products: state.products, trips: state.trips, fileName: state.fileName, chartCode: state.chartCode };
      const next = {
        ...state,
        ...nextAudit,
        sourceLabel: `File Excel · ${count.toLocaleString("vi-VN")} mã`,
      };
      set(next);
      persist(next);
      toast.success(`Đã nạp ${count.toLocaleString("vi-VN")} mã chuẩn.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không đọc được phụ lục.");
    }
  },

  syncSheet: async (silent = false) => {
    const { sheetUrl, sheetName } = get();
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      if (!silent) toast.error("Link Google Sheet không hợp lệ.");
      return false;
    }
    set({ syncing: true });
    const csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName || "plkl list")}&t=${Date.now()}`;
    try {
      const response = await fetch(csvUrl, { cache: "no-store", signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(String(response.status));
      const master = await masterFromSheetCsv(await response.text());
      const count = Object.keys(master).length;
      if (!count) throw new Error("empty");
      replaceMaster(master);
      const state = get();
      const nextAudit =
        state.trips.length > 0
          ? applyAudit(state.trips, state.fileName, state, true)
          : {
              products: state.products,
              trips: state.trips,
              fileName: state.fileName,
              chartCode: state.chartCode,
            };
      const clock = new Date().toTimeString().slice(0, 5);
      const next = {
        ...state,
        ...nextAudit,
        syncing: false,
        sourceLabel: `Live Sheet · ${count.toLocaleString("vi-VN")} mã · ${clock}`,
      };
      set(next);
      persist(next);
      if (!silent) toast.success(`Đã cập nhật ${count.toLocaleString("vi-VN")} mã từ Sheet.`);
      return true;
    } catch {
      set({
        syncing: false,
        sourceLabel: `Bản đang dùng · ${masterSize().toLocaleString("vi-VN")} mã`,
      });
      if (!silent) {
        toast("Chưa tải được Sheet. Hãy mở quyền xem công khai, hoặc nạp file phụ lục.");
      }
      return false;
    }
  },

  saveConfig: (config) => {
    const state = { ...get(), ...config };
    const nextAudit =
      state.trips.length > 0
        ? applyAudit(state.trips, state.fileName, state, true)
        : {
            products: state.products,
            trips: state.trips,
            fileName: state.fileName,
            chartCode: state.chartCode,
          };
    const next = { ...state, ...nextAudit };
    set(next);
    persist(next);
    toast.success("Đã lưu cài đặt.");
  },

  submitToQa: () => {
    const state = get();
    if (!state.products.length) {
      toast.error("Chưa có dữ liệu để gửi.");
      return;
    }
    const pending = state.products.filter((product) => !product.isGreen && !product.qcConfirmed);
    if (pending.length) {
      set({ filter: "non-green", tab: "detail", role: "QC" });
      toast.error(`Còn ${pending.length} mã chưa xác nhận.`);
      return;
    }
    const now = new Date();
    const report = { ...makeReport(state), createdAt: now.toISOString(), timestamp: `${now.toLocaleDateString("vi-VN")} ${now.toTimeString().slice(0, 5)}` };
    const next = { ...state, reports: [report, ...state.reports.filter((item) => item.id !== report.id)], tab: "qa" as const, role: "QA" as const };
    set(next);
    persist(next);
    toast.success("Đã gửi báo cáo cho QA.");
  },

  confirmLive: (qaName) => {
    const state = get();
    if (!state.products.some((product) => !product.isGreen && product.qcConfirmed)) {
      toast.error("QC chưa xác nhận mã nào để QA chốt.");
      return;
    }
    const name = qaName.trim() || "QA trực ca";
    const now = new Date().toISOString();
    const existing = filedReport(state);
    const reports = existing
      ? state.reports.map((report) =>
          report.id === existing.id
            ? { ...report, qaStatus: "QA Đã Duyệt" as const, handledAt: now, qaName: name }
            : report,
        )
      : [
          { ...makeReport(state), qaStatus: "QA Đã Duyệt" as const, handledAt: now, qaName: name },
          ...state.reports,
        ];
    const next = { ...state, reports, tab: "qa" as const, role: "QA" as const };
    set(next);
    persist(next);
    toast.success("QA đã xác nhận ca này.");
  },

  approveReport: (id, qaName) => {
    const now = new Date().toISOString();
    const name = qaName.trim() || "QA trực ca";
    const reports = get().reports.map((report) =>
      report.id === id ? { ...report, qaStatus: "QA Đã Duyệt" as const, handledAt: now, qaName: name } : report,
    );
    const next = { ...get(), reports };
    set({ reports });
    persist(next);
    toast.success("QA đã xác nhận báo cáo.");
  },

  toggleApproval: (id) => {
    const now = new Date().toISOString();
    const reports = get().reports.map((report) =>
      report.id === id
        ? {
            ...report,
            qaStatus:
              report.qaStatus === "QA Đã Duyệt"
                ? ("Chờ QA duyệt" as const)
                : ("QA Đã Duyệt" as const),
            handledAt: report.qaStatus === "QA Đã Duyệt" ? undefined : now,
            qaName: report.qaStatus === "QA Đã Duyệt" ? undefined : report.qaName,
          }
        : report,
    );
    const next = { ...get(), reports };
    set({ reports });
    persist(next);
  },

  downloadShift: async () => {
    if (!get().products.length) {
      toast.error("Không có dữ liệu để xuất.");
      return;
    }
    await exportShift(get().products);
    toast.success("Đã tải file Excel.");
  },

  downloadReport: async (id) => {
    const report = get().reports.find((item) => item.id === id);
    if (!report) return;
    await exportReport(report);
  },

  pushCloud: async () => {
    await flushCloud();
  },

  pullCloud: async () => {
    if (cloudDirty || cloudBusy || pushTimer) return;
    try {
      const remote = await loadWorkspace();
      if (!remote?.updatedAt || remote.updatedAt === get().cloudUpdatedAt) return;
      suppressPush = true;
      const next = fromPayload(get(), remote);
      set(next);
      writeLocal(
        { fileName: next.fileName, products: next.products, trips: next.trips },
        next.reports,
        configOf(next),
      );
      suppressPush = false;
    } catch {
      suppressPush = false;
    }
  },
}));
