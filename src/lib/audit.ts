import type { FailedSegment, Master, Product, ProductStatus, RawRow, Trip } from "@/lib/types";

export function cleanGrossValue(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return Number.parseFloat(`${val.getDate()}.${val.getMonth() + 1}`);
  }
  if (typeof val === "number") return Number.isFinite(val) ? val : null;
  const s = String(val).trim();
  if (s.includes("-") && s.length >= 8) {
    const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return Number.parseFloat(`${Number.parseInt(m[3], 10)}.${Number.parseInt(m[2], 10)}`);
  }
  const num = Number.parseFloat(s.replace(",", "."));
  return Number.isNaN(num) ? null : num;
}

function defaultResolution(status: ProductStatus): string {
  if (status === "unknown") return "Đã báo R&D cập nhật định mức PLKL";
  if (status === "critical") return "Đã cô lập đoạn thùng lỗi & cân bù đủ chuẩn";
  if (status === "warn-low") return "Đã kiểm tra đoạn thùng lệch: Đủ gói, đạt PLKL";
  if (status === "warn-high") return "Đã kiểm tra đoạn thùng lệch: Đúng quy cách";
  return "Đạt chuẩn xuất hàng";
}

function statusCopy(status: ProductStatus, lower: number, upper: number): string {
  if (status === "unknown") return "CHƯA CÓ PLKL";
  if (status === "critical") return "KHÔNG ĐẠT · THIẾU CÂN";
  if (status === "warn-low") return `CẦN XEM LẠI · DƯỚI -${lower}%`;
  if (status === "warn-high") return `CẦN XEM LẠI · TRÊN +${upper}%`;
  return "ĐẠT CHUẨN";
}

export function auditProducts(
  rawList: RawRow[],
  master: Master,
  lowerTolPercent: number,
  upperTolPercent: number,
): { products: Product[]; trips: Trip[] } {
  const groupMap = new Map<
    string,
    {
      code: string;
      name: string;
      plkl: number | null;
      grossValues: number[];
      trips: { from_box: number; to_box: number; box_count: number; gross: number; packedOn: string }[];
      totalBoxes: number;
    }
  >();

  for (const row of rawList) {
    const code = String(row.code || "").trim();
    const gross = cleanGrossValue(row.gross);
    if (!code || gross === null) continue;

    let group = groupMap.get(code);
    if (!group) {
      const info = master[code];
      group = {
        code,
        name: info ? info[0] : row.name || "Chưa khai báo tên",
        plkl: info ? info[1] : null,
        grossValues: [],
        trips: [],
        totalBoxes: 0,
      };
      groupMap.set(code, group);
    }

    const fromB = Number.parseInt(String(row.from_box ?? 0), 10) || 0;
    const toB = Number.parseInt(String(row.to_box ?? 0), 10) || 0;
    const boxesRaw = Number.parseInt(String(row.box_count ?? toB - fromB + 1), 10);
    const boxes = Number.isNaN(boxesRaw) || boxesRaw <= 0 ? 1 : boxesRaw;

    group.grossValues.push(gross);
    group.totalBoxes += boxes;
    group.trips.push({ from_box: fromB, to_box: toB, box_count: boxes, gross, packedOn: row.packed_on || "" });
  }

  const products: Product[] = [];
  const trips: Trip[] = [];
  const order: Record<ProductStatus, number> = {
    critical: 1,
    "warn-low": 2,
    "warn-high": 3,
    unknown: 4,
    pass: 5,
  };

  for (const group of groupMap.values()) {
    const vals = group.grossValues;
    const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 1000) / 1000;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const plkl = group.plkl;
    const failed: FailedSegment[] = [];
    let hasCritical = false;
    let hasWarnLow = false;
    let hasWarnHigh = false;

    for (const trip of group.trips) {
      let tripStatus: ProductStatus = "pass";
      let reason = "Đạt";
      const dev = avg ? Math.round(((trip.gross - avg) / avg) * 1000) / 10 : 0;

      if (plkl === null) {
        tripStatus = "unknown";
        reason = "Chưa có PLKL";
      } else if (trip.gross < plkl) {
        tripStatus = "critical";
        hasCritical = true;
        const diffG = Math.round((plkl - trip.gross) * 1000);
        reason = `Thiếu ${diffG} g (${trip.gross.toFixed(2)} < ${plkl})`;
        failed.push({ ...trip, type: "critical", reason });
      } else if (trip.gross < avg * (1 - lowerTolPercent / 100)) {
        tripStatus = "warn-low";
        hasWarnLow = true;
        reason = `Lệch ${dev}% (${trip.gross.toFixed(2)} kg)`;
        failed.push({ ...trip, type: "warn-low", reason });
      } else if (trip.gross > avg * (1 + upperTolPercent / 100)) {
        tripStatus = "warn-high";
        hasWarnHigh = true;
        reason = `Vượt +${dev}% (${trip.gross.toFixed(2)} kg)`;
        failed.push({ ...trip, type: "warn-high", reason });
      }

      trips.push({
        code: group.code,
        from_box: trip.from_box,
        to_box: trip.to_box,
        box_count: trip.box_count,
        gross: trip.gross,
        packedOn: trip.packedOn,
        status: tripStatus,
        statusLabel: reason,
      });
    }

    let status: ProductStatus = "pass";
    if (plkl === null) status = "unknown";
    else if (hasCritical) status = "critical";
    else if (hasWarnLow) status = "warn-low";
    else if (hasWarnHigh) status = "warn-high";

    const isGreen = status === "pass";
    products.push({
      index: 0,
      code: group.code,
      name: group.name,
      tripCount: group.trips.length,
      totalBoxes: group.totalBoxes,
      avg,
      plkl,
      min,
      max,
      status,
      statusLabel: statusCopy(status, lowerTolPercent, upperTolPercent),
      isGreen,
      failedSegments: failed,
      packedDates: [...new Set(group.trips.map((trip) => trip.packedOn).filter(Boolean))],
      qcConfirmed: isGreen,
      qcResolution: defaultResolution(status),
      qcNote: "",
      qcTime: "",
    });
  }

  products.sort((a, b) => order[a.status] - order[b.status] || a.code.localeCompare(b.code));
  products.forEach((p, i) => {
    p.index = i + 1;
  });

  return { products, trips };
}

export function kg(n: number | null | undefined, digits = 3): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}
