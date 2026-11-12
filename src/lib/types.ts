export type ProductStatus = "critical" | "warn-low" | "warn-high" | "unknown" | "pass";

export type FilterKey = "all" | "non-green" | "critical" | "warn-low" | "warn-high" | "pass";

export type Role = "QC" | "QA";

export type TabKey = "detail" | "qa" | "chart";

export type Master = Record<string, [string, number]>;

export type RawRow = {
  code: string;
  from_box?: number | string | null;
  to_box?: number | string | null;
  box_count?: number | string | null;
  gross?: unknown;
  name?: string;
  packed_on?: string;
};

export type FailedSegment = {
  from_box: number;
  to_box: number;
  box_count: number;
  gross: number;
  packedOn: string;
  type: Exclude<ProductStatus, "pass">;
  reason: string;
};

export type Product = {
  index: number;
  code: string;
  name: string;
  tripCount: number;
  totalBoxes: number;
  avg: number;
  plkl: number | null;
  min: number;
  max: number;
  status: ProductStatus;
  statusLabel: string;
  isGreen: boolean;
  failedSegments: FailedSegment[];
  packedDates: string[];
  qcConfirmed: boolean;
  qcResolution: string;
  qcNote: string;
  qcTime: string;
};

export type Trip = {
  code: string;
  from_box: number;
  to_box: number;
  box_count: number;
  gross: number;
  packedOn: string;
  status: ProductStatus;
  statusLabel: string;
};

export type ReportItem = {
  code: string;
  name: string;
  totalBoxes: number;
  avg: number;
  plkl: number | null;
  status: ProductStatus;
  statusLabel: string;
  isGreen: boolean;
  failedSegmentsText: string;
  qcResolution: string;
  qcNote: string;
  qcTime: string;
};

export type QaReport = {
  id: string;
  timestamp: string;
  createdAt?: string;
  handledAt?: string;
  fileName: string;
  qcInspector: string;
  qaName?: string;
  qaStatus: "Chờ QA duyệt" | "QA Đã Duyệt";
  totalProducts: number;
  passProductsCount: number;
  failProductsCount: number;
  totalBoxes: number;
  productsSummary: ReportItem[];
};

export type AppConfig = {
  sheetUrl: string;
  sheetName: string;
  scriptUrl: string;
  upperTolPercent: number;
  lowerTolPercent: number;
};

export const DEFAULT_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1YA0j-kh_m3mJMvxtDp2oHkgNpG9BsqPBnCPk_3Q413I/edit";

export const RESOLUTION_OPTIONS: { value: string; label: string }[] = [
  { value: "Đã cô lập đoạn thùng lỗi & cân bù đủ chuẩn", label: "Cô lập và cân bù đủ chuẩn" },
  { value: "Đã kiểm tra đoạn thùng lệch: Đủ gói, đạt PLKL", label: "Đủ gói, đạt PLKL" },
  { value: "Đã kiểm tra đoạn thùng lệch: Đúng quy cách", label: "Sai số bao bì, đúng quy cách" },
  { value: "Đã xả đoạn thùng lỗi đóng gói lại", label: "Xả đoạn lỗi và đóng lại" },
  { value: "Đã báo R&D cập nhật định mức PLKL", label: "Báo R&D cập nhật PLKL" },
];
