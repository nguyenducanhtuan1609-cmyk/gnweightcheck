import type { Master, Product, QaReport, RawRow } from "@/lib/types";

type SheetRows = unknown[][];

async function readMatrix(file: File): Promise<{ name: string; rows: SheetRows }[]> {
  const XLSX = await import("xlsx");
  const data = new Uint8Array(await file.arrayBuffer());
  const workbook = XLSX.read(data, { type: "array", cellDates: true });
  return workbook.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: "" }) as SheetRows,
  }));
}

function isDateHeader(cell: string) {
  return (
    cell.includes("ngày đóng thùng") ||
    cell.includes("ngay dong thung") ||
    cell.includes("ngày đóng") ||
    cell.includes("ngày sản xuất") ||
    cell.includes("ngày sx") ||
    cell === "nsx" ||
    cell === "date"
  );
}

export function formatPackedDate(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const day = String(value.getUTCDate()).padStart(2, "0");
    const month = String(value.getUTCMonth() + 1).padStart(2, "0");
    const year = value.getUTCFullYear();
    if (year < 1990 || year > 2100) return "";
    return `${day}/${month}/${year}`;
  }
  if (typeof value === "number" && value > 20000 && value < 80000) {
    const utc = new Date(Date.UTC(1899, 11, 30) + Math.round(value) * 86400000);
    return formatPackedDate(utc);
  }
  const text = String(value).trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const local = text.match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{2,4})/);
  if (local) {
    const year = local[3].length === 2 ? `20${local[3]}` : local[3];
    return `${local[1].padStart(2, "0")}/${local[2].padStart(2, "0")}/${year}`;
  }
  return "";
}

function cellText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export async function parsePackingList(file: File): Promise<RawRow[]> {
  const sheets = await readMatrix(file);
  const rows = sheets[0]?.rows ?? [];
  if (rows.length < 2) return [];

  let headerIdx = -1;
  let colCode = -1;
  let colFrom = -1;
  let colTo = -1;
  let colCnt = -1;
  let colGross = -1;
  let colDate = -1;

  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i] ?? [];
    let code = -1;
    let from = -1;
    let to = -1;
    let cnt = -1;
    let gross = -1;
    let date = -1;
    for (let j = 0; j < row.length; j++) {
      const cell = cellText(row[j]);
      if (cell.includes("mã mặt hàng") || cell === "mã hàng" || cell === "code") code = j;
      if (cell.includes("từ thùng") || cell === "từ") from = j;
      if (cell.includes("đến thùng") || cell === "đến") to = j;
      if (cell.includes("sl thùng") || cell.includes("số thùng") || cell === "thùng") cnt = j;
      if (cell === "gross" || cell.includes("khối lượng") || cell.includes("trọng lượng")) gross = j;
      if (isDateHeader(cell)) date = j;
    }
    if (code !== -1 && (gross !== -1 || from !== -1)) {
      headerIdx = i;
      colCode = code;
      colFrom = from;
      colTo = to;
      colCnt = cnt;
      colGross = gross;
      colDate = date;
      break;
    }
  }

  if (headerIdx === -1) {
    headerIdx = 0;
    colCode = 0;
    colFrom = 3;
    colTo = 4;
    colCnt = 5;
    colGross = 6;
  }

  const parsed: RawRow[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const code = row[colCode];
    if (!code) continue;
    const fromB = colFrom !== -1 ? row[colFrom] : 0;
    const toB = colTo !== -1 ? row[colTo] : 0;
    const cnt =
      colCnt !== -1 && row[colCnt] !== "" && row[colCnt] != null
        ? row[colCnt]
        : Number.parseInt(String(toB), 10) - Number.parseInt(String(fromB), 10) + 1;
    parsed.push({
      code: String(code).trim(),
      from_box: fromB as number | string,
      to_box: toB as number | string,
      box_count: cnt as number | string,
      gross: colGross !== -1 ? row[colGross] : null,
      packed_on: colDate !== -1 ? formatPackedDate(row[colDate]) : "",
    });
  }
  return parsed;
}

