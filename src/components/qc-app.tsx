import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpen,
  ChartColumn,
  Check,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Scale,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Toaster } from "sonner";
import { kg } from "@/lib/audit";
import { useQcStore } from "@/lib/store";
import type { AppConfig, FilterKey, Product, ProductStatus, QaReport } from "@/lib/types";
import { RESOLUTION_OPTIONS } from "@/lib/types";

const primaryBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40";
const quietBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-card px-3 text-sm font-medium text-foreground shadow-card transition-[transform,box-shadow,background-color] duration-150 hover:bg-secondary active:scale-[0.98] disabled:opacity-40";
const field =
  "h-11 rounded-md border border-border bg-card px-3 text-sm outline-none transition-[box-shadow] duration-150 focus:ring-2 focus:ring-primary";

const tone: Record<ProductStatus, string> = {
  pass: "bg-ok-soft text-ok",
  critical: "bg-bad-soft text-bad",
  "warn-low": "bg-warn-soft text-warn",
  "warn-high": "bg-over-soft text-over",
  unknown: "bg-secondary text-muted-foreground",
};

const rail: Record<ProductStatus, string> = {
  pass: "border-l-ok",
  critical: "border-l-bad",
  "warn-low": "border-l-warn",
  "warn-high": "border-l-over",
  unknown: "border-l-border",
};

function reportWhen(report: QaReport) {
  const parsed = report.createdAt ? new Date(report.createdAt) : null;
  if (parsed && !Number.isNaN(parsed.getTime())) {
    return {
      day: parsed.toLocaleDateString("vi-VN"),
      time: parsed.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
  }
  const [day, time] = report.timestamp.split(" ");
  return { day: day || report.timestamp, time: time || "" };
}

function handledWhen(report: QaReport) {
  if (!report.handledAt) return "";
  const parsed = new Date(report.handledAt);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.toLocaleDateString("vi-VN")} ${parsed.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
}

function StatusPill({ status, label }: { status: ProductStatus; label: string }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${tone[status]}`}>{label}</span>
  );
}

function matches(product: Product, filter: FilterKey, search: string) {
  if (filter === "non-green" && product.isGreen) return false;
  if (filter !== "all" && filter !== "non-green" && product.status !== filter) return false;
  if (!search) return true;
  const q = search.toLowerCase();
  return product.code.toLowerCase().includes(q) || product.name.toLowerCase().includes(q);
}

export function QcApp() {
  const store = useQcStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [qaName, setQaName] = useState("QA trực ca");

  useEffect(() => {
    setMounted(true);
    void useQcStore.getState().hydrate();
    const pull = () => void useQcStore.getState().pullCloud();
    const timer = window.setInterval(pull, 8000);
    window.addEventListener("focus", pull);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", pull);
    };
  }, []);

  const counts = useMemo(() => {
    const products = store.products;
    const boxes = products.reduce((sum, product) => sum + product.totalBoxes, 0);
    const trips = products.reduce((sum, product) => sum + product.tripCount, 0);
    const critical = products.filter((product) => product.status === "critical");
    const nonGreen = products.filter((product) => !product.isGreen);
    const pass = products.filter((product) => product.isGreen);
    return {
      codes: products.length,
      boxes,
      trips,
      critical: critical.length,
      criticalSeg: critical.reduce((sum, product) => sum + product.failedSegments.length, 0),
      nonGreen: nonGreen.length,
      confirmed: nonGreen.filter((product) => product.qcConfirmed).length,
      pass: pass.length,
      low: products.filter((product) => product.status === "warn-low").length,
      high: products.filter((product) => product.status === "warn-high").length,
    };
  }, [store.products]);

  const confirmedRows = useMemo(
    () => store.products.filter((product) => !product.isGreen && product.qcConfirmed),
    [store.products],
  );
  const showLive = useMemo(() => {
    if (!confirmedRows.length) return false;
    const latest = store.reports[0];
    if (!latest || latest.fileName !== store.fileName) return true;
    const reported = latest.productsSummary
      .filter((item) => !item.isGreen && item.qcTime)
      .map((item) => `${item.code}|${item.qcResolution}|${item.qcNote}`)
      .sort()
      .join("~");
    const current = confirmedRows
      .map((product) => `${product.code}|${product.qcResolution}|${product.qcNote}`)
      .sort()
      .join("~");
    return current !== reported;
  }, [confirmedRows, store.fileName, store.reports]);
  const qaBadge = store.reports.length + (showLive ? 1 : 0);
  const reportGroups = useMemo(() => {
    const groups = new Map<string, QaReport[]>();
    for (const report of store.reports) {
      const day = reportWhen(report).day;
      const list = groups.get(day) ?? [];
      list.push(report);
      groups.set(day, list);
    }
    return [...groups.entries()];
  }, [store.reports]);

  const visible = store.products.filter((product) => matches(product, store.filter, store.search.trim()));

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "Tất cả", count: counts.codes },
    { key: "non-green", label: "Cần xác nhận", count: counts.nonGreen },
    { key: "critical", label: "Thiếu cân", count: counts.critical },
    { key: "warn-low", label: "Dưới sàn", count: counts.low },
    { key: "warn-high", label: "Vượt trần", count: counts.high },
    { key: "pass", label: "Đạt", count: counts.pass },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="bottom-center" />
      <header className="sticky top-0 z-20 border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold tracking-wide text-primary-foreground">
              GN
            </span>
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground">GN FOODS</p>
              <h1 className="text-xl font-semibold leading-tight tracking-tight">Kiểm soát khối lượng</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-sm text-muted-foreground">{store.sourceLabel}</p>
                <p className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-foreground">{store.syncLabel}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg bg-secondary p-1">
              <button
                type="button"
                className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium ${store.role === "QC" ? "bg-card text-foreground shadow-card" : "text-muted-foreground"}`}
                onClick={() => store.setRole("QC")}
              >
                <ClipboardCheck className="size-4" aria-hidden />
                QC
              </button>
              <button
                type="button"
                className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium ${store.role === "QA" ? "bg-card text-foreground shadow-card" : "text-muted-foreground"}`}
                onClick={() => store.setRole("QA")}
              >
                <ShieldCheck className="size-4" aria-hidden />
                QA
                <span className="rounded-sm bg-secondary px-1.5 font-mono text-xs">{qaBadge}</span>
              </button>
            </div>
            <button type="button" className={quietBtn} onClick={() => setGuideOpen(true)}>
              <BookOpen className="size-4" aria-hidden />
              Quy chuẩn
            </button>
            <button type="button" className={quietBtn} onClick={() => setSettingsOpen(true)}>
              <Settings className="size-4" aria-hidden />
              Cài đặt
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {store.role === "QC" ? (
            <>
              Xác nhận mã thiếu cân hoặc lệch quá −{store.lowerTolPercent}% / +{store.upperTolPercent}%. QA thấy ngay trên{" "}
              <a className="font-medium text-foreground underline" href="https://gncheckweight.grok.me">
                gncheckweight.grok.me
              </a>
              .
            </>
          ) : (
            <>
              Mã QC đã xác nhận nằm ở Báo cáo QA. Ký duyệt hoặc tải Excel. Mở cùng{" "}
              <a className="font-medium text-foreground underline" href="https://gncheckweight.grok.me">
                gncheckweight.grok.me
              </a>{" "}
              trên máy khác.
            </>
          )}
        </p>

        {store.role === "QC" && (
          <section className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-card md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void store.importPacking(file);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                className={primaryBtn}
                onClick={() => fileRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const file = event.dataTransfer.files?.[0];
                  if (file) void store.importPacking(file);
                }}
              >
                <FileSpreadsheet className="size-4" aria-hidden />
                Nạp packing list
              </button>
              <button type="button" className={quietBtn} onClick={() => store.loadSample()}>
                Dữ liệu mẫu
              </button>
              <button type="button" className={quietBtn} onClick={() => store.clearShift()}>
                <Trash2 className="size-4" aria-hidden />
                Xóa ca
              </button>
              <span className="text-sm text-muted-foreground">
                File <span className="font-medium text-foreground">{store.fileName}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="qc-name">
                Tên QC
              </label>
              <input
                id="qc-name"
                value={store.qcName}
                onChange={(event) => store.setQcName(event.target.value)}
                className={`${field} w-40`}
                placeholder="Tên QC"
              />
              <button type="button" className={primaryBtn} onClick={() => store.submitToQa()}>
                <Send className="size-4" aria-hidden />
                Gửi QA
              </button>
            </div>
          </section>
        )}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Mã trong ca" value={`${counts.codes}`} hint={`${counts.boxes.toLocaleString("vi-VN")} thùng · ${counts.trips} chuyến`} />
          <Stat label="Thiếu cân" value={`${counts.critical}`} hint={`${counts.criticalSeg} đoạn thùng`} tone="bad" />
          <Stat
            label="Cần QC xác nhận"
            value={`${counts.nonGreen}`}
            hint={`Đã xác nhận ${counts.confirmed}/${counts.nonGreen}`}
            tone="warn"
          />
          <Stat
            label="Đạt chuẩn"
            value={`${counts.pass}`}
            hint={counts.codes ? `${((counts.pass / counts.codes) * 100).toFixed(1)}% mã đạt` : "Chưa có ca"}
            tone="ok"
          />
        </section>

        <section className="overflow-hidden rounded-lg bg-card shadow-card">
          <div className="flex flex-col gap-2 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 rounded-lg bg-secondary p-1">
              <TabButton active={store.tab === "detail"} onClick={() => store.setTab("detail")} icon={<Scale className="size-4" />}>
                Từng mã hàng
              </TabButton>
              <TabButton active={store.tab === "qa"} onClick={() => store.setTab("qa")} icon={<ShieldCheck className="size-4" />}>
                Báo cáo QA
              </TabButton>
              <TabButton active={store.tab === "chart"} onClick={() => store.setTab("chart")} icon={<ChartColumn className="size-4" />}>
                Biểu đồ
              </TabButton>
            </div>
            <button type="button" className={quietBtn} onClick={() => void store.downloadShift()}>
              <Download className="size-4" aria-hidden />
              Xuất Excel
            </button>
          </div>

          {store.tab === "detail" && (
            <div className="flex flex-col gap-3 p-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {filters.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => store.setFilter(item.key)}
                      className={`min-h-11 rounded-md px-3 text-sm font-medium ${store.filter === item.key ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                    >
                      {item.label} <span className="font-mono">{item.count}</span>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className={quietBtn} onClick={() => store.confirmPending()}>
                    <Check className="size-4" aria-hidden />
                    Xác nhận mã lệch
                  </button>
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" aria-hidden />
                    <input
                      value={store.search}
                      onChange={(event) => store.setSearch(event.target.value)}
                      placeholder="Tìm mã hoặc tên"
                      className={`${field} w-full pr-3 pl-9 sm:w-56`}
                    />
                  </div>
                </div>
              </div>

              {visible.length === 0 ? (
                <p className="px-2 py-10 text-center text-sm text-muted-foreground">
                  Không có mã phù hợp. Nạp packing list hoặc đổi bộ lọc.
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-3 md:hidden">
                    {visible.map((product) => (
                      <ProductCard key={product.code} product={product} />
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="data-table w-full min-w-[1100px] border-collapse text-left text-sm">
                      <thead className="text-xs font-medium text-muted-foreground">
                        <tr className="border-b border-border bg-secondary">
                          <th className="px-3 py-3 font-medium">Mã</th>
                          <th className="px-3 py-3 font-medium">Tên</th>
                          <th className="px-3 py-3 text-right font-medium">Thùng</th>
                          <th className="px-3 py-3 text-right font-medium">Gross TB</th>
                          <th className="px-3 py-3 text-right font-medium">PLKL</th>
                          <th className="px-3 py-3 text-right font-medium">Min–Max</th>
                          <th className="px-3 py-3 font-medium">Kết quả</th>
                          <th className="min-w-72 px-3 py-3 font-medium">Ngày đóng thùng</th>
                          <th className="px-3 py-3 font-medium">QC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((product) => (
                          <tr key={product.code} className={`border-b border-border border-l-4 ${rail[product.status]} align-top`}>
                            <td className="px-3 py-4 font-mono text-xs font-medium">
                              {product.code}
                              {product.isGreen && (
                                <span className="mt-1 block font-sans text-sm font-medium text-foreground">
                                  {(product.packedDates ?? []).join(", ") || "Không có ngày"}
                                </span>
                              )}
                            </td>
                            <td className="max-w-56 px-3 py-4">{product.name}</td>
                            <td className="px-3 py-4 text-right font-mono">
                              {product.totalBoxes}
                              <span className="block text-xs text-muted-foreground">{product.tripCount} chuyến</span>
                            </td>
                            <td className="px-3 py-4 text-right font-mono">{kg(product.avg)}</td>
                            <td className="px-3 py-4 text-right font-mono">{product.plkl === null ? "—" : kg(product.plkl)}</td>
                            <td className="px-3 py-4 text-right font-mono text-muted-foreground">
                              {kg(product.min, 2)}–{kg(product.max, 2)}
                            </td>
                            <td className="px-3 py-4">
                              <StatusPill status={product.status} label={product.statusLabel} />
                            </td>
                            <td className="min-w-72 px-3 py-4">
                              <FailingDates product={product} />
                            </td>
                            <td className="min-w-64 px-3 py-4">
                              <QcCell product={product} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {store.tab === "qa" && (
            <div className="flex flex-col gap-3 p-3">
              <div className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-card sm:flex-row sm:items-end sm:justify-between">
                <label className="flex flex-col gap-1 text-sm">
                  Tên QA
                  <input
                    value={qaName}
                    onChange={(event) => setQaName(event.target.value)}
                    className={`${field} w-full sm:w-56`}
                    placeholder="Tên QA"
                    aria-label="Tên QA"
                  />
                </label>
                <p className="text-sm text-muted-foreground">
                  Bấm QA xác nhận trên ca hoặc báo cáo chưa xử lý. Báo cáo đã xác nhận được giữ lại.
                </p>
              </div>
              {showLive && (
                <article className="rounded-lg bg-secondary p-4">
                  <div className="border-b border-border pb-3">
                    <p className="font-medium">Ca đang xác nhận</p>
                    <p className="text-sm text-muted-foreground">
                      Ngày {new Date().toLocaleDateString("vi-VN")} · {store.qcName || "QC trực ca"} · {store.fileName}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex min-h-11 items-center rounded-md bg-warn-soft px-3 text-sm font-medium text-warn">
                      Chưa xử lý
                    </span>
                    <button type="button" className={primaryBtn} onClick={() => store.confirmLive(qaName)}>
                      <Check className="size-4" aria-hidden />
                      QA xác nhận
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="text-xs text-muted-foreground">
                        <tr className="border-b border-border">
                          <th className="py-2 pr-2 font-medium">Mã</th>
                          <th className="py-2 pr-2 font-medium">Tên</th>
                          <th className="py-2 pr-2 font-medium">Kết quả</th>
                          <th className="py-2 pr-2 font-medium">Đoạn lệch</th>
                          <th className="py-2 font-medium">QC xử lý</th>
                        </tr>
                      </thead>
                      <tbody>
                        {confirmedRows.map((product) => (
                          <tr key={product.code} className="border-b border-border align-top">
                            <td className="py-2 pr-2 font-mono text-xs">{product.code}</td>
                            <td className="py-2 pr-2">{product.name}</td>
                            <td className="py-2 pr-2">
                              <StatusPill status={product.status} label={product.statusLabel} />
                            </td>
                            <td className="py-2 pr-2 text-xs text-muted-foreground">
                              {product.failedSegments
                                .map((seg) => `${seg.packedOn ? `${seg.packedOn} · ` : ""}Thùng ${seg.from_box}-${seg.to_box} (${seg.reason})`)
                                .join("; ") || "—"}
                            </td>
                            <td className="py-2 text-sm">
                              {product.qcResolution}
                              {product.qcNote ? ` (${product.qcNote})` : ""}
                              <span className="mt-1 block text-xs text-muted-foreground">{product.qcTime}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              )}
              {store.reports.length === 0 && !showLive ? (
                <p className="px-2 py-10 text-center text-sm text-muted-foreground">
                  Chưa có mã nào được QC xác nhận.
                </p>
              ) : (
                reportGroups.map(([day, reports]) => (
                  <section key={day} className="flex flex-col gap-3">
                    <h2 className="px-1 text-sm font-medium text-foreground">Ngày {day}</h2>
                    {reports.map((report) => {
                      const when = reportWhen(report);
                      const done = report.qaStatus === "QA Đã Duyệt";
                      return (
                  <article key={report.id} className="rounded-lg bg-card p-4 shadow-card">
                    <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium">Ngày {when.day}{when.time ? ` · ${when.time}` : ""}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.qcInspector}
                          {report.qaName ? ` · QA ${report.qaName}` : ""} · {report.fileName}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium ${done ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"}`}>
                          {done ? "QA đã xác nhận" : "Chưa xử lý"}
                        </span>
                        {done ? (
                          <button type="button" className={quietBtn} onClick={() => store.toggleApproval(report.id)}>
                            Bỏ xác nhận
                          </button>
                        ) : (
                          <button type="button" className={primaryBtn} onClick={() => store.approveReport(report.id, qaName)}>
                            <Check className="size-4" aria-hidden />
                            QA xác nhận
                          </button>
                        )}
                        <button type="button" className={quietBtn} onClick={() => void store.downloadReport(report.id)}>
                          <Download className="size-4" aria-hidden />
                          Excel
                        </button>
                      </div>
                    </div>
                    {done && handledWhen(report) && (
                      <p className="pt-3 text-sm text-muted-foreground">QA xác nhận lúc {handledWhen(report)}</p>
                    )}
                    <p className="grid grid-cols-2 gap-2 py-3 text-sm sm:grid-cols-4">
                      <span>Mã: <strong>{report.totalProducts}</strong></span>
                      <span>Đạt: <strong className="text-ok">{report.passProductsCount}</strong></span>
                      <span>Lệch: <strong className="text-warn">{report.failProductsCount}</strong></span>
                      <span>Thùng: <strong>{report.totalBoxes.toLocaleString("vi-VN")}</strong></span>
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="text-xs text-muted-foreground">
                          <tr className="border-b border-border">
                            <th className="py-2 pr-2 font-medium">Mã</th>
                            <th className="py-2 pr-2 font-medium">Tên</th>
                            <th className="py-2 pr-2 text-right font-medium">Thùng</th>
                            <th className="py-2 pr-2 text-right font-medium">TB / PLKL</th>
                            <th className="py-2 pr-2 font-medium">Kết quả</th>
                            <th className="py-2 font-medium">Xử lý</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.productsSummary.map((item) => (
                            <tr key={item.code} className="border-b border-border align-top">
                              <td className="py-2 pr-2 font-mono text-xs">{item.code}</td>
                              <td className="py-2 pr-2">{item.name}</td>
                              <td className="py-2 pr-2 text-right font-mono">{item.totalBoxes}</td>
                              <td className="py-2 pr-2 text-right font-mono">
                                {kg(item.avg)} / {kg(item.plkl)}
                              </td>
                              <td className="py-2 pr-2">
                                <StatusPill status={item.status} label={item.statusLabel} />
                              </td>
                              <td className="py-2 text-sm">
                                {item.isGreen
                                  ? "Đạt chuẩn"
                                  : `${item.qcResolution}${item.qcNote ? ` (${item.qcNote})` : ""}`}
                                {!item.isGreen && item.failedSegmentsText && (
                                  <span className="mt-1 block text-xs text-muted-foreground">{item.failedSegmentsText}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                      );
                    })}
                  </section>
                ))
              )}
            </div>
          )}

          {store.tab === "chart" && (
            <ChartPanel mounted={mounted} />
          )}
        </section>
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <GuideDialog open={guideOpen} onOpenChange={setGuideOpen} />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone: kind,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "ok" | "warn" | "bad";
}) {
  const valueTone = kind === "ok" ? "text-ok" : kind === "warn" ? "text-warn" : kind === "bad" ? "text-bad" : "text-foreground";
  return (
    <article className="rounded-lg bg-card p-4 shadow-card">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 font-mono text-3xl font-medium tracking-tight ${valueTone}`}>{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </article>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium ${active ? "bg-card text-foreground shadow-card" : "text-muted-foreground"}`}
    >
      {icon}
      {children}
    </button>
  );
}

function FailingDates({ product }: { product: Product }) {
  const trips = useQcStore((state) => state.trips);
  if (product.isGreen) return <p className="text-sm text-muted-foreground">—</p>;
  const failed = trips.filter((trip) => trip.code === product.code && trip.status !== "pass");
  if (!failed.length) return <p className="text-sm text-muted-foreground">—</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {failed.map((trip) => (
        <li
          key={`${trip.packedOn}-${trip.from_box}-${trip.to_box}-${trip.gross}`}
          className={`rounded-md px-2 py-1.5 text-sm ${
            trip.status === "critical"
              ? "bg-bad-soft text-bad"
              : trip.status === "warn-high"
                ? "bg-over-soft text-over"
                : "bg-warn-soft text-warn"
          }`}
        >
          <span className="font-medium">{trip.packedOn || "Không có ngày"}</span>
          <span className="text-muted-foreground"> · Lô {trip.from_box}–{trip.to_box}</span>
        </li>
      ))}
    </ul>
  );
}

function QcCell({ product }: { product: Product }) {
  const patchProduct = useQcStore((state) => state.patchProduct);
  if (product.isGreen) {
    return <p className="text-sm font-medium text-ok">Đạt, không cần xác nhận</p>;
  }
  const time = new Date().toTimeString().slice(0, 5);
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className={product.qcConfirmed ? quietBtn : primaryBtn}
        onClick={() =>
          patchProduct(product.code, {
            qcConfirmed: !product.qcConfirmed,
            qcTime: product.qcConfirmed ? "" : time,
          })
        }
      >
        <Check className="size-4" aria-hidden />
        {product.qcConfirmed ? `Đã xác nhận ${product.qcTime}` : "Xác nhận"}
      </button>
      <select
        value={product.qcResolution}
        onChange={(event) => patchProduct(product.code, { qcResolution: event.target.value })}
        className={`${field} bg-card`}
        aria-label={`Hướng xử lý ${product.code}`}
      >
        {RESOLUTION_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <input
        value={product.qcNote}
        onChange={(event) => patchProduct(product.code, { qcNote: event.target.value })}
        placeholder="Ghi chú đoạn thùng"
        className={`${field} px-2`}
        aria-label={`Ghi chú ${product.code}`}
      />
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className={`rounded-lg border-l-4 bg-card p-4 shadow-card ${rail[product.status]}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-medium">{product.code}</p>
          {product.isGreen && (
            <p className="text-sm font-medium">{(product.packedDates ?? []).join(", ") || "Không có ngày"}</p>
          )}
          <p className="text-sm font-medium">{product.name}</p>
        </div>
        <StatusPill status={product.status} label={product.statusLabel} />
      </div>
      <p className="mt-2 font-mono text-sm text-muted-foreground">
        {product.totalBoxes} thùng · TB {kg(product.avg)} · PLKL {product.plkl === null ? "—" : kg(product.plkl)}
      </p>
      {!product.isGreen && (
        <div className="mt-2">
          <FailingDates product={product} />
        </div>
      )}
      <div className="mt-3">
        <QcCell product={product} />
      </div>
    </article>
  );
}

function ChartPanel({ mounted }: { mounted: boolean }) {
  const products = useQcStore((state) => state.products);
  const trips = useQcStore((state) => state.trips);
  const chartCode = useQcStore((state) => state.chartCode);
  const setChartCode = useQcStore((state) => state.setChartCode);
  const lower = useQcStore((state) => state.lowerTolPercent);
  const upper = useQcStore((state) => state.upperTolPercent);
  const product = products.find((item) => item.code === chartCode) ?? products[0];
  const points = trips
    .filter((trip) => trip.code === product?.code)
    .map((trip) => ({
      name: `${trip.packedOn ? `${trip.packedOn} · ` : ""}${trip.from_box}–${trip.to_box}`,
      gross: trip.gross,
      plkl: product?.plkl,
      low: product ? Math.round(product.avg * (1 - lower / 100) * 1000) / 1000 : null,
      high: product ? Math.round(product.avg * (1 + upper / 100) * 1000) / 1000 : null,
      fill:
        trip.status === "critical"
          ? "var(--color-bad)"
          : trip.status === "warn-low"
            ? "var(--color-warn)"
            : trip.status === "warn-high"
              ? "var(--color-over)"
              : "var(--color-ok)",
    }));

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm">
          Mã hàng
          <select
            value={product?.code ?? ""}
            onChange={(event) => setChartCode(event.target.value)}
            className={`${field} bg-card`}
          >
            {products.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted-foreground">Cột là gross. Đường là PLKL, sàn và trần.</p>
      </div>
      {!product || !mounted ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chưa có chuyến cân để vẽ.</p>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-foreground)",
                }}
              />
              <Bar dataKey="gross" name="Gross" radius={[4, 4, 0, 0]}>
                {points.map((point, index) => (
                  <Cell key={`${point.name}-${index}`} fill={point.fill} />
                ))}
              </Bar>
              <Line dataKey="plkl" name="PLKL" stroke="var(--color-bad)" strokeDasharray="4 4" dot={false} strokeWidth={2} />
              <Line dataKey="low" name="Sàn" stroke="var(--color-warn)" strokeDasharray="2 2" dot={false} />
              <Line dataKey="high" name="Trần" stroke="var(--color-over)" strokeDasharray="2 2" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      {product && (
        <p className="text-center font-mono text-xs text-muted-foreground">
          {product.code} · {product.name} · PLKL {kg(product.plkl)} kg · TB {kg(product.avg)} kg
        </p>
      )}
    </div>
  );
}

function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const sheetUrl = useQcStore((state) => state.sheetUrl);
  const sheetName = useQcStore((state) => state.sheetName);
  const scriptUrl = useQcStore((state) => state.scriptUrl);
  const upper = useQcStore((state) => state.upperTolPercent);
  const lower = useQcStore((state) => state.lowerTolPercent);
  const sourceLabel = useQcStore((state) => state.sourceLabel);
  const syncing = useQcStore((state) => state.syncing);
  const saveConfig = useQcStore((state) => state.saveConfig);
  const syncSheet = useQcStore((state) => state.syncSheet);
  const importMaster = useQcStore((state) => state.importMaster);
  const [draft, setDraft] = useState<AppConfig>({
    sheetUrl,
    sheetName,
    scriptUrl,
    upperTolPercent: upper,
    lowerTolPercent: lower,
  });

  useEffect(() => {
    if (open) {
      setDraft({ sheetUrl, sheetName, scriptUrl, upperTolPercent: upper, lowerTolPercent: lower });
    }
  }, [open, sheetUrl, sheetName, scriptUrl, upper, lower]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/30" />
        <Dialog.Content className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-screen max-w-lg -translate-y-1/2 overflow-y-auto rounded-lg bg-card p-5 shadow-card">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-lg font-semibold">Nguồn định mức và dung sai</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">{sourceLabel}</Dialog.Description>
            </div>
            <Dialog.Close className={quietBtn} aria-label="Đóng">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="flex flex-col gap-3">
            <Field label="Link Google Sheet phụ lục">
              <input
                value={draft.sheetUrl}
                onChange={(event) => setDraft({ ...draft, sheetUrl: event.target.value })}
                className={`${field} w-full`}
              />
            </Field>
            <Field label="Link Apps Script (tuỳ chọn, đồng bộ ca giữa các máy)">
              <input
                value={draft.scriptUrl}
                onChange={(event) => setDraft({ ...draft, scriptUrl: event.target.value })}
                placeholder="https://script.google.com/macros/s/.../exec"
                className={`${field} w-full`}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tên sheet">
                <input
                  value={draft.sheetName}
                  onChange={(event) => setDraft({ ...draft, sheetName: event.target.value })}
                  className={`${field} w-full`}
                />
              </Field>
              <Field label="Sàn % dưới TB">
                <input
                  type="number"
                  min={1}
                  value={draft.lowerTolPercent}
                  onChange={(event) => setDraft({ ...draft, lowerTolPercent: Number(event.target.value) })}
                  className={`${field} w-full`}
                />
              </Field>
              <Field label="Trần % trên TB">
                <input
                  type="number"
                  min={1}
                  value={draft.upperTolPercent}
                  onChange={(event) => setDraft({ ...draft, upperTolPercent: Number(event.target.value) })}
                  className={`${field} w-full`}
                />
              </Field>
            </div>
            <Field label="Hoặc nạp file Excel phụ lục">
              <input
                type="file"
                accept=".xlsx,.xls"
                className="text-sm"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importMaster(file);
                }}
              />
            </Field>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className={quietBtn}
                disabled={syncing}
                onClick={() => {
                  saveConfig(draft);
                  void syncSheet(false);
                }}
              >
                <RefreshCw className="size-4" aria-hidden />
                {syncing ? "Đang nạp" : "Đồng bộ Sheet"}
              </button>
              <button
                type="button"
                className={primaryBtn}
                onClick={() => {
                  saveConfig(draft);
                  onOpenChange(false);
                }}
              >
                Lưu
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function GuideDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/30" />
        <Dialog.Content className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2 rounded-lg bg-card p-5 shadow-card">
          <Dialog.Title className="text-lg font-semibold">Quy chuẩn kiểm tra</Dialog.Title>
          <Dialog.Description className="sr-only">Ba bước đối chiếu khối lượng theo mã hàng.</Dialog.Description>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground">
            <li>Nạp packing list. Hệ thống gộp theo mã và lấy định mức PLKL.</li>
            <li>Thiếu so với PLKL là không đạt. Lệch dưới sàn hoặc trên trần so với trung bình ca thì QC phải xác nhận.</li>
            <li>Khi mọi mã lệch đã xác nhận, gửi báo cáo. QA ký duyệt hoặc tải Excel.</li>
          </ol>
          <div className="mt-4 flex justify-end">
            <Dialog.Close className={primaryBtn}>Đã hiểu</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