export function masterFromRows(rows: SheetRows): Master {
  const next: Master = {};
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;
    const code = String(row[0]).trim();
    const name = row[1] ? String(row[1]).trim() : "";
    const grams = Number.parseFloat(String(row[18] ?? ""));
    if (!code || !Number.isFinite(grams) || grams <= 0) continue;
    next[code] = [name.slice(0, 60), Math.round((grams / 1000) * 1000) / 1000];
  }
  return next;
}

export async function parseMasterFile(file: File): Promise<Master> {
  const sheets = await readMatrix(file);
  const picked = sheets.find((sheet) => sheet.name === "plkl list") ?? sheets[0];
  return masterFromRows(picked?.rows ?? []);
}

export async function masterFromSheetCsv(csv: string): Promise<Master> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(csv, { type: "string" });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
    header: 1,
    defval: "",
  }) as SheetRows;
  return masterFromRows(rows);
}

function stamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

export async function exportShift(products: Product[]) {
  const XLSX = await import("xlsx");
  const rows: (string | number)[][] = [
    [
      "STT",
      "Mã mặt hàng",
      "Tên mặt hàng",
      "Tổng thùng",
      "Số chuyến cân",
      "Gross TB (kg)",
      "PLKL chuẩn (kg)",
      "Min (kg)",
      "Max (kg)",
      "Kết quả",
      "Ngày sản xuất",
      "Đoạn thùng không đạt",
      "QC xác nhận",
      "Hướng xử lý",
      "Ghi chú",
    ],
  ];
  for (const product of products) {
    const segments = product.isGreen
      ? ""
      : product.failedSegments
          .map((seg) => `${seg.packedOn ? `${seg.packedOn} · ` : ""}Thùng ${seg.from_box}-${seg.to_box} (${seg.reason})`)
          .join("; ");
    rows.push([
      product.index,
      product.code,
      product.name,
      product.totalBoxes,
      product.tripCount,
      product.avg,
      product.plkl ?? "",
      product.min,
      product.max,
      product.statusLabel,
      (product.packedDates ?? []).join(", "),
      segments,
      product.isGreen ? "Đạt" : product.qcConfirmed ? "Đã xác nhận" : "Chưa xác nhận",
      product.qcResolution,
      product.qcNote,
    ]);
  }
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "Theo_mat_hang");
  XLSX.writeFile(book, `Kiem_soat_khoi_luong_${stamp()}.xlsx`);
}

export async function exportReport(report: QaReport) {
  const XLSX = await import("xlsx");
  const rows: (string | number)[][] = [
    ["BÁO CÁO KIỂM TRA KHỐI LƯỢNG THEO MẶT HÀNG"],
    ["Mã báo cáo", report.id, "Thời gian", report.timestamp],
    ["QC", report.qcInspector, "Trạng thái QA", report.qaStatus],
    ["File gốc", report.fileName, "Tổng thùng", report.totalBoxes],
    [],
    [
      "STT",
      "Mã",
      "Tên",
      "Tổng thùng",
      "Gross TB",
      "PLKL",
      "Kết quả",
      "Đoạn không đạt",
      "Xác nhận QC",
      "Ghi chú",
    ],
  ];
  report.productsSummary.forEach((item, index) => {
    rows.push([
      index + 1,
      item.code,
      item.name,
      item.totalBoxes,
      item.avg,
      item.plkl ?? "",
      item.statusLabel,
      item.isGreen ? "" : item.failedSegmentsText,
      item.isGreen ? "Đạt chuẩn" : item.qcResolution,
      item.qcNote,
    ]);
  });
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "Bao_cao");
  XLSX.writeFile(book, `Bao_cao_QA_${report.id}.xlsx`);
}
