import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { a as Settings, c as Scale, d as Download, f as ClipboardCheck, h as BookOpen, i as ShieldCheck, l as RefreshCw, m as ChartColumn, o as Send, p as Check, r as Trash2, s as Search, t as X, u as FileSpreadsheet } from "../_libs/lucide-react.mjs";
import { a as DialogOverlay, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { a as CartesianGrid, c as ResponsiveContainer, i as Line, l as Tooltip, n as YAxis, o as Bar, r as XAxis, s as Cell, t as ComposedChart } from "../_libs/recharts+[...].mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CHiPutsO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cleanGrossValue(val) {
	if (val === null || val === void 0 || val === "") return null;
	if (val instanceof Date && !Number.isNaN(val.getTime())) return Number.parseFloat(`${val.getDate()}.${val.getMonth() + 1}`);
	if (typeof val === "number") return Number.isFinite(val) ? val : null;
	const s = String(val).trim();
	if (s.includes("-") && s.length >= 8) {
		const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
		if (m) return Number.parseFloat(`${Number.parseInt(m[3], 10)}.${Number.parseInt(m[2], 10)}`);
	}
	const num = Number.parseFloat(s.replace(",", "."));
	return Number.isNaN(num) ? null : num;
}
function defaultResolution(status) {
	if (status === "unknown") return "Đã báo R&D cập nhật định mức PLKL";
	if (status === "critical") return "Đã cô lập đoạn thùng lỗi & cân bù đủ chuẩn";
	if (status === "warn-low") return "Đã kiểm tra đoạn thùng lệch: Đủ gói, đạt PLKL";
	if (status === "warn-high") return "Đã kiểm tra đoạn thùng lệch: Đúng quy cách";
	return "Đạt chuẩn xuất hàng";
}
function statusCopy(status, lower, upper) {
	if (status === "unknown") return "CHƯA CÓ PLKL";
	if (status === "critical") return "KHÔNG ĐẠT · THIẾU CÂN";
	if (status === "warn-low") return `CẦN XEM LẠI · DƯỚI -${lower}%`;
	if (status === "warn-high") return `CẦN XEM LẠI · TRÊN +${upper}%`;
	return "ĐẠT CHUẨN";
}
function auditProducts(rawList, master, lowerTolPercent, upperTolPercent) {
	const groupMap = /* @__PURE__ */ new Map();
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
				totalBoxes: 0
			};
			groupMap.set(code, group);
		}
		const fromB = Number.parseInt(String(row.from_box ?? 0), 10) || 0;
		const toB = Number.parseInt(String(row.to_box ?? 0), 10) || 0;
		const boxesRaw = Number.parseInt(String(row.box_count ?? toB - fromB + 1), 10);
		const boxes = Number.isNaN(boxesRaw) || boxesRaw <= 0 ? 1 : boxesRaw;
		group.grossValues.push(gross);
		group.totalBoxes += boxes;
		group.trips.push({
			from_box: fromB,
			to_box: toB,
			box_count: boxes,
			gross
		});
	}
	const products = [];
	const trips = [];
	const order = {
		critical: 1,
		"warn-low": 2,
		"warn-high": 3,
		unknown: 4,
		pass: 5
	};
	for (const group of groupMap.values()) {
		const vals = group.grossValues;
		const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 1e3) / 1e3;
		const min = Math.min(...vals);
		const max = Math.max(...vals);
		const plkl = group.plkl;
		const failed = [];
		let hasCritical = false;
		let hasWarnLow = false;
		let hasWarnHigh = false;
		for (const trip of group.trips) {
			let tripStatus = "pass";
			let reason = "Đạt";
			const dev = avg ? Math.round((trip.gross - avg) / avg * 1e3) / 10 : 0;
			if (plkl === null) {
				tripStatus = "unknown";
				reason = "Chưa có PLKL";
			} else if (trip.gross < plkl) {
				tripStatus = "critical";
				hasCritical = true;
				reason = `Thiếu ${Math.round((plkl - trip.gross) * 1e3)} g (${trip.gross.toFixed(2)} < ${plkl})`;
				failed.push({
					...trip,
					type: "critical",
					reason
				});
			} else if (trip.gross < avg * (1 - lowerTolPercent / 100)) {
				tripStatus = "warn-low";
				hasWarnLow = true;
				reason = `Lệch ${dev}% (${trip.gross.toFixed(2)} kg)`;
				failed.push({
					...trip,
					type: "warn-low",
					reason
				});
			} else if (trip.gross > avg * (1 + upperTolPercent / 100)) {
				tripStatus = "warn-high";
				hasWarnHigh = true;
				reason = `Vượt +${dev}% (${trip.gross.toFixed(2)} kg)`;
				failed.push({
					...trip,
					type: "warn-high",
					reason
				});
			}
			trips.push({
				code: group.code,
				from_box: trip.from_box,
				to_box: trip.to_box,
				box_count: trip.box_count,
				gross: trip.gross,
				status: tripStatus,
				statusLabel: reason
			});
		}
		let status = "pass";
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
			qcConfirmed: isGreen,
			qcResolution: defaultResolution(status),
			qcNote: "",
			qcTime: ""
		});
	}
	products.sort((a, b) => order[a.status] - order[b.status] || a.code.localeCompare(b.code));
	products.forEach((p, i) => {
		p.index = i + 1;
	});
	return {
		products,
		trips
	};
}
function kg(n, digits = 3) {
	if (n === null || n === void 0 || Number.isNaN(n)) return "—";
	return n.toFixed(digits);
}
async function readMatrix(file) {
	const XLSX = await import("../_libs/xlsx.mjs").then((n) => n.t);
	const data = new Uint8Array(await file.arrayBuffer());
	const workbook = XLSX.read(data, {
		type: "array",
		cellDates: true
	});
	return workbook.SheetNames.map((name) => ({
		name,
		rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], {
			header: 1,
			defval: ""
		})
	}));
}
function cellText(value) {
	return String(value ?? "").trim().toLowerCase();
}
async function parsePackingList(file) {
	const rows = (await readMatrix(file))[0]?.rows ?? [];
	if (rows.length < 2) return [];
	let headerIdx = -1;
	let colCode = -1;
	let colFrom = -1;
	let colTo = -1;
	let colCnt = -1;
	let colGross = -1;
	for (let i = 0; i < Math.min(10, rows.length); i++) {
		const row = rows[i] ?? [];
		let code = -1;
		let from = -1;
		let to = -1;
		let cnt = -1;
		let gross = -1;
		for (let j = 0; j < row.length; j++) {
			const cell = cellText(row[j]);
			if (cell.includes("mã mặt hàng") || cell === "mã hàng" || cell === "code") code = j;
			if (cell.includes("từ thùng") || cell === "từ") from = j;
			if (cell.includes("đến thùng") || cell === "đến") to = j;
			if (cell.includes("sl thùng") || cell.includes("số thùng") || cell === "thùng") cnt = j;
			if (cell === "gross" || cell.includes("khối lượng") || cell.includes("trọng lượng")) gross = j;
		}
		if (code !== -1 && (gross !== -1 || from !== -1)) {
			headerIdx = i;
			colCode = code;
			colFrom = from;
			colTo = to;
			colCnt = cnt;
			colGross = gross;
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
	const parsed = [];
	for (let i = headerIdx + 1; i < rows.length; i++) {
		const row = rows[i] ?? [];
		const code = row[colCode];
		if (!code) continue;
		const fromB = colFrom !== -1 ? row[colFrom] : 0;
		const toB = colTo !== -1 ? row[colTo] : 0;
		const cnt = colCnt !== -1 && row[colCnt] !== "" && row[colCnt] != null ? row[colCnt] : Number.parseInt(String(toB), 10) - Number.parseInt(String(fromB), 10) + 1;
		parsed.push({
			code: String(code).trim(),
			from_box: fromB,
			to_box: toB,
			box_count: cnt,
			gross: colGross !== -1 ? row[colGross] : null
		});
	}
	return parsed;
}
function masterFromRows(rows) {
	const next = {};
	for (let i = 4; i < rows.length; i++) {
		const row = rows[i];
		if (!row || !row[0]) continue;
		const code = String(row[0]).trim();
		const name = row[1] ? String(row[1]).trim() : "";
		const grams = Number.parseFloat(String(row[18] ?? ""));
		if (!code || !Number.isFinite(grams) || grams <= 0) continue;
		next[code] = [name.slice(0, 60), Math.round(grams / 1e3 * 1e3) / 1e3];
	}
	return next;
}
async function parseMasterFile(file) {
	const sheets = await readMatrix(file);
	return masterFromRows((sheets.find((sheet) => sheet.name === "plkl list") ?? sheets[0])?.rows ?? []);
}
async function masterFromSheetCsv(csv) {
	const XLSX = await import("../_libs/xlsx.mjs").then((n) => n.t);
	const workbook = XLSX.read(csv, { type: "string" });
	return masterFromRows(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
		header: 1,
		defval: ""
	}));
}
function stamp() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
}
async function exportShift(products) {
	const XLSX = await import("../_libs/xlsx.mjs").then((n) => n.t);
	const rows = [[
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
		"Đoạn thùng không đạt",
		"QC xác nhận",
		"Hướng xử lý",
		"Ghi chú"
	]];
	for (const product of products) {
		const segments = product.isGreen ? "" : product.failedSegments.map((seg) => `Thùng ${seg.from_box}-${seg.to_box} (${seg.reason})`).join("; ");
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
			segments,
			product.isGreen ? "Đạt" : product.qcConfirmed ? "Đã xác nhận" : "Chưa xác nhận",
			product.qcResolution,
			product.qcNote
		]);
	}
	const book = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "Theo_mat_hang");
	XLSX.writeFile(book, `Kiem_soat_khoi_luong_${stamp()}.xlsx`);
}
async function exportReport(report) {
	const XLSX = await import("../_libs/xlsx.mjs").then((n) => n.t);
	const rows = [
		["BÁO CÁO KIỂM TRA KHỐI LƯỢNG THEO MẶT HÀNG"],
		[
			"Mã báo cáo",
			report.id,
			"Thời gian",
			report.timestamp
		],
		[
			"QC",
			report.qcInspector,
			"Trạng thái QA",
			report.qaStatus
		],
		[
			"File gốc",
			report.fileName,
			"Tổng thùng",
			report.totalBoxes
		],
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
			"Ghi chú"
		]
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
			item.qcNote
		]);
	});
	const book = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "Bao_cao");
	XLSX.writeFile(book, `Bao_cao_QA_${report.id}.xlsx`);
}
var plkl_master_default = {
	"ABWC000000ABW11.00": ["CHẢ GIÒ RẾ HẢI SẢN 20G, KB", 9.76],
	"ABWC000000ABW12.00": ["CHẢ GIÒ RẾ TÔM 20G, KB", 9.76],
	"ABWC000000ABW13.00": ["CHẢ GIÒ BỘT MÌ HẢI SẢN 20G, KB", 9.814],
	"VSA00000700.00": ["CÀ TÍM NƯỚNG (500 G/GÓI)", 6.684],
	"HIGP000000HIG04.0A": ["ĐẾ PIZZA NƯỚNG 160G 10 INCHES (HA)", 4.742],
	"VFM00006800.BC": ["SOUP LẨU HOTPOT (123 G/GÓI)", 8.81],
	"VFM00006900.BC": ["SOUP LẨU HOTPOT (369 G/GÓI)", 9.94],
	"HLHP00000000093.0B": ["BÁNH NAAN BƠ TỎI (HÌNH OVAL) 70G, LOGO HA", 9.836],
	"VHF00023400.0C": ["Sốt phô mai ( 500 g)\nKHỐI LƯỢNG GIAO ĐỘNG: 502G - 515G", 13.398],
	"VCO00006600.0A": ["Bánh mì bơ tỏi phô mai 70 g (140 g)", 3.578],
	"JNIP00000JNI37A.00": ["BÁNH PIZZA SAUCE CÀ CHUA 170G, 20CM", 4.697],
	"EHAB00000036215.00": ["BÁNH CÀ RI RAU CỦ CHAY 130G", 8.63],
	"UNMB000000UNM01.00": ["BÁNH CÀ RI RAU CỦ CHAY 130G (CHIÊN SẴN)", 8.577],
	"HIGP000000HIG06.00": ["SOUP RAU CỦ 200G (HA)", 4.5],
	"HIGP000000HIG07.00": ["SOUP HẢI SẢN 200G (HA)", 4.5],
	"VHF00053500.0A": ["Bánh mì mè Hàn Quốc 45 G (270 G)", 3.014],
	"V4P00000400.0A": ["Spicy seafood pizza 23cm (316g)", 6.052],
	"V4P00000500.0A": ["Salami pizza 23cm (285g)", 5.599],
	"ENPK00000002841.AE": ["BÁNH BAO SANDWICH 60G", 10.668],
	"JAC2F0000JAC212.0A": ["XOÀI KEO CẮT VUÔNG 15MM, 500G/PA", 10.864],
	"HLHF00000HLH85A.00": ["HÀNH TÂY TẨM BỘT CHIÊN, LOGO HA", 10.13],
	"ETFK00011298100.00": ["MÌ XÀO TÔM 300G", 6.97],
	"EFPB0000EFP031A.0B": ["BÁNH BAO SANDWICH 100G", 3.771],
	"VP700000300.0C": ["PIZZA NẤM BURGER BÒ XỐT MAYO 20CM (215 G/GÓI)", 5.47],
	"ECOK00000007414.AC": ["BÁNH RAU CỦ CHIÊN TÔM 30G", 4.472],
	"EFPB00000EFP042.0C": ["BÁNH BAO SANDWICH 25G", 4.659],
	"EFPK00000EFP058.00": ["TÚI MAY MẮN NHÂN CƠM CUỘN TÔM CHIỄN SẴN VỚI NƯỚC SỐT 260G", 3.898],
	"EFPK00000EFP055.00": ["BURGER CƠM 105G", 5.448],
	"EASB000000EAS18.00": ["BÁNH CUỐN TÔM 48G VÀ SỐT NƯỚC TƯƠNG 60G", 9.747],
	"ENPB00000007309.0B": ["BÁNH BAO SANDWICH MÀU VÀNG 30G", 6.955],
	"ENPB00000007310.0C": ["BÁNH BAO SANDWICH MÀU CAM 30G", 6.955],
	"ENPB00000007398.0B": ["BÁNH BAO SANDWICH 70G", 4.969],
	"ENPK00000002841.AD": ["BÁNH BAO SANDWICH 60G", 10.668],
	"HSVP000000HSV04.00": ["SAMOSA RẾ SÒ ĐIỆP HÌNH NÓN 20G", 12.219],
	"HSVB000000HSV05.00": ["BÁNH MÌ BƠ TỎI 95G", 5.875],
	"HSVB000000HSV06.00": ["BÁNH MÌ TRỨNG CÁ TUYẾT 105G", 6.375],
	"JCHC000000A-209.0B": ["CHẢ GIÒ RẾ TÔM 16G, GF", 5.246],
	"ETFH00011394300.AB": ["HÁ CẢO BÁNH BAO CHAY 25G, NG, GF", 11.77],
	"ETFD00011301900.BB": ["BÁNH CUỐN TÔM 25G", 11.095],
	"ETFK00011397900.0A": ["PHỞ XÀO TÔM 300G, NG", 7.395],
	"VMN00001400.0A": ["BÁNH KHOAI MÔN 80 G (480 G/ GÓI)", 6.638],
	"VZS00008200.0D": ["Sốt thịt nướng Yakiniku 1 kg", 12.67],
	"VCO00008000.0B": ["Chả giò chay 25 g (400 g)", 10.711],
	"VCO00002900.0C": ["Bánh cuốn tôm Coop 28 g (300 g/gói)", 8.492],
	"VHF00037800.0C": ["Bánh cuốn tôm BON 60 g (600 g)", 5.594],
	"JNIP00000JNI34A.00": ["PIZZA PHÔ MAI CÀ CHUA 18CM 188G", 4.455],
	"JNIP000000JNI34.0A": ["PIZZA MARGHERITA 18CM 193G", 4.605],
	"NUTB00000009210.BB": ["BÁNH BAO HOT DOG 60G, 3KG/PE", 3.576],
	"VCO00003800.BB": ["Bánh bao nấm chay 40 g (240 g/gói)", 7.014],
	"VGS00001300.AA": ["BÁNH MÌ MÈ KIỂU HÀN QUỐC VỊ TRÀ XANH 45 G (270 G/GÓI)", 3.59],
	"VGN00001500.0D": ["BÁNH CUỐN HẢI SẢN 45 G (250 G/GÓI)", 9.286],
	"JTUP00000000005.BA": ["ĐẾ PIZZA NƯỚNG 80G, 6 INCHES", 4.814],
	"JTUP00000000009.B0": ["PIZZA PHÔ MAI CÀ CHUA 240G, 9 INCHES", 13.32],
	"JTUP00000000021.BB": ["PIZZA PHÔ MAI CÀ CHUA 95G 5 INCHES", 5.446],
	"VCO00003600.0B": ["Bánh cuốn tôm thịt 50 g (360 g/gói)", 12.15],
	"VGN00004800.0B": ["BÁNH CUỐN XÁ XÍU 45 G (250 G/GÓI)", 8.194],
	"VSF00001800.00": ["KHOAI TÂY BÁNH ĐÔNG LẠNH MEITO (2,5KG/GÓI)", 10.108],
	"VSF00001900.00": ["KHOAI TÂY ĐÔNG LẠNH CẮT THẲNG MEITO (350G/GÓI)", 13.17],
	"VSF00002000.00": ["KHOAI TÂY CẮT MÚI ĐÔNG LẠNH MEITO (500G/GÓI)", 12.745],
	"SSGK000000SSG06.0C": ["SỐT CHIMICHURRI 500G/PA, LOGO HA", 10.71],
	"VCO00002200.0B": ["Bánh bao không nhân 30 g (240 g/gói) - CH", 4.964],
	"VCO00002300.0B": ["Bánh bao sữa đậu xanh 50 g (300 g/gói)-CH", 5.494],
	"JAC2P0000JAC213.00": ["MARGHERITA PIZZA 210G, 8 INCHES", 5.222],
	"VSF00002300.00": ["RAU HỖN HỢP ĐÔNG LẠNH VSAFEFOOD (1KG/GÓI)", 14.716],
	"ECMG0000000KS02.0B": ["SỦI CẢO CHAY MÀU XANH ÁP CHẢO 25G, GF, VE, NG", 11.89],
	"JSVP000000JSV01.00": ["PIZZA CÀ CHUA PHÔ MAI 115G,15-16CM", 3.406],
	"JSVP000000JSV02.00": ["PIZZA PHÔ MAI 110G,15-16CM", 3.29],
	"V4P00000600.0D": ["Half Cheese pizza (143 g)", 6.047],
	"JIGD000000JIG76.00": ["CHẢ GIÒ RẾ TÔM 25G", 2.242],
	"JIGD000000JIG76.0A": ["CHẢ GIÒ RẾ TÔM 25G (GIẢM 1,5CM)", 2.242],
	"JIGD000000JIG76.0B": ["CHẢ GIÒ RẾ TÔM 25G (GIẢM 1,5CM)", 2.242],
	"VMN00001600.00": ["BÁNH CROISSANT VỊ BƠ TỎI 50 G (300 G/ GÓI)", 2.798],
	"V4P00000100.DC": ["Margherita pizza 23cm (267g)", 5.632],
	"V4P00000200.DC": ["Cheese pizza 23 cm (277 g)", 5.636],
	"V4P00000500.0B": ["Salami pizza 23cm (285g)", 5.599],
	"V4P00000400.0B": ["Spicy seafood pizza 23cm (316g)", 6.052],
	"EHM0000FS037-05.0B": ["RAU CỦ TẨM BỘT 60G", 5.4],
	"EHMR0000000HM08.0C": ["KAKIAGE RAU CỦ 60G", 9.626],
	"JNIP00000JNI37A.0A": ["BÁNH PIZZA SAUCE CÀ CHUA 170G, 20CM", 4.732],
	"JTUP000000JTU31.0A": ["PIZZA PHÔ MAI CÀ CHUA 125G, 6 INCHES", 7.506],
	"ETFS00011394100.AA": ["SỦI CẢO CHAY NẤM 25G, NG, GF", 11.832],
	"SNMB000000SNM08.00": ["BÁNH MÌ HOTDOG 50G", 4.614],
	"V4P00000600.0E": ["Half Cheese pizza - vna (143 g)", 5.135],
	"V4P00000700.0D": ["Half Margherita pizza - vna (133 g)", 4.935],
	"JCFB000000JCF30.00": ["BÁNH BAO SANDWICH 30G", 6.8],
	"CATD00000510768.AC": ["BÁNH CUỐN TÔM 48G VỚI SỐT 46G/GÓI", 12.566],
	"EASR000000EAS19.00": ["CƠM CHIÊN HẢI SẢN 300G", 7.4],
	"EASR000000EAS21.00": ["PHỞ XÀO HẢI SẢN 300G", 7.4],
	"EASS000000EAS22.00": ["SỦI CẢO CHAY ÁP CHẢO VỎ XANH 25G", 11.724],
	"EASB000000EAS24.00": ["BÁNH XÈO VIỆT NAM 120G", 6.307],
	"EASK000000EAS25.00": ["BÁNH NẾP LÁ SEN 80G", 7.141],
	"CATD00000510767.AC": ["BÁNH CUỐN HẢI SẢN 48G VỚI SỐT 46G/GÓI", 12.584],
	"JTUP0000000025A.00": ["ĐẾ PIZZA NƯỚNG 140G, 9 INCHES", 6.896],
	"EMJB0000EMJ2285.AC": ["BÁNH CUỐN HẢI SẢN 35G", 14.656],
	"EASR000000EAS20.00": ["MIẾN XÀO TÔM 300G", 7.4],
	"VZS00008200.0E": ["Sốt thịt nướng Yakiniku 1 kg", 12.67],
	"CATD00000507718.0B": ["BÁNH CUỐN TÔM 48G VỚI SỐT 50G/GÓI", 13.274],
	"EUGR000000EUG02.00": ["MÌ XÀO CHOW MEIN TÔM 410G/HỘP", 9.638],
	"EUGR000000EUG01.00": ["CƠM CHIÊN TÔM 410G/HỘP", 9.615],
	"SFFP000000SFF09.0A": ["ĐẾ BÁNH PIZZA NƯỚNG 250G, 12 INCHES, HA", 8.864],
	"VIM00000100.0A": ["HÀNH TÂY THÁI NHỎ CHẦN 0.2cm", 10.82],
	"JNNP000000JNN01.AK": ["BÁNH PANCAKE 20G", 4.709],
	"EASB000000EAS23.00": ["BÁNH MÌ VIỆT NAM 65G", 4.351],
	"JGMK0000000G603.0A": ["BÁNH QUẨY CHIÊN PHỦ ĐƯỜNG 17G, RTE", 5.22],
	"V4P00000100.DD": ["Margherita pizza 23cm (267g)", 5.632],
	"V4P00000200.DD": ["Cheese pizza 23 cm (277 g)", 5.636],
	"VGN01000900.0B": ["PIZZA GẬP NHÂN PHÔ MAI CÀ CHUA 100 G (200 G/HỘP)", 5.415],
	"VMN00001700.00": ["BÁNH MÌ MÈ HÀN QUỐC 80 G (480 G/ GÓI)", 3.718],
	"JGMB0000000G601.0A": ["BÁNH MÌ HÌNH DƯA LƯỚI 25G", 5.045],
	"VGN01000500.0A": ["PIZZA 4 LOẠI PHÔ MAI 200 G (200 G/ HỘP)", 5.735],
	"CAHGK0000CAHG01.00": ["BÁNH CÀ RI RAU CỦ CHAY 100G, CH, RTE", 6.6],
	"SSMB0SMH75A-KOR.0A": ["BÁNH CUỐN TÔM 48G & SỐT NƯỚC TƯƠNG 40G, LOGO HA, TIÊU CHUẨN ", 9.81],
	"UWLD0003694674A.0A": ["BÁNH CUỐN TÔM 45G", 6.106],
	"UWLD00003694674.0B": ["BÁNH CUỐN TÔM 45G", 6.106],
	"EFPB00000EFP043.0D": ["BÁNH BAO SANDWICH 50G", 4.566],
	"EFS1B0000EFS101.00": ["BÁNH BAO SANDWICH 36G, VE", 6.838],
	"ELOB000000ELO01.00": ["BÁNH BAO SANDWICH 50G", 5.765],
	"VMN00001600.0A": ["BÁNH CROISSANT VỊ BƠ TỎI 50 G (300 G/ GÓI)", 2.795],
	"KMFP000000KMF13.00": ["ĐẾ PIZZA NƯỚNG 80G, 6 INCHES", 6.83],
	"VHOF0000100.CC": ["Bánh cà ri 65 g (585 g)", 5.322],
	"SFFP000000SFF07.0A": ["ĐẾ BÁNH PIZZA NƯỚNG 90G, 7INCHES, HA", 6.57],
	"KEMB000000KEM26.00": ["BÁNH MÌ TRỨNG CÁ TUYẾT 85G", 1.471],
	"VGN01000600.0A": ["PIZZA HẢI SẢN XỐT KIM QUẤT 150 G (150 G/HỘP)", 4.295],
	"V4P00000400.0C": ["Spicy seafood pizza 23cm (316g)", 6.052],
	"V4P00000600.0F": ["Half Cheese pizza (143 g)", 6.087],
	"V4P00000500.0C": ["Salami pizza 23cm (285g)", 5.599],
	"V4P00000900.0B": ["Half Teriyaki chicken pizza (157 g)", 6.136],
	"ECOB00000007468.0D": ["BÁNH BAO SANDWICH 40G", 5.087],
	"ECOB00000007619.0B": ["BÁNH BAO SANDWICH 40G", 3.412],
	"UMRB0000EF21049.00": ["BÁNH BAO SANDWICH TÔM 90G, RTE, KB, TÔM COSTCO", 12.58],
	"UNIC000000UNI01.00": ["BÁNH TART SÔ CÔ LA NƯỚNG 50G, RTE, VE, GF", 6.812],
	"JTUP0000000003A.AA": ["PIZZA PHÔ MAI CÀ CHUA 125G, 6 INCHES", 8.519],
	"JTUP0000000009A.AA": ["PIZZA PHÔ MAI CÀ CHUA 240G, 9 INCHES", 10.915],
	"JTUP0000000034A.AA": ["PIZZA CẦM TAY PHÔ MAI CÀ CHUA 125G", 7.005],
	"V4P00000300.CD": ["Teriyaki chicken pizza 23cm (315g)", 6.033],
	"V4P00000700.0E": ["Half Margherita pizza (133 g)", 5.464],
	"V4P00000900.0C": ["Half Teriyaki chicken pizza - vna (157 g)", 5.38],
	"CAAID0000531530.00": ["HÁ CẢO TÔM 26G", 10.673],
	"CAAIK0000536451.00": ["BÁNH QUẨY THỪNG 50G", 9.026],
	"CAAIK0000536450.00": ["BẮP QUE TẨM GIA VỊ NƯỚNG 3KG/PA", 9.498],
	"VMN00001900.00": ["BÁNH TRỨNG NƯỚNG 55 G (TART TRỨNG 55 G) (330 G/GÓI)", 4.882],
	"JBSP000000JBS01.00": ["PIZZA CÀ CHUA PHÔ MAI 133G", 2.504],
	"ECAB000000ECA02.00": ["BÁNH BAO TÔM VỊ KIMCHI 192G/HỘP", 3.095],
	"JBSP000000JBS02.00": ["PIZZA CÀ CHUA BẮP PHÔ MAI SỐT MAYO 140G", 2.666],
	"EUGR000000EUG02.0A": ["MÌ XÀO CHOW MEIN TÔM 410G/HỘP", 9.638],
	"EUGR000000EUG01.0A": ["CƠM CHIÊN TÔM 410G/HỘP", 9.615],
	"ESF3P0000ESF302.00": ["ĐẾ PIZZA NƯỚNG HÌNH TAM GIÁC 115G", 6.38],
	"V7E00000300.00": ["Pizza Xúc Xích Pepperoni 7-Eleven 120 g", 5.41],
	"UHGK000000UHG01.AC": ["BÁNH CÀ RI RAU CỦ CHAY 70G", 7.825],
	"SSFP000000SSF20.00": ["BÁNH PIZZA MARGHERITA 250G 9 INCHES, LOGO HA", 7.399],
	"VHF00008000.AD": ["Bánh bao sandwich 48 g (672 g)", 6.187],
	"UTT1D0000507718.0A": ["BÁNH CUỐN TÔM 48G VỚI SỐT 50G/GÓI", 13.274],
	"UTT1D0000510767.0A": ["BÁNH CUỐN HẢI SẢN 48G VỚI SỐT 46G/GÓI", 12.584],
	"UTT1D0000510768.0A": ["BÁNH CUỐN TÔM 48G VỚI SỐT 46G/GÓI", 12.566],
	"KMFP000000KMF11.00": ["ĐẾ PIZZA NƯỚNG 210G, 10 INCHES", 7.25],
	"KMFP000000KMF10.00": ["ĐẾ PIZZA NƯỚNG 100G, 8 INCHES", 5.983],
	"KMFP000000KMF12.00": ["ĐẾ PIZZA NƯỚNG 250G, 12 INCHES", 8.645],
	"JCOX000000JCO04.00": ["PIZZA CÁ NGỪ SỐT MAYO 120G", 3.531],
	"UMTC00000031362.00": ["CHẢ GIÒ RẾ TÔM DÀI 35G", 12.084],
	"EHM0000FS038-05.AE": ["KHOAI LANG TẨM BỘT 60G", 5.45],
	"VGS00001900.A0": ["BÁNH MÌ BƠ TỎI KIỂU HÀN QUỐC 58 G (348 G/GÓI)", 4.23],
	"EPDB0000EPD7031.00": ["SANDWICH BUN 60G", 8.64],
	"EPDD0000EPD7029.00": ["BÁNH CUỐN TÔM 45G", 9.975],
	"JCFB000000JCF30.0A": ["BÁNH BAO SANDWICH 30G", 6.763],
	"ETFC00011307600.CD": ["CHẢ GIÒ BÁNH TRÁNG TÔM 16.67G", 13.513],
	"JGMB0000000G701.00": ["BÁNH MÌ TRẮNG 15G, RTE", 6.428],
	"JGMB0000000G702.00": ["BÁNH MÌ PHÁP HÌNH TRÒN 20G, RTE", 5.177],
	"JTUP0000000005A.BB": ["ĐẾ PIZZA NƯỚNG 80G, 6 INCHES", 8.516],
	"JTUP0000000033A.BB": ["ĐẾ PIZZA NƯỚNG CẦM TAY 70G", 8.56],
	"JTUP0000000003A.BB": ["PIZZA PHÔ MAI CÀ CHUA 125G, 6 INCHES", 12.548],
	"JTUP0000000009A.BA": ["PIZZA PHÔ MAI CÀ CHUA 240G, 9 INCHES", 10.915],
	"JTUP0000000011A.BB": ["PIZZA 4 LOẠI PHÔ MAI 110G, 6 INCHES", 11.217],
	"JTUP0000000025A.BA": ["ĐẾ PIZZA NƯỚNG 140G, 9 INCHES", 6.896],
	"VGN01001400.00": ["BÁNH KHOAI LANG TÍM NHÂN PHÔ MAI 40 G (200 G)", 4.519],
	"VGN01001500.00": ["BÁNH TRỨNG SÔ-CÔ-LA 30 G (180 G)", 5.512],
	"VGN01001600.00": ["BÁNH TRỨNG 30 G (180 G)", 5.512],
	"CAPSK000CAPS03A.BD": ["RAU CỦ TẨM BỘT CHIÊN TÔM 25G, KB", 16.96],
	"JTUP0000000034A.BB": ["PIZZA CẦM TAY PHÔ MAI CÀ CHUA 125G", 14.676],
	"JTUP0000000035A.BB": ["PIZZA CẦM TAY 4 LOẠI PHÔ MAI 115G", 13.626],
	"UMNK000000UMN01.0C": ["BÁNH BAO SANDWICH 30G", 6.658],
	"EVR1B0000EVR101.00": ["BÁNH BAO TÔM MÈ CHIÊN 70G, TÔM ASC, DẦU RSPO OIL, BAO BÌ FSC", 6.195],
	"VIM00000100.0B": ["HÀNH TÂY THÁI NHỎ CHẦN 0.2cm", 10.82],
	"VIM00000200.0B": ["CÀ RỐT THÁI NHỎ CHẦN 0.2-0.3CM", 10.82],
	"JHID000000JHI21.00": ["BÁNH BAO HẢI SẢN 40G", 5.98],
	"KMFP000000KMF09.0A": ["ĐẾ PIZZA NƯỚNG 230G, 11 INCHES", 8.2],
	"V4P00000200.DE": ["Cheese pizza 23 cm (277 g)", 5.492],
	"V4P00000400.0D": ["Spicy seafood pizza 23cm (316g)", 5.968],
	"V4P00000500.0D": ["Salami pizza 23cm (285g)", 5.534],
	"SFFP000000SFF05.0B": ["BÁNH PANCAKE 40G, HA", 5.495],
	"ETNB000000ETN01.AB": ["BÁNH BAO SANDWICH 50G, NG", 8.942],
	"V4P00000300.CE": ["Teriyaki chicken pizza 23cm (315g)", 5.954],
	"ETNB000000ETN03.00": ["BÁNH BAO SANDWICH 80G, NG", 10.705],
	"ETNB00000ETN02A.00": ["BÁNH BAO SANDWICH 40G", 7.294],
	"V4P00000100.DE": ["Margherita pizza 23cm (267g)", 5.282],
	"VGN01001100.0A": ["BÁNH MÌ BƠ TỎI PHÔ MAI 45 G (180 G/HỘP)", 5.015],
	"ETNB000000ETN04.00": ["BÁNH BAO SANDWICH 70G, NG", 9.304],
	"JTUP00000000022.AB": ["ĐẾ PIZZA NƯỚNG 65G, 5 INCHES", 4.297],
	"ELM2C00000ASD27.0A": ["CHẢ GIÒ BỘT MÌ HOA NHÂN RAU CỦ 18G, VE", 3.732],
	"EUGR00000EUG01A.00": ["CƠM CHIÊN TÔM 410G/HỘP", 7.232],
	"EUGR00000EUG02A.00": ["MÌ XÀO CHOW MEIN TÔM 410G/HỘP", 7.232],
	"JKBB00000076850.00": ["BÁNH MÌ VIỆT NAM 65G", 4.348],
	"JTUP00000000021.BC": ["PIZZA PHÔ MAI CÀ CHUA 95G, 5 INCHES", 5.446],
	"JTUP00000000021.BD": ["PIZZA PHÔ MAI CÀ CHUA 95G, 5 INCHES", 5.446],
	"SFFB000000SFF11.00": ["BÁNH MÌ SANDWICH NGUYÊN Ổ CẮT SẴN 1KG, HA", 8.876],
	"SFFB000000SFF12.00": ["BÁNH MÌ SANDWICH NGUYÊN CÁM NGUYÊN Ổ CẮT SẴN 1KG, HA", 8.876],
	"V7E00000300.0A": ["Pizza Xúc Xích Pepperoni 7-Eleven 120 g", 5.44],
	"JGMB0000000G146.00": ["BÁNH MÌ BƠ TỎI CẮT LÁT NƯỚNG 15G (RTE)", 3.94],
	"KMFP000000KMF05.0A": ["ĐẾ PIZZA NƯỚNG 210G, 10 INCHES", 7.25],
	"JMS1C0000028001.A0": ["CHẢ GIÒ RẾ TÔM 16G", 5.325],
	"JMS1C0000028006.A0": ["CHẢ GIÒ RẾ TÔM DÀI 35G", 6.161],
	"EASB000000EAS23.0A": ["BÁNH MÌ VIỆT NAM 65G", 4.351],
	"EKSB00003348281.00": ["BÁNH BAO XOÀI DỪA 40G, KB", 5.495],
	"EKSB00003349107.00": ["BÁNH BAO ĐẬU ĐỎ 40G, KB", 5.515],
	"JBSP000000JBS01.0A": ["PIZZA CÀ CHUA PHÔ MAI 133G", 2.504],
	"JIGP000000JIG50.0B": ["ĐẾ PIZZA 80GR, 15-16CM", 2.579],
	"JBSP000000JBS02.0A": ["PIZZA CÀ CHUA BẮP PHÔ MAI SỐT MAYO 140G", 2.621],
	"JIGP000000JIG77.00": ["PIZZA CRUST 165G, 10 INCHES", 9.62],
	"KMFP000000KMF06.0A": ["ĐẾ PIZZA NƯỚNG 250G, 12 INCHES", 8.73],
	"CATC00000535817.0B": ["BÁNH BAO SẦU RIÊNG 40G", 5.795],
	"KMFD000000KMF15.00": ["BÁNH CUỐN TÔM 48G VÀ NƯỚC TƯƠNG 580G/KHAY, NG", 13.13],
	"VMN00002100.00": ["PIZZA GẬP NHÂN THỊT BÒ PHÔ MAI 85 G (510 G/GÓI)", 8.106],
	"CATT00000537253.00": ["BỘ TÔM, RAU CỦ, SỐT TEMPURA 548G/HỘP", 8.17],
	"VMN00001600.AA": ["BÁNH CROISSANT VỊ BƠ TỎI 50 G (300 G/ GÓI)", 2.795],
	"NUTK00000008072.00": ["BẮP QUE VỊ MISO NƯỚNG 3KG/BULK", 3.35],
	"JGMB0000000G703.00": ["BÁNH MÌ CUỘN BƠ NƯỚNG 20G, RTE", 5.008],
	"VHF00053200.0B": ["Bánh khoai lang tím phô mai 30 g (360 g)", 3.518],
	"EKGH00000004915.BE": ["HÁ CẢO TÔM 25G, NG, GF", 11.69],
	"JGLX000000JGL23.00": ["PHÔ MAI QUE XÙ 25G", 5.514],
	"EKGH00000004912.BE": ["SỦI CẢO HẢI SẢN ÁP CHẢO 25G, NG, GF", 11.953],
	"ETFC00011307200.BD": ["CHẢ GIÒ TÔM ỐNG TRÚC 8G, 1KG/PA (PHUN DL719)", 11.052],
	"ECAB000000ECA01.AA": ["BÁNH BAO TÔM VỊ CÀ RI 192G/HỘP", 3.095],
	"ETFC00011307400.BD": ["CHẢ GIÒ TÔM ỐNG TRÚC 8G, 300G/PA (PHUN DL719)", 12.4],
	"ETFC00011392500.0C": ["CHẢ GIÒ BÁNH TRÁNG TÔM CHIÊN 25G, 500G/PA, NG", 13.302],
	"VHF00057600.00": ["Bánh Cuốn Hải Sản 40 g (800 g)", 13.738],
	"ETFC00011392600.0B": ["CHẢ GIÒ BÁNH TRÁNG TÔM CHIÊN 25G, 1KG/PA, NG", 10.789],
	"ECAB000000ECA02.0A": ["BÁNH BAO TÔM VỊ KIMCHI 192G/HỘP", 3.095],
	"JTUP00000000009.BA": ["PIZZA PHÔ MAI CÀ CHUA 240G, 9 INCHES", 13.242],
	"JTUP00000000011.AA": ["PIZZA 4 LOẠI PHÔ MAI 110G, 6 INCHES", 6.278],
	"JTUP00000000005.BB": ["ĐẾ PIZZA NƯỚNG 80G, 6 INCHES", 4.838],
	"JTUP00000000012.AA": ["PIZZA 4 LOẠI PHÔ MAI 240G, 9 INCHES", 13.32],
	"JTUP000000JTU26.AB": ["RONG BIỂN TẨM BỘT CHIÊN 25G", 10.955],
	"JTUP000000JTU27.AB": ["RONG BIỂN TẨM BỘT CHIÊN 65G", 8.873],
	"ETFR00011392100.BF": ["BÁNH CUỐN TÔM 50G + NƯỚC TƯƠNG 50G (PHUN DL719)", 10.39],
	"ETFD00011301900.BC": ["BÁNH CUỐN TÔM 25G", 11.095],
	"JTUP00000000025.AA": ["ĐẾ PIZZA NƯỚNG 140G, 9 INCHES", 8.246],
	"EHA1K0000082914.0A": ["TÔM VIÊN TẨM BỘT XÙ 60G", 5.208],
	"EHM0000FS091-05.0F": ["RAU CỦ TẨM BỘT VỊ CÀ RI 35G", 6.052],
	"UMRB0000EF21037.0A": ["BÁNH BAO SANDWICH TÔM 90G, RTE, KB", 8.874],
	"UMRC0000EF21035.0A": ["CHẢ GIÒ BÁNH TRÁNG TÔM 20G, RTE, KB, TÔM BAP 4*", 5.737],
	"ETFB00011167400.0B": ["BÁNH BAO SANDWICH 80G, NG", 7.024],
	"EHM0000FS038-05.AF": ["KHOAI LANG TẨM BỘT 60G", 5.45],
	"KMFD000000KMF16.00": ["BÁNH CUỐN TÔM 48G", 11.2],
	"ETFB00011167300.0C": ["BÁNH BAO MÈ ĐEN 95G, NG", 8.876],
	"SGPP000000VN16A.0B": ["BÁNH NƯỚNG 40G, LOGO HA", 9.305],
	"SNMB000000SNM07.AA": ["BÁNH BAO NẤM 40G, LOGO HA", 5.895],
	"EHMX000FS040-10.00": ["BÁNH TÔM RAU CỦ 60G", 5.24],
	"EHM0000FS037-05.0C": ["RAU CỦ TẨM BỘT 60G", 5.4],
	"VGN00008200.0A": ["MIẾN THỊT GHẸ 190 G (190 G/ HỘP)", 5.492],
	"CPCMB0000CPCM23.00": ["BÁNH TRỨNG 30G", 5.512],
	"ETFD00011170000.AF": ["BÁNH BAO ĐÀO TIÊN 40G", 6.045],
	"VGN01001200.0A": ["PHÔ MAI QUE 25 G (250 G/HỘP)", 6.275],
	"UMRB0000EF21048.0A": ["BÁNH BAO SANDWICH TÔM 90G, RTE, KB", 5.363],
	"ETFS00011394100.AB": ["SỦI CẢO CHAY NẤM 25G, NG, GF", 9.76],
	"UNPT000000UNP04.0B": ["BỘ MIX RAU CỦ CHIÊN 500G/PA, GF, VE, KB", 3.878],
	"VGN00007800.0A": ["MÌ UDON RAU NẤM 250 G (250 G/ TÔ)", 3.798],
	"EIGK000000EIG01.00": ["PHỞ LUỘC 220G", 9.34],
	"ENPB00000007309.0C": ["BÁNH BAO SANDWICH MÀU VÀNG 30G", 6.955],
	"ENPB00000007310.0D": ["BÁNH BAO SANDWICH MÀU CAM 30G", 6.955],
	"ETFK00011298100.0A": ["MÌ XÀO TÔM 300G", 6.97],
	"JCOX000000JCO04.0A": ["PIZZA CÁ NGỪ SỐT MAYO 120G", 3.531],
	"JGMB0000000G704.00": ["BÁNH TART TRỨNG NƯỚNG 20G, RTE", 3.305],
	"KMFP000000KMF11.0A": ["ĐẾ PIZZA NƯỚNG 210G, 10 INCHES", 7.235],
	"CPCMD0000CPCM04.0A": ["BÁNH CUỐN HẢI SẢN 250G/TÚI", 9.246],
	"ENPB00000007308.0B": ["BÁNH BAO BURGER 60G (CẮT SẴN)", 6.523],
	"PSMB000000PSM08.0A": ["BÁNH BAO SANDWICH 40G, HA", 6.784],
	"VCE00000100.00": ["BÁNH BAO NHÂN SẦU RIÊNG 40 G (240 G)", 7.074],
	"VGN00008000.0A": ["MÌ LẨU THÁI VIÊN HẢI SẢN 250 G (250 G/ TÔ)", 3.798],
	"VGN00008300.0A": ["PAD THÁI TÔM 235 G (235 G/ HỘP)", 6.482],
	"CPCMK0000CPCM06.0A": ["BÁNH BAO KIM SA 40G", 5.79],
	"ENPB00000007311.0B": ["BÁNH BAO SANDWICH TRÀ XANH 30G", 6.955],
	"ENPB00000007312.0C": ["BÁNH BAO SANDWICH THAN TRE 30G", 6.955],
	"JGMB0000000G705.00": ["BÁNH MÌ NGUYÊN CÁM NƯỚNG 25G (HÌNH CHỮ NHẬT)", 5.89],
	"JGMB0000000G706.00": ["BÁNH MÌ DƯA LƯỚI MÀU CAM NƯỚNG 25G", 11.932],
	"JCFB000000JCF24.0A": ["BÁNH MÌ NAAN 70G, VE, NG, CH", 2.972],
	"SNMP000000SNM05.AA": ["BÁNH PIZZA CÁ NGỪ MAYO 600G 12 INCHES", 10.818],
	"SNMP000000SNM06.AA": ["BÁNH PIZZA TÔM MAYO 600G 12 INCHES", 10.78],
	"ETFK00011398300.0B": ["CƠM CHIÊN HẢI SẢN CÀ RI 350G, NG", 7.97],
	"EHOK000000EHO04.AD": ["BÁNH CÀ RI RAU CỦ CHAY 130G, VE, NG", 8.655],
	"UMTC00000031362.0A": ["CHẢ GIÒ RẾ TÔM DÀI 35G", 12.084],
	"EFPD0000EFP016A.0C": ["BÁNH CUỐN TÔM VUÔNG HẤP 25G VÀ SỐT NƯỚC TƯƠNG 20G/GÓI, NG", 3.33],
	"JGMB0000000G707.00": ["BÁNH MÌ HÀNH TÂY 25G (HÌNH CHỮ NHẬT)", 5.89],
	"EWB2C00EWBALD31.00": ["RAU CỦ TẨM BỘT CHIÊN VÀ SỐT CHUA NGỌT 280G/KHAY, CH, VE", 5.989],
	"UMTK00000006815.0E": ["BÁNH RAU CỦ CHIÊN TÔM 40G", 4.67],
	"JNNP000000JNN01.AL": ["BÁNH PANCAKE 20G", 4.709],
	"JGMB0000000G702.0A": ["BÁNH MÌ PHÁP HÌNH TRÒN 20G, RTE", 5.177],
	"CPSRB0000CPSR01.00": ["BÁNH BAO CADE 40G", 7.2],
	"UMRB0000EF21049.0A": ["BÁNH BAO SANDWICH TÔM 90G, RTE, KB, TÔM COSTCO", 12.62],
	"JGMB0000000G708.00": ["BÁNH SỪNG TRÂU NƯỚNG 15G, RTE", 5.236],
	"JTUP00000000022.AC": ["ĐẾ PIZZA NƯỚNG 65G, 5 INCHES", 4.297],
	"TMFP00000TMF01A.00": ["BÁNH NAAN (HÌNH OVAL) 65G", 4.611],
	"ATMK0000CR10KG.00": ["BẮP QUE NƯỚNG 2KG/PA", 10.685],
	"ESTB0000048491A.0A": ["BÁNH BAO SANDWICH 30G, VE", 7.886],
	"UAIK00000536823.0A": ["BÁNH QUẨY THỪNG 50G", 9.051],
	"ATMK00FGBPT01-C.00": ["BÁNH MÌ TÔM BƠ TỎI 32G", 11],
	"EFDC000000EFD11.AB": ["CHẢ GIÒ RẾ HẢI SẢN 20G", 11.41],
	"JIGR000000JIG79.00": ["PHỞ XÀO HẢI SẢN 250G", 3.687],
	"ENPK00000001511.AF": ["BÁNH BAO SANDWICH 30G", 6.936],
	"ESTB0000000ST22.AD": ["BÁNH BAO CHAY 40G", 8.93],
	"MSFK00000MSF03A.00": ["BÁNH BAO SANDWICH 30G", 8.139],
	"JTUP0000000012A.BA": ["PIZZA 4 LOẠI PHÔ MAI 240G, 9 INCHES", 10.96],
	"EHA10000060066A.AE": ["BÁNH BAO SANDWICH 50G, 30PCS/PE", 3.489],
	"ETFD00011172100.AC": ["BÁNH BAO KHOAI MÔN 40G", 8.325],
	"ETFK00011306000.BE": ["BÁNH BÈO TÔM 15G", 8.268],
	"UAIK00000536822.0A": ["BẮP QUE TẨM GIA VỊ NƯỚNG 3KG/PA", 9.585],
	"SFFB000000SFF11.0A": ["BÁNH MÌ SANDWICH NGUYÊN Ổ CẮT SẴN 1KG, HA", 8.926],
	"VHF00056600.0A": ["Chả Giò Chay 40 g (960 g) (Ha, Ve). Logo HALAL", 12.345],
	"EFR1R00000EFR03.0C": ["BÁNH CUỐN TÔM 48G (PHUN LÔ TÔM + DL719)", 8.338],
	"JNPC000000JNP02.A0": ["BÁNH TART TRỨNG NƯỚNG 30G, RTE", 6.853],
	"VFM00011700.00": ["SOUP LẨU HOTPOT 354 G (354 G/GÓI)", 9.565],
	"VKF00000900.00": ["HÁ CẢO HẢI SẢN 22 G\xA0(250 G)", 5.571],
	"VKF00001000.00": ["BÁNH CUỐN HẢI SẢN VÀ RAU CỦ 50 G (275 G)", 6.057],
	"UUGR00081147512.00": ["BÁNH CUỐN TÔM 46G VÀ SOY SAUCE", 9.292],
	"V7E00000400.00": ["Bánh Gạo và  Xúc Xích Xiên Que 56 g (112 g)", 4.725],
	"VFM00011600.00": ["SOUP LẨU HOTPOT 118 G (118 G/GÓI)", 8.485],
	"JGMB0000000G701.0A": ["BÁNH MÌ TRẮNG 15G, RTE", 6.433],
	"MAIGP0000MAIG01.00": ["ĐẾ PIZZA NƯỚNG 100G 8 INCHES, LOGO HA", 5.988],
	"MAIGP0000MAIG02.00": ["ĐẾ PIZZA NƯỚNG 180G 10 INCHES, LOGO HA", 5.174],
	"UTT1D0000510767.AB": ["BÁNH CUỐN HẢI SẢN 48G VỚI SỐT 46G/GÓI", 12.584],
	"SNMP000000SNM05.AB": ["BÁNH PIZZA CÁ NGỪ MAYO 600G 12 INCHES", 10.918],
	"SNMP000000SNM11.0A": ["BÁNH PIZZA ĐẾ NUỚNG 250G,12 INCHES, LOGO HA", 8.756],
	"UTT1D0000510768.AB": ["BÁNH CUỐN TÔM 48G VỚI SỐT 46G/GÓI", 12.566],
	"JIGP000000JIG78.00": ["PIZZA HẢI SẢN 250G", 3.648],
	"NUTB00000009197.0B": ["BÁNH BAO SANDWICH 60G, 900G/PA", 8.458],
	"SFFB000000SFF12.0A": ["BÁNH MÌ SANDWICH NGUYÊN CÁM NGUYÊN Ổ CẮT SẴN 1KG, HA", 8.928],
	"SNMP000000SNM06.AB": ["BÁNH PIZZA TÔM MAYO 600G 12 INCHES", 10.875],
	"CAHAB0000048032.00": ["BÁNH MÌ HÌNH DƯA LƯỚI 100G, RTE", 7.16],
	"ESOB000SOR-S25A.0B": ["BÁNH BAO SANDWICH 36G", 8.32],
	"ESOB000SOR-S25B.0A": ["BÁNH BAO SANDWICH 48G", 8.74],
	"EFP2P0000EFP203.00": ["BÁNH DONUT NHÂN CÀ RI RAU CỦ 60G", 4.098],
	"CAHAB0000037887.00": ["BÁNH CÀ RI RAU CỦ CHAY 130G, RTE", 7.07],
	"EFPB00000EFP052.00": ["BÁNH BAO SANDWICH NHÂN RAU CỦ 40G", 1.766],
	"EFP2P0000EFP202.00": ["BÁNH PIZZA NHÂN RAU CỦ VỊ TERIYAKI 400G, 25CM", 6.183],
	"UGTB00000338143.00": ["BÁNH BAO DỪA 85G", 9.266],
	"VHF00058100.00": ["Bánh mì bơ tỏi than tre kiểu Hàn Quốc 66 g (528 g)", 4.402],
	"VHF00058200.00": ["Bánh tiểu long bao Sô-cô-la 25 g (1 kg)", 4.368],
	"EFP2R0000EFP201.00": ["BÁNH BAO SANDWICH NHÂN SỐT CÀ CHUA 50G", 3.257],
	"CAHAC0000036163.00": ["CHẢ GIÒ RẾ KHOAI MỠ 25G", 11.65],
	"EHM0000FS087-05.0D": ["TÔM VIÊN 40G", 4.59],
	"HLMP000000HLM01.00": ["PIZZA CÁ NGỪ MAYO 120G, 15-16CM", 7.013],
	"HLMP000000HLM02.00": ["PIZZA MARGHERITA 120G, 15-16CM", 6.933],
	"JGLX000000JGL23.0A": ["PHÔ MAI QUE XÙ 25G", 5.567],
	"ENPB00000007398.0C": ["BÁNH BAO SANDWICH 70G", 4.969],
	"CAAIK0000536450.0A": ["BẮP QUE TẨM GIA VỊ NƯỚNG 3KG/PA", 9.498],
	"CAAIK0000536451.0A": ["BÁNH QUẨY THỪNG 50G", 9.026],
	"JAC2P0000JAC214.00": ["PIZZA MAYONNAISE BẮP 214G, 8 INCH", 4.975],
	"JAC2P0000JAC215.00": ["PIZZA PHOMAI 183G, 8 INCH", 4.345],
	"EHA10000060066B.00": ["BÁNH BAO SANDWICH 50G, VE", 3.489],
	"JGMB0000000G709.00": ["BÁNH CHURROS VANI PHỦ ĐƯỜNG CHIÊN 15G, RTE", 9.926],
	"JGMB0000000G710.00": ["BÁNH TÁO NƯỚNG 25G, RTE", 6.581],
	"JKKP000000JKK02.00": ["ĐẾ  PIZZA 110G (8 INCHES), CH", 6.54],
	"JKKP000000JKK03.00": ["ĐẾ  PIZZA 80G (8 INCHES), CH", 4.566],
	"JCHK00000A-2603.00": ["RAU CỦ TÔM 25G", 3.685],
	"JWFK0000000WG06.00": ["BÁNH TART CÁ HỒI VÀ RAU CỦ NƯỚNG 35G", 5.52],
	"TSTB00TST03-FTR.0G": ["BÁNH CUỐN HẢI SẢN 35G, KB", 4.126],
	"EHM0000FS091-05.0G": ["RAU CỦ TẨM BỘT VỊ CÀ RI 35G", 6.052],
	"ETFK00011397900.0B": ["PHỞ XÀO TÔM 300G, NG", 7.395],
	"V4P00000100.DF": ["Margherita pizza 23cm (267g)", 5.317],
	"V4P00000200.DF": ["Cheese pizza 23 cm (277 g)", 5.527],
	"V4P00000300.CF": ["Teriyaki chicken pizza 23cm (315g)", 5.989],
	"V4P00000400.0E": ["Spicy seafood pizza 23cm (316g)", 6.003],
	"V4P00000500.0E": ["Salami pizza 23cm (285g)", 5.569],
	"VGS00001300.AB": ["BÁNH MÌ MÈ KIỂU HÀN QUỐC VỊ TRÀ XANH 45 G (270 G/GÓI)", 3.594],
	"EHA1K0000082914.0B": ["TÔM VIÊN TẨM BỘT XÙ 60G", 5.208],
	"EHA100000082512.0A": ["KHOAI LANG TẨM BỘT 60G", 5.35],
	"EVLD00000090874.0B": ["BÁNH CUỐN TÔM 50G & SOY SAUCE 60G, KB, HA", 10.41],
	"EWB2C00EWBCOS32.00": ["BỘ MIX CHIÊN 800G/HỘP, NG", 10.309],
	"EWB3C00EWBCOS32.00": ["BỘ MIX CHIÊN 800G/HỘP, NG", 10.309],
	"EFP2P0000EFP202.0A": ["BÁNH PIZZA NHÂN RAU CỦ VỊ TERIYAKI 400G, 25CM", 6.183],
	"JMS1C0007221257.00": ["BÁNH TẤM VUÔNG NƯỚNG 15G", .826],
	"PSMB000000PSM07.0A": ["BÁNH BAO NẤM 40G, HA", 6.555],
	"VMN00002300.00": ["BÁNH NƯỚNG NHÂN THANH CUA PHÔ MAI 50 G (BÁNH TART NHÂN THANH", 6.258],
	"JITP000000JIT01.00": ["BÁNH PIZZA CẦM TAY NHÂN CÀ CHUA PHÔ MAI 100G, 6 INCHES", 4.758],
	"JITP000000JIT02.00": ["BÁNH PIZZA CẦM TAY NHÂN PHÔ MAI 100G, 6 INCHES", 4.768],
	"UHGK000000UHG01.AD": ["BÁNH CÀ RI RAU CỦ CHAY 70G", 7.825],
	"EHM0000FS037-05.0D": ["RAU CỦ TẨM BỘT 60G", 5.4],
	"EHMR0000000HM08.0D": ["KAKIAGE RAU CỦ 60G", 9.647],
	"EPDB0000EPD7031.0A": ["BÁNH BAO SANDWICH 60G", 8.561],
	"JGMB0000000G146.0A": ["BÁNH MÌ BƠ TỎI CẮT LÁT NƯỚNG 15G (RTE)", 3.852],
	"EFRR000000EFR03.0C": ["BÁNH CUỐN TÔM 48G", 8.338],
	"JIGP000000JIG77.0A": ["PIZZA CRUST 165G, 10 INCHES", 9.661],
	"JGMB0000000G705.0A": ["BÁNH MÌ NGUYÊN CÁM NƯỚNG 25G (HÌNH CHỮ NHẬT)", 5.89],
	"SSFP000000SSF22.00": ["PIZZA HẢI SẢN SỐT CUA CAY 165G", 6.705],
	"SSFP000000SSF23.00": ["PIZZA HẢI SẢN SỐT TIÊU TRẮNG 160G", 6.555],
	"SSFP000000SSF24.00": ["PIZZA HẢI SẢN SỐT TRỨNG MUỐI 165G", 6.705],
	"JGMB0000000G707.0A": ["BÁNH MÌ HÀNH TÂY 25G (HÌNH CHỮ NHẬT)", 5.89],
	"JGMB0000000G708.0A": ["BÁNH SỪNG TRÂU NƯỚNG 15G, RTE", 5.246],
	"JSVP000000JSV01.0A": ["PIZZA CÀ CHUA PHÔ MAI 115G,15-16CM", 3.406],
	"JSVP000000JSV02.0A": ["PIZZA PHÔ MAI 110G,15-16CM", 3.29],
	"JGMB000000G706A.00": ["BÁNH MÌ DƯA LƯỚI MÀU CAM NƯỚNG 25G", 6.068],
	"VMN00001400.00": ["BÁNH KHOAI MÔN 80 G (480 G/ GÓI)", 6.638],
	"ENPK00000001517.BF": ["HẢI SẢN VIÊN ÁO BỘT 20G", 9.96],
	"VKF00000400.0A": ["PIZZA PHÔ MAI ĐẶC BIỆT 120 G", 2.582],
	"KMFP000000KMF09.00": ["ĐẾ PIZZA NƯỚNG 230G, 11 INCHES", 8.2],
	"SFFP000000SFF07.00": ["ĐẾ BÁNH PIZZA NƯỚNG 90G, 7INCHES, HA", 6.57],
	"SFFP000000SFF08.0A": ["ĐẾ BÁNH PIZZA NƯỚNG 210G, 10 INCHES, HA", 7.257],
	"SFFP000000SFF08.00": ["ĐẾ BÁNH PIZZA NƯỚNG 210G, 10 INCHES, HA", 7.257],
	"SFFP000000SFF09.00": ["ĐẾ BÁNH PIZZA NƯỚNG 250G, 12 INCHES, HA", 8.864],
	"CPCMD0000CPCM04.00": ["BÁNH CUỐN HẢI SẢN 250G/TÚI", 9.246],
	"CPCMC0000CPCM08.00": ["TÔM XÙ PANKO BA MÀU 30G", 8.794],
	"CPCMK0000CPCM06.00": ["BÁNH BAO KIM SA 40G", 5.79],
	"HHAP00000093068.00": ["PIZZA MARGHERITA 115G, 15-16CM", 3.424],
	"HHAP00000093069.00": ["PIZZA 4 LOẠI PHÔ MAI 110G, 15-16CM", 3.349],
	"VGN01000800.0B": ["PIZZA PHÔ MAI XÚC XÍCH PEPPERONI 120 G (120G/HỘP)", 3.695],
	"VGN01000800.0A": ["PIZZA PHÔ MAI XÚC XÍCH PEPPERONI 120 G (120G/HỘP)", 3.695],
	"VGS00002000.00": ["BÁNH BAO NGƯỜI TUYẾT NHÂN BÍ ĐỎ 40 G (320 G/GÓI)", 6.614],
	"HSVB000000HSV07.00": ["BÁNH MÌ VIỆT NAM 80G", 6.125],
	"VGN00005600.AB": ["CHÂN GÀ TÀU XÌ (270 G/TÔ)", 4.086],
	"VMN00000600.0A": ["BÁNH KHOAI LANG TÍM PHÔ MAI 60 G ( 360  G/GÓI)", 5.118],
	"JCFR00000JCF23B.00": ["RAU CỦ CHIÊN 70G, CH", 7.245],
	"JCFR00000JCF22B.00": ["RAU CỦ CHIÊN TÔM 70G, CH", 7.29],
	"VHF00055100.00": ["Bánh bao kim sa 45 g (540 g)", 2.041],
	"VHF00055900.00": ["Cơm nắm gạo lứt 80 g (480 g)", 3.246],
	"VHF00056000.00": ["Cơm Nắm Gạo Lứt Hạt Sen 80 g (480 g)", 3.246],
	"ETNB00000ETN01A.00": ["BÁNH BAO SANDWICH 50G, NG", 3.51],
	"SFFB000000SFF06.00": ["BÁNH MÌ VIỆT NAM 65G, HA", 4.314],
	"TTGD000000TTG05.00": ["BÁNH CUỐN TÔM VUÔNG 25G", 10.83],
	"JGMB0000000G601.00": ["BÁNH MÌ HÌNH DƯA LƯỚI 25G", 5.045],
	"JGMP0000000G602.0A": ["BÁNH MÌ CUỘN BƠ NƯỚNG 25G, RTE", 5.244],
	"JGMP0000000G602.00": ["BÁNH MÌ CUỘN BƠ NƯỚNG 25G, RTE", 5.244],
	"JNIP000000JNI36.0A": ["PIZZA SAUCE CÀ CHUA 18CM 150G", 3.735],
	"JTUP000000JTU27.0A": ["RONG BIỂN TẨM BỘT CHIÊN 65G", 8.891],
	"EVL3D0000090874.0A": ["BÁNH CUỐN TÔM 50G & SOY SAUCE 60G, KB, LOGO HA", 10.41],
	"EFPB00000EFP043.0C": ["BÁNH BAO SANDWICH 50G", 4.558],
	"JTUP00000000025.A0": ["ĐẾ PIZZA NƯỚNG 140G, 9 INCHES", 8.246],
	"SNMP000000SNM03.00": ["BÁNH PIZZA PHÔ MAI 500G 12 INCHES", 11.225],
	"SNMP000000SNM04.00": ["BÁNH PIZZA RAU CỦ CÀ RI PHÔ MAI 500G 12 INCHES", 11.47],
	"SNMP000000SNM05.00": ["BÁNH PIZZA CÁ NGỪ MAYO 600G 12 INCHES", 10.818],
	"SNMP000000SNM06.00": ["BÁNH PIZZA TÔM MAYO 600G 12 INCHES", 10.81],
	"JGMK0000000G603.00": ["BÁNH QUẨY CHIÊN PHỦ ĐƯỜNG 17G, RTE", 5.22],
	"JWFK0000000WG05.00": ["BÁNH CÁ HỒI VÀ RAU CỦ 435G", 5.98],
	"VGN00001400.0D": ["BÁNH BAO KIM SA 40 G (240 G/GÓI)", 5.79],
	"VGN00000500.AC": ["TÔM XÙ RẾ BA MÀU 30 G (300 G/GÓI)", 8.794],
	"VCO00008100.00": ["Bánh cuốn chay 48 G (290 G) (ND030A.25)", 5.552],
	"VGS00001700.00": ["BÁNH MÌ MÈ NHÂN ĐẬU ĐỎ 40 G (360 G/GÓI)", 2.892],
	"VGS00001800.00": ["XÔI GÀ NẤM HƯƠNG 150 G (1.2 KG/GÓI)", 15.38],
	"VGN00001500.0C": ["BÁNH CUỐN HẢI SẢN 45 G (250 G/GÓI)", 9.246],
	"VMN00001200.00": ["BÁNH VỎ NGÀN LỚP NHÂN DÂU 60 G (300 G/ GÓI)", 2.568],
	"VMN00001300.00": ["BÁNH VỎ NGÀN LỚP NHÂN XOÀI 60 G (360 G/ GÓI)", 2.928],
	"JLFV00000021920.00": ["BẮP CẮT KHOANH 5CM, NG", 11.561],
	"VGN00004800.0A": ["BÁNH CUỐN XÁ XÍU 45 G (250 G/GÓI)", 8.154],
	"JKKP000000JKK01.00": ["BÁNH PIZZA PHÔ MAI CÀ CHUA 125G, 7 INCHES", 3.63],
	"PSMB000000PSM08.00": ["BÁNH BAO SANDWICH 40G, HA", 6.784],
	"PSMC000000PSM09.00": ["TÔM FILO 20G, HA", 11.67],
	"PSMK000000PSM01.00": ["RAU CỦ TẨM BỘT CHIÊN TÔM 25G, HA", 13.608],
	"PSMD000000PSM10.00": ["BỘ DIMSUM 840G/HỘP, HA", 10.231],
	"PSMH000000PSM02.00": ["HÁ CẢO TÔM 30G, HA", 10.805],
	"PSMH000000PSM02.0A": ["HÁ CẢO TÔM 30G, HA ( SỬ DỤNG CHUNG HỘP ESM 4650A)", 10.805],
	"PSMH000000PSM02.0B": ["HÁ CẢO TÔM 30G, HA ( SỬ DỤNG CHUNG HỘP ESM 4650A)", 10.805],
	"ESMH0000044650A.00": ["HÁ CẢO TÔM 30G, HA", 10.805],
	"ESMH0000044650A.0A": ["HÁ CẢO TÔM 30G, HA (PHUN DL719)", 10.805],
	"ESMH0000044651A.00": ["HÁ CẢO TÔM 30G, HA", 7.235],
	"PSMX000000PSM03.00": ["XÍU MẠI TÔM 25G, HA", 6.087],
	"PSMX000000PSM03.0A": ["XÍU MẠI TÔM 25G, HA (SỬ DỤNG HỘP ESM 4652A)", 6.087],
	"ESMS0000044652A.00": ["XÍU MẠI TÔM 25G, HA (SỬ DỤNG HỘP PSM 03)", 6.087],
	"PSMW000000PSM04.00": ["HOÀNH THÁNH TÔM 25G, HA", 6.638],
	"PSMW000000PSM04.0A": ["HOÀNH THÁNH TÔM 25G, HA (SỬ DỤNG CHUNG HỘP CỦA ESM 4653A)", 6.662],
	"PSMW000000PSM04.0B": ["HOÀNH THÁNH TÔM 25G, HA (SỬ DỤNG CHUNG HỘP CỦA ESM 4653A)", 6.61],
	"ESMD0000044653A.00": ["HOÀNH THÁNH TÔM 25G, HA", 6.662],
	"ESMD0000044653A.0A": ["HOÀNH THÁNH TÔM 25G, HA (PHUN DL719)", 6.61],
	"ESMH0000054271A.00": ["DIMSUM THẬP CẨM HẤP 340G/HỘP, HA (PHUN DL719)", 6.662],
	"PSMD000000PSM06.00": ["BỘ DIMSUM HẤP 340G/HỘP, HA", 10.414],
	"PSMD000000PSM06.0A": ["BỘ DIMSUM HẤP 340G/HỘP, HA (SỬ DỤNG CHUNG HỘP ESM 4271A)", 10.414],
	"ETFC011307200NL.00": ["CHẢ GIÒ TÔM ỐNG TRÚC 8G, 1KG/PA. RIDER 4 NGÔN NGỮ (FR, EN, N", 11.052],
	"VHF00054900.00": ["Bánh Trứng Sô-Cô-La 25 g (250 g)", 5.628],
	"HHAB00000036620.00": ["BÁNH CÀ RI RAU CỦ CHAY 130G, RTE", 7.13],
	"SHAB00000036620.00": ["BÁNH CÀ RI RAU CỦ CHAY 130G, RTE", 7.13],
	"ASFV000000ASF19.0D": ["HẸ CẮT 5MM", 10.825],
	Đ: ["BÁNH CÀ RI RAU CỦ CHAY 70G", 7.845],
	"UAIK00000536823.00": ["BÁNH QUẨY THỪNG 50G", 9.051],
	"AUTK0SCAHSMR840.00": ["SÒ ĐIỆP VÀ PHÔ MAI VỚI SỐT MORNAY 70G", 9.065],
	"UAIK00000536822.00": ["BẮP QUE TẨM GIA VỊ NƯỚNG 3KG/PA", 9.585],
	"UAIK00000536824.00": ["BÁNH XẾP TÔM 60G (CODE UAI-S06.25, HÀNG CHIÊN)", 9.995],
	"UAIK00000536824.AA": ["BÁNH XẾP TÔM 60G (PHUN MÃ PO TRÊN THÙNG)", 9.995],
	"UAIH00000536825.00": ["HOÀNH THÁNH TÔM, HÌNH THUYỀN 20G (CODE UAI-S07.25, HÀNG CHIÊ", 9.635],
	"UAIH00000536825.AA": ["HOÀNH THÁNH TÔM, HÌNH THỎI VÀNG 20G  (THAY ĐỔI PHUN THÊM PO)", 9.635],
	"UAIH00000536826.00": ["HÁ CẢO TÔM 40G (CODE UAI-S08.25)", 10.635],
	"UAIH00000536826.0A": ["HÁ CẢO TÔM 40G (PHUN MÃ PO TRÊN THÙNG)", 10.635],
	"ENPB00000007308.0A": ["BÁNH BAO BURGER 60G (CẮT SẴN)", 6.523],
	"JWFK0000000WG04.00": ["TÔM RAU CỦ TẨM BỘT CHIÊN 70G", 4.905],
	"AGBB000000AGB06.00": ["BÁNH BAO NẤM 40G", 6.005],
	"AGBB000000AGB07.00": ["BÁNH BAO KIM SA 40G", 8.675],
	"ATMB000FGBC40-C.A0": ["BÁNH BAO SANDWICH 40G, CH, NG", 7.29],
	"AGBG000000AGB10.00": ["SỦI CẢO TÔM 25G", 8.754],
	"AGBG000000AGB09.00": ["SỦI CẢO CHAY VỎ MÀU XANH 25G", 8.754],
	"AGBG000000AGB08.00": ["SỦI CẢO TÔM GỪNG 25G", 8.754],
	"AGBB000000AGB05.00": ["BÁNH TIỂU LONG TÔM 30G (CODE: AGB-S31.24)", 4.952],
	"AGBC000000AGB04.00": ["CHẢ GIÒ RẾ KHOAI MỠ 25G", 5.967],
	"AGBC000000AGB03.00": ["CHẢ GIÒ RẾ HẢI SẢN 50G (CODE AGB-S27.24)", 5.513],
	"AGBW000000AGB02.00": ["HOÀNH THÁNH NGUYÊN CON TÔM HÌNH ĐỒNG TIỀN 20G", 5.617],
	"AGBH000000AGB01.00": ["HÁ CẢO HOÀNG GIA 30G (CODE AGB-S09.23)", 4.936],
	"HSVP000000HSV01.0B": ["PIZZA BỐN LOẠI PHÔ MAI 230G, 9 INCHES", 6.949],
	"HSVP000000HSV02.0B": ["PIZZA MARGHERITA 230G, 9 INCHES", 6.929],
	"HSVP000000HSV03.0B": ["PIZZA TÔM SỐT MAYO 230G, 9 INCHES", 6.964],
	"ENPB00000007309.0A": ["BÁNH BAO SANDWICH MÀU VÀNG 30G", 6.955],
	"ENPB00000007310.0B": ["BÁNH BAO SANDWICH MÀU CAM 30G", 6.955],
	"ENPB00000007311.0A": ["BÁNH BAO SANDWICH TRÀ XANH 30G", 6.955],
	"ENPB00000007398.0A": ["BÁNH BAO SANDWICH 70G", 4.969],
	"ETFK00011306000.BD": ["BÁNH BÈO TÔM 15G", 8.268],
	"EFPD00000EFP047.00": ["BÁNH CUỐN CHAY CUỐN LÁ CHUỐI 48G", 2.973],
	"ETFD00011172100.AB": ["BÁNH BAO KHOAI MÔN 40G", 8.325],
	"JCHK00000A-2302.0C": ["RAU CỦ TÔM 25G", 4.658],
	"VGN01001300.00": ["MÌ Ý BÒ BẰM XỐT CÀ CHUA 240 G (240 G/HỘP)", 6.592],
	"VGN00008200.00": ["MIẾN THỊT GHẸ 190 G (190 G/ HỘP)", 5.492],
	"VGN00008300.00": ["PAD THÁI TÔM 235 G (235 G/ HỘP)", 6.482],
	"EFPK00000EFP046.00": ["BÁNH RÁN NHÂN ĐẬU ĐỎ 35G", 1.168],
	"JTUP000000JTU26.0A": ["RONG BIỂN TẨM BỘT CHIÊN 25G", 10.95],
	"JTUP000000JTU26.00": ["RONG BIỂN TẨM BỘT CHIÊN 25G", 11.11],
	"CAHT00000EG3023.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM CUA 22G", 9.58],
	"UMNK000000UMN03.00": ["BÁNH BAO KHOAI MÔN 50G", 8.748],
	"UMNK000000UMN04.00": ["BÁNH BAO ĐẬU XANH 50G", 8.763],
	"UMNK000000UMN05.00": ["BÁNH BAO CADE 50G", 8.793],
	"UMNK000000UMN06.00": ["BÁNH BAO RAU CỦ 50G", 8.793],
	"JTUP000000JTU27.00": ["RONG BIỂN TẨM BỘT CHIÊN 65G", 8.96],
	"ABWC000000ABW15.00": ["CHẢ GIÒ BỘT MÌ TÔM 20G, KB", 9.814],
	"JNIP000000JNI37.0A": ["BÁNH PIZZA SAUCE CÀ CHUA 174G, 22CM", 5.01],
	"JNIP000000JNI37.00": ["BÁNH PIZZA SAUCE CÀ CHUA 174G, 22CM", 5.01],
	"VMN00001100.00": ["BÁNH TRÀ XANH HÌNH DƯA LƯỚI 50 G (300 G/ GÓI)", 3.78],
	"SFFP000000SFF04.0A": ["BÁNH PANCAKE 20G, HA", 4.69],
	"SFFP000000SFF04.00": ["BÁNH PANCAKE 20G, HA", 4.69],
	"JNIP00000JNI31A.00": ["PIZZA 4 LOẠI PHOMAI 18CM 172G", 2.16],
	"JNIP00000JNI30A.00": ["PIZZA MARGHERITA 18CM 193G", 2.39],
	"ABWD000000ABW04.00": ["HOÀNH THÁNH TÔM 25G, KB", 11.74],
	"EFPR00000EFP048.00": ["HỦ TIẾU TÔM 350G", 5.026],
	"EFPR00000EFP049.00": ["SÚP MÌ NHẬT RAU CỦ 350G", 5.026],
	"EFPR00000EFP050.00": ["BÁNH RÁN NHÂN ĐẬU HỦ KIM CHI 25G (THỰC TẾ GIAO ĐỘNG 39 - 41 ", 5.575],
	"EFPR00000EFP051.00": ["BÁNH BAO HÌNH CON MA 45G", 5.7],
	"EFPG00000EFP053.00": ["SỦI CẢO TÔM ÁP CHẢO, SỐT PONZU 220G/HỘP, ASC LOGO", 3.416],
	"JIGP000000JIG72.00": ["PIZZA MARGHERITA 250G, 22CM", 3.613],
	"JIGP000000JIG73.00": ["HOÀNH THÁNH TÔM 13G", 5.675],
	"KHT10000000KST06.00": ["BÁNH CUỐN TÔM 450G/PA", 6.862],
	"JCFB000000JCF24.00": ["BÁNH MÌ NAAN 70G, VE, NG, CH", 2.982],
	"EHA100000082512.00": ["KHOAI LANG TẨM BỘT 60G", 5.35],
	"ABWH000000ABW01.00": ["HÁ CẢO TÔM SÒ ĐIỆP 25G, KB", 12.51],
	"ABWH000000ABW02.00": ["HÁ CẢO TÔM 25G, KB", 14.034],
	"ABWK000000ABW07.00": ["CHẠO MÍA 62.5G, KB", 12.35],
	"ABWK00000ABW016.00": ["XÔI TÔM VÀ SÒ ĐIỆP LÁ SEN 80G", 11.53],
	"ABWX000000ABW03.00": ["XÍU MẠI TÔM 30G", 10.815],
	"ACC000000FACF03.00": ["HÁ CẢO TÔM 21G, 6PCS/LY, KB", 1.964],
	"ACCD0000000FA01.0A": ["DIMSUM THẬP CẨM HẤP 240GR/HỘP", 1.977],
	"ACCD0000000FA18.00": ["BÁNH BAO SANDWICH 32G", 1.743],
	"ACCD0000000FA22.0A": ["HOÀNH THÁNH TÔM SẢ 30G", 2.034],
	"ACCD0000000SB03.00": ["BÁNH BAO SANDWICH 32G, 320G/PA", 1.933],
	"ACCD0000000SB03.0A": ["BÁNH BAO SANDWICH 32G, 320G/PA", 1.933],
	"ACCD000000FA07B.0D": ["DIMSUM THẬP CẨM HẤP-NON MSG-MIX DIMSUM STEAMED", 4.518],
	"ACCD000000FAL04.00": ["DIMSUM THẬP CẨM HẤP", 4.812],
	"ACCD00000FPW76B.00": ["HOÀNH THÁNH TÔM CHIÊN 20G, 36PC/TRAY ( CODE: 789C.17 (SAME A", 6.814],
	"ACCD00000FPW76B.0A": ["HOÀNH THÁNH TÔM CHIÊN 20G, 36PC/TRAY ( CODE: 789C.17 (SAME A", 6.814],
	"ACCD000FA07-500.00": ["DIMSUM THẬP CẨM HẤP 500GR/HỘP", 4.105],
	"ACCD000FA07-625.00": ["DIMSUM THẬP CẨM HẤP 4 MÓN, 625G/BOX, NON-MSG\n 1. HÁ CẢO TÔM ", 3.715],
	"ACCD00FAB07-500.00": ["DIMSUM THẬP CẨM HẤP, KB, 500G/BOX", 3.516],
	"ACCD00FAB07-625.00": ["DIMSUM THẬP CẨM HẤP, 625G/BOX", 3.665],
	"ACCH0000000FA03.0A": ["HÁ CẢO TÔM 21G", 2.323],
	"ACCH0000000FA06.0A": ["SỦI CẢO TÔM GỪNG 30G", 1.983],
	"ACCH0000000FA09.0A": ["BÁNH CUỐN TÔM 48GR", 2.3442],
	"ACCH0000000FA13.0A": ["HÁ CẢO TÔM 23G", 1.797],
	"ACCH000000FAL01.0D": ["HÁ CẢO TÔM 21G, 700G/BAG/INNER BOX", 5.258],
	"ACCH000000FAL06.00": ["HÁ CẢO TÔM 21G - SHRIMP ASC", 5.025],
	"ACCH000000FBA03.00": ["HÁ CẢO TÔM 23G, KBN, 5.5KG/PE", 11.71],
	"ACCH000000FBA03.AA": ["HÁ CẢO TÔM 23G, KBN, 5.5KG/PE", 11.714],
	"ACCH000000FBA03.AB": ["HÁ CẢO TÔM 23G (23G+-1G), KB, 5.0KG/PE", 10.884],
	"ACCH000000FDL02.00": ["HÁ CẢO TÔM 25G, 1KG/BAG", 10.727],
	"ACCH000000FDL02.0A": ["HÁ CẢO TÔM 25G, 1KG/PA", 10.735],
	"ACCH000000FPW75.0A": ["SỦI CẢO TÔM 25G (800G/BAG)", 8.65],
	"ACCH00000FAGB02.00": ["SỦI CẢO CHAY 25G, GF", 1.824],
	"ACCH00000FAGB02.0A": ["SỦI CẢO CHAY 25G, GF", 1.824],
	"ACCH00000FAGB13.0A": ["HÁ CẢO TÔM 23G, KB, GF", 1.845],
	"ACCH00000FAGB13.0B": ["HÁ CẢO TÔM 23G, KB, GF", 1.845],
	"ACCH000FA03-550.0A": ["HÁ CẢO TÔM 21G, 550G/BOX", 4.5],
	"ACCH000FA03-700.00": ["HÁ CẢO TÔM 21G, 700G/BOX, NON-MSG", 4.038],
	"ACCH000FA06-450.00": ["SỦI CẢO TÔM GỪNG 30G", 3.254],
	"ACCH000FA06-630.00": ["SỦI CẢO TÔM GỪNG 30G, 630G/BOX, NON-MSG", 3.725],
	"ACCH00FAB03-550.00": ["HÁ CẢO TÔM 21G, KB", 3.841],
	"ACCH00FAB03-700.00": ["HÁ CẢO TÔM 21G, 700G/BOX", 4.076],
	"ACCH00FAB03.300.00": ["HÁ CẢO TÔM 21G, KB", 2.526],
	"ACCH00FAB06-450.00": ["SỦI CẢO TÔM GỪNG 30G, KB", 3.254],
	"ACCH00FAB06-630.00": ["SỦI CẢO TÔM GỪNG 30G, 630G/BOX, NON-MSG", 3.725],
	"ACCH00FAB09-300.00": ["BÁNH CUỐN TÔM 48G & 60G SAUCE/SACHET, KB", 2.175],
	"ACCH00FAB09-300.0A": ["BÁNH CUỐN TÔM 48G & 60G SAUCE/SACHET, KB", 2.193],
	"ACCK000000FPW66.00": ["BÁNH BAO SANDWICH 32G, 320G/PA", 9.252],
	"ACCK000000FPW66.0A": ["BÁNH BAO SANDWICH 32G, 320G/PA", 9.252],
	"ACCK000000FPW84.00": ["BÁNH BAO KIM SA 40G", 7.75],
	"ACCK00000FPW66B.00": ["BÁNH BAO SANDWICH 32G, 640G/PA", 9.113],
	"ACCK00000FPW66B.0A": ["BÁNH BAO SANDWICH 32G, 640G/PA", 9.113],
	"ACCR000FM05-350.00": ["CƠM CÀ RI ĐẬU HỦ 350G", 2.993],
	"ACCR000FM06-350.BA": ["PAD THÁI XÀO TÔM 350G", 3.021],
	"ACCR000FM07-350.AA": ["MÌ XÀO RAU CỦ VÀ SỦI CẢO TÔM ÁP CHẢO 350G", 3.021],
	"ACCR000FM08-350.AA": ["MÌ XÀO SINGAPORE 350G", 3.021],
	"ACCR00FMM06-350.00": ["PAD THÁI XÀO TÔM 350G", 3.045],
	"ACCR00FMM06-350.0A": ["PAD THÁI XÀO TÔM 350G", 3.021],
	"ACCR00FMM07-350.00": ["MÌ XÀO RAU CỦ VÀ SỦI CẢO TÔM ÁP CHẢO 350G", 3.021],
	"ACCR00FMM07-350.0A": ["MÌ XÀO RAU CỦ VÀ SỦI CẢO TÔM ÁP CHẢO 350G", 3.021],
	"ACCR00FMM08-350.00": ["MÌ XÀO SINGAPORE 350G", 3.045],
	"ACCR00FMM08-350.0A": ["MÌ XÀO SINGAPORE 350G", 3.021],
	"ACCR00FMM08-350.0B": ["MÌ XÀO SINGAPORE 350G", 3.021],
	"ACCW0000000FA05.0A": ["HOÀNH THÁNH TÔM HẸ 20G", 2.001],
	"ACCW00000FPW59A.0A": ["HOÀNH THÁNH TÔM 20G, 250G/BAG", 6.27],
	"ACCW00000FPW59B.00": ["HOÀNH THÁNH TÔM 20G, 250G/PA", 6.27],
	"ACCW00FAB05-240.00": ["HOÀNH THÁNH TÔM HẸ 19.2G, KB", 1.842],
	"ACCW00FAB05-240.0A": ["HOÀNH THÁNH TÔM HẸ 19.2G, KB", 1.842],
	AG003: ["Bánh bao chay rau củ 100g", 7.2],
	AG004: ["Bánh bao cade 100g", 7.2],
	"AGBP0PIZZAPC350.00": ["PIZZA HẢI SẢN 350G, ĐK 23CM, TÔM BAP 4*", 4.62],
	"AHAB00000037703.00": ["BÁNH BAO SANDWICH 35G", 4.856],
	"AHAC00000037704.00": ["CHẢ GIÒ RẾ CÀNG GHẸ 20G", 5.996],
	"AHAC00000037704.0A": ["CHẢ GIÒ RẾ CÀNG GHẸ 20G", 5.996],
	"AHAC00000082096.00": ["SAMOSA VỊ CÀ RI RAU CỦ 25G", 11.03],
	"AHAG00000094170.00": ["SỦI CẢO PTO ÁP CHẢO 25G", 11.7],
	"AHAC00000048046.00": ["BÁNH XOÀI 20G", 5.31],
	"AHAC00000048047.00": ["BÁNH CHANH DÂY 20G", 5.175],
	"AHAC00000036163.00": ["CHẢ GIÒ RẾ KHOAI MỠ 25G", 11.66],
	"AHAG00000098213.00": ["SỦI CẢO TÔM HẸ 25G", 5.49],
	"ANFT0000BR20057.00": ["MỰC TEMPURA 30G", 9.87],
	"ANFT0000BR20057.0A": ["MỰC TEMPURA 30G", 9.89],
	"ANFX0000BA81008.0A": ["XÍU MẠI TÔM 35G", 11.162],
	"ANFX0000BA81008.0B": ["XÍU MẠI TÔM 35G", 11.162],
	"ASF0000000ASF03.0A": ["SỦI CẢO TÔM BẮP CẢI 25G. CODE : RD02", 11.17],
	"ASF0000000ASF03.0B": ["SỦI CẢO TÔM BẮP CẢI 25G", 11.17],
	"ASF0000000ASF03.0C": ["SỦI CẢO TÔM BẮP CẢI 25G", 10.77],
	"ASF0000000ASF03.0D": ["SỦI CẢO TÔM BẮP CẢI 25G (Sử dụng thùng in)", 10.77],
	"ASFB000000ASF07.0A": ["BÁNH BAO SANDWICH 60G (HALF OVAL). 8PC/PE", 10.6],
	"ASFB000000ASF18.0A": ["BÁNH BAO SANDWICH 30G (HALF MOON)- HÌNH DẠNG NHƯ GN", 7.44],
	"ASFC000000ASF04.0A": ["CHẢ GIÒ BỘT MÌ BẮP PHÔ MAI QUE 10G", 5.69],
	"ASFG00000ASF09A.AA": ["SỦI CẢO CHAY 25G. 40PC/PA", 6.538],
	"ASFG00000ASF09A.AB": ["SỦI CẢO CHAY 25G", 6.538],
	"ASFG00000ASF09A.AC": ["SỦI CẢO CHAY 25G", 6.538],
	"ASFG00000ASF09A.AD": ["SỦI CẢO CHAY 25G", 6.538],
	"ASFG00000ASF13A.0A": ["SỦI CẢO TÔM 25G", 10.74],
	"ASFG00000ASF13A.0B": ["SỦI CẢO TÔM 25G", 10.74],
	"ASFG00000ASF13A.0C": ["SỦI CẢO TÔM 25G", 10.74],
	"ASFG00000ASF13A.0D": ["SỦI CẢO TÔM 25G (SỬ DỤNG THÙNG IN)", 10.74],
	"ASFK000000ASF20.0A": ["RẾ MỰC PHÔ MAI VIÊN 20G", 9.69],
	"ASFK000000ASF20.0B": ["RẾ MỰC PHÔ MAI VIÊN 20G", 9.69],
	"ASFK000000ASF20.0C": ["RẾ MỰC PHÔ MAI VIÊN 20G", 9.69],
	"ASFK000000ASF20.0D": ["RẾ MỰC 20G (THÙNG IN, BĂNG KEO TRONG)", 9.69],
	"ATDC000000ATD01.00": ["CHẢ CÁ 250G", 10.76],
	"ATDC000000ATD03.00": ["CHẢ GIÒ BỘT MÌ CHAY 25G", 4.87],
	"ATDC000000ATD06.00": ["CHUỐI CHIÊN 100G", 7.22],
	"ATDD000000ATD05.00": ["HÁ CẢO TÔM MÀU XANH 25G", 8.24],
	"ATDH000000ATD07.00": ["HÁ CẢO TÔM 15G", 11.724],
	"ATDH000000ATD09.00": ["HÁ CẢO TÔM HÌNH THUYỀN 25G", 10.344],
	"ATDK000000ATD02.00": ["BÁNH XÈO 90G", 4.47],
	"ATDS000000ATD04.00": ["XÍU MẠI MỰC 25G", 7.23],
	"ATMB000FGBC40-C.00": ["BÁNH BAO SANDWICH 40G, CH", 7.29],
	"ATMC000000APS25.00": ["CHẢ GIÒ BỘT MÌ TÁO 25G", 5.455],
	"ATMC000000APS25.0A": ["CHẢ GIÒ BỘT MÌ TÁO 25G (Giảm 2cm chiều cao)", 5.4],
	"ATMC000000ARW05.0E": ["CHẢ GIÒ CHAY 20G, VE", 2.1],
	"ATMC000000ARW05.0F": ["CHẢ GIÒ CHAY 20G, VE, CH", 2.1],
	"ATMC000000ARW14.0A": ["BÁNH XẾP CÀ RY CHAY 40G \n (VEGAN) CODE 990F.19", 1.5],
	"ATMC000000ARW14.0D": ["BÁNH XẾP CÀ RY CHAY 40G, VE", 1.5],
	"ATMC0000ARC31-C.00": ["BỘ MIX CHIÊN 490G/HỘP\n 1. BÁNH MÌ TÔM MÈ CHIÊN 15G X 10PCS\n ", 3.148],
	"ATMC0000ARC31-C.0A": ["BỘ MIX CHIÊN 490G/HỘP\n 1. BÁNH MÌ TÔM MÈ CHIÊN 15G X 10PCS\n ", 3.148],
	"ATMH0000ARC32-C.00": ["HÁ CẢO TÔM GỪNG CHIÊN 20G", 2.384],
	"ATMC000ALPS25-C.00": ["CHẢ GIÒ BỘT MÌ TÔM 25G, TÔM ASC (CODE 621D.24 (HÀNG CHIÊN))", 3.882],
	"ATMC000ALPS25-C.AA": ["CHẢ GIÒ BỘT MÌ TÔM 25G, TÔM ASC (CODE 621D.24 (HÀNG CHIÊN))\n", 3.702],
	"ATMC000SPSS50-C.0A": ["CHẢ GIÒ BỘT MÌ CHUA NGỌT 50G (CODE 308B.22)", 5.435],
	"ATMC000SPSS50-C.0B": ["CHẢ GIÒ BỘT MÌ CHUA NGỌT 50G (CODE 308B.22)", 5.435],
	"ATMC000SPVG50-C.0B": ["CHẢ GIÒ BỘT MÌ CHAY 50G", 5.435],
	"ATMC000SSGF20-C.00": ["CHẢ GIÒ BÁNH TRÁNG RAU CỦ CHUA NGỌT 20G, GF", 4.365],
	"ATMC000VBGF20-C.00": ["RẾ VIÊN RAU CỦ 20G, GF", 2.535],
	"ATMD00000GB32-C.BA": ["BÁNH BAO SANDWICH CHAY 32G", 3.112],
	"ATMD00000GB40-C.AA": ["BÁNH BAO SANDWICH CHAY 40G", 7.255],
	"ATMD00000HF05-C.0A": ["BÁNH BAO SANDWICH 40G, VE, 240G/TRAY", 3.169],
	"ATMD0000ARC05-C.0A": ["BÁNH BAO SANDWICH 40G, VE", 3.478],
	"ATMD0000HF05A-C.00": ["BÁNH BAO SANDWICH 40G, VE, 240G/TRAY, CH", 3.382],
	"ATMD000FBC160-C.AA": ["BÁNH MÌ TRÒN 160G", 1.218],
	"ATMD000FGB40A-C.0B": ["BÁNH BAO SANDWICH 40G, VE", 9.377],
	"ATMG000000ARW03.0A": ["SỦI CẢO CHAY 25G", 2.1],
	"ATMG000000ARW04.0E": ["SỦI CẢO CHAY 25G, VE", 2.1],
	"ATMG00000GPGF30.00": ["SỦI CẢO TÔM GỪNG 30G, GF, KB", 4.95],
	"ATMG00000HF04-C.0A": ["SỦI CẢO CHAY 25G, VE, 10PCS/TRAY", 3.02],
	"ATMG0000HF04A-C.00": ["SỦI CẢO CHAY 25G, VE, CH \n(có gài sleeve không date trước kh", 3.18],
	"ATMG0000HF08A-C.00": ["SỦI CẢO CHAY MÀU XANH 25G, CH, (18 THÁNG)\n ( GÀI SLEEVE, KHÔ", 3.17],
	"NTMG0000HF08A-C.00": ["SỦI CẢO CHAY MÀU XANH 25G, CH, (18 THÁNG)\n ( GÀI SLEEVE, KHÔ", 3.17],
	"ATMG0000HF09A-C.00": ["SỦI CẢO TÔM GỪNG 25G, CH \n( GÀI SLEEVE, PHUN DATE LÊN SLEEVE", 3.17],
	"NTMG0000HF09A-C.00": ["SỦI CẢO TÔM GỪNG 25G, CH \n( GÀI SLEEVE, PHUN DATE LÊN SLEEVE", 3.17],
	"ATMG00000SHGF40.00": ["SỦI CẢO CHAY 40G, GF, KB", 5.475],
	"ATMG0000GP30A-C.00": ["SỦI CẢO TÔM GỪNG 30G", 4.977],
	"ATMG0000GP30A-C.0A": ["SỦI CẢO TÔM GỪNG 30G (Giảm 2cm chiều cao)", 4.946],
	"ATMG0000SH40A-C.00": ["SỦI CẢO CHAY 40G", 5.445],
	"ATMG000SPGF30-C.0A": ["HÁ CẢO SÒ ĐIỆP 30G, GF, KB", 6.59],
	"ATMH000000ARW16.00": ["HÁ CẢO TÔM 23G (CODE ATM-S63A.24 (CHILLED))", 1.622],
	"ATMH000000ARW16.0A": ["HÁ CẢO TÔM 23G (CODE 0A THAY ĐỔI THIẾT KẾ SLEEVE)", 1.622],
	"ATMH00000PHGF25.00": ["HÁ CẢO TÔM 25G, GF, KB", 5.595],
	"ATMH0000PH23A-C.00": ["HÁ CẢO TÔM 23G\n(HÚT CHẶT, BAN BÁNH)", 5.41],
	"ATMH000ARC25A-C.00": ["HÁ CẢO TÔM 25G, KB (CODE ATM-S37.24)", 3.436],
	"ATMH000ARC25A-C.0A": ["HÁ CẢO TÔM 25G, KB", 3.454],
	"ATMH000ARC26A-C.00": ["BỘ MIX DIM SUM HẤP 460G/PA, KB (CODE 891.24)", 3.19],
	"ATMH000ARC26A-C.0A": ["BỘ MIX DIM SUM HẤP 460G/PA, KB (CODE 891.24)", 3.19],
	"ATMH000FCC03D-C.0C": ["HÁ CẢO TÔM 25G, 500G/TRAY", 12.6],
	"ATMK000000ARW17.00": ["BÁNH MÌ TÔM MÈ 15G", 1.366],
	"ATMK000000ARW17.0A": ["BÁNH MÌ TÔM MÈ 15G, CH", 1.322],
	"ATMD0000ARW20-C.00": ["BÁNH TIỂU LONG BAO SÔ CÔ LA 25G, KB", 1.838],
	"ATMC0000ARW22-C.00": ["CHẢ GIÒ BỘT MÌ NẾP XOÀI 25G", 1.838],
	"ATMC0000ARW23-C.00": ["CHẢ GIÒ BỘT MÌ TÔM 25G", 1.838],
	"ATMG000000ARW25.00": ["SỦI CẢO TÔM 25G, CH", 1.784],
	"ATMC000000ARW26.00": ["CHẢ GIÒ BỘT MÌ TÔM 25G, CH", 1.449],
	"ATMC000000ARW26.0A": ["CHẢ GIÒ BỘT MÌ TÔM 25G, CH", 1.449],
	"ATMK0000CR100-C.00": ["BẮP QUE NƯỚNG 1KG/PA", 5.415],
	"ATMK000CCGF20-C.00": ["BÁNH BẮP CHIÊN 20G, GF", 5.635],
	"ATMR000000FR250.00": ["CƠM CHIÊN TÔM 250G", 3.004],
	"ATMT000000FVT01.00": ["RAU CỦ CHIÊN ( VEGAN) - CODE 335B.20 (Pumpkin tempura code 6", 10.716],
	"ATMW00000HF01-C.AC": ["HOÀNH THÁNH TÔM HẸ 20G", 2.92],
	"ATMW00000PW20-C.00": ["HOÀNH THÁNH TÔM 20G (CODE ATM-S09D1.21 (HÀNG HẤP))", 7.42],
	"ATMW0000PWS20-C.AA": ["HOÀNH THÁNH TÔM 20G (CÓ 2 GÓI BỘT NÊM). CODE ACCW0000FPW59", 2.97],
	"ATMW0000PWS20-C.AB": ["HOÀNH THÁNH TÔM 20G & 2 GÓI SOUP POWDER 5G", 3.062],
	"ATMW0000PWS20-C.AC": ["HOÀNH THÁNH TÔM 20G & 2 GÓI SOUP POWDER 5G", 3.062],
	"ATMW0000PWS20-C.AD": ["HOÀNH THÁNH TÔM 20G & 2 GÓI SOUP POWDER 5G", 3.062],
	"ATMW000ARC27A-C.00": ["HOÀNH THÁNH TÔM HẸ 20G, KB", 2.83],
	"ATMW000ARC27A-C.0A": ["HOÀNH THÁNH TÔM HẸ 20G, KB", 2.83],
	"ATMC0000FPC25-C.00": ["CHẢ GIÒ BỘT MÌ TÔM VÀ SỐT ỚT 1.1KG/BOX\n(ĐÓNG THÙNG VÔ 4 GÓI ", 12.58],
	"ATMC0000FPC25-C.0A": ["CHẢ GIÒ BỘT MÌ TÔM VÀ SỐT ỚT 1.1KG/BOX\n(ĐÓNG THÙNG VÔ 4 GÓI ", 12.58],
	"ATMW000FCPW25-C.00": ["HOÀNH THÁNH TÔM GỪNG CHIÊN 25G", 12.075],
	"ATMR0000FTR01-C.00": ["MÌ SOUP RAU CỦ VỊ HEO CHAY 285G (ĐÓNG THÙNG VÀO 4 CHÉN 1 HỘP", 9.571],
	"ETMC000000IPC25.00": ["CHẢ GIÒ BỘT MÌ TÔM VÀ SỐT ỚT 1.1KG/BOX\n(ĐÓNG THÙNG VÔ 4 GÓI ", 12.58],
	"ETM1C0000IPC25A.00": ["CHẢ GIÒ BỘT MÌ TÔM VÀ SỐT ỚT 1.1KG/HỘP (COPY CT CỦA ETMC0000", 12.58],
	"AUFG000000AUF01.AD": ["SỦI CẢO TÔM HẸ 35G", 10.838],
	"AUTK0ORNBKSO948.00": ["BỘ MIX BÁNH BAO 60G, TÔM XÙ 23G VÀ SRIRACHA SAUCE 100G", 9.676],
	"AUTK0ORNTKTF840.00": ["BỘ MIX BÁNH BỘT MÌ 30G, CÁ TRA TEMPURA 60G VÀ RED SAUCE 120G", 8.376],
	"AUTR00000009300.00": ["BÁNH CUỐN TÔM 65G & NƯỚC TƯƠNG 50G/SACHET & HÀNH TÍM PHI VÀ ", 8.467],
	"AUTS00ORNDUPG12.00": ["SỦI CẢO TÔM HẸ 35G", 10.854],
	"AUTS00ORNDUPG12.0A": ["SỦI CẢO TÔM HẸ 35G", 10.854],
	"AUTS00ORNDUPG12.0B": ["SỦI CẢO TÔM HẸ 35G (PHUN LÔ TÔM V1,V2)", 10.854],
	"UVR1R0000UVR101.00": ["CƠM RISOTTO TÔM 283.5G VÀ CƠM CÁ BIRRIA 283.5G, ASC LOGO", 3.454],
	"UVR1R0000UVR101.0A": ["CƠM RISOTTO TÔM 283.5G VÀ CƠM CÁ BIRRIA 283.5G, ASC LOGO\n(GI", 3.441],
	"AVR1K0000013602.A0": ["HÀNH TÂY VÒNG TEMPURA 1KG/TÚI (1004G - 1025G)", 3.517],
	"AVR1K0000013602.00": ["HÀNH TÂY VÒNG TEMPURA 1KG/TÚI (1004G - 1025G)", 3.517],
	"AVRSK0000013602.00": ["HÀNH TÂY VÒNG TEMPURA 1KG/TÚI", 3.505],
	"AWBK00003803373.00": ["Bánh mì mít chay 13g ( Vegan) code 187A.20", 2.575],
	BTPVDLCA016: ["Hoành thánh tôm thịt 14g (code S-DL009A1)", 2.215],
	BTPVDLCC06B: ["Bánh củ cải 45g (720g)", 6.198],
	BTPVDLCD08A: ["Há cảo hoa hồng 22g (880g)", 3.934],
	"CACEB0000CACE01.00": ["BÁNH BAO SẦU RIÊNG 40G (HÌNH OVAL)", 7.05],
	"CAPSH000CAPS01A.0A": ["HÁ CẢO TÔM HOÀNG GIA 25G", 10.232],
	"CAPSH000CAPS01B.0A": ["HÁ CẢO TÔM HOÀNG GIA 25G", 9.152],
	"CAPSK000CAPS03A.00": ["RAU CỦ TẨM BỘT CHIÊN TÔM 25G, 1.13KG/BOX NO TRAY", 16.986],
	"CAPSK000CAPS03A.AB": ["RAU CỦ TẨM BỘT CHIÊN TÔM 25G", 16.96],
	"CAPSK000CAPS03A.BC": ["RAU CỦ TẨM BỘT CHIÊN TÔM 25G", 16.96],
	"CAPSW000CAPS06A.00": ["HOÀNH THÁNH TÔM CHIÊN VỚI SAUCE CHUA NGỌT", 16.965],
	"CASC1D000088622.00": ["SỦI CẢO TÔM PTO ÁP CHẢO 28G", 7.2],
	"CASCD0000088622.00": ["SỦI CẢO TÔM PTO ÁP CHẢO 28G", 7.2],
	"CASSK0000CASS03.AA": ["Tôm cánh bướm xù dừa chiên 20g", 5.266],
	"CASSK0000CASS05.0A": ["TÔM VÀ RAU CỦ TẨM BỘT CHIÊN 30G, TÔM BAP4*", 6.153],
	"CASSK0000CASS06.00": ["BÁNH BURRITOS TÔM 20G, TÔM BAP 4*", 4.772],
	"CASSK0000CASS06.0A": ["BÁNH BURRITOS TÔM 20G, TÔM BAP 4*", 4.772],
	"CASSK0000CASS07.A0": ["BÁNH MÌ TÔM TỎI 32G, BAP 4* shrimp CODE 784H.19. ( CODE BÁNH", 6.598],
	"CASSK0000CASS08.00": ["Dimsum Selection 280g ( BAP 4* \n SHRIMP, ASC FISH) (6pcs Shr", 5.766],
	"CASSH0000CASS09.00": ["HÁ CẢO TÔM 30G", 9.703],
	"CATC00000535818.00": ["CHẢ GIÒ CHAY MAYONNAISE 50G \n(ĐÓNG SỐ LÔ TẠI MẶT CÓ DATE + L", 8.876],
	"CATC00000535818.0A": ["CHẢ GIÒ CHAY MAYONNAISE 50G \n(ĐÓNG SỐ LÔ TẠI MẶT CÓ DATE + L", 8.956],
	"CATC00000535819.00": ["CHẢ GIÒ TÔM VỎ BỘT MÌ 25G\n (ĐÓNG SỐ LÔ TẠI MẶT CÓ DATE VÀ LO", 6.921],
	"CATC00000535819.0A": ["CHẢ GIÒ TÔM VỎ BỘT MÌ 25G\n (ĐÓNG SỐ LÔ TẠI MẶT CÓ DATE VÀ LO", 7.017],
	"CATC00000535819.0B": ["CHẢ GIÒ TÔM VỎ BỘT MÌ 25G\n (ĐÓNG SỐ LÔ TẠI MẶT CÓ DATE VÀ LO", 7.017],
	"CATD00000501349.00": ["CHẢ GIÒ TÔM VỎ BỘT MÌ 25G\n (ĐÓNG SỐ LÔ TẠI MẶT CÓ DATE VÀ LO", 9.962],
	"CATD00000501349.AA": ["HÁ CẢO TÔM 26G (spec: 522 - 560)", 9.93],
	"CATD00000501349.AB": ["HÁ CẢO TÔM 26G (spec: 522 - 560)", 9.93],
	"CATD00000507718.0A": ["BÁNH CUỐN TÔM 48G VỚI SỐT 50G/GÓI", 13.274],
	"CATD00000507718.00": ["BÁNH CUỐN TÔM 48G VỚI SỐT 50G/GÓI", 13.274],
	"CATD00000510765.00": ["XÍU MẠI TÔM 25G", 12.508],
	"CATD00000510765.AA": ["XÍU MẠI TÔM 25G", 12.508],
	"CATD00000510765.AB": ["XÍU MẠI TÔM 25G (THÙNG ĐỔI ĐỊA CHỈ TÂY NINH)", 12.508],
	"CATD00000510767.00": ["BÁNH CUỐN HẢI SẢN 48G VỚI SỐT 46G/GÓI", 12.584],
	"CATD00000510767.0A": ["BÁNH CUỐN HẢI SẢN 48G VỚI SỐT 46G/GÓI", 12.584],
	"CATD00000510767.AB": ["BÁNH CUỐN HẢI SẢN 48G VỚI SỐT 46G/GÓI", 12.584],
	"CATD00000510768.0A": ["BÁNH CUỐN TÔM 48G VỚI SỐT 46G/GÓI", 12.566],
	"CATD00000510768.AB": ["BÁNH CUỐN TÔM 48G VỚI SỐT 46G/GÓI", 12.566],
	"CATD00000519019.00": ["CHẢ GIÒ CHAY CHIÊN 50G", 11.97],
	"CATD00000519019.0A": ["CHẢ GIÒ CHAY CHIÊN 50G", 11.97],
	"CATD00000519019.0B": ["CHẢ GIÒ CHAY CHIÊN 50G (TÂY NINH)", 11.97],
	"CATD00000528879.0B": ["CHẠO TÔM 50G", 11.41],
	"UTT1D0000536551.00": ["CHẠO TÔM 50G", 11.41],
	"CATD00000528879.0A": ["CHẠO TÔM 50G (ĐÓNG LÔ MẶT LOT)", 11.41],
	"CATD00000528879.00": ["CHẠO TÔM 50G (ĐÓNG LÔ MẶT LOT)", 11.41],
	"CATD00000528880.00": ["CHẢ GIÒ RẾ KHOAI MỠ 30G (ĐÓNG SỐ LÔ Ở MẶT LOT)", 10.73],
	"CATD00000528880.0A": ["CHẢ GIÒ RẾ KHOAI MỠ 30G (ĐÓNG SỐ LÔ Ở MẶT LOT)", 10.73],
	"CATD00000531071.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM CUA 45G", 12.245],
	"CATD00000531071.0A": ["CHẢ GIÒ BÁNH TRÁNG TÔM CUA 45G\n(ĐÓNG SỐ LÔ TẠI MẶT CÓ DATE)", 12.245],
	"CATD00000531071.0B": ["CHẢ GIÒ BÁNH TRÁNG TÔM CUA 45G (TÂY NINH)", 12.245],
	"CATD00000531530.00": ["HÁ CẢO TÔM 26G", 10.669],
	"CATD00000531530.0A": ["HÁ CẢO TÔM 26G", 10.669],
	"CATD00000786937.AA": ["HÁ CẢO TÔM 25G", 11.672],
	"CATD00000786937.AB": ["HÁ CẢO TÔM 25G", 11.672],
	"CATD00000786937.AC": ["HÁ CẢO TÔM 25G", 11.672],
	"CATD00000786937.AD": ["HÁ CẢO TÔM 25G (TÂY NINH)", 11.672],
	"CATD00000786938.00": ["MIXED DIMSUM (STEAMED)", 11.75],
	"CATD00000786938.0A": ["MIXED DIMSUM (STEAMED)", 11.75],
	"CATD00000786938.A0": ["MIXED DIMSUM (STEAMED)- HÁ CẢO, XÍU MẠI, HÁ CẢO HOA HỒNG, HÁ", 11.58],
	"CATD00000786938.0B": ["DIMSUM THẬP CẨM HẤP 500G/KHAY", 11.58],
	"CATD00000786938.0C": ["DIMSUM THẬP CẨM HẤP 500G/KHAY (THÙNG ĐỔI ĐỊA CHỈ TÂY NINH)", 11.58],
	"UTT1D0000786938.00": ["DIMSUM THẬP CẨM HẤP 500G/KHAY", 11.58],
	"CATD000510768.1.00": ["BÁNH CUỐN TÔM 48G", 12.566],
	"CATK00000532993.00": ["XÔI HẢI SẢN 40G (ĐÓNG SỐ LÔ TẠI MẶT CÓ BARCODE)", 9.112],
	"CATP00000532994.00": ["PIZZA QUAI VẠC PHÔ MAI SỐT CÀ CHUA 100G", 6.485],
	"CATP00000532995.00": ["PIZZA PHÔ MAI SỐT CÀ CHUA 115G, 15-16CM", 7.172],
	"CATC00000537252.00": ["CHẢ GIÒ TÔM VỎ BỘT MÌ CHIÊN 50G", 9.488],
	"CAUTD0000CAUT03.00": ["BỘ MIX DIMSUM", 11.71],
	"CAUTDFMD000CT05.0A": ["BỘ MIX DIMSUM HẤP", 11.71],
	"CAUTDFMD000CT05.0B": ["BỘ MIX DIMSUM HẤP", 11.71],
	"CAUTH00FDS000KS.00": ["BÁNH CUỐN TÔM VÀ SỐT NƯỚC TƯƠNG 540G/PA", 12.055],
	"CAUTH00FDS100KS.00": ["BÁNH CUỐN NẤM CHAY VÀ SỐT NƯỚC TƯƠNG 360G/PA", 8.38],
	"CAUTHFPD000CT06.00": ["HÁ CẢO TÔM 25G", 11.72],
	"CAUTHFPD000CT06.0A": ["HÁ CẢO TÔM 25G", 11.72],
	"CAUTSFPS000CT07.00": ["XÍU MẠI TÔM 25G", 11.53],
	"CAUTSFPS000CT07.0A": ["XÍU MẠI TÔM 25G", 11.53],
	"CAWED0000101731.00": ["BÁNH CUỐN TÔM 550G/TRAY", 12.6],
	"CAWED0000101731.0A": ["BÁNH CUỐN HẢI SẢN 45G & SOY SAUCE 50G", 12.6],
	"CAWED0000101731.0B": ["BÁNH CUỐN HẢI SẢN 45G", 12.641],
	"CAWED0000101731.0C": ["BÁNH CUỐN HẢI SẢN 45G & SOY SAUCE 50G", 12.601],
	"CAWED0000101731.0D": ["BÁNH CUỐN HẢI SẢN 45G & SOY SAUCE 50G", 12.571],
	"CAWED0000101731.0E": ["BÁNH CUỐN HẢI SẢN 45G & SOY SAUCE 50G", 12.582],
	"CAWED0000101731.0F": ["BÁNH CUỐN HẢI SẢN 45G & SOY SAUCE 50G", 12.582],
	"CAWED0000101731.0G": ["BÁNH CUỐN HẢI SẢN 45G & SOY SAUCE 50G", 12.62],
	"CAWED0000101731.0H": ["BÁNH CUỐN HẢI SẢN 45G & SOY SAUCE 50G", 12.62],
	"CAWED0000301788.0B": ["BÁNH CUỐN NẤM CHAY 60G & SOYSAUCE 50G", 10.801],
	"CAWEH0000301730.0A": ["HÁ CẢO HOÀNG GIA 25G", 11.481],
	"CAWEH0000301730.0E": ["HÁ CẢO HOÀNG GIA 25G", 11.478],
	"CWEG00000301722.00": ["SỦI CẢO TÔM PTO 20G, 8PC/TRAY", 4.848],
	"CWEG000301713-C.0B": ["SỦI CẢO TÔM PTO 20G, 8PC/TRAY, 160G", 4.829],
	"CWEH00000301729.0A": ["HÁ CẢO TÔM 25G, 8PC/TRAY, 200G", 5.598],
	"CWEW000301739-A.0B": ["HOÀNH THÁNH TÔM SOUP RAW 15.5G, 50PCS, 795G. CODE 667A2.18 -", 12.8],
	"EAIC000000EAI06.00": ["CHẢ GIÒ RẾ HẢI SẢN 20G (SAMPLE CODE EVF-S12D.21)", 5.85],
	"EAIC000000EAI09.00": ["CHẢ GIÒ TÔM QUE 25G (SAMPLE CODE EVF-S34.21)", 11.38],
	"EAIH000000EAI03.00": ["HÁ CẢO TÔM 25G (sample code EVF-S07C.21)", 11.67],
	"EAIH000000EAI10.00": ["HÁ CẢO TÔM 20G (FOR HOTPOT) (SAMPLE CODE EVF-S33.21)", 8.9],
	"EAIW000000EAI07.00": ["HOÀNH THÁNH TÔM 20G (SAMPLE CODE EVF-S18A.21)", 9.86],
	"EAIX000000EAI04.00": ["XÍU MẠI TÔM 25G (SAMPLE CODE EVF-S08C.21)", 11.6],
	"EASB000000EAS05.AA": ["BÁNH BAO SẦU RIÊNG HÌNH TRÁI ĐÀO 40G", 5.345],
	"EASB000000EAS07.AA": ["BÁNH BAO CHIÊN 32G", 7.3],
	"EASB000000EAS15.00": ["BÁNH BAO SANDWICH 60G", 8.244],
	"EASC000000EAS06.AA": ["CHẢ GIÒ RẾ TÔM PTO 25G", 11.52],
	"EASH000000EAS01.BC": ["HÁ CẢO TÔM 25G", 11.445],
	"EASH000000EAS04.AA": ["HÁ CẢO CHAY 25G", 6.981],
	"EASH000000EAS04.AB": ["HÁ CẢO CHAY 25G", 6.981],
	"EASK000000EAS16.A0": ["BÁNH BỘT LỌC NHÂN TÔM 25G", 11.15],
	"EASS000000EAS09.00": ["SỦI CẢO TÔM HẸ 20G", 9.618],
	"EAST000000EAS17.00": ["KHOAI LANG KÉN CHIÊN 20G", 10.76],
	"EAST000000EAS17.AA": ["KHOAI LANG KÉN CHIÊN 15G", 10.76],
	"EASX000000EAS02.AC": ["XÍU MẠI TÔM 500G/24PCS", 11.18],
	"EASX000000EAS02.BD": ["XÍU MẠI TÔM 500G/24PCS", 11.18],
	"EAWX000000EAW03.00": ["XÍU MẠI TÔM 35G", 10.752],
	"EAYC000000EAY01.00": ["CHẢ GIÒ RẾ HẢI SẢN 20.8G", 11.82],
	"EAYC000000EAY04.00": ["CHẢ GIÒ RẾ TÔM 20.8G (CODE EAY-S01A.23, HÀNG SỐNG)", 11.69],
	"EAYH000000EAY02.00": ["HÁ CẢO TÔM HOÀNG GIA 25G", 11.15],
	"EAYH000000EAY02.0A": ["HÁ CẢO TÔM HOÀNG GIA 25G", 11.15],
	"EAYH000000EAY02.AB": ["HÁ CẢO TÔM 25G (PHUN LÔ TÔM TRÊN RIDER)", 11.15],
	"EAYH000000EAY05.00": ["HÁ CẢO TÔM 4 MÀU 35G", 12.7],
	"EAYS000000EAY03.00": ["XÍU MẠI TÔM 25G", 11.07],
	"EAYS000000EAY03.0A": ["XÍU MẠI TÔM 25G", 11.07],
	"EBFD00000050120.BH": ["SỦI CẢO HẤP 20G", 9.865],
	"EBFD00000050120.BI": ["SỦI CẢO HẤP 20G", 9.865],
	"EBFD00000050120.BK": ["SỦI CẢO HẤP 20G", 9.865],
	"EBFD00000050120.BL": ["SỦI CẢO HẤP 20G (ĐÓNG THÊM MÃ LÔ TÔM TRÊN BAO, CODE 719)", 9.865],
	"EBFD00000050133.00": ["SỦI CẢO HẤP 20G", 9.66],
	"EBFH00000050110.CI": ["HÁ CẢO TÔM 25G (BRAND : BEN'S EASY KITCHEN)", 9.089],
	"EBFH00000050110.CK": ["HÁ CẢO TÔM 25G (BRAND : BEN'S EASY KITCHEN)", 9.089],
	"EBFH00000050110.CL": ["HÁ CẢO TÔM 25G (BRAND : BEN'S EASY KITCHEN)\n(SPEC: 802 - 864", 9.249],
	"EBFH00000050110.CM": ["HÁ CẢO TÔM 25G (CODE 719)\n(SPEC: 802 - 864)", 9.249],
	"EBFH00000050111.BC": ["HÁ CẢO TÔM 25GR/PC", 7.1],
	"EBFH00000050111.CE": ["HÁ CẢO TÔM 25GR/PC", 7.1],
	"EBFH00000050111.CF": ["HÁ CẢO TÔM 25GR/PC", 7.1],
	"EBFH00000050111.CG": ["HÁ CẢO TÔM 25GR/PC", 7.1],
	"EBFH00000050111.CH": ["HÁ CẢO TÔM 25G", 7.1],
	"EBFH00000050111.CI": ["HÁ CẢO TÔM 25G  (CODE 719)", 7.1],
	"EBFH00000050114.00": ["HÁ CẢO TÔM 25G", 10.63],
	"EBFH00000050115.BC": ["HÁ CẢO TÔM 25GR/PC (CODE\n 317A.14 (ÁP DỤNG CÔNG THỨC CẢI TIẾ", 13.19],
	"EBFH00000050115.BD": ["HÁ CẢO TÔM 25GR/PC", 13.2],
	"EBFH00000050115.BE": ["HÁ CẢO TÔM 25G  (CODE 719 + PHUN LÔ TÔM)", 13.19],
	"EBFH00000050116.00": ["HÁ CẢO TÔM 25G", 5.466],
	"EBFH00000050130.AA": ["HÁ CẢO TÔM 25GR/PC", 9.105],
	"EBFH00000050130.BC": ["HÁ CẢO TÔM 25G", 9.105],
	"EBFH00000050131.AA": ["HÁ CẢO TÔM 25GR/PC", 6.935],
	"EBFH00000050131.BC": ["HÁ CẢO TÔM 25G", 6.935],
	"EBFH00000050132.0C": ["HÁ CẢO TÔM 25G (BRAND: JONA)", 9.089],
	"EBFH00000050132.0D": ["HÁ CẢO TÔM 25G (BRAND: JONA) (PHUN LÔ TÔM V1,V2 + DL719)", 9.089],
	"EBFH00050110GMS.00": ["HÁ CẢO TÔM 25GR/PC", 9.105],
	"EBFH00050110GMS.0A": ["HÁ CẢO TÔM 25GR/PC", 9.105],
	"EBFS00000050112.BB": ["XÍU MẠI TÔM 20GR/PC", 9.09],
	"EBFS00000050112.CF": ["XÍU MẠI TÔM 20G", 9.16],
	"EBFS00000050112.CG": ["XÍU MẠI TÔM 20G", 9.16],
	"EBFS00000050112.CH": ["XÍU MẠI TÔM 20G (PHUN DL719 + LÔ TÔM V1,V2)", 9.16],
	"EBFS0000050112J.A0": ["XÍU MẠI TÔM 20G", 9.033],
	"ECHB000000ECH05.00": ["BÁNH BAO ĐẬU ĐỎ 40G", 6.464],
	"ECHB000000ECH05.0A": ["BÁNH BAO ĐẬU ĐỎ 40G", 6.464],
	"ECHC000000ECH03.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM PTO 25G (ECH-S11A.20)", 10.99],
	"ECHC000000ECH04.00": ["CHẢ GIÒ BÁNH TRÁNG ỐNG \n TRÚC 8G (ECH-S12.20 ko dau hào)", 8.945],
	"ECHC000000ECH04.AA": ["CHẢ GIÒ BÁNH TRÁNG ỐNG TRÚC 400G/PA", 8.945],
	"ECHC000000ECH04.AB": ["CHẢ GIÒ BÁNH TRÁNG ỐNG TRÚC 400G/PA", 8.945],
	"ECHC000000ECH08.0A": ["CHẢ GIÒ RẾ KHOAI MỠ 25G", 10.81],
	"ECHC000000ECH11.00": ["CHUỐI CHIÊN 100G", 7.262],
	"ECHC00000ECH04A.0A": ["CHẢ GIÒ BÁNH TRÁNG ỐNG TRÚC 8G, 1KG/PA", 10.973],
	"ECHD000000ECH06.0A": ["BÁNH BAO KHOAI MÔN 40G. CT UWL,ĐH TRÒN MẶT", 10.44],
	"ECHD000000ECH07.00": ["BÁNH BAO SẦU RIÊNG 40G (HÌNH TRÁI ĐÀO, VỎ VÀNG)", 7.072],
	"ECHD000000ECH07.0A": ["BÁNH BAO SẦU RIÊNG 40G (HÌNH TRÁI ĐÀO, VỎ VÀNG)", 7.057],
	"ECHH000000ECH01.00": ["HÁ CẢO TÔM 25G", 10.66],
	"ECHH000000ECH01.AA": ["HÁ CẢO TÔM 25G, 2KG/PA", 10.634],
	"ECHH000000ECH01.BB": ["HÁ CẢO TÔM 25G, 2KG/PA", 10.634],
	"ECHH000000ECH01.BC": ["HÁ CẢO TÔM 25G, 2KG/PA", 10.634],
	"ECHH00000ECH01A.00": ["HÁ CẢO TÔM 25G, 500G/PA", 11.536],
	"ECHH00000ECH01A.AA": ["HÁ CẢO TÔM 25G, 500G/PA", 11.536],
	"ECHH00000ECH01A.AB": ["HÁ CẢO TÔM 25G, 500G/PA", 11.536],
	"ECHR00000V01139.00": ["BÁNH CUỐN TÔM 45G VÀ SOY SAUCE 60G/SACHET", 6.878],
	"ECHS000000ECH02.00": ["XÍU MẠI TÔM 25G (ECH-S010B.20)", 10.66],
	"ECHS000000ECH02.0A": ["XÍU MẠI TÔM 25G, 2KG/PA", 10.622],
	"ECHS000000ECH02.AC": ["XÍU MẠI TÔM 25G, 2KG/PA", 10.622],
	"ECHS000000ECH02.AD": ["XÍU MẠI TÔM 25G, 2KG/PA", 10.622],
	"ECHS000000ECH13.00": ["BÁNH MÌ VIỆT NAM 80G", 4.271],
	"ECHS000000ECH13.AA": ["BÁNH MÌ VIỆT NAM 80G", 4.271],
	"ECHS000000ECH13.AB": ["BÁNH MÌ VIỆT NAM 80G", 4.271],
	"ECHS000000ECH16.00": ["SỦI CẢO TÔM 25G", 11.628],
	"ECHS00000ECH02A.00": ["XÍU MẠI TÔM 25G, 500G/PA", 11.4],
	"ECHS00000ECH02A.AA": ["XÍU MẠI TÔM 25G, 500G/PA", 11.4],
	"ECHT000000ECH12.00": ["BÁNH PIE KHOAI MÔN 85G", 7.368],
	"ECHT000000ECH14.00": ["BÁNH NẾP LÁ SEN 80G", 6.29],
	"ECI1S0000ECI101.AA": ["SỦI CẢO TÔM HẸ 20G", 9.64],
	"ECI1S0000ECI101.AB": ["SỦI CẢO TÔM HẸ 20G", 9.64],
	"ECIC000000ECI05.00": ["CHẢ GIÒ BỘT MÌ CHAY 25G", 10.672],
	"ECIC000000ECI05.0A": ["CHẢ GIÒ BỘT MÌ CHAY 25G", 10.672],
	"ECIC000000ECI05.0B": ["CHẢ GIÒ BỘT MÌ CHAY 25G", 10.672],
	"ECIC000000ECI05.0C": ["CHẢ GIÒ BỘT MÌ CHAY 25G (CODE 931)", 10.672],
	"ECIC000000ECI05.0D": ["CHẢ GIÒ BỘT MÌ CHAY 25G (PHUN DL719)", 10.672],
	"ECIH000000ECI03.BB": ["HÁ CẢO TÔM HOÀNG GIA 25G", 11.54],
	"ECIH000000ECI03.BC": ["HÁ CẢO TÔM HOÀNG GIA 25G", 11.54],
	"ECIH000000ECI03.BD": ["HÁ CẢO TÔM HOÀNG GIA 25G", 11.54],
	"ECIH000000ECI03.BE": ["HÁ CẢO TÔM HOÀNG GIA 25G (CODE 931)", 11.54],
	"ECIH000000ECI03.BF": ["HÁ CẢO TÔM HOÀNG GIA 25G (PHUN DL719 + LÔ TÔM)", 11.54],
	"ECIS000000ECI01.BC": ["SỦI CẢO TÔM HẸ 20G", 9.618],
	"ECIS000000ECI01.BD": ["SỦI CẢO TÔM HẸ 20G", 9.618],
	"ECIS000000ECI01.BE": ["SỦI CẢO TÔM HẸ 20G", 9.618],
	"ECIS000000ECI01.BF": ["SỦI CẢO TÔM HẸ 20G (CODE 931)", 9.618],
	"ECIS000000ECI01.BG": ["SỦI CẢO TÔM HẸ 20G (PHUN DL719+LÔ TÔM TRÊN BAO BÌ)", 9.618],
	"ECIS000000ECI02.BC": ["SỦI CẢO TÔM GỪNG 30G", 10.082],
	"ECIS000000ECI02.BD": ["SỦI CẢO TÔM GỪNG 30G", 10.082],
	"ECIS000000ECI02.BE": ["SỦI CẢO TÔM GỪNG 30G (CODE 931)", 10.082],
	"ECIS000000ECI02.BF": ["SỦI CẢO TÔM GỪNG 30G (PHUN DL719 + LÔ TÔM)", 10.082],
	"ECIS000000ECI04.AA": ["BÁNH CUỐN TÔM QUE 20G", 9.592],
	"ECIS000000ECI04.AB": ["BÁNH CUỐN TÔM QUE 20G", 9.6],
	"ECIS000000ECI04.AD": ["BÁNH CUỐN TÔM QUE 20G (CODE 931)", 9.6],
	"ECIS000000ECI04.AE": ["BÁNH CUỐN TÔM QUE 20G (PHUN DL719)", 9.6],
	"ECIS000000ECI06.AA": ["SỦI CẢO TÔM ÁP CHẢO 20G", 6.65],
	"ECIS000000ECI06.AB": ["SỦI CẢO TÔM ÁP CHẢO 20G", 6.65],
	"ECIS000000ECI07.00": ["SỦI CẢO TÔM HẸ 20G", 9.618],
	"ECIS000000ECI07.0A": ["SỦI CẢO TÔM HẸ 20G (CODE 931)", 9.618],
	"ECMG0000000KS02.00": ["SỦI CẢO CHAY MÀU XANH ÁP CHẢO 25G, GF, VE, NG", 11.89],
	"ECMG0000000KS02.0A": ["SỦI CẢO CHAY MÀU XANH ÁP CHẢO 25G, GF, VE, NG", 11.89],
	"ECMH0000000KS01.0B": ["HÁ CẢO TÔM 22G", 11.645],
	"ECMH0000000KS01.0C": ["HÁ CẢO TÔM 22G (code 931)", 11.645],
	"ECNH000000ECN01.00": ["HÁ CẢO TÔM HOÀNG GIA 22G", 11.64],
	"ECNH000000ECN01.0A": ["HÁ CẢO TÔM HOÀNG GIA 22G (CODE 931)", 11.64],
	"ECNG000000ECN02.00": ["SỦI CẢO TÔM HẸ 20G (CODE 931)", 9.707],
	"ECOB00000007468.0C": ["BÁNH BAO SANDWICH 40G", 5.087],
	"ECOB00000007468.0B": ["BÁNH BAO SANDWICH 40G", 5.087],
	"ECOB00000007468.0A": ["BÁNH BAO SANDWICH 40G", 5.112],
	"ECOB00000007619.0A": ["BÁNH BAO SANDWICH 40G", 3.412],
	"ECOB00000007761.00": ["BÁNH BAO SANDWICH ÐEN 40G", 3.436],
	"ECOB00000007854.00": ["BÁNH BAO SANDWICH ÐEN 40G", 5.144],
	"ECOB00000007903.0A": ["BÁNH BAO SANDWICH 40G", 3.44],
	"ECOB00000007903.00": ["BÁNH BAO SANDWICH 40G", 3.44],
	"ECOK00000007414.AB": ["BÁNH RAU CỦ CHIÊN TÔM 30G", 4.472],
	"EDCK000000EDC02.00": ["PASTRY CUỘN TÔM CHIÊN 25G", 4.885],
	"EDCW000000EDC01.00": ["TÚI MAY MẮN TÔM CHIÊN 20G", 6.28],
	"EDFD0000KFDS08C.00": ["BÁNH CUỐN TÔM VÀ SAUCE 540G/PA, KB", 9.696],
	"EDFH0000KFDS06C.00": ["HÁ CẢO TÔM 25G", 11.643],
	"EDFH0000KFDS07C.00": ["HÁ CẢO TÔM 22G", 9.962],
	"EDFS0000KFDS09C.00": ["XÍU MẠI TÔM 25G, KB", 11.445],
	"EEF000000007578.0A": ["CHẢ GIÒ BỘT MỲ TÔM FILO 18G", 6.96],
	"EEF000000007578.0B": ["CHẢ GIÒ BỘT MỲ TÔM FILO 18G", 6.96],
	"EEFC00000007583.0A": ["CHẢ GIÒ BỘT MÌ TÔM 30G", 6.926],
	"EEFC0000EEF7546.00": ["CHẢ GIÒ BỘT MÌ QUE CHAY CHIÊN VÀ SỐT ỚT", 3.39],
	"EEFC0000EEF7546.0A": ["CHẢ GIÒ BỘT MÌ QUE CHAY CHIÊN VÀ SỐT ỚT", 3.39],
	"EEFC0000EEF7546.0B": ["CHẢ GIÒ BỘT MÌ QUE CHAY CHIÊN VÀ SỐT ỚT 225G, VE", 3.39],
	"EEFC0000EEF7549.00": ["CHẢ GIÒ TÔM CHIÊN VÀ SỐT ỚT 225G", 3.432],
	"EEFC0000EEF7549.0B": ["CHẢ GIÒ TÔM CHIÊN VÀ SỐT ỚT 225G", 3.39],
	"EEFG0000EEF7545.00": ["SỦI CẢO CHAY 20G", 3.06],
	"EEFG0000EEF7545.0C": ["SỦI CẢO CHAY 20G", 3.06],
	"EEFG0000EEF7547.0A": ["SỦI CẢO TÔM 20G", 3.054],
	"EEFM0000EEF7542.00": ["BỘ TÔM CHIÊN 2 MÓN 240G \n 1. SAMOSA TÔM CHIÊN 15G X 8PCS \n 2", 3.809],
	"EEFM0000EEF7544.00": ["TÔM CHIÊN BỘ 2 MÓN 20G\n - TÔM BƯỚM 20G\n - FILO TÔM 20G\n - SỐ", 4.046],
	"EEFM000EEF7542A.0A": ["BỘ TÔM CHIÊN 2 MÓN 240G \n 1. SAMOSA TÔM CHIÊN 15G X 8PCS \n 2", 3.809],
	"EEFM000EEF7542A.0C": ["BỘ TÔM CHIÊN 2 MÓN 240G \n 1. SAMOSA TÔM CHIÊN 15G X 8PCS \n 2", 3.809],
	"EEFM000EEF7542A.0D": ["BỘ TÔM CHIÊN 2 MÓN 240G\n1. SAMOSA TÔM CHIÊN 15G X 8PCS \n2. T", 3.809],
	"EFF000000EFF03A.AD": ["HÁ CẢO TÔM HOÀNG GIA 25G", 5.501],
	"EEXB00000EEX080.CD": ["BÁNH TIỂU LONG 30G", 7.34],
	"EEXB00000EEX080.CE": ["BÁNH TIỂU LONG 30G", 7.34],
	"SFFP00000SFF03A.00": ["ĐẾ BÁNH PIZZA NƯỚNG 250G, 12 INCHES, HA", 8.946],
	"SFFP00000SFF02A.00": ["ĐẾ BÁNH PIZZA NƯỚNG 210G, 10 INCHES, HA", 7.388],
	"EEXB00000EEX378.0A": ["BÁNH BAO SANDWICH 60G", 8.188],
	"EEXB0000EEX1115.0B": ["BÁNH HẸ 80G", 7.22],
	"EEXC00000EEX084.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM PTO 20G", 11.288],
	"EEXC00000EEX353.0A": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G", 11.518],
	"EEXC00000EEX353.0B": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G", 11.545],
	"EEXC00000EEX354.0A": ["CHẢ GIÒ BÁNH TRÁNG TÔM CÁ 16.6G", 11.714],
	"EEXC00000EEX354.0C": ["CHẢ GIÒ HẢI SẢN 16.6G", 11.714],
	"EEXC00000EEX354.0D": ["CHẢ GIÒ HẢI SẢN 16.6G", 11.714],
	"EEXC00000EEX995.CF": ["CHẢ GIÒ RẾ CHAY 20.8G", 11.42],
	"EEXC00000EEX996.EH": ["CHẢ GIÒ RẾ HẢI SẢN 20.8G", 11.42],
	"EEXC00000EEX995.CE": ["CHẢ GIÒ RẾ CHAY 20.8G", 11.42],
	"EEXC00000EEX996.EG": ["CHẢ GIÒ RẾ HẢI SẢN 20.8G", 11.42],
	"EEXC0000EEX1075.0A": ["CHẢ GIÒ BÁNH TRÁNG CHAY 25G", 11.504],
	"EEXC0000EEX1075.0C": ["CHẢ GIÒ BÁNH TRÁNG CHAY 25G", 11.504],
	"EEXC0000EEX1075.0D": ["CHẢ GIÒ BÁNH TRÁNG CHAY 25G", 11.59],
	"EEXC0000EEX1075.0E": ["CHẢ GIÒ BÁNH TRÁNG CHAY 25G", 11.59],
	"EEXH00000EEX331.0A": ["HÁ CẢO TÔM 25G", 13.25],
	"EEXH00000EEX331.0B": ["HÁ CẢO TÔM 25G", 13.325],
	"EEXH0000EEX1173.0A": ["HÁ CẢO TÔM 25G", 10.995],
	"EEXH0000EEX1173.0B": ["HÁ CẢO TÔM 25G", 10.985],
	"EEXH00000EEX114.00": ["HÁ CẢO TÔM 25G (PHUN DL719)", 11.523],
	"EEXH0000EEX1212.AB": ["HÁ CẢO CHAY 25G", 7.29],
	"EEXH0000EEX1212.AC": ["HÁ CẢO CHAY 25G", 7.29],
	"EEXK00000EEX218.0A": ["BÁNH NẾP LÁ SEN 200G", 6.788],
	"EEXK00000EEX218.0B": ["BÁNH NẾP LÁ SEN 200G", 6.788],
	"EEXK00000EEX218.0C": ["BÁNH NẾP LÁ SEN 200G", 6.788],
	"EEXK00000EEX376.00": ["KIMCHI 500G", 13.059],
	"EEXK0000EEX1065.0B": ["MIẾN XÀO GHẸ 250G", 6.807],
	"EEXK0000EEX1116.0C": ["BÁNH CỦ CẢI 100G", 6.67],
	"EEXK0000EEX1116.0D": ["BÁNH CỦ CẢI 100G", 6.67],
	"EEXS00000EEX175.00": ["SỦI CẢO TÔM ÁP CHẢO 25G", 6.808],
	"EEXS00000EEX175.0B": ["SỦI CẢO TÔM ÁP CHẢO 25G", 6.808],
	"EEXS00000EEX175.0C": ["SỦI CẢO TÔM ÁP CHẢO 25G", 6.808],
	"EEXS00000EEX175.0D": ["SỦI CẢO TÔM ÁP CHẢO 25G", 6.808],
	"EEXS00000EEX176.00": ["SỦI CẢO CHAY ÁP CHẢO 25G", 6.808],
	"EEXS00000EEX176.0B": ["SỦI CẢO CHAY ÁP CHẢO 25G", 6.808],
	"EEXW00000EEX498.0C": ["HOÀNH THÁNH TÔM 13.33G", 7.6],
	"EEXW00000EEX498.0D": ["HOÀNH THÁNH TÔM 13.33G", 7.6],
	"EEXX00000EEX355.00": ["XÍU MẠI TÔM 25G (CODE: EEX-S01.24)", 10.81],
	"EEXX00000EEX357.00": ["XÍU MẠI TÔM 25G", 10.995],
	"EFD1C0000EFD104.AA": ["CHẢ GIÒ RẾ TÔM 20G", 11.415],
	"EFD1H0000EFD103.00": ["HÁ CẢO TÔM 25G", 11.19],
	"EFD1H0000EFD103.0A": ["HÁ CẢO TÔM 25G", 11.19],
	"EFD1S0000EFD101.00": ["SỦI CẢO TÔM 20G", 9.664],
	"EFD1S0000EFD101.0A": ["SỦI CẢO TÔM 20G (CODE 0A DÁN STICKER PHỤ TRÊN BAO)", 9.576],
	"EFDC000000EFD11.AA": ["CHẢ GIÒ RẾ HẢI SẢN 20G", 11.41],
	"EFDH000000EFD10.00": ["HÁ CẢO TÔM 25G", 10.87],
	"EFDH000000EFD10.0A": ["HÁ CẢO TÔM 25G", 10.81],
	"EFDH000000EFD10.0B": ["HÁ CẢO TÔM 25G", 10.81],
	"EFDH000000EFD10.0C": ["HÁ CẢO TÔM 25G", 10.774],
	"EFDS000000EFD01.BB": ["SỦI CẢO TÔM 20G", 9.62],
	"EFDS000000EFD01.BC": ["SỦI CẢO TÔM 20G", 9.62],
	"EFDS000000EFD01.BD": ["SỦI CẢO TÔM 20G\n402g - 440g", 9.58],
	"EFLC000000EFL03.00": ["CHẢ GIÒ BỘT MÌ TÔM 40G, KB", 10.4],
	"EFLG000000EFL01.A0": ["SỦI CẢO PTO ÁP CHẢO 25G. PANFRIED SHRIMP GYOZA PTO 25G", 5.905],
	"EFLG000000EFL01.AA": ["SỦI CẢO PTO ÁP CHẢO 25G. PANFRIED SHRIMP GYOZA PTO 25G", 5.905],
	"EFLG000000EFL02.AA": ["SỦI CẢO PTO 20G", 11.56],
	"EFLH000000EFL04.00": ["HÁ CẢO TÔM 20G, KB", 10.85],
	"EFLS000000EFL05.00": ["XÍU MẠI TÔM 20G, KB", 10.84],
	"EFPB00000EFP031.0A": ["BÁNH BAO SANDWICH 100G", 3.798],
	"EFPB00000EFP031.00": ["BÁNH BAO SANDWICH 100G", 3.833],
	"EFPB00000EFP036.00": ["BÁNH BAO TRÒN 70G", 3.872],
	"EFPB00000EFP038.00": ["BỘ BÁNH BAO HALLOWEEN 180G, NG", 3.17],
	"EFPB00000EFP041.0A": ["BÁNH BAO TRÒN 80G (CẮT MỘT NỬA)", 4.558],
	"EFPB00000EFP042.0A": ["BÁNH BAO SANDWICH 25G", 4.659],
	"EFPB00000EFP042.0B": ["BÁNH BAO SANDWICH 25G", 4.659],
	"EFPB00000EFP043.0B": ["BÁNH BAO SANDWICH 50G", 4.623],
	"EFPB00000EFP043.00": ["BÁNH BAO SANDWICH 50G", 4.628],
	"EFPB00000EFP043.0A": ["BÁNH BAO SANDWICH 50G", 4.628],
	"EFPB0000EFP031A.0A": ["BÁNH BAO SANDWICH 100G", 3.86],
	"EFPC00000EFP003.00": ["TÔM ÁO BỘT THẬP CẨM 15GR/PC", 1.9248],
	"EFPC00000EFP008.0A": ["CHẢ GIÒ BỘT MỲ MINI CHAY 8GR/PC", 5.46],
	"EFPC00000EFP008.0B": ["CHẢ GIÒ BÁNH TRÁNG MINI CHAY 8G", 5.46],
	"EFPC0000EFP004A.0A": ["CHẢ GIÒ CUỘN TÔM XIÊN QUE 10GR/PC", 2.072],
	"EFPC0000EFP005A.AC": ["CHẢ GIÒ BỘT MỲ CHAY 25G VÀ SỐT ỚT NGỌT 40G/GÓI", 3.411],
	"EFPC0000EFP005C.00": ["CHẢ GIÒ BỘT MỲ CHAY 25G VÀ SỐT ỚT NGỌT 40G/GÓI, NG", 3.411],
	"EFPC0000EFP005C.0A": ["CHẢ GIÒ BỘT MỲ CHAY 25G VÀ SỐT ỚT NGỌT 40G/GÓI, NG", 3.435],
	"EFPC0000EFP013A.00": ["CHẢ GIÒ BỘT MỲ CHAY 25GR/PC", 5.38],
	"EFPC0000EFP013A.0A": ["CHẢ GIÒ BỘT MỲ CHAY 25G", 5.38],
	"EFPD0000EFP016A.0B": ["BÁNH CUỐN TÔM VUÔNG HẤP 25G VÀ SỐT NƯỚC TƯƠNG 20G/GÓI", 3.642],
	"EFPH00000EFP034.00": ["BÁNH BAO TRÒN 30G", 2.748],
	"EFPH00000EFP034.0A": ["BÁNH BAO TRÒN 30G", 2.748],
	"EFPH00000EFP035.00": ["BÁNH QUẨY THỪNG 50G", .951],
	"EFPH00000EFP037.00": ["HÁ CẢO TÔM 25G VÀ SỐT NƯỚC TƯƠNG 20G/TÚI", 3.297],
	"EFPH0000EFP011B.0A": ["HÁ CẢO TÔM 25GR/PC", 5.43],
	"EFPH0000EFP011B.0B": ["HÁ CẢO TÔM 25G", 5.43],
	"EFPK00000EFP029.00": ["BẠCH TUỘC VIÊN 25G CODE 79L.19. Sauce code 411C.20", 2.5648],
	"EFPK00000EFP044.00": ["BÁNH RÁN VỚI SỐT NGỌT 65G/HỘP", 1.192],
	"EFPK00000EFP045.00": ["BÁNH SỪNG TRÂU NHÂN SỐT SÔ CÔ LA 50G", 1.041],
	"EFPK0000EFP026B.00": ["MÌ XÀO TÔM 350G", 5.064],
	"EFPK0000EFP026B.0A": ["MÌ XÀO TÔM 350G, NG", 5.064],
	"EFPR000000EFP30.00": ["MÌ RAMEN MISO NGHÊU 250G", 3.692],
	"EFPR00000EFP039.00": ["MÌ HOÀNH THÁNH HẢI SẢN 350G", 5.026],
	"EFPR00000EFP039.0A": ["MÌ HOÀNH THÁNH HẢI SẢN 350G", 5.026],
	"EFR1R00000EFR03.0B": ["BÁNH CUỐN TÔM 48G", 8.338],
	"EFR1S00000EFR04.AC": ["XÍU MẠI TÔM 25G, 500G", 11.54],
	"EFRH000000EFR01.00": ["HÁ CẢO TÔM 25G, 500G", 11.68],
	"EFRH000000EFR01.0B": ["HÁ CẢO TÔM 25G, 500G", 11.657],
	"EFRH000000EFR02.00": ["HÁ CẢO TÔM 22G, 880G", 9.9],
	"EFRH000000EFR02.0B": ["HÁ CẢO TÔM 22G, 880G", 10.7],
	"EFRR000000EFR03.00": ["BÁNH CUỐN TÔM 48G", 8.338],
	"EFRR000000EFR03.0B": ["BÁNH CUỐN TÔM 48G", 8.338],
	"EFRS000000EFR04.00": ["XÍU MẠI TÔM 25G, 500G", 11.54],
	"EFRS000000EFR04.AB": ["XÍU MẠI TÔM 25G, 500G", 11.54],
	"EFRS000000EFR04.AC": ["XÍU MẠI TÔM 25G", 11.54],
	"EFRS000000EFR04.AD": ["XÍU MẠI TÔM 25G (PHUN LÔ TÔM V1,V2 + DL719)", 11.54],
	"EFSC0000ECPFS03.0B": ["CHẢ GIÒ BỘT MÌ CHAY 25G", 6.443],
	"EFSC0000ECPFS04.0A": ["SỦI CẢO CHAY 20G", 6.5],
	"EFSC0000ECPFS04.0B": ["SỦI CẢO CHAY 20G", 6.5],
	"EFSD0000EFSFS05.00": ["BÁNH BAO SANDWICH 30G", 6.847],
	"EFSD0000EFSFS07.00": ["BÁNH BAO SANDWICH 36G", 6.852],
	"EFSD0000EFSFS08.00": ["BÁNH BAO SANDWICH 45G, VE", 6.715],
	"EFSG00EFSITSU01.AA": ["SỦI CẢO TÔM 15G", 1.615],
	"EGEB000000EGE01.00": ["BÁNH BAO SANDWICH 48G", 8.762],
	"EGL1C000DUP0085.00": ["TÔM FILO 12G", 4.073],
	"EGL1C000DUP0085.0A": ["TÔM FILO 12G", 4.073],
	"EGLC0000DUP0085.00": ["TÔM FILO 12G,120G/BOX", 4.073],
	"EGLC0000DUP0085.AA": ["TÔM FILO 12G", 4.073],
	EGLC0000WOR0048: ["BỘ MIX TÔM XÙ CHIÊN: 1. TÔM XÙ DỪA ỚT 17G CODE: OG - 8302007", 13.424],
	"EGLK0000DEL0005.A0": ["TÔM XÙ PANKO 15G, 230G/TRAY/BOX", 2.55],
	"EGLP0000WOR0051.0A": ["BÁNH PIZZA OVAL 210G. CODE: 1296D.17", 9.413],
	"EGLP0000WOR0059.00": ["ĐẾ BÁNH PIZZA NƯỚNG 240G", 9.843],
	"EGZH000000EGZ01.00": ["HÁ CẢO TÔM 25G", 11.142],
	"EGZH000000EGZ01.AA": ["HÁ CẢO TÔM 25G", 11.14],
	"EGZH000000EGZ03.00": ["HÁ CẢO TÔM HÌNH HOA HỒNG 25G", 11.371],
	"EGZH000000EGZ03.0A": ["HÁ CẢO TÔM HÌNH HOA HỒNG 25G", 11.39],
	"EGZH00000EGZ01A.0A": ["HÁ CẢO TÔM 25G", 11.14],
	"EGZH00000EGZ01A.0B": ["HÁ CẢO TÔM 25G", 11.14],
	"EGZH00000EGZ01A.0C": ["HÁ CẢO TÔM 25G, LOGO HA (PHUN LÔ TÔM V1,V2)", 11.14],
	"EGZH00000EGZ01B.00": ["HÁ CẢO TÔM 25G, HA (CODE 719)", 11.14],
	"EGZH00000EGZ03A.0A": ["HÁ CẢO TÔM HÌNH HOA HỒNG 25G", 11.371],
	"EGZH00000EGZ03A.0B": ["HÁ CẢO TÔM HÌNH HOA HỒNG 25G", 11.371],
	"EGZH00000EGZ03A.0C": ["HÁ CẢO TÔM HÌNH HOA HỒNG 25G, LOGO HA", 11.371],
	"EGZH00000EGZ03A.0D": ["HÁ CẢO TÔM HÌNH HOA HỒNG 25G, LOGO HA (PHUN LÔ TÔM)", 11.389],
	"EGZH00000EGZ03B.00": ["HÁ CẢO TÔM HÌNH HOA HỒNG 25G, HA (CODE 719)", 11.389],
	"EGZH00000EGZ04A.0A": ["HÁ CẢO TÔM ĐẶC BIỆT 30G", 10.74],
	"EGZH00000EGZ04A.0B": ["HÁ CẢO TÔM ĐẶC BIỆT 30G", 10.74],
	"EGZH00000EGZ04A.0C": ["HÁ CẢO TÔM ĐẶC BIỆT 30G, LOGO HA (PHUN LÔ TÔM V1,V2)", 10.74],
	"EGZH00000EGZ04B.00": ["HÁ CẢO TÔM ĐẶC BIỆT 30G, HA (CODE 719)", 10.74],
	"EGZH000000EGZ05.00": ["HÁ CẢO TÔM ĐẶC BIỆT 36G, LOGO HA", 12.788],
	"EGZX000000EGZ02.00": ["XÍU MẠI MỰC 25G", 11.301],
	"EGZX00000EGZ02A.0A": ["XÍU MẠI MỰC 25G, HA", 11.33],
	"EGZX00000EGZ02A.0B": ["XÍU MẠI MỰC 25G, HA", 11.33],
	"EGZX00000EGZ02A.0C": ["XÍU MẠI MỰC 25G, LOGO HA", 11.33],
	"EGZX00000EGZ02A.0D": ["XÍU MẠI MỰC 25G, LOGO HA", 11.33],
	"EGZX00000EGZ02B.00": ["XÍU MẠI MỰC 25G, HA (BỎ LOGO HALAL, CODE 719)", 11.33],
	"EHA000000082471.00": ["BÁNH BAO SANDWICH 50G", 3.462],
	"EHA000000082472.00": ["BÁNH BAO SANDWICH 35G", 4.844],
	"EHA00000060066A.0D": ["BANH BAO SANDWICH 50G", 3.643],
	"EHA00000060066A.0E": ["BÁNH BAO SANDWICH 50G, 30PCS/PE", 3.489],
	"EHA0000EHA60630.0A": ["BANH BAO SANDWICH 50G, 10PCS/PE", 3.475],
	"EHA0000EHA60630.0C": ["BÁNH BAO SANDWICH 50G, 10PCS/PE", 3.451],
	"EHA0000EHA60630.0B": ["BÁNH BAO SANDWICH 50G, 10PCS/PE", 3.451],
	"EHA1K0000082914.00": ["TÔM VIÊN TẨM BỘT XÙ 60G", 5.18],
	"EHA10000060066A.0E": ["BÁNH BAO SANDWICH 50G, 30PCS/PE", 3.489],
	"EHA1G0000090341.00": ["SỦI CẢO PTO ÁP CHẢO 25G", 11.675],
	"EHA1G0000098213.00": ["SỦI CẢO TÔM HẸ 25G", 5.49],
	"EHA1G0000098213.0A": ["SỦI CẢO TÔM HẸ 25G (PHUN LÔ TÔM)", 5.49],
	"EHA1H0000082451.0B": ["HÁ CẢO TÔM 20G", 7.11],
	"EHA1S0000084373.0B": ["XÍU MẠI TÔM 20G", 5.662],
	"EHAC00000036163.00": ["CHẢ GIÒ RẾ KHOAI MỠ 25G", 11.635],
	"EHAD00000082452.00": ["TÚI MAY MẮN HẢI SẢN 20G", 5.89],
	"EHAD00000082452.0A": ["TÚI MAY MẮN HẢI SẢN 20G", 5.89],
	"EHAD00000082452.0B": ["TÚI MAY MẮN HẢI SẢN 20G", 5.89],
	"EHAD00000082452.0C": ["TÚI MAY MẮN HẢI SẢN 20G (PHUN LÔ TÔM TRÊN BAO BÌ)", 5.89],
	"EHAG00000094170.00": ["SỦI CẢO PTO ÁP CHẢO 25G", 11.7],
	"EHAG00000094170.0A": ["SỦI CẢO PTO ÁP CHẢO 25G", 11.7],
	"EHAG00000094170.0B": ["SỦI CẢO PTO ÁP CHẢO 25G", 11.7],
	"EHAG00000094170.0C": ["SỦI CẢO PTO ÁP CHẢO 25G", 11.7],
	"EHAG0000094170A.00": ["SỦI CẢO PTO ÁP CHẢO 25G", 11.7],
	"EHAG00000098213.00": ["SỦI CẢO TÔM HẸ 25G", 5.49],
	"EHAG00000098213.0A": ["SỦI CẢO TÔM HẸ 25G", 5.52],
	"EHAG0000090341A.0B": ["SỦI CẢO PTO ÁP CHẢO 25G", 11.675],
	"EHAG0000090341A.0C": ["SỦI CẢO PTO ÁP CHẢO 25G", 11.675],
	"EHAH00000082451.0B": ["HÁ CẢO TÔM 20G", 7.022],
	"EHAH00000082451.0C": ["HÁ CẢO TÔM 20G", 7.022],
	"EHAH00000082451.0D": ["HÁ CẢO TÔM 20G", 7.022],
	"EHAS00000036774.00": ["XÍU MẠI TÔM 15G", 3.93],
	"EHAS00000036774.AA": ["XÍU MẠI TÔM 15G, NG", 3.93],
	"EHAS00000036999.00": ["XÍU MẠI TÔM 20G", 5.629],
	"EHAH00000082280.00": ["HÁ CẢO TÔM 20G", 6.996],
	"EHAH00000082280.0A": ["HÁ CẢO TÔM 20G", 6.996],
	"EHAS00000082281.00": ["XÍU MẠI TÔM 20G", 5.626],
	"EHAS00000082281.0A": ["XÍU MẠI TÔM 20G", 5.626],
	"EHAS00000084373.00": ["XÍU MẠI TÔM 20G", 5.662],
	"EHAS00000084373.0A": ["XÍU MẠI TÔM 20G", 5.662],
	"EHAS00000084373.0B": ["XÍU MẠI TÔM 20G", 5.662],
	"EHAS00000084373.0C": ["XÍU MẠI TÔM 20G (ĐỔI TÊN KHOA HỌC CỦA TÔM) + PHUN LÔ TÔM V1,", 5.662],
	"EHM0000FS040-05.00": ["BÁNH NGHÊU RAU CỦ 60G", 5.24],
	"EHM0000FS037-05.00": ["RAU CỦ TẨM BỘT 60G", 5.4],
	"EHM0000FS037-05.0A": ["RAU CỦ TẨM BỘT 60G", 5.4],
	"EHM0000FS038-05.00": ["KHOAI LANG TẨM BỘT 60G", 5.45],
	"EHM0000FS038-05.0A": ["Khoai lang tẩm bột 60g", 5.45],
	"EHM0000FS038-05.AA": ["Khoai lang tẩm bột 60g", 5.45],
	"EHM0000FS038-05.AB": ["KHOAI LANG TẨM BỘT 60G", 5.45],
	"EHM0000FS038-05.AC": ["KHOAI LANG TẨM BỘT 60G", 5.45],
	"EHM0000FS038-05.AD": ["KHOAI LANG TẨM BỘT 60G", 5.45],
	"EHM0000FS087-05.00": ["TÔM VIÊN 40G", 4.59],
	"EHM0000FS087-05.0A": ["TÔM VIÊN 40G", 4.59],
	"EHM0000FS087-05.0C": ["TÔM VIÊN 40G", 4.59],
	"EHM0000FS087-05.0B": ["TÔM VIÊN 40G", 4.59],
	"EHM0000FS091-05.00": ["RAU CỦ TẨM BỘT VỊ CÀ RI 35G (CODE 121A.22)", 6.064],
	"EHM0000FS091-05.0E": ["RAU CỦ TẨM BỘT VỊ CÀ RI 35G", 6.052],
	"EHM0000FS091-05.0D": ["RAU CỦ TẨM BỘT VỊ CÀ RI 35G", 6.052],
	"EHMR0000000HM08.0A": ["KAKIAGE RAU CỦ 60G", 9.574],
	"EHMR0000000HM08.0B": ["KAKIAGE RAU CỦ 60G", 9.626],
	"EHOK000000EHO02.00": ["BÁNH CÀ RI RAU CỦ CHAY 130G", 8.577],
	"EHOK000000EHO02.AA": ["BÁNH CÀ RI RAU CỦ CHAY 130G, VE, NG", 8.577],
	"EHOK000000EHO02.AB": ["BÁNH CÀ RI RAU CỦ CHAY 130G, VE, NG", 8.577],
	"EHOK000000EHO03.A0": ["BÁNH CÀ RI RAU CỦ CHAY 130G,VE, NG", 8.67],
	"EHOK000000EHO03.AA": ["BÁNH CÀ RI RAU CỦ CHAY 130G,VE, NG", 8.6],
	"EHOK000000EHO04.AA": ["BÁNH CÀ RI RAU CỦ CHAY 130G, VE, NG", 8.67],
	"EHOK000000EHO04.AB": ["BÁNH CÀ RI RAU CỦ CHAY 130G, VE, NG", 8.655],
	"EHOK000000EHO04.AC": ["BÁNH CÀ RI RAU CỦ CHAY 130G, VE, NG", 8.655],
	"EHOK00000EHO01A.00": ["BÁNH CÀ RI RAU CỦ CHAY 130G", 8.577],
	"EHOK00000EHO01A.AA": ["BÁNH CÀ RI RAU CỦ CHAY 130G", 8.63],
	"EHU0000000EHU03.00": ["BÁNH CUỐN TÔM 48G & SOY SAUCE 60G", 8.176],
	"EHUD000000EHU06.00": ["HOÀNH THÁNH TÔM 20G", 12.74],
	"EHUH000000EHU05.00": ["HÁ CẢO PTO 20G", 9.85],
	"EHUS000000EHU02.00": ["XÍU MẠI TÔM 30G", 10.75],
	"EKGC00000001624.AA": ["CHẢ GIÒ BỘT MÌ TÔM 25G, NG", 11.559],
	"EKGC00000001624.BB": ["CHẢ GIÒ BỘT MÌ TÔM 25G, NG", 11.559],
	"EKGC00000001624.BC": ["CHẢ GIÒ BỘT MÌ TÔM 25G, NG", 11.559],
	"EKGC00000001624.BD": ["CHẢ GIÒ BỘT MÌ TÔM 25G, NG (CODE 931)", 11.559],
	"EKGC00000001624.BF": ["CHẢ GIÒ BỘT MÌ TÔM 25G, NG (PHUN LÔ TÔM V1,V2 VÀ DL719)", 11.559],
	"EKGC00000001646.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G, NG", 11.656],
	"EKGH00000004912.BA": ["SỦI CẢO HẢI SẢN ÁP CHẢO 25G, NG, GF", 11.953],
	"EKGH00000004912.BB": ["SỦI CẢO HẢI SẢN ÁP CHẢO 25G, NG, GF", 11.953],
	"EFR1H00000EFR01.0B": ["HÁ CẢO TÔM 25G, 500G", 11.58],
	"EFR1H00000EFR01.0C": ["HÁ CẢO TÔM 25G, 500G (PHUN LÔ TÔM + DL719)", 11.58],
	"EFRH000000EFR01.0C": ["HÁ CẢO TÔM 25G, 500G (PHUN LÔ TÔM + DL719)", 11.58],
	"EFR1H00000EFR02.0B": ["HÁ CẢO TÔM 22G, 880G", 9.9],
	"EFR1H00000EFR02.0C": ["HÁ CẢO TÔM 22G, 880G (PHUN LÔ TÔM+DL719)", 9.9],
	"EFRH000000EFR02.0C": ["HÁ CẢO TÔM 22G, 880G (PHUN LÔ TÔM+DL719)", 9.9],
	"EKGH00000004912.BD": ["SỦI CẢO HẢI SẢN ÁP CHẢO 25G, NG, GF", 11.953],
	"EKGH00000004912.BC": ["SỦI CẢO HẢI SẢN ÁP CHẢO 25G, NG, GF", 11.953],
	"EFR1S00000EFR04.AB": ["XÍU MẠI TÔM 25G, 500G", 11.54],
	"EKGH00000004915.BA": ["HÁ CẢO TÔM 25G, NG, GF", 11.69],
	"EKGH00000004915.BB": ["HÁ CẢO TÔM 25G, NG, GF", 11.69],
	"EKGH00000004915.BD": ["HÁ CẢO TÔM 25G, NG, GF", 11.69],
	"EKGH00000004915.BC": ["HÁ CẢO TÔM 25G, NG, GF", 11.69],
	"EKGS00000004910.BA": ["SỦI CẢO CHAY ÁP CHẢO 25G (VỎ XANH), NG, VE", 11.953],
	"EKGS00000004910.BC": ["SỦI CẢO CHAY ÁP CHẢO 25G, NG, VE", 11.953],
	"EKGS00000004910.BB": ["SỦI CẢO CHAY ÁP CHẢO 25G, NG, VE", 11.953],
	"EKGS00000004911.AA": ["XÍU MẠI TÔM 25G - NON GMO", 11.731],
	"EKGS00000004911.BA": ["XÍU MẠI TÔM 25G, NG", 11.731],
	"EKGS00000004911.BB": ["XÍU MẠI TÔM 25G - NON GMO", 11.731],
	"EKGS00000004911.BC": ["XÍU MẠI TÔM 25G, NG", 11.731],
	"EKGS00000004911.BD": ["XÍU MẠI TÔM 25G, NG", 11.731],
	"EKGS00000004911.BE": ["XÍU MẠI TÔM 25G, NG (CODE 931)", 11.731],
	"EKGS00000004911.BF": ["XÍU MẠI TÔM 25G, NG (PHUN DL719)", 11.731],
	"EKGS00000094913.00": ["NƯỚC SỐT DIMSUM 20G", 3.483],
	"EKSD000000EKS05.00": ["BỘ DIMSUM HẤP, LOGO ASC, FSC \n\"PHUN LÔ TÔM\"", 4.399],
	"EKSD00003388212.00": ["BỘ DIMSUM HẤP, LOGO ASC, FSC \n\"PHUN LÔ TÔM\"", 4.399],
	"ELFCG00000ELF03.00": ["CHẢ GIÒ BỘT MỲ CHAY KHÔNG CHIÊN 25G - CODE : 630A.14", 9.311],
	"ELFCG00000ELF05.00": ["CHẢ GIÒ BỘT MỲ CHAY KHÔNG CHIÊN 50G", 11.383],
	"ELFS000000ELF04.00": ["SAMOSA CURRY CHAY 30G - CODE : 488.14", 8.234],
	"ELIB00000199392.00": ["BÁNH BAO MÍT NON 40G, VE", 4.242],
	"ELIB00000199392.0A": ["BÁNH BAO MÍT NON 40G, VE", 4.242],
	"ELIB00000199392.0C": ["BÁNH BAO MÍT NON 40G, VE", 4.242],
	"ELIB00000199392.0D": ["BÁNH BAO MÍT NON 40G, VE", 4.242],
	"ELIB00000199392.0E": ["BÁNH BAO MÍT NON 40G, VE", 4.242],
	"ELIC00000201618.00": ["CHẢ GIÒ BỘT MÌ EDAMAME 25G VÀ SỐT ỚT 25G/GÓI, VE\n 1. CHẢ GIÒ", 3.888],
	"ELIC00000201618.0A": ["CHẢ GIÒ BỘT MÌ EDAMAME 25G VÀ SỐT ỚT 25G/GÓI, VE\n 1. CHẢ GIÒ", 3.888],
	"ELIC00000201618.0B": ["CHẢ GIÒ BỘT MÌ EDAMAME 25G VÀ SỐT ỚT 25G/GÓI, VE\n 1. CHẢ GIÒ", 3.888],
	"ELIC00000201618.0C": ["CHẢ GIÒ BỘT MÌ EDAMAME 25G VÀ SỐT ỚT 25G/GÓI, VE\n 1. CHẢ GIÒ", 3.888],
	"ELIC0000201618C.00": ["CHẢ GIÒ BỘT MÌ EDAMAME 25G VÀ SỐT ỚT 25G/GÓI, VE\n 1. CHẢ GIÒ", 3.888],
	"ELIC0000201618D.00": ["CHẢ GIÒ BỘT MÌ EDAMAME 25G VÀ SỐT ỚT 25G/GÓI, VE\n 1. CHẢ GIÒ", 3.888],
	"ELIC0000201618E.00": ["CHẢ GIÒ BỘT MÌ EDAMAME 25G VÀ SỐT ỚT 25G/GÓI, VE\n 1. CHẢ GIÒ", 3.888],
	"ELIC0000201618F.00": ["CHẢ GIÒ BỘT MÌ EDAMAME 25G VÀ SỐT ỚT 25G/GÓI, VE\n 1. CHẢ GIÒ", 3.888],
	"ELIC0000201618A.00": ["CHẢ GIÒ BỘT MÌ EDAMAME 25G VÀ SỐT ỚT 25G/GÓI, VE\n 1. CHẢ GIÒ", 3.888],
	"ELIC0000201618H.00": ["CHẢ GIÒ BỘT MÌ EDAMAME 25G VÀ SỐT ỚT 25G/GÓI, VE\n 1. CHẢ GIÒ", 3.888],
	"ELIK00001000130.00": ["BÁNH BURRITOS CHAY 20G", 6.085],
	"ELUH000000ELU01.00": ["HÁ CẢO TÔM 25G (CODE ELU-S02.25)", 13.183],
	"ELUH000000ELU01.0A": ["HÁ CẢO TÔM 25G (DL 719)", 13.183],
	"ELUH000000ELU02.0A": ["HÁ CẢO TÔM HÌNH HOA HỒNG 25G (DL719)", 5.455],
	"EHHH000000EHH01.00": ["HÁ CẢO TÔM 30G (CODE EHH-S01.25)", 10.814],
	"EHHH00VRCGN3038.00": ["HÁ CẢO TÔM 30G (COPY EHH01)", 10.802],
	"EHHH00VRCGN2226.00": ["HÁ CẢO TÔM 22G", 11.645],
	"EHHX00000SSGN25.00": ["XÍU MẠI MỰC 25G", 11.097],
	"EHHHVRCROSEGN25.00": ["HÁ CẢO TÔM HÌNH HOA HỒNG 25G", 10.703],
	"ELM2B00000ASD22.00": ["BÁNH BAO NHÂN NẤM, HÌNH CHIM CÁNH CỤT 35G,VE, NG", 8.724],
	"ELM2B00000BOO24.00": ["BÁNH BAO SANDWICH 50G, VE, NG", 7.498],
	"ELM2B00000LID23.00": ["BỘ MIX BÁNH BAO 2 LOẠI/ THÙNG, VE, NG", 6.696],
	"ELM2C00000ASD27.00": ["CHẢ GIÒ BỘT MÌ HOA NHÂN RAU CỦ 18G, VE", 3.716],
	"ELM3C0000ELM302.0A": ["CHẢ GIÒ BỘT MÌ HẢI SẢN 25G, ASC, NG (CODE ELM-S32A.24)", 11.355],
	"ELM3C0000ELM302.0B": ["CHẢ GIÒ BỘT MÌ HẢI SẢN 25G, ASC, NG (CODE ELM-S32A.24)\nSPEC:", 11.265],
	"ELM3C0000ELM303.0A": ["CHẢ GIÒ BÁNH TRÁNG RAU CỦ CHAY 30G, VE, NG (CODE ELM-S31A.24", 10.441],
	"ELM3C0000ELM303.0B": ["CHẢ GIÒ BÁNH TRÁNG RAU CỦ CHAY 30G, VE, NG (CODE ELM-S31A.24", 10.553],
	"ELMB000000ASD21.00": ["BÁNH BAO SANDWICH PHỦ MÈ ĐEN 20G", 5.96],
	"ELMB00000TES18A.00": ["BỘ MIX BÁNH BAO TÔM 256G/HỘP\n 1. BÁNH BAO TÔM VỊ KIM CHI 32G", 4.2],
	"ELMB00000TES18A.0A": ["BỘ MIX BÁNH BAO TÔM 256G/HỘP (TÔM TWA, NG)", 4.132],
	"ELMB00000TES18A.0B": ["BỘ MIX BÁNH BAO TÔM 256G/HỘP (TÔM TWA, NG)", 4.132],
	"ELMC000000TES26.00": ["CHẢ GIÒ RAU CỦ CHAY RẾ VÀNG 24G, VE", 1.211],
	"ELMC000000TES28.00": ["CHẢ GIÒ RAU CỦ CHAY RẾ VÀNG VÀ SỐT KATSU CÀ RI 222G, VE\nSPEC", 9.539],
	"ELMC0000ELMBM19.00": ["BÁNH MÌ SANDWICH TÔM MÈ 12G (TAM GIÁC)", 2.216],
	"ELMC000ELMASD15.00": ["BỘ MIX DELI CHAY CHIÊN 180G, VE", 2.893],
	"ELMC000ELMASD15.AA": ["BỘ MIX DELI CHAY CHIÊN 180G, VE", 2.881],
	"ELMC000ELMASD17.0A": ["BÁNH CUỘN RAU CỦ CHAY 20G, VE", 3.278],
	"ELMK00000ASDA08.00": ["Bộ mix bánh bao", 10.216],
	"ELMK00000ASDA14.00": ["BÁNH BAO SANDWICH 28G, NG", 5.806],
	"ELMK0000ASDA02C.B0": ["BÁNH MÌ SANDWICH TÔM MÈ (NGÔI SAO) 20G", 8.184],
	"ELMK0000ASDA02C.CA": ["BÁNH MÌ SANDWICH TÔM MÈ 20G (NGÔI SAO), TÔM BAP 4*", 8.184],
	"ELMK000ELMTES18.00": ["BỘ MIX BÁNH BAO TÔM 256G/HỘP\n 1. BÁNH BAO TÔM VỊ KIM CHI 32G", 4.204],
	"ELMS0000ELMFP25.00": ["SỦI CẢO CHAY 20G", 5.495],
	"ELMS000ELMFP25A.00": ["SỦI CẢO CHAY 20G, NG, RTE, CH", 5.495],
	"ELMC0000ELMBM29.00": ["BÁNH MÌ SANDWICH TÔM MÈ 15G (TAM GIÁC), NG\nSPEC: (122g - 144", 2.297],
	"EMBB000000EMB02.00": ["TIỂU LONG BAO 30G", 7.044],
	"EMBB000000EMB02.0A": ["TIỂU LONG BAO 30G", 7.044],
	"EMBC00000052151.0B": ["CHẢ GIÒ RẾ HẢI SẢN 20G", 5.79],
	"EMBC00000052151.0C": ["CHẢ GIÒ RẾ HẢI SẢN 20G", 5.79],
	"EMBC00000052151.0D": ["CHẢ GIÒ RẾ HẢI SẢN 20G (CODE 931)", 5.79],
	"EMBC00000052574.0B": ["XÍU MẠI TÔM 25G", 11.04],
	"EMBC00000052574.0C": ["XÍU MẠI TÔM 25G", 11.04],
	"EMBC00000052574.0D": ["XÍU MẠI TÔM 25G (CODE 931)", 11.04],
	"EMBC00000052574.0E": ["XÍU MẠI TÔM 25G (PHUN DL719)", 11.04],
	"EMBC000000EMB06.00": ["CHẢ GIÒ RẾ HẢI SẢN 20G", 5.81],
	"EMBC000000EMB06.0A": ["CHẢ GIÒ RẾ HẢI SẢN 20G", 5.81],
	"EMBC000000EMB06.0B": ["CHẢ GIÒ RẾ HẢI SẢN 20G", 5.81],
	"EMBH00000052149.0A": ["HÁ CẢO TÔM 25G", 11.19],
	"EMBH00000052149.0B": ["HÁ CẢO TÔM 25G", 11.19],
	"EMBH00000052149.0C": ["HÁ CẢO TÔM 25G (CODE 931)", 11.19],
	"EMBH00000052149.0D": ["HÁ CẢO TÔM 25G (PHUN DL719)", 11.19],
	"EMBH00000052152.00": ["HÁ CẢO TÔM HOÀNG GIA 25G", 11.68],
	"EMBH00000052152.0A": ["HÁ CẢO TÔM HOÀNG GIA 25G", 11.68],
	"EMBH00000052152.0B": ["HÁ CẢO TÔM HOÀNG GIA 25G (CODE 931)", 12.48],
	"EMBH00000052152.0C": ["HÁ CẢO TÔM HOÀNG GIA 25G (PHUN DL719)", 12.48],
	"EMBH000000EMB04.00": ["HÁ CẢO TÔM 25G", 11.19],
	"EMBH000000EMB07.00": ["HÁ CẢO TÔM HOÀNG GIA 25G", 11.68],
	"EMBH000000EMB07.0A": ["HÁ CẢO TÔM HOÀNG GIA 25G", 11.68],
	"EMBH000000EMB07.0B": ["HÁ CẢO TÔM HOÀNG GIA 25G", 11.68],
	"EMBX000000EMB05.00": ["XÍU MẠI TÔM 25G", 11.58],
	"EMBX000000EMB05.0A": ["XÍU MẠI TÔM 25G", 11.58],
	"EMPC000000EMP02.00": ["RẾ MỰC 20G", 9.708],
	"EMPC000000EMP02.0B": ["RẾ MỰC 20G", 9.708],
	"EMG00188990427B.00": ["SAMOSA TÔM VÀ TÚI MAY MẮN TÔM 15G (CHIÊN)", 6.096],
	"EMGC000000EMG01.00": ["TÔM FILO 20G", 4.714],
	"EMGC000000EMG02.00": ["CHẢ GIÒ BỘT MÌ TÔM 30G", 4.664],
	"EMGC00188990506.AB": ["CHẢ GIÒ TÔM CHIÊN 25GR.CODE : 670E.15 - THE HIEN 225G TREN B", 3.446],
	"EMGC00188990507.BB": ["CHẢ GIÒ BỘT MỲ CHAY (CHIÊN)", 3.406],
	"EMGG000000EMG03.00": ["SỦI CẢO TÔM 20G.", 2.998],
	"EMGM00188990502.BB": ["BỘ TÔM CHIÊN 3 MÓN. \n  (CHẢ GIÒ 150GR/PE . SAMOSA 150GR/PE. ", 3.585],
	"EMGM00188990509.AA": ["SAMOSA VA TÚI MAY MẮN CHIÊN 15G", 3.809],
	"EMGM00188990509.BA": ["SAMOSA VA TÚI MAY MẮN CHIÊN 15G", 3.809],
	"EMGM00188990510.AC": ["TÔM CHIÊN BỘ 2 MÓN 20G\n - TÔM BƯỚM 20G\n - FILO TÔM 20G\n - SỐ", 4.109],
	"EMJB00000003073.AA": ["BÁNH BAO SANDWICH 36G", 9.095],
	"EMJB0000EMJ2285.AB": ["BÁNH CUỐN HẢI SẢN 35G", 14.656],
	"EMJC00000002875.0D": ["CHẢ GIÒ BÁNH TRÁNG TÔM PTO 25G", 13.7],
	"EMJC00000002875.0C": ["CHẢ GIÒ BÁNH TRÁNG TÔM PTO 25G", 13.7],
	"EMJC00000002875.0A": ["CHẢ GIÒ TÔM PTO 25G", 13.7],
	"EMJC00000002877.0A": ["CHẢ GIÒ TÔM CUA 25G, 500G/PA", 13.348],
	"EMJC00000002878.AC": ["CHẢ GIÒ BÁNH TRÁNG ỐNG TRÚC 8G", 11.005],
	"EMJC00000002878.AD": ["CHẢ GIÒ BÁNH TRÁNG ỐNG TRÚC 8G", 11.005],
	"EMJC00000003163.00": ["CHẢ GIÒ BỘT MỲ CHAY 25GR/PC", 11.085],
	"EMJC00000006742.00": ["CHẢ GIÒ BÁNH TRÁNG CHAY 25G (CODE 47B.22)", 13.852],
	"EMJC00000006742.AA": ["CHẢ GIÒ BÁNH TRÁNG CHAY 25G (CODE 47B.22)", 13.852],
	"EMJC00000006742.AB": ["CHẢ GIÒ BÁNH TRÁNG CHAY 25G (CODE 931)", 13.852],
	"EMJC0000002877Q.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G", 13.348],
	"EMJC0000002877Q.0A": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G", 13.348],
	"EMJC0000002877Q.AB": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G", 13.348],
	"EMJD0000EMJ2293.BC": ["HOÀNH THÁNH HẢI SẢN 15G", 7.668],
	"EMJD0000EMJ2293.BD": ["HOÀNH THÁNH HẢI SẢN 15G (code 931)", 7.668],
	"EMJD0000MJ2286A.0A": ["HOÀNH THÁNH TÔM (NGUYÊN CON) 15G", 4.748],
	"EMJD0000MJ2286A.0C": ["HOÀNH THÁNH TÔM (NGUYÊN CON) 15G", 4.748],
	"EMJD0000MJ2286A.0D": ["HOÀNH THÁNH TÔM (NGUYÊN CON) 15G (CODE 931)", 4.758],
	"EMJD000EMJ2790Q.AC": ["DIM SUM THẬP CẨM (HẤP)", 11.136],
	"EMJD000EMJ2790Q.BD": ["DIM SUM THẬP CẨM (HẤP)", 11.136],
	"EMJD000EMJ2790Q.BE": ["DIM SUM THẬP CẨM (HẤP)", 11.136],
	"EMJD000EMJ2790Q.BF": ["DIM SUM THẬP CẨM (HẤP)", 11.136],
	"EMJD000EMJ2790Q.BG": ["DIM SUM THẬP CẨM HẤP (PHUN DL719)", 11.136],
	"EMJG00000006802.00": ["SỦI CẢO CHAY 25G", 14.132],
	"EMJG00000006803.00": ["SỦI CẢO KIMCHI CHAY 25G", 14.132],
	"EMJH00000006158.00": ["HÁ CẢO CHAY 25G CODE EMJ-S01.20", 11.64],
	"EMJH00000006158.0A": ["HÁ CẢO CHAY 25G CODE EMJ-S01.20", 11.64],
	"EMJH00000006158.0B": ["HÁ CẢO CHAY 25G, DL931", 11.64],
	"EMJH00000MJ7130.00": ["HÁ CẢO ĐỎ TÔM CÀ RI 25G (CODE 203.25)", 11.67],
	"EMJH00000MJ7130.0A": ["HÁ CẢO ĐỎ TÔM CÀ RI 25G (CODE 203.25)", 11.67],
	"EMJH00000007193.00": ["BÁNH BỘT LỌC NHÂN TÔM 25G", 11.15],
	"EMJH00000007193.0A": ["BÁNH BỘT LỌC NHÂN TÔM 25G (CODE 931)", 11.15],
	"EMJH00000MJ2283.BC": ["HÁ CẢO TÔM 25G, 20 VIÊN/TÚI", 11.638],
	"EMJH00000MJ2283.BD": ["HÁ CẢO TÔM 25G, 20 VIÊN/TÚI", 11.638],
	"EMJH00000MJ2283.BE": ["HÁ CẢO TÔM 25G, 20 VIÊN/TÚI", 11.638],
	"EMJH00000MJ2283.BF": ["HÁ CẢO TÔM 25G, 20 VIÊN/TÚI", 11.638],
	"EMJH00000MJ2283.BG": ["HÁ CẢO TÔM 25G, 20 VIÊN/TÚI (PHUN DL719 + LÔ TÔM)", 11.638],
	"EMJH00000MJ2284.AC": ["HÁ CẢO TÔM HOÀNG GIA 25G", 11.644],
	"EMJH00000MJ2284.AD": ["HÁ CẢO TÔM HOÀNG GIA 25G", 11.644],
	"EMJH00000MJ6037.AA": ["HÁ CẢO TÔM 22G", 11.655],
	"EMJH00000MJ6037.BB": ["HÁ CẢO TÔM 22G", 11.655],
	"EMJH00000MJ6037.BC": ["HÁ CẢO TÔM 22G", 11.655],
	"EMJH00000MJ6037.BD": ["HÁ CẢO TÔM 22G", 11.655],
	"EMJH00000MJ6037.BE": ["HÁ CẢO TÔM 22G (PHUN DL719 + PHUN LÔ TÔM TRÊN BAO)", 11.655],
	"EMJH00000MJ6601.AA": ["HÁ CẢO TÔM 25G, 1KG/TÚI", 10.73],
	"EMJH00000MJ6601.AB": ["HÁ CẢO TÔM 25G, 1KG/TÚI", 10.73],
	"EMJH00000MJ6601.AC": ["HÁ CẢO TÔM 25G, 1KG/TÚI", 10.73],
	"EMJH00000MJ6601.AD": ["HÁ CẢO TÔM 25G, 1KG/TÚI (code 931)", 10.73],
	"EMJH00000MJ6605.00": ["HÁ CẢO TÔM HOÀNG GIA 25G", 10.78],
	"EMJH00000MJ6605.0A": ["HÁ CẢO TÔM HOÀNG GIA 25G", 10.78],
	"EMJH00000MJ6605.0B": ["HÁ CẢO TÔM HOÀNG GIA 25G", 10.78],
	"EMJH0000EMJ2697.AC": ["HÁ CẢO TÔM HẸ 25G (VỎ HÁ CẢO)", 11.73],
	"EMJH0000EMJ2697.AD": ["HÁ CẢO TÔM HẸ 25G (VỎ HÁ CẢO)", 11.738],
	"EMJH0000EMJ2697.AE": ["HÁ CẢO TÔM HẸ 25G (VỎ HÁ CẢO) - (PHUN DL719)", 11.738],
	"EMJH0000EMJ2964.0A": ["HÁ CẢO TÔM 3 MÀU 25G", 11.455],
	"EMJS00000002287.BD": ["XÍU MẠI TÔM 25G", 11.538],
	"EMJS00000002287.BE": ["XÍU MẠI TÔM 25G (PHUN DL719)", 11.538],
	"EMJS00000006606.00": ["XÍU MẠI TÔM 25G", 10.78],
	"EMJS00000006606.AA": ["XÍU MẠI TÔM 25G", 10.78],
	"EMJS00000006606.AB": ["XÍU MẠI TÔM 25G (PHUN DL719+LÔ TÔM)", 10.78],
	"EMJS0000EMJ2696.AB": ["SỦI CẢO TÔM HẸ 25G", 11.72],
	"EMJS0000EMJ2696.AC": ["SỦI CẢO TÔM HẸ 25G", 11.72],
	"EMJS0000EMJ2696.AD": ["SỦI CẢO TÔM HẸ 25G (PHUN DL719)", 11.72],
	"EMKC000000EMK01.00": ["CHẢ GIÒ BỘT MÌ TÁO 25G VÀ CARAMEL SAUCE 50G, VE, NG", 9.544],
	"EMOB000000EMO01.0A": ["BÁNH BAO SANDWICH 50G", 5.61],
	"EMOB000000EMO04.00": ["BÁNH BAO SANDWICH 30G", 6.909],
	"EMOB000000EMO05.00": ["BÁNH BAO HÌNH TRÒN 100G (CẮT MỘT NỬA)", 10.628],
	"EMOH000000EMO06.00": ["HÁ CẢO TÔM 25G", 9.227],
	"EMRH000000RAV01.AC": ["HÁ CẢO TÔM 25G, 2KG/PA", 10.665],
	"EMRH000000RAV01.BD": ["HÁ CẢO TÔM 25G, 2KG/PA", 10.665],
	"EMRH000000RAV01.CE": ["HÁ CẢO TÔM 25G, 2KG/PA", 10.665],
	"EMRH000000RAV01.CF": ["HÁ CẢO TÔM 25G, 2KG/PA", 10.665],
	"EMRH000000RAV01.CG": ["HÁ CẢO TÔM 25G, 2KG/PA (PHUN LÔ TÔM V1,V2)", 10.665],
	"EMRS000000RAV07.00": ["SỦI CẢO TÔM BẮP CẢI 25G (CODE: EMR-S01A.24)", 10.962],
	"ENC1D0000ENC104.00": ["BỘ DIMSUM HẤP, HẢI SẢN ASC, LOGO ASC\n 1. HÁ CẢO TÔM HOA HỒNG", 10.84],
	"ENC1G0000ENC101.00": ["SỦI CẢO TÔM 25G, TÔM ASC, LOGO ASC", 10.87],
	"ENC1K0000ENC102.00": ["XÍU MẠI TÔM 25G, HẢI SẢN ASC, LOGO ASC", 10.775],
	"ENC1K0000ENC103.00": ["HÁ CẢO TÔM 25G, TÔM ASC, LOGO ASC", 10.84],
	"EKSK00003353513.00": ["HÁ CẢO TÔM 25G, LOGO ASC (THAM CHIẾU CODE ENC 03)", 10.84],
	"EKSH00003348968.00": ["HÁ CẢO TÔM MÀU HỒNG 25G, ASC LOGO, KB", 10.81],
	"EKSD00003349677.00": ["BỘ HÁ CẢO TÔM HOA HỒNG NHIỀU MÀU 1.05KG, ASC LOGO, KB", 11.337],
	"EKSD00003352747.00": ["BÁNH TIỂU LONG TÔM 30G, ASC LOGO, KB (CODE 719)", 10.87],
	"ENCK000000ENC07.00": ["BỘT MÌ HOA CHAY 20G", 6.288],
	"ENCK000000ENC09.00": ["BỘT MÌ CHAY NƯỚNG MÀU XANH 20G (HSD 15 tháng)", 2.89],
	"ENPB00000007308.00": ["BÁNH BAO BURGER 60G (CẮT SẴN)", 6.523],
	"ENPB00000007309.00": ["BÁNH BAO SANDWICH MÀU VÀNG 30G", 6.955],
	"ENPB00000007310.0A": ["BÁNH BAO SANDWICH MÀU CAM 30G", 6.955],
	"ENPB00000007311.00": ["BÁNH BAO SANDWICH TRÀ XANH 30G", 6.955],
	"ENPB00000007312.0B": ["BÁNH BAO SANDWICH THAN TRE 30G", 6.955],
	"ENPB00000007312.0A": ["BÁNH BAO SANDWICH THAN TRE 30G", 6.955],
	"ENPB00000007324.0A": ["BÁNH BAO BURGER MÀU ĐEN 60G (CẮT SẴN)", 6.523],
	"ENPB00000007324.00": ["BÁNH BAO BURGER MÀU ĐEN 60G (CẮT SẴN)", 6.523],
	"ENPB00000007325.00": ["TIỂU LONG BAO 30G (CODE ENP-S15.22)", 7.064],
	"ENPB00000007325.0A": ["TIỂU LONG BAO 30G", 7.064],
	"ENPB00000007325.0B": ["TIỂU LONG BAO 30G", 7.064],
	"ENPB00000007398.00": ["BÁNH BAO SANDWICH 70G", 4.969],
	"ENPC00000007313.00": ["TÔM FILO 20G (CODE ENP-S18.22)", 9.072],
	"ENPC00000007313.0A": ["TÔM FILO 20G (CODE ENP-S18.22)", 9.072],
	"ENPC00000007314.AA": ["CHẢ GIÒ BỘT MÌ TÔM 25G (CODE ENP-S20.22)", 10.92],
	"ENPC00000007314.AB": ["CHẢ GIÒ BỘT MÌ TÔM 25G (CODE ENP-S20.22)", 10.92],
	"ENPC00000007314.AC": ["CHẢ GIÒ BỘT MÌ TÔM 25G", 10.92],
	"ENPC00000007314.AD": ["CHẢ GIÒ BỘT MÌ TÔM 25G (GIẢM CHIỀU CAO THÙNG)", 10.885],
	"ENPC00000007314.AE": ["CHẢ GIÒ BỘT MÌ TÔM 25G (GIẢM CHIỀU CAO THÙNG)", 10.885],
	"ENPC00000007554.00": ["SAMOSA CHAY VỎ XANH CHIÊN 15G", 7],
	"ENPC00000007554.AA": ["SAMOSA CHAY VỎ XANH CHIÊN 15G", 7],
	"ENPG00000001512.0A": ["SỦI CẢO CHAY (HẸ) 25G, 40PC/PA", 6.566],
	"ENPG00000001512.0B": ["SỦI CẢO CHAY (HẸ) 25G, 40PC/PA", 6.566],
	"ENPG00000001512.0C": ["SỦI CẢO CHAY (HẸ) 25G, 40PC/PA", 6.566],
	"ENPG00000001515.0B": ["SỦI CẢO PTO HẤP 25G", 9.925],
	"ENPG00000001515.0C": ["SỦI CẢO PTO HẤP 25G", 9.925],
	"ENPG00000001515.0D": ["SỦI CẢO PTO HẤP 25G", 9.925],
	"ENPG00000001515.0E": ["SỦI CẢO PTO HẤP 25G", 9.925],
	"ENPG00000007326.00": ["SỦI CẢO TÔM VỎ XANH 25G (CODE ENP-S26.22)", 6.814],
	"ENPG00000007327.00": ["SỦI CẢO TÔM VỎ VÀNG 25G (CODE ENP-S26A.22)", 6.814],
	"ENPG00000007327.0A": ["SỦI CẢO TÔM VỎ VÀNG 25G (CODE ENP-S26A.22)", 6.814],
	"ENPG00000007328.00": ["SỦI CẢO TÔM VỎ CAM 25G (CODE ENP-S26B.22)", 6.814],
	"ENPG00000007328.0A": ["SỦI CẢO TÔM VỎ CAM 25G (CODE ENP-S26B.22)", 6.814],
	"ENPG00000007328.0B": ["SỦI CẢO TÔM VỎ CAM 25G (THAY ĐỔI KÍCH THƯỚC BAO BÌ)", 6.773],
	"ENPG0000001588A.00": ["SỦI CẢO TÔM THÁI ÁP CHẢO 25G. 40PC/PA", 10.93],
	"ENPG0000001588A.0B": ["SỦI CẢO TÔM THÁI ÁP CHẢO 25G", 10.87],
	"ENPG0000001588A.0C": ["SỦI CẢO TÔM THÁI ÁP CHẢO 25G", 10.87],
	"ENPG0000001588A.0D": ["SỦI CẢO TÔM THÁI ÁP CHẢO 25G", 10.87],
	"ENPH00000001521.BD": ["HÁ CẢO TÔM 25G, 40PC/PA", 6.539],
	"ENPH00000001521.BE": ["HÁ CẢO TÔM 25G, 40PC/PA", 6.539],
	"ENPH00000001521.BF": ["HÁ CẢO TÔM 25G, 40PC/PA", 6.539],
	"ENPH00000001521.BG": ["HÁ CẢO TÔM 25G, 40PC/PA", 6.539],
	"ENPH00000001845.BB": ["HÁ CẢO TÔM 25G. 8PC/TRAY", 9.35],
	"ENPH00000001845.BC": ["HÁ CẢO TÔM 25G. 8PC/TRAY", 9.35],
	"ENPH00000001845.BD": ["HÁ CẢO TÔM 25G, 8PC/TRAY", 9.35],
	"ENPH00000001845.BE": ["HÁ CẢO TÔM 25G, 8PC/TRAY (TĂNG 1.5CM CHIỀU CAO)", 9.343],
	"ENPK00000001511.AC": ["BÁNH BAO SANDWICH 30G", 6.936],
	"ENPK00000001511.AD": ["BÁNH BAO SANDWICH 30G", 6.936],
	"ENPK00000001511.AE": ["BÁNH BAO SANDWICH 30G", 6.936],
	"ENPK00000001517.BE": ["HẢI SẢN VIÊN ÁO BỘT 20G", 9.96],
	"ENPK00000002841.AC": ["BÁNH BAO SANDWICH 60G", 10.668],
	"ENPK000ENP01520.AC": ["XÍU MẠI TÔM 25G", 9.502],
	"ENPK000ENP01520.AD": ["XÍU MẠI TÔM 25G", 9.502],
	"ENPK000ENP01520.AE": ["XÍU MẠI TÔM 25G", 9.502],
	"ENPH00000008059.00": ["HÁ CẢO CHAY NGÔI SAO XANH 18G", 8.714],
	"EPCC000000EPC02.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G", 11.381],
	"EPCC000000EPC03.00": ["CHẢ GIÒ BÁNH TRÁNG CHAY 25G", 11.381],
	"EPCC000000EPC08.00": ["SAMOSA CHAY 30G", 4.74],
	"EPCC000000EPC09.00": ["CÁ VIÊN 10G", 11.054],
	"EPCC000000EPC10.00": ["CÁ VIÊN CHIÊN 10G", 11.054],
	"EPCC000000EPC11.00": ["TÔM VIÊN 10G", 11.054],
	"EPCC000000EPC12.00": ["CUA VIÊN 10G", 11.054],
	"EPCD000000EPC05.00": ["DIMSUM THẬP CẨM HẤP", 11.702],
	"EPCD000000EPC05.AA": ["DIMSUM THẬP CẨM HẤP\n 1. HÁ CẢO TÔM 25G\n 2. HÁ CẢO HÌNH HOA H", 11.702],
	"EPCG000000EPC01.00": ["SỦI CẢO TÔM HẸ 25G", 11.785],
	"EPCH000000EPC06.AA": ["HÁ CẢO TÔM 25G", 11.705],
	"EPCK000000EPC13.00": ["CHÈ KHOAI MÔN NƯỚC DỪA 250G", 5.294],
	"EPCR000000EPC04.00": ["PAD THAI XÀO TÔM 350G", 6.75],
	"EPCR000000EPC16.00": ["MÌ XÀO SINGAPORE 350G", 8.3],
	"EPDB000200EPD02.AA": ["BÁNH TIỂU LONG 33.33G", 11.488],
	"EPDB000200EPD02.AB": ["BÁNH TIỂU LONG 33.33G", 11.488],
	"EPDB000400EPD04.AA": ["BÁNH BAO ĐẬU ĐỎ 40G", 8.456],
	"EPDC000000EPD14.AA": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G", 11.14],
	"EPDC000000EPD14.AB": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G", 11.14],
	"EPDC001400EPD14.00": ["CHẢ GIÒ TÔM CUA 25G (CODE: EPD-S02.22)", 11.11],
	"EPDD000100EPD01.0B": ["SỦI CẢO TÔM ÁP CHẢO 20G", 11.523],
	"EPDD0000EPD7028.00": ["SỦI CẢO TÔM ÁP CHẢO 20G\n(THAM CHIẾU EPD 01, CODE 931)", 11.523],
	"EPDD000600EPD06.00": ["CHẢ GIÒ TÔM 25G. CODE: 44.18", 10.82],
	"EPDD000600EPD06.0A": ["CHẢ GIÒ BỘT MÌ TÔM QUE 25G", 10.82],
	"EPDC0000EPD7026.00": ["CHẢ GIÒ BỘT MÌ TÔM QUE 25G \n(THAM CHIẾU CODE EPD 06)", 10.82],
	"EPDD000800EPD08.00": ["BÁNH CUỐN TÔM 45G", 9.972],
	"EPDD000900EPD09.AA": ["SANDWICH BUN 60G", 8.66],
	"EPDH000300EPD03.AA": ["HÁ CẢO TÔM 25G", 11.635],
	"EPDH000300EPD03.AB": ["HÁ CẢO TÔM 25G", 11.635],
	"EPDH0000EPD7024.00": ["HÁ CẢO TÔM 25G \n(THAM CHIẾU EPD 03, CODE 931)", 11.635],
	"EPDH0000EPD7024.0A": ["HÁ CẢO TÔM 25G \n(THAM CHIẾU EPD 03, ĐỎI TỪ RIDER-->STICKER, ", 11.555],
	"EPDH000700EPD07.AA": ["HÁ CẢO TÔM HẸ VỎ XANH 25G. CODE: 45A.18", 11.55],
	"EPDH0000EPD7027.00": ["HÁ CẢO TÔM HẸ VỎ XANH 25G \n(THAM CHIẾU EPD 07, CODE 931)", 11.55],
	"EPDK001200EPD12.AA": ["HOÀNH THÁNH TÔM CHIÊN 20G", 7.44],
	"EPDH0000EPD7033.00": ["HOÀNH THÁNH TÔM CHIÊN 20G\n(THAM CHIẾU EPD 12, CODE 931)", 7.44],
	"EPDS000500EPD05.AA": ["XÍU MẠI TÔM 25G", 11.675],
	"EPDS0000EPD7025.00": ["XÍU MẠI TÔM 25G\n(THAM CHIẾU EPD 05, CODE 931)", 11.675],
	"EPDS0000EPD7025.0A": ["XÍU MẠI TÔM 25G (PHUN DL719 + TĂNG 2CM CHIỀU CAO THÙNG)", 11.415],
	"EPDX000000EPD13.AA": ["XÍU MẠI TÔM 25G", 11.635],
	"EPDX000000EPD13.AB": ["XÍU MẠI TÔM 25G", 11.635],
	"EPDS0000EPD7034.00": ["XÍU MẠI TÔM 25G\n(THAM CHIẾU EPD 13, CODE 931)", 11.635],
	"EPFS000000EPF01.00": ["SỦI CẢO TÔM 22GG", 5.49],
	"EPXH000000EPX01.00": ["HÁ CẢO TÔM 25G", 6.462],
	"EPXH000000EPX01.0A": ["HÁ CẢO TÔM 25G", 6.462],
	"EPXH000000EPX01.0B": ["HÁ CẢO TÔM 25G", 6.462],
	"EPXH000000EPX02.00": ["XÍU MẠI TÔM 33G", 6.516],
	"EPXH000000EPX02.0A": ["XÍU MẠI TÔM 33G", 6.487],
	"EPXH000000EPX02.0B": ["XÍU MẠI TÔM 33G", 6.487],
	"EPHB000000EPH04.00": ["BÁNH BAO RAU CỦ 35G", 7.935],
	"EPHD000000EPH02.A0": ["BÁNH CUỐN HẢI SẢN 25G", 10.922],
	"EPHH000000EPH01.0B": ["HÁ CẢO TÔM 35G", 10.504],
	"EPHH000000EPH01.0C": ["HÁ CẢO TÔM 35G", 10.504],
	"EPHK000000EPH06.00": ["RAU CỦ TẨM BỘT CHIÊN 30G", 7.293],
	"EPHR000000EPH05.00": ["MÌ XÀO SINGAPORE 350G", 8.17],
	"EPPC00000026030.00": ["BÁNH CUỐN TÔM 40G & 50G NƯỚC SỐT", 13.78],
	"EPPH00000026010.AB": ["HÁ CẢO TÔM HOÀNG GIA 35G (CODE: EPP S01A.20)", 10.754],
	"EPPS00000026025.00": ["SỦI CẢO CHAY NẤM 37.5G (CODE: EPP-S09.20)", 12.65],
	"EPPS00000026040.AA": ["SỦI CẢO TÔM HẸ 25G (CODE: EPP S03A.20)", 14.01],
	"EPPX00000026020.AB": ["XÍU MẠI TÔM HOÀNG GIA 35G (CODE: EPP S05.20)", 10.694],
	"EPR1D000EPR006A.AA": ["BÁNH RAVIOLIS 33GR/PC", 12.854],
	"EPR1D000EPR006C.00": ["BÁNH RAVIOLIS 33G (BĂNG KEO CAM, ĐAI 4 DÂY HÌNH #)", 12.72],
	"EPR1D000EPR006C.0A": ["BÁNH RAVIOLIS 33G, CODE 931", 12.72],
	"EPR1H0000EPR001.AA": ["HÁ CẢO TÔM 25GR/PC", 12.854],
	"EPR1H000EPR001C.00": ["HÁ CẢO TÔM 25G, GF", 12.73],
	"EPR1H000EPR001C.0A": ["HÁ CẢO TÔM 25G", 12.73],
	"EPR1H000EPR005C.00": ["HÁ CẢO TÔM (ĐỊNH HÌNH GYOZA) 25GR/PC", 12.86],
	"EPR1H000EPR005C.0A": ["HÁ CẢO TÔM (ĐỊNH HÌNH GYOZA) 25GR/PC (CODE 931)", 12.73],
	"EPR1K0000EPR009.0B": ["TÔM TẨM BỘT 15G - 18G", 12.898],
	"EPR1S0000EPR003.AA": ["XÍU MẠI TÔM 25GR/PC", 12.854],
	"EPR1S000EPR003C.00": ["XÍU MẠI TÔM 25G", 12.75],
	"EPR1S000EPR003C.0A": ["XÍU MẠI TÔM 25G (CODE 931)", 12.75],
	"EPSK00000EPS01A.00": ["RAU CỦ TẨM BỘT CHIÊN TÔM 25G, KB", 16.96],
	"EPWB000000EPW02.00": ["BÁNH BAO MÍT NON 55G, VE", 6.205],
	"EPWC000000EPW03.00": ["RẾ MỰC 20G", 10.297],
	"EPWC000000EPW04.00": ["TÔM TẨM BỘT 25G, BAP 4*", 12.347],
	"EPWC000000EPW05.00": ["CHẢ GIÒ BÁNH TRÁNG MỰC VÀ RAU CỦ CHUA NGỌT 20G", 5.878],
	"EPWC000000EPW06.00": ["RẾ MỰC VỊ CÀ RI 20G", 5.916],
	"EPWK000000EPW01.00": ["BÁNH BẮP CHIÊN 20G", 5.732],
	"ESF1D0000ESF102.0A": ["SỦI CÁO TÔM 20G", 6.61],
	"ESF1D0000ESF103.0A": ["SỦI CẢO CHAY 20G", 6.61],
	"ESF1D0000ESF104.00": ["HÁ CẢO TÔM 25G (CODE ESF-S07A2.23)", 5.879],
	"ESF1D0000ESF104.0A": ["HÁ CẢO TÔM 25G (CODE ESF-S07A2.23)", 5.879],
	"ESF1D0000ESF104.0B": ["HÁ CẢO TÔM 25G (CODE ESF-S07A2.23)", 5.879],
	"ESF1D0000ESF105.00": ["XÍU MẠI TÔM 25G (ESF-S08A2.23)", 5.842],
	"ESF1D0000ESF105.0A": ["XÍU MẠI TÔM 25G (ESF-S08A2.23)", 5.842],
	"ESF1D0000ESF105.0B": ["XÍU MẠI TÔM 25G (ESF-S08A2.23)", 5.842],
	"ESF1D000ESF105A.00": ["XÍU MẠI TÔM 25G", 5.77],
	"ESF1D000ESF105B.00": ["XÍU MẠI TÔM 25G", 5.77],
	"ESF1D0000ESF106.00": ["SỦI CẢO CHAY 20G (CODE ESF-S10A3.23)", 7.126],
	"ESF1D000ESF106A.00": ["SỦI CẢO CHAY 20G", 7.148],
	"ESF1D0000ESF107.00": ["SỦI CẢO CHAY 20G \n(BĂNG KEO CAM - TRONG)", 6.623],
	"ESF1D0000ESF107.0A": ["SỦI CẢO CHAY 20G \n(BĂNG KEO CAM - TRONG)", 6.623],
	"ESF1D0000ESF107.0B": ["SỦI CẢO CHAY 20G (CODE DL719)\n(BĂNG KEO CAM - TRONG)", 6.623],
	"ESF1D000ESF102A.00": ["SỦI CÁO TÔM 20G (BĂNG KEO TÍM - TRONG)", 6.61],
	"ESF1D000ESF102A.0A": ["SỦI CÁO TÔM 20G (BĂNG KEO TÍM - TRONG)", 6.61],
	"ESF1D000ESF102A.0B": ["SỦI CÁO TÔM 20G (CODE DL719)\n (BĂNG KEO TÍM - TRONG)", 6.61],
	"ESF1D000ESF104A.00": ["HÁ CẢO TÔM 25G (BĂNG KEO ĐỎ - TRONG)", 5.839],
	"ESF1D000ESF104A.0A": ["HÁ CẢO TÔM 25G (BĂNG KEO ĐỎ - TRONG)", 5.839],
	"ESF1D000ESF104A.0B": ["HÁ CẢO TÔM 25G (PHUN DL719)\n(BĂNG KEO ĐỎ - TRONG)", 5.839],
	"ESF1D000ESF104B.00": ["HÁ CẢO TÔM 25G", 5.839],
	"ESF1D000ESF104B.0A": ["HÁ CẢO TÔM 25G (PHUN DL719)\nTHÙNG DÁN BĂNG KEO: XANH LÁ - ĐỎ", 5.839],
	"ESF2G0000ESF201.0A": ["SỦI CẢO CHAY 20G, VE, NG", 3.502],
	"ESF2G0000ESF201.0B": ["SỦI CẢO CHAY 20G, VE, NG", 3.502],
	"ESF2G0000ESF201.0C": ["SỦI CẢO CHAY 20G, VE, NG", 3.502],
	"ESF3C0000ESF301.00": ["BỘ MIX BÁNH MÌ TÔM MÈ VÀ DELI CHIÊN (VE, TÔM BAP 4*)", 4.04],
	"ESFH000000ESF01.00": ["HÁ CẢO TÔM 25G", 11.63],
	"ESFR000000ESF04.00": ["PAD THÁI XÀO TÔM 350G", 6.714],
	"ESFS000000ESF02.00": ["XÍU MẠI TÔM 25G", 11.54],
	"ESLC000000SLY01.AD": ["CHẢ GIÒ CHAY 30G", 9.641],
	"ESLC000000SLY01.AE": ["CHẢ GIÒ CHAY 30G", 9.641],
	"ESLC000000SLY01.AF": ["CHẢ GIÒ CHAY 30G", 9.641],
	"ESLC000000SLY01.AG": ["CHẢ GIÒ CHAY 30G", 9.641],
	"ESLC000000SLY01.AH": ["CHẢ GIÒ CHAY 30G", 9.641],
	"ESLC000000SLY01.AI": ["CHẢ GIÒ CHAY 30G", 9.641],
	"ESLC000000SLY03.BB": ["CHẢ GIÒ GHẸ 30G", 9.646],
	"ESLC000000SLY03.BC": ["CHẢ GIÒ GHẸ 30G", 9.646],
	"ESLC000000SLY09.AB": ["SAMOSA CHAY 30GR", 9.698],
	"ESLC000000SLY09.AC": ["SAMOSA CHAY 30G", 9.698],
	"ESLC000000SLY09.AD": ["SAMOSA CHAY 30G", 9.698],
	"ESLC000000SLY09.AE": ["SAMOSA CHAY 30G", 9.698],
	"ESLC000000SLY09.AF": ["SAMOSA CHAY 30G", 9.698],
	"ESLC000000SLY09.AG": ["SAMOSA CHAY 30G", 9.698],
	"ESLH000000SLY26.AA": ["HÁ CẢO CHAY 25G", 11.26],
	"ESLH000000SLY26.AC": ["HÁ CẢO CHAY 25G", 11.26],
	"ESLH000000SLY26.AD": ["HÁ CẢO CHAY 25G", 11.26],
	"ESLH000000SLY34.BD": ["HÁ CẢO TÔM HOÀNG GIA 30G", 11.977],
	"ESLH000000SLY34.BE": ["HÁ CẢO TÔM HOÀNG GIA 30G", 11.977],
	"ESLH000000SLY34.BF": ["HÁ CẢO TÔM HOÀNG GIA 30G", 11.977],
	"ESLH000000SLY34.BG": ["HÁ CẢO TÔM HOÀNG GIA 30G", 11.929],
	"ESLH000000SLY34.BH": ["HÁ CẢO TÔM HOÀNG GIA 30G", 11.929],
	"ESLH000000SLY34.BI": ["HÁ CẢO TÔM HOÀNG GIA 30G", 11.929],
	"ESLH000000SLY36.BA": ["BÁNH CUỐN VIỆT NAM 48G", 10.234],
	"ESLH000000SLY36.BC": ["BÁNH CUỐN VIỆT NAM 48G", 10.234],
	"ESLH000000SLY36.BD": ["BÁNH CUỐN VIỆT NAM 48G", 10.25],
	"ESLH000000SLY38.00": ["BÁNH CUỐN TÔM 48GR", 10.266],
	"ESLH000000SLY38.AC": ["BÁNH CUỐN TÔM 48G", 10.266],
	"ESLH000000SLY38.AD": ["BÁNH CUỐN TÔM 48G", 10.266],
	"ESLK000000SLY25.BC": ["TÔM VIÊN 25G", 11.22],
	"ESLK000000SLY25.BD": ["TÔM VIÊN 25G", 11.22],
	"ESLK000000SLY25.CE": ["TÔM VIÊN 25G", 11.22],
	"ESM000000087074.00": ["BÁNH CUỐN TÔM 48G VÀ SOY SAUCE 40G, LOGO HA", 9.705],
	"ESM0000000ESM01.00": ["BÁNH CUỐN TÔM 48G VÀ SOY SAUCE 40G HL", 9.836],
	"ESMD00000044653.BB": ["HOÀNH THÁNH TÔM 25GR/PC", 5.736],
	"ESMD00000044653.BC": ["HOÀNH THÁNH TÔM 25G, LOGO HA", 5.736],
	"ESMH00000044650.AC": ["HÁ CẢO TÔM 30G HL", 10.1],
	"ESMH00000044650.AD": ["HÁ CẢO TÔM 30G, LOGO HA", 10.1],
	"ESMH00000044651.AB": ["HÁ CẢO TÔM 30G, LOGO HA", 6.587],
	"ESMH00000054271.AB": ["DIMSUM THẬP CẨM HẤP", 9.272],
	"ESMH00000054271.BC": ["DIMSUM THẬP CẨM HẤP 340G/PA, LOGO HA", 9.272],
	"ESMH00000054271.BD": ["DIMSUM THẬP CẨM HẤP 340G/PA, LOGO HA", 9.272],
	"ESMS00000044652.BB": ["XÍU MẠI TÔM 25G, LOGO HA", 5.49],
	"ESMS00000044652.BC": ["XÍU MẠI TÔM 25G, LOGO HA", 5.49],
	"ESO0000000SOR01.AA": ["CHẢ GIÒ TÔM CUA 500G/PA", 13.35],
	"ESO0000000SOR03.BC": ["HÁ CẢO TÔM 500G/PA", 11.68],
	"ESO0000000SOR03.CE": ["HÁ CẢO TÔM 500G/PA", 11.68],
	"ESO0000000SOR03.CF": ["HÁ CẢO TÔM 500G/PA", 11.68],
	"ESO0000000SOR03.CG": ["HÁ CẢO TÔM 500G/PA (CODE 931)", 11.68],
	"ESO0000000SOR05.BB": ["HÁ CẢO TÔM HÌNH HOA HỒNG 33.33G", 11.2],
	"ESO0000000SOR05.BC": ["HÁ CẢO TÔM HÌNH HOA HỒNG 33.33G", 11.2],
	"ESO0000000SOR05.BD": ["HÁ CẢO TÔM HÌNH HOA HỒNG 33.33G (CODE 931)", 11.2],
	"ESO0000000SOR08.BC": ["CHẢ GIÒ BỘT MÌ BABY 6G", 12.015],
	"ESO0000000SOR08.BE": ["CHẢ GIÒ BỘT MÌ BABY 6G", 12.015],
	"ESO0000000SOR08.BF": ["CG BỘT MÌ BABY (ỐNG TRÚC TÔM) 6G (CODE 931)", 12.435],
	"ESO0000000SOR09.0B": ["CHẢ GIÒ BỘT MÌ CHAY 25G", 13.302],
	"ESO0000000SOR09.0C": ["CHẢ GIÒ BỘT MÌ CHAY 25G", 13.302],
	"ESO0000000SOR09.0D": ["CHẢ GIÒ BỘT MÌ CHAY 25G (CODE 931)", 13.302],
	"ESO0000000SOR10.BC": ["CHẢ GIÒ ỐNG TRÚC TÔM 8G", 12.38],
	"ESO0000000SOR10.BD": ["CHẢ GIÒ BÁNH TRÁNG ỐNG TRÚC TÔM 8G", 12.38],
	"ESO0000000SOR10.BE": ["CHẢ GIÒ BÁNH TRÁNG ỐNG TRÚC TÔM 8G - CODE 931", 12.38],
	"ESO0000000SOR10.BF": ["CHẢ GIÒ BÁNH TRÁNG ỐNG TRÚC TÔM 8G ( PHUN LÔ TÔM + DL719)", 12.38],
	"ESO0000000SOR12.BA": ["HẢI SẢN VIÊN ÁO BỘT 20G", 9.9],
	"ESO0000000SOR12.CC": ["HẢI SẢN VIÊN ÁO BỘT 20G", 9.9],
	"ESO0000000SOR12.CD": ["HẢI SẢN VIÊN ÁO BỘT 20G", 9.9],
	"ESO0000000SOR12.CE": ["HẢI SẢN VIÊN ÁO BỘT 20G (code 931)", 9.9],
	"ESO000000SOR13B.0A": ["KHOAI TÂY CUỘN TÔM 30G, CODE 931", 7.152],
	"ESO0000000SOR14.AC": ["GỎI CUỐN 45G", 14.882],
	"ESO0000000SOR14.AD": ["GỎI CUỐN 45G", 14.882],
	"ESO0000000SOR21.AD": ["BÁNH XÈO 200G", 11.575],
	"ESO0000000SOR21.AE": ["BÁNH XÈO 200G", 11.575],
	"ESO0000000SOR23.BC": ["HÁ CẢO HẢI SẢN 25G", 8.09],
	"ESO0000000SOR23.BD": ["HÁ CẢO HẢI SẢN 25G", 8.09],
	"ESO0000000SOR23.BE": ["HÁ CẢO HẢI SẢN 25G, CODE 931", 8.09],
	"ESO00000SOR-A30.00": ["TÔM TẨM BỘT CHIÊN 20G", 9.99],
	"ESO00000SOR-A30.0A": ["TÔM TẨM BỘT CHIÊN 20G", 9.99],
	"ESO00000SOR-N03.BB": ["XÍU MẠI TÔM 25G", 12.549],
	"ESO00000SOR-N03.CD": ["XÍU MẠI TÔM 25G", 12.549],
	"ESO00000SOR-N03.DE": ["XÍU MẠI TÔM 25G", 12.549],
	"ESO00000SOR-N03.DF": ["XÍU MẠI TÔM 25G (CODE 931)", 12.549],
	"ESO00000SOR-N03.DG": ["XÍU MẠI TÔM 25G (PHUN DL719 + LÔ TÔM)", 12.549],
	"ESO00000SOR-N04.BB": ["HÁ CẢO TÔM 25G/PC, 300G/PA", 12.574],
	"ESO00000SOR-N04.CC": ["HÁ CẢO TÔM 25G", 12.574],
	"ESO00000SOR-N04.CD": ["HÁ CẢO TÔM 25G", 12.574],
	"ESO00000SOR-N04.CE": ["HÁ CẢO TÔM 25G", 12.574],
	"ESO00000SOR-N04.CF": ["HÁ CẢO TÔM 25G (CODE 931)", 12.574],
	"ESO00000SOR-N05.BB": ["HÁ CẢO TÔM HẸ 25G", 12.574],
	"ESO00000SOR-N07.BA": ["HOÀNH THÁNH TÔM 20G", 10.184],
	"ESO00000SOR-N07.CB": ["HOÀNH THÁNH TÔM 20G", 10.184],
	"ESO00000SOR-N07.CC": ["HOÀNH THÁNH TÔM 20G", 10.184],
	"ESO00000SOR-N07.DD": ["HOÀNH THÁNH TÔM 20G", 10.184],
	"ESO00000SOR-N07.DE": ["HOÀNH THÁNH TÔM 20G (CODE 931)", 10.184],
	"ESO00000SOR-N10.CD": ["HÁ CẢO TÔM 35G", 11.044],
	"ESO00000SOR-N10.CE": ["HÁ CẢO TÔM 35G (PHUN LÔ TÔM + DL719)", 11.044],
	"ESO00000SOR-N12.BB": ["SỦI CẢO TÔM HẸ 25G", 13.81],
	"ESO00000SOR-N12.BC": ["SỦI CẢO TÔM HẸ 25G", 13.81],
	"ESO00000SOR-N12.BD": ["SỦI CẢO TÔM HẸ 25G", 13.81],
	"ESO00000SOR-N17.BB": ["TÔM LĂN BỘT CHIÊN 12G", 4.255],
	"ESO00000SOR-N17.BC": ["TÔM LĂN BỘT CHIÊN 12G (CODE 931)", 4.255],
	"ESO00000SOR-N21.BB": ["HÁ CẢO TÔM 25G, 1KG/BAG", 11.14],
	"ESO00000SOR-N21.CD": ["HÁ CẢO TÔM 25G, 1KG/PA", 11.14],
	"ESO00000SOR-N21.CE": ["HÁ CẢO TÔM 25G, 1KG/PA", 11.14],
	"ESO00000SOR-N21.CF": ["HÁ CẢO TÔM 25G, 1KG/PA (CODE 931)", 11.14],
	"ESO00000SOR-N21.CG": ["HÁ CẢO TÔM 25G, 1KG/PA (PHUN LÔ TÔM + DL719)", 11.14],
	"ESO00000SOR-Y01.AB": ["HÁ CẢO TÔM HOÀNG GIA 25G", 11.135],
	"ESO00000SOR-Y03.BC": ["HÁ CẢO TÔM HOÀNG GIA 15G, 450G/KHAY", 15.776],
	"ESO00000SOR-Y03.BD": ["HÁ CẢO TÔM HOÀNG GIA 15G, 450G/KHAY", 15.776],
	"ESO00000SOR-Y03.BE": ["HÁ CẢO TÔM HOÀNG GIA 15G (CODE 931)", 15.776],
	"ESO0000SOR-A29S.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM 80G", 16.97],
	"ESO0000SOR-A29S.0A": ["CHẢ GIÒ BÁNH TRÁNG TÔM 80G", 16.97],
	"ESO0000SOR-A29S.0B": ["CHẢ GIÒ BÁNH TRÁNG TÔM 80G", 16.97],
	"ESO0000SOR-A29S.0C": ["CHẢ GIÒ BÁNH TRÁNG TÔM 80G - CODE 931", 16.97],
	"ESO0000SOR-N09B.00": ["HÁ CẢO TÔM ĐẶC BIỆT 30G", 11.397],
	"ESO0000SOR-N09B.0A": ["HÁ CẢO TÔM ĐẶC BIỆT 30G (CODE 931)", 11.397],
	"ESO0000SOR-N13A.0A": ["BÁNH BAO HẠT SEN 37.5G", 8.65],
	"ESOB000SOR-S25A.0A": ["BÁNH BAO SANDWICH 36G", 8.32],
	"ESOB000SOR-S25A.00": ["BÁNH BAO SANDWICH 36G", 8.32],
	"ESOB000SOR-S25B.00": ["BÁNH BAO SANDWICH 48G", 8.74],
	"ESOC000SOR-A011.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM 37.5G", 13.03],
	"ESOC000SOR-A011.0A": ["CHẢ GIÒ BÁNH TRÁNG TÔM 37.5G", 13.038],
	"ESOC000SOR-A011.0B": ["CHẢ GIÒ BÁNH TRÁNG TÔM 37.5G", 13.03],
	"ESOC000SOR-A011.0C": ["CHẢ GIÒ BÁNH TRÁNG TÔM 37.5G", 13.03],
	"ESOC000SOR-A011.0D": ["CHẢ GIÒ BÁNH TRÁNG TÔM 37.5G", 13.03],
	"ESOC000SOR-A012.0A": ["CHẢ GIÒ BỘT MÌ TÔM 30G (CHIÊN SẴN)", 13.072],
	"ESOC000SOR-A012.0B": ["CHẢ GIÒ BỘT MÌ TÔM 30G (CHIÊN SẴN)", 13.072],
	"ESOC000SOR-A012.0C": ["CHẢ GIÒ BỘT MÌ TÔM 30G (CHIÊN SẴN) - CODE 931", 13.072],
	"ESOC000SOR-A013.0A": ["CHẢ GIÒ BỘT MÌ TÔM MINI 12.5G (CHIÊN SẴN)", 13.418],
	"ESOC000SOR-A013.0B": ["CHẢ GIÒ BỘT MÌ TÔM MINI 12.5G (CHIÊN SẴN)- CODE 931", 13.418],
	"ESOC00SOR-A016B.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G", 13.405],
	"ESOC00SOR-A016B.0A": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G (CODE 931)", 13.405],
	"ESOG0000SOR-656.0A": ["SỦI CẢO CHAY 20G (CODE 931)", 12.502],
	"ESOW00SOR-S06A1.00": ["SOUP MÌ HOÀNH THÁNH TÔM 227G", 10.618],
	"ESOX0000SOR-A09.BB": ["KHOAI MÔN VIÊN ÁO XÙ 30G", 13.15],
	"ESOX0000SOR-A09.BD": ["KHOAI MÔN VIÊN ÁO XÙ 30G", 13.15],
	"ESOX0000SOR-A09.BE": ["KHOAI MÔN VIÊN ÁO XÙ 30G", 13.15],
	"ESOX0000SOR-A09.BF": ["KHOAI MÔN VIÊN ÁO XÙ 30G (CODE 931)", 13.15],
	"ESTB0000000ST22.AC": ["BÁNH BAO CHAY 40G", 8.93],
	"ESTB0000000ST27.AB": ["Bánh bao đậu đỏ 40g", 8.81],
	"ESTB0000000ST35.0A": ["BÁNH BAO SANDWICH 36G", 8.895],
	"ESTB0000048491A.00": ["BÁNH BAO SANDWICH 30G, VE", 7.886],
	"ESTC0000000ST15.AC": ["CHẢ GIÒ BỘT MÌ TÔM 20G", 6.812],
	"ESTC000000ST15A.00": ["CHẢ GIÒ BỘT MÌ TÔM 20G", 6.812],
	"ESTC000000ST15A.0A": ["CHẢ GIÒ BỘT MÌ TÔM 20G", 6.812],
	"ESTC0000000ST16.0C": ["CHẢ GIÒ BỘT MÌ CHAY 20G", 6.812],
	"ESTC000000ST16A.00": ["CHẢ GIÒ BỘT MÌ CHAY 20G", 6.812],
	"ESTX000000ST18A.00": ["Khoai tây cuộn tôm 30G", 7.202],
	"ESTX000000ST18B.00": ["KHOAI TÂY CUỘN TÔM 30G", 7.412],
	"ESTC0000000ST24.AB": ["SAMOSA CHAY 50G", 10.792],
	"ESTC00000043335.00": ["CHẢ GIÒ BỘT MÌ CHAY 20G (CHIÊN SẴN)", 10.887],
	"ESTC000000ST24A.00": ["SAMOSA CHAY 50G", 11.268],
	"ESTC000000ST24A.0A": ["SAMOSA CHAY 50G (PHUN DL719)", 11.268],
	"ESTD0000000ST02.CE": ["DELI TÔM 18G", 7.438],
	"ESTD0000000ST04.0C": ["DELI CHAY 18G", 7.428],
	"ESTD000000ST07B.BC": ["Dimsum thập cẩm hấp", 7.623],
	"ESTD000000ST07B.CD": ["DIMSUM THẬP CẨM HẤP", 7.59],
	"ESTD000000ST07B.CE": ["DIMSUM THẬP CẨM HẤP (PHUN DL719, PHUN LÔ TÔM)", 7.59],
	"ESTD000000ST14A.BD": ["HOÀNH THÁNH TÔM 20G", 6.817],
	"ESTD000000ST14A.BE": ["HOÀNH THÁNH TÔM 20G (PHUN DL719, PHUN LÔ TÔM)", 6.817],
	"ESTH000000ST05A.AC": ["HÁ CẢO TÔM 30G", 10.181],
	"ESTH000000ST05A.AD": ["HÁ CẢO TÔM 30G (PHUN DL719 + LÔ TÔM)", 10.181],
	"ESTH000000ST06A.AC": ["Sủi cảo tôm hẹ 25g", 6.928],
	"ESTH000000ST26A.AC": ["SỦI CẢO TÔM 25G", 6.974],
	"ESTH000000ST28A.AC": ["SỦI CẢO CHAY 37.5g", 7.04],
	"ESTS0000000ST40.0B": ["SỦI CẢO CHAY 25G", 10.657],
	"ESTS0000000ST42.0B": ["SỦI CẢO CHAY 25G", 10.658],
	"ESTS0000000ST42.0C": ["SỦI CẢO CHAY 25G, NG (PHUN DL719)", 10.658],
	"ESTS000000ST10B.BC": ["XÍU MẠI HOA CÚC 25G", 8.696],
	"ESTS000000ST10B.BD": ["XÍU MẠI HOA CÚC 25G (PHUN DL719,  PHUN  LÔ TÔM)", 8.696],
	"ESGD000000ESG01.00": ["BÁNH HẸ CHAY 35G", 10.738],
	"ESYD00000ESYS11.00": ["BÁNH CUỐN TÔM 48G", .288],
	"ESYS00000ESYI02.00": ["HÁ CẢO TÔM 25G (2KG/PA)", 10.645],
	"ESYS00000ESYI02.0B": ["HÁ CẢO TÔM 25G (2KG/PA)", 10.645],
	"ESYS00000ESYI02.0C": ["HÁ CẢO TÔM 25G (2KG/PA) (PHUN LÔ TÔM TRÊN BAO BÌ)", 10.645],
	"ESYZ00000ESYZ02.00": ["HÁ CẢO TÔM 25G (2KG/PA)", 10.645],
	"ETFB00011167300.0B": ["BÁNH BAO MÈ ĐEN 95G, NG", 8.876],
	"ETFB00000111673.0A": ["BÁNH BAO MÈ ĐEN 95G, NG", 8.876],
	"ETFB00011167400.0A": ["BÁNH BAO SANDWICH 80G, NG", 7.024],
	"ETFB00000111674.00": ["BÁNH BAO SANDWICH 80G, NG", 7.024],
	"ETFC00000113069.AB": ["CHẢ GIÒ TÔM QUE 25G", 13.59],
	"ETFC00011306900.AC": ["CHẢ GIÒ TÔM QUE 25G (CODE 931)", 13.59],
	"ETFC00000113072.BB": ["CHẢ GIÒ TÔM ỐNG TRÚC 8G, 1KG/PA", 11.052],
	"ETFC00011307200.BC": ["CHẢ GIÒ TÔM ỐNG TRÚC 8G, 1KG/PA (code 931)", 11.052],
	"ETFC00000113073.AB": ["CHẢ GIÒ TÔM CUA 25G, 1KG/PA", 10.702],
	"ETFC00000113074.BB": ["CHẢ GIÒ TÔM ỐNG TRÚC 8G, 300G/PA", 12.4],
	"ETFC00011307400.BC": ["CHẢ GIÒ TÔM ỐNG TRÚC 8G, 300G/PA (CODE 931)", 12.4],
	"ETFC00000113076.BB": ["CHẢ GIÒ TÔM 16.67G", 13.513],
	"ETFC00000113076.CC": ["CHẢ GIÒ BÁNH TRÁNG TÔM 16.67G", 13.513],
	"ETFC00000113077.AB": ["CHẢ GIÒ TÔM CUA MINI 12.5G", 12.116],
	"ETFC00000113079.A0": ["BÁNH SAMOSA CHAY 15G", 12.498],
	"ETFC00011307900.AA": ["SAMOSA CHAY 15G (code 931)", 12.498],
	"ETFC00011307900.AB": ["SAMOSA CHAY 15G (PHUN DL719)", 12.498],
	"ETFC00000113084.00": ["CHẢ GIÒ CHAY 25G", 13.334],
	"ETFC00011308400.0A": ["CHẢ GIÒ CHAY 25G (CODE 931)", 13.334],
	"ETFC00011308400.0B": ["CHẢ GIÒ CHAY 25G (PHUN DL719)", 13.334],
	"ETFC00000113085.AB": ["CHẢ GIÒ TÔM CUA 25G, 500G/PA", 13.332],
	"ETFC00000113090.AB": ["CHẢ GIÒ BÁNH TRÁNG TÔM PTO 25G", 13.75],
	"ETFC00011309000.AC": ["CHẢ GIÒ TÔM PTO 25G (CODE 931)", 13.75],
	"ETFC00011309000.AE": ["CHẢ GIÒ TÔM PTO 25G (PHUN DL719, TĂNG KÍCH THƯỚC THÙNG)", 13.796],
	"ETFC00000113091.AB": ["GỎI CUỐN TÔM 45G", 14.908],
	"ETFC00011309100.AC": ["GỎI CUỐN TÔM 45G (CODE 931)", 14.908],
	"ETFC00011309100.AD": ["GỎI CUỐN TÔM 45G (PHUN DL719)", 14.908],
	"ETFC00000113944.A0": ["CHẢ GIÒ RẾ CHAY 25G, NG", 11.95],
	"ETFC00000113944.AA": ["CHẢ GIÒ RẾ CHAY 25G, NG", 11.95],
	"ETFC00011394400.00": ["CHẢ GIÒ RẾ CHAY 25G, NG (CODE 931)", 11.95],
	"ETFC00011394400.0A": ["CHẢ GIÒ RẾ CHAY 25G, NG (PHUN DL719)", 11.95],
	"ETFC00000113999.00": ["CHẢ GIÒ BỘT MÌ CHAY 30G, ĐÔNG SỐNG)", 11.592],
	"ETFC00011399900.0A": ["CHẢ GIÒ BỘT MÌ CHAY 30G, NG (code 931)", 11.592],
	"ETFC00011392500.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM CHIÊN 25G, 500G/PA, NG", 13.302],
	"ETFC00011392500.0B": ["CHẢ GIÒ BÁNH TRÁNG TÔM CHIÊN 25G, 500G/PA, NG (CODE 931)", 13.302],
	"ETFC00011392600.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM CHIÊN 25G, 1KG/PA, NG (CODE: ETF-S02.", 10.789],
	"ETFC00011392600.0A": ["CHẢ GIÒ BÁNH TRÁNG TÔM CHIÊN 25G, 1KG/PA, NG (CODE 931)", 10.789],
	"ETFD00011170000.AE": ["BÁNH BAO ĐÀO TIÊN 40G", 6.045],
	"ETFD00000111700.AC": ["BÁNH BAO ĐÀO TIÊN 40G", 6.045],
	"ETFD00000111721.AA": ["BÁNH BAO KHOAI MÔN 40G", 8.325],
	"ETFD00000111722.BB": ["BÁNH BAO HẢI SẢN HẸ 40G", 8.31],
	"ETFD00000113019.BA": ["BÁNH CUỐN TÔM 25G", 11.095],
	"ETFD00000113040.AA": ["HOÀNH THÁNH TÔM 20G", 12.659],
	"ETFD00000113040.BB": ["HOÀNH THÁNH TÔM 20G", 12.659],
	"ETFD00000113040.CC": ["HOÀNH THÁNH TÔM 20G", 12.674],
	"ETFD00011304000.CD": ["HOÀNH THÁNH TÔM 20G (CODE 931)", 12.674],
	"ETFD00011304000.CE": ["HOÀNH THÁNH TÔM 20G (PHUN DL719)", 12.674],
	"ETFD00000113059.BB": ["HOÀNH THÁNH HẢI SẢN 15G", 7.502],
	"ETFD00000113059.CC": ["HOÀNH THÁNH HẢI SẢN 15G", 7.502],
	"ETFD00011305900.CD": ["HOÀNH THÁNH HẢI SẢN 15G (CODE 931)", 7.502],
	"ETFD00011305900.CE": ["HOÀNH THÁNH HẢI SẢN 15G (PHUN DL719)", 7.502],
	"ETFD00000113064.CC": ["BÁNH QUAI VẠC NHÂN TÔM 50G", 10.847],
	"ETFD00000113064.DD": ["BÁNH QUAI VẠC NHÂN TÔM 50G", 10.851],
	"ETFD00011306400.DE": ["BÁNH QUAI VẠC NHÂN TÔM 50G (CODE 931)", 10.851],
	"ETFD00011306400.DF": ["BÁNH QUAI VẠC NHÂN TÔM 50G (PHUN DL719)", 10.851],
	"ETFD00000113066.BB": ["DIM SUM THẬP CẨM (HẤP)", 11.67],
	"ETFD00000113066.CC": ["DIM SUM THẬP CẨM (HẤP)", 11.67],
	"ETFD000113066NL.00": ["DIM SUM THẬP CẨM HẤP 500G/PA (code 931)", 11.67],
	"ETFD011306600BE.0A": ["DIM SUM THẬP CẨM HẤP 500G/PA (CODE 931)", 11.67],
	"ETFD00000113066.CD": ["DIM SUM THẬP CẨM HẤP 500G/PA (CODE 931)", 11.67],
	"ETFD00011306600.CD": ["DIM SUM THẬP CẨM HẤP 500G/PA (CODE 931)", 11.67],
	"ETFD00011306600.CE": ["DIM SUM THẬP CẨM HẤP 500G/PA (PHUN DL719)", 11.67],
	"ETFD00000113067.CD": ["DIM SUM THẬP CẨM (CHIÊN)", 11.792],
	"ETFD00000113067.DE": ["DIM SUM RÁN NGẬP TRONG DẦU 520G/PA", 11.796],
	"ETFD00000113088.BB": ["BÁNH XẾP TÔM 25G, 1KG/PA", 10.735],
	"ETFD00011308800.BD": ["BÁNH XẾP TÔM 25G, 1KG/PA (PHUN DL719)", 10.735],
	"ETFD00000113096.AA": ["BÁNH CUỐN HẢI SẢN 35G", 13.932],
	"ETFD00011391600.00": ["DIM SUM RÁN NGẬP TRONG DẦU 520G/PA, NG (CODE: ETF-S26B1.21, ", 11.845],
	"ETFD00011391600.0B": ["DIM SUM RÁN NGẬP TRONG DẦU 520G/PA, NG (CODE 931)", 11.845],
	"ETFD00011391600.0C": ["DIM SUM RÁN NGẬP TRONG DẦU 520G/PA, NG (PHUN DL719)", 11.89],
	"ETFH00000112970.BB": ["HÁ CẢO TÔM HOÀNG GIA 15G, 1KG/PA", 11.41],
	"ETFH00011297000.BC": ["HÁ CẢO TÔM HOÀNG GIA 15G, 1KG/PA (CODE 931)", 11.41],
	"ETFH00000112971.BB": ["HÁ CẢO TÔM HOÀNG GIA 25G, 1KG/PA", 10.878],
	"ETFH00011297100.BD": ["HÁ CẢO TÔM HOÀNG GIA 25G, 1KG/PA (CODE 931)", 10.878],
	"ETFH00000112972.BC": ["HÁ CẢO TÔM HOÀNG GIA 30G, 1KG/PA", 10.842],
	"ETFH00011297200.BD": ["HÁ CẢO TÔM HOÀNG GIA 30G, 1KG/PA (code 931)", 10.842],
	"ETFH00011297200.BF": ["HÁ CẢO TÔM HOÀNG GIA 30G, 1KG/PA (PHUN DL719)", 10.842],
	"ETFH00000113061.BB": ["HÁ CẢO TÔM 25G, 2KG/PA", 10.673],
	"ETFH00000113061.CC": ["HÁ CẢO TÔM 25G, 2KG/PA", 10.7],
	"ETFH00011306100.CD": ["HÁ CẢO TÔM 25G, 2KG/PA (code 931)", 10.7],
	"ETFH00011306100.CE": ["HÁ CẢO TÔM 25G, 2KG/PA (PHUN  DL719)", 10.7],
	"ETFH00000113065.BB": ["HÁ CẢO TÔM 3 MÀU 25G", 10.77],
	"ETFH00000113065.CC": ["HÁ CẢO TÔM 3 MÀU 25G", 10.77],
	"ETFH00011306500.CD": ["HÁ CẢO TÔM 3 MÀU 25G (CODE 931)", 10.77],
	"ETFH00011306500.CE": ["HÁ CẢO TÔM 3 MÀU 25G (PHUN DL719)", 10.77],
	"ETFH011306500NL.00": ["HÁ CẢO TÔM 3 MÀU 25G. (CODE 931)", 10.815],
	"ETFH00000113070.BB": ["HÁ CẢO TÔM 25G, 500G/PA", 11.513],
	"ETFH00000113070.CC": ["HÁ CẢO TÔM 25G, 500G/PA", 11.523],
	"ETFH00011307000.CD": ["HÁ CẢO TÔM 25G, 500G/PA, code 931", 11.523],
	"ETFH00011307000.CE": ["HÁ CẢO TÔM 25G, 500G/PA (PHUN DL719)", 11.523],
	"ETFH0011307000I.00": ["HÁ CẢO TÔM 25G, 500G/PA (CODE 931)", 11.523],
	"ETFH00000113092.BB": ["HÁ CẢO TÔM HÌNH HOA HỒNG 33.33G", 11.25],
	"ETFH00011309200.BC": ["HÁ CẢO TÔM HÌNH HOA HỒNG 33.33G (CODE 931)", 11.25],
	"ETFH00011309200.BD": ["HÁ CẢO TÔM HÌNH HOA HỒNG 33.33G (PHUN DL719)", 11.25],
	"ETFH00000113098.BB": ["HÁ CẢO TÔM 25G, 1KG/PA", 11.158],
	"ETFH00000113098.CC": ["HÁ CẢO TÔM 25G, 1KG/PA", 11.162],
	"ETFH00011309800.CD": ["HÁ CẢO TÔM 25G, 1KG/PA (CODE 931)", 11.162],
	"ETFH00011309800.CE": ["HÁ CẢO TÔM 25G, 1KG/PA (PHUN DL719)", 11.162],
	"ETFH011309800NL.00": ["HÁ CẢO TÔM 25G, 1KG/PA (CODE 931)", 11.162],
	"ETFH0011309800I.00": ["HÁ CẢO TÔM 25G, 1KG/PA (CODE 931)", 11.162],
	"ETFH00000113107.BB": ["HÁ CẢO TÔM HẸ 25G (VỎ HÁ CẢO)", 11.792],
	"ETFH00011310700.BC": ["HÁ CẢO TÔM HẸ 25G (VỎ HÁ CẢO) - CODE 931", 11.792],
	"ETFH00011310700.BD": ["HÁ CẢO TÔM HẸ 25G (VỎ HÁ CẢO) (PHUN DL719)", 11.792],
	"ETFH00000113109.BB": ["HÁ CẢO TÔM HẸ 25G", 11.782],
	"ETFH00011310900.BD": ["SỦI CẢO TÔM HẸ 25G (CODE 931)", 11.782],
	"ETFH00011310900.BE": ["SỦI CẢO TÔM HẸ 25G (PHUN DL719)", 11.782],
	"ETFH011310900NL.00": ["SỦI CẢO TÔM HẸ 25G (CODE 931)", 11.782],
	"ETFH00000113110.BB": ["HÁ CẢO TÔM HOÀNG GIA 15G, 450G/PA", 15.574],
	"ETFH00011311000.BC": ["HÁ CẢO TÔM HOÀNG GIA 15G, 450G/PA (CODE 931)", 15.574],
	"ETFH00000113111.BB": ["HÁ CẢO TÔM HOÀNG GIA 25G, 500G/PA", 11.69],
	"ETFH00011311100.BC": ["HÁ CẢO TÔM HOÀNG GIA 25G, 500G/PA (CODE 931)", 11.55],
	"ETFH00000113112.BB": ["HÁ CẢO TÔM HOÀNG GIA 30G, 450G/PA", 14.981],
	"ETFH00011311200.BC": ["HÁ CẢO TÔM HOÀNG GIA 30G, 450G/PA (CODE 931)", 14.981],
	"ETFH00011311200.BD": ["HÁ CẢO TÔM HOÀNG GIA 30G, 450G/PA (PHUN DL719)", 14.981],
	"ETFH011311200NL.00": ["HÁ CẢO TÔM HOÀNG GIA 30G, 450G/PA.(CODE 931)", 14.981],
	"ETFH00000113942.00": ["HÁ CẢO CHAY 25G, NG", 11.653],
	"ETFH00000113942.A0": ["HÁ CẢO CHAY 25G, NG", 11.653],
	"ETFH00011394200.AA": ["HÁ CẢO CHAY 25G, NG (CODE 931)", 11.653],
	"ETFH00000113943.00": ["HÁ CẢO BÁNH BAO CHAY 25G, NG, GF", 11.77],
	"ETFH00000113943.AA": ["HÁ CẢO BÁNH BAO CHAY 25G, NG, GF", 11.77],
	"ETFH0000113098P.00": ["HÁ CẢO TÔM 25G, 1KG/PA", 11.173],
	"ETFH0000113109P.00": ["HÁ CẢO TÔM HẸ 25G ( RIDER VÀ THÙNG CARTON DESIGN RIÊNG CHO T", 11.762],
	"ETFH0000113109P.0A": ["HÁ CẢO TÔM HẸ 25G ( RIDER VÀ THÙNG CARTON DESIGN RIÊNG CHO T", 11.762],
	"ETFH0011310900P.0B": ["HÁ CẢO TÔM HẸ 25G (CODE 931)", 11.762],
	"ETFH00011313800.00": ["HÁ CẢO TÔM HOÀNG GIA 30G, 2KG/PA, NG (CODE: ETF-S02A.21, NON", 10.7],
	"ETFH00011313800.0A": ["HÁ CẢO TÔM HOÀNG GIA 30G, 2KG/PA, NG (CODE 931)", 10.7],
	"ETFH00011313800.0B": ["HÁ CẢO TÔM HOÀNG GIA 30G, 2KG/PA, NG (PHUN DL719)", 10.7],
	"ETFH0011297200B.00": ["HÁ CẢO TÔM HOÀNG GIA 30G, 1KG/PA", 10.842],
	"ETFH0011306100B.00": ["HÁ CẢO TÔM 25G, 2KG/PA", 10.673],
	"ETFH0011306100I.00": ["HÁ CẢO TÔM 25G, 2KG/PA", 10.674],
	"ETFH0011306100I.0A": ["HÁ CẢO TÔM 25G, 2KG/PA (CODE 931)", 10.674],
	"ETFH0011306100P.00": ["HÁ CẢO TÔM 25G, 2KG/PA", 10.673],
	"ETFH0011306100P.0A": ["HÁ CẢO TÔM 25G, 2KG/PA", 10.673],
	"ETFH0011306100P.0B": ["HÁ CẢO TÔM 25G, 2KG/PA (code 931)", 10.673],
	"ETFH0011307000P.AA": ["HÁ CẢO TÔM 25G, 500G/PA", 11.523],
	"ETFH0011307000P.AB": ["HÁ CẢO TÔM 25G, 500G/PA", 11.523],
	"ETFH0011307000P.AC": ["HÁ CẢO TÔM 25G, 500G/PA (CODE 931)", 11.5231],
	"ETFH0011309800B.00": ["HÁ CẢO TÔM 25G, 1KG/PA", 11.173],
	"ETFH0011309800P.AA": ["HÁ CẢO TÔM 25G, 1KG/PA", 11.173],
	"ETFH0011309800P.AB": ["HÁ CẢO TÔM 25G, 1KG/PA", 11.173],
	"ETFH0011309800P.AC": ["HÁ CẢO TÔM 25G, 1KG/PA (CODE 931)", 11.173],
	"ETFH011297200BE.00": ["HÁ CẢO TÔM HOÀNG GIA 30G, 1KG/PA", 10.842],
	"ETFH011297200BE.0A": ["HÁ CẢO TÔM HOÀNG GIA 30G, 1KG/PA (CODE 931)", 10.842],
	"ETFH011297200BE.0B": ["HÁ CẢO TÔM HOÀNG GIA 30G, 1KG/PA (PHUN DL719)", 10.842],
	"ETFH011297200SP.00": ["HÁ CẢO TÔM HOÀNG GIA 30G, 1KG/PA", 10.842],
	"ETFH011297200SP.0A": ["HÁ CẢO TÔM HOÀNG GIA 30G, 1KG/PA (CODE 931)", 10.842],
	"ETFH011297200NL.00": ["HÁ CẢO TÔM HOÀNG GIA 30G, 1KG/PA. (Code 931)", 10.842],
	"ETFH011306100BE.00": ["HÁ CẢO TÔM 25G, 2KG/PA", 10.7],
	"ETFH011306100BE.0A": ["HÁ CẢO TÔM 25G, 2KG/PA (CODE 931)", 10.7],
	"ETFH011306100BE.0B": ["HÁ CẢO TÔM 25G, 2KG/PA (PHUN DL719)", 10.7],
	"ETFH011306100NL.00": ["HÁ CẢO TÔM 25G, 2KG/PA. (CODE 931)", 10.7],
	"ETFH011306500BE.00": ["HÁ CẢO TÔM 3 MÀU 25G", 10.815],
	"ETFH011306500BE.0A": ["HÁ CẢO TÔM 3 MÀU 25G", 10.815],
	"ETFH011306500BE.0B": ["HÁ CẢO TÔM 3 MÀU 25G (PHUN DL719)", 10.815],
	"ETFH011309800BE.00": ["HÁ CẢO TÔM 25G, 1KG/PA", 11.173],
	"ETFH011309800BE.0A": ["HÁ CẢO TÔM 25G, 1KG/PA (CODE 931)", 11.173],
	"ETFH011309800BE.0B": ["HÁ CẢO TÔM 25G, 1KG/PA (PHUN DL719)", 11.173],
	"ETFK00000112981.CE": ["MÌ XÀO TÔM 300G", 6.97],
	"ETFK00000112981.DF": ["MÌ XÀO TÔM 300G", 6.97],
	"ETFK00000113036.AB": ["BÁNH XÈO TÔM 200G", 12.052],
	"ETFK00011303600.AC": ["BÁNH XÈO TÔM 200G (CODE 931)", 12.052],
	"ETFK00011303600.AD": ["BÁNH XÈO TÔM 200G (PHUN DL719)", 12.052],
	"ETFK00000113039.BC": ["BÁNH NẾP LÁ SEN 80G. CODE\n 301.14 (KHÔNG DÙNG KHAY XỐP TỪ LS", 11.14],
	"ETFK00011303900.BD": ["BÁNH NẾP TÔM LÁ SEN 80G (CODE 931)", 11.14],
	"ETFK00011303900.BE": ["BÁNH NẾP TÔM LÁ SEN 80G (PHUN DL719)", 11.14],
	"ETFK00000113060.AB": ["BÁNH BÈO TÔM 15G", 8.268],
	"ETFK00000113060.BC": ["BÁNH BÈO TÔM 15G", 8.268],
	"ETFK00000113101.AA": ["CÀNG GHẸ BỌC TÔM 31.25G", 10.412],
	"ETFK00000113102.AA": ["CHẠO TÔM 62.5G", 11.34],
	"ETFK00000113102.BB": ["CHẠO TÔM 62.5G", 11.34],
	"ETFK00011310200.BC": ["CHẠO TÔM 62.5G (CODE 931)", 11.35],
	"ETFK00011310200.BD": ["CHẠO TÔM 62.5G (PHUN DL719)", 11.35],
	"ETFK00000113979.00": ["PHỞ XÀO TÔM 300G, NG", 7.395],
	"ETFH00011343200.00": ["HÁ CẢO TÔM 25G, KB", 10.692],
	"ETFH00011343200.0A": ["HÁ CẢO TÔM 25G, KB (PHUN DL719)", 10.692],
	"NUTK00000009265.00": ["BÁNH QUAI VẠC NHÂN GHẸ NƯỚNG VÀ CHIMICHURRI SAUCE 830G/BOX", 8.612],
	"AUTK0ORNENCC830.00": ["BÁNH QUAI VẠC NHÂN GHẸ NƯỚNG VÀ CHIMICHURRI SAUCE 830G/BOX", 8.612],
	"CATC00000535817.00": ["BÁNH BAO SẦU RIÊNG 40G", 5.56],
	"ETFR00011392100.BE": ["BÁNH CUỐN TÔM 50G + NƯỚC TƯƠNG 50G", 10.39],
	"ETFR0011392100A.BD": ["BÁNH CUỐN TÔM 50G + NƯỚC TƯƠNG 50G", 10.39],
	"ETFS00000113062.DB": ["XÍU MẠI TÔM 25G, 2KG/PA", 10.682],
	"ETFS00000113062.EC": ["XÍU MẠI TÔM 25G, 2KG/PA", 10.682],
	"ETFS00011306200.ED": ["XÍU MẠI TÔM 25G, 2KG/PA (CODE 931)", 10.682],
	"ETFS00011306200.EE": ["XÍU MẠI TÔM 25G, 2KG/PA (PHUN DL719)", 10.682],
	"ETFS00000113082.CB": ["XÍU MẠI TÔM 25G, 500G/PA", 11.555],
	"ETFS00000113082.DC": ["XÍU MẠI TÔM 25G, 500G/PA", 11.555],
	"ETFS00000113103.CB": ["XÍU MẠI TÔM 25G, 1KG/PA", 10.988],
	"ETFS00000113103.DC": ["XÍU MẠI TÔM 25G, 1KG/PA", 10.988],
	"ETFS00011310300.DD": ["XÍU MẠI TÔM 25G, 1KG/PA (code 931)", 10.99],
	"ETFS00011310300.DE": ["XÍU MẠI TÔM 25G, 1KG/PA (code 931)", 10.99],
	"ETFS00011310300.DF": ["XÍU MẠI TÔM 25G, 1KG/PA (PHUN DL719)", 10.99],
	"ETFS00000113941.00": ["SỦI CẢO CHAY NẤM 25G, NG, GF", 11.815],
	"ETFS00000113941.A0": ["SỦI CẢO CHAY NẤM 25G, NG, GF", 11.832],
	"ETFS0000113082P.00": ["XÍU MẠI TÔM 25G, 500G/PA (RIDER VÀ THÙNG DESIGN RIÊNG CHO TH", 11.555],
	"ETFS0000113082P.AA": ["XÍU MẠI TÔM 25G, 500G/PA (RIDER VÀ THÙNG DESIGN RIÊNG CHO TH", 11.555],
	"ETFS00011308200.DE": ["XÍU MẠI TÔM 25G, 500G/PA (CODE 931)", 11.555],
	"ETFS0000113103P.00": ["XÍU MẠI TÔM 25G, 1KG/PA", 10.988],
	"ETFS0011310300P.AA": ["XÍU MẠI TÔM 25G, 1KG/PA", 10.988],
	"ETFS0011310300P.AC": ["XÍU MẠI TÔM 25G, 1KG/PA", 10.99],
	"ETFS011310300BE.00": ["XÍU MẠI TÔM 25G, 1KG/PA", 10.99],
	"ETFS0011310300P.AD": ["XÍU MẠI TÔM 25G, 1KG/PA (CODE 931)", 10.99],
	"ETFX00000113009.AA": ["1. FROZEN SHRIMP SPRING ROLLS 25G X 4 PCS - CODE: ETF-S02.24", 13.325],
	"ETFX00011300900.AD": ["CÁ TẨM BỘT 30G (PHUN DL719)", 13.325],
	"ETFX00011300900.AC": ["CÁ TẨM BỘT 30G", 13.325],
	"ETFX00011300900.AB": ["CÁ TẨM BỘT 30G", 13.325],
	"ETNB000000ETN01.AA": ["BÁNH BAO SANDWICH 50G, NG", 8.942],
	"ETNB000000ETN01.00": ["BÁNH BAO SANDWICH 50G", 8.942],
	"ETNB000000ETN02.00": ["BÁNH BAO SANDWICH 40G", 7.234],
	"EVC0000000EVC03.CB": ["HÁ CẢO TÔM 25G", 11.632],
	"EVFB000000EVF06.0A": ["BÁNH BAO SANDWICH TÔM 55G", 8.978],
	"EVFS000000EVF05.AA": ["CHẢ GIÒ RẾ HẢI SẢN 20.8G, NG", 11.67],
	"EVL1D0000090812.AA": ["MIX DIMSUM HẤP 500G/PA", 11.33],
	"EVL1D0000090814.00": ["BÁNH CUỐN TÔM 48G & SOY SAUCE 60G, KB, HL", 9.574],
	"EVL1D0000090814.AB": ["BÁNH CUỐN TÔM 48G & SOY SAUCE 60G, KB, LOGO HA", 9.574],
	"EVL1D0000090814.AA": ["BÁNH CUỐN TÔM 48G & SOY SAUCE 60G, KB, HL", 9.574],
	"EVL1D000090814A.00": ["BÁNH CUỐN TÔM 48G & SOY SAUCE 60G", 9.696],
	"EVL1H0000090801.00": ["HÁ CẢO TÔM 25G", 11.55],
	"EVL1H0000090801.0A": ["HÁ CẢO TÔM 25G, KB, LOGO HA", 11.53],
	"EVL1H0000090801.0B": ["HÁ CẢO TÔM 25G, KB, LOGO HA", 11.53],
	"EVL1H0000090818.00": ["HÁ CẢO TÔM 22G, KB", 9.79],
	"EVL1H0000090818.0A": ["HÁ CẢO TÔM 22G, KB", 9.79],
	"EVL1H0000090818.0B": ["HÁ CẢO TÔM 22G, KB, HA", 9.79],
	"EVL3H0000090818.00": ["HÁ CẢO TÔM 22G, KB, LOGO HA", 9.79],
	"EVL3H0000090818.0A": ["HÁ CẢO TÔM 22G, KB, LOGO HA", 9.79],
	"EVL1H0000090868.0A": ["HÁ CẢO TÔM HOÀNG GIA 35G, KB, LOGO HA", 10.63],
	"EVL1H0000090868.0B": ["HÁ CẢO TÔM HOÀNG GIA 35G, KB, LOGO HA", 10.63],
	"EVL3H0000090868.00": ["HÁ CẢO TÔM HOÀNG GIA 35G, KB", 10.63],
	"EVL1H000090801A.00": ["HÁ CẢO TÔM 25G", 11.643],
	"EVL1H000090818A.00": ["HÁ CẢO TÔM 22G", 9.962],
	"EVL1S0000090802.00": ["XÍU MẠI TÔM 25G", 11.34],
	"EVL3C0000090808.00": ["CHẢ GIÒ RẾ TÔM PTO 25G, KB", 11.18],
	"EVL3C0000090808.0A": ["CHẢ GIÒ RẾ TÔM PTO 25G, KB", 11.18],
	"EVL2D0000090812.00": ["DIMSUM MIX HẤP (HÁ CẢO TÔM, XÍU MẠI TÔM, XÍU MẠI 4 MÀU, YUBA", 11.513],
	"EVL3D0000090812.00": ["MIX DIMSUM HẤP (HÁ CẢO TÔM, XÍU MẠI TÔM, XÍU MẠI 4 MÀU, YUBA", 11.513],
	"EVL2H0000090831.00": ["HÁ CẢO TÔM 25G, KB", 10.745],
	"EVL2S0000090832.00": ["XÍU MẠI TÔM 25G, KB", 10.745],
	"EVL3D0000090814.00": ["BÁNH CUỐN TÔM 48G VÀ SOY SAUCE 60G, KB, LOGO HA", 9.635],
	"EVL3D0000090874.00": ["BÁNH CUỐN TÔM 50G & SOY SAUCE 60G, KB, LOGO HA", 10.41],
	"EVL3H0000090801.00": ["HÁ CẢO TÔM 25G, KB, LOGO HA", 11.35],
	"EVL3H0000090801.0B": ["HÁ CẢO TÔM 25G, KB, LOGO HA", 11.35],
	"EVL3H0000090801.0C": ["HÁ CẢO TÔM 25G, KB, LOGO HA", 11.35],
	"EVL3H0000090822.00": ["HÁ CẢO CHAY 22G, KB", 10.31],
	"EVL3H0000090822.0A": ["HÁ CẢO CHAY 22G, KB", 10.31],
	"EVL3H0000090831.00": ["HÁ CẢO TÔM 25G, KB, LOGO HA", 10.695],
	"EVL3H0000090863.00": ["HÁ CẢO TÔM 25G, KB, LOGO HA, 1KG/PA", 10.771],
	"EVL3S0000090802.00": ["XÍU MẠI TÔM 25G, KB, LOGO HA", 11.34],
	"EVL3S0000090802.0A": ["XÍU MẠI TÔM 25G, KB, LOGO HA", 11.34],
	"EVL3S0000090802.0B": ["XÍU MẠI TÔM 25G, KB, LOGO HA", 11.34],
	"EVL3S0000090802.0C": ["XÍU MẠI TÔM 25G, KB, LOGO HA", 11.34],
	"EVLB00000090809.00": ["BÁNH TÔM HẸ 30G", 10.406],
	"EVLB00000090870.00": ["BÁNH BAO CHIÊN 32G", 8.64],
	"EVLC00000090805.AC": ["CHẢ GIÒ TÔM CUA 25G", 11.17],
	"EVLC00000090806.AB": ["CHẢ GIÒ BÁNH TRÁNG PTO 25G", 11.42],
	"EVL3C0000090806.00": ["CHẢ GIÒ BÁNH TRÁNG PTO 25G, KB", 11.42],
	"EVLC00000090807.AB": ["CHẢ GIÒ RẾ TÔM CUA 25G", 11.42],
	"EVLC00000090807.BC": ["CHẢ GIÒ RẾ TÔM CUA 25G", 11.42],
	"EVLC00000090808.AC": ["CHẢ GIÒ RẾ TÔM PTO 25G", 11.18],
	"EVLC00000090808.BD": ["CHẢ GIÒ RẾ TÔM PTO 25G, KB", 11.18],
	"EVLC00000090811.AC": ["CHẢ GIÒ TÔM MINI 10G", 11],
	"EVLC00000090811.BD": ["CHẢ GIÒ BÁNH TRÁNG MINI 10G, KB", 11],
	"EVLC00000090811.BE": ["CHẢ GIÒ BÁNH TRÁNG MINI 10G, KB (PHUN DL719)", 11],
	"EVL3C0000090811.00": ["CHẢ GIÒ BÁNH TRÁNG MINI 10G, KB", 11],
	"EVLC00000090821.AC": ["CHẢ GIÒ TÔM QUE 25G", 11.254],
	"EVLC00000090821.BD": ["CHẢ GIÒ TÔM QUE 25G, KB", 11.27],
	"EVLC00000090821.BE": ["CHẢ GIÒ TÔM QUE 25G, KB (PHUN DL719)", 11.27],
	"EVL3C0000090821.00": ["CHẢ GIÒ TÔM QUE 25G, KB", 11.27],
	"EVL3C0000090821.0A": ["CHẢ GIÒ TÔM QUE 25G, KB", 11.27],
	"EVLD00000090812.CE": ["MIX DIMSUM HẤP (HÁ CẢO TÔM, XÍU MẠI TÔM, XÍU MẠI 4 MÀU, YUBA", 11.33],
	"EVLD00000090813.00": ["BÁNH BỘT LỌC NHÂN TÔM 25G, KB", 11.15],
	"EVLD00000090813.0A": ["BÁNH BỘT LỌC NHÂN TÔM 25G, KB (PHUN DL719)", 11.15],
	"EVL3D0000090813.00": ["BÁNH BỘT LỌC NHÂN TÔM 25G, KB", 11.15],
	"EVLD00000090814.BD": ["BÁNH CUỐN TÔM 48G, SAUCE 60G CODE: EVL", 9.574],
	"EVLD00000090814.CE": ["BÁNH CUỐN TÔM 48G VÀ SOY SAUCE 60G", 9.574],
	"EVLD00000090814.DG": ["BÁNH CUỐN TÔM 48G VÀ SOY SAUCE 60G, KB", 9.574],
	"EVLD00000090814.DH": ["BÁNH CUỐN TÔM 48G VÀ SOY SAUCE 60G, KB", 9.574],
	"EVLD00000090816.00": ["SỦI CẢO CHAY 37.5G CODE: EVL-S01.18", 7.197],
	"EVLD00000090824.BD": ["SỦI CẢO TÔM 22G", 9.073],
	"EVLD00000090824.CE": ["SỦI CẢO TÔM 22G", 9.073],
	"EVLD00000090824.CF": ["SỦI CẢO TÔM 22G, KB (PHUN DL719)", 9.073],
	"EVL3D0000090824.00": ["SỦI CẢO TÔM 22G, KB", 9.073],
	"EVLD00000090874.00": ["BÁNH CUỐN TÔM 50G & SOY SAUCE 60G, KB, LOGO HA", 10.41],
	"EVLH00000090800.BC": ["HÁ CẢO TÔM HẸ 25G", 11.55],
	"EVLH00000090800.CD": ["HÁ CẢO TÔM HẸ 25G", 11.55],
	"EVLH00000090800.CE": ["HÁ CẢO TÔM HẸ 25G (PHUN DL719)", 11.55],
	"EVL3H0000090800.00": ["HÁ CẢO TÔM HẸ 25G, KB", 11.55],
	"EVLH00000090801.BD": ["HÁ CẢO TÔM 25G, ROYAL, CT TF", 11.53],
	"EVLH00000090801.DF": ["HÁ CẢO TÔM 25G, ROYAL, CT TF", 11.53],
	"EVLH00000090801.EG": ["HÁ CẢO TÔM 25G, ROYAL, CT TF", 11.35],
	"EVLH00000090810.AA": ["HÁ CẢO TÔM BA MÀU 22G", 11.771],
	"EVLH00000090817.BC": ["HÁ CẢO TÔM GỪNG 25G CODE: EVL-208.18", 8.6475],
	"EVLH00000090818.BB": ["HÁ CẢO TÔM 22G", 9.925],
	"EVLH00000090818.CD": ["HÁ CẢO TÔM 22G, KB", 9.79],
	"EVLH00000090818.CF": ["HÁ CẢO TÔM 22G, KB (PHUN DL719)", 9.79],
	"EVLH00000090819.BB": ["HÁ CẢO HẢI SẢN 25G", 8.1],
	"EVLH00000090819.CC": ["HÁ CẢO HẢI SẢN 25G", 8.1],
	"EVL3H0000090819.00": ["HÁ CẢO HẢI SẢN 25G, KB", 8.1],
	"EVLH00000090822.0B": ["HÁ CẢO CHAY 22G", 10.31],
	"EVLH00000090822.BD": ["HÁ CẢO CHAY 22G", 10.31],
	"EVLH00000090828.BC": ["BÁNH HẸ TÔM ÁP CHẢO 25G", 12.173],
	"EVLH00000090828.CD": ["BÁNH HẸ TÔM ÁP CHẢO 25G", 12.173],
	"EVLH00000090828.CE": ["BÁNH HẸ TÔM ÁP CHẢO 25G (PHUN DL719)", 12.173],
	"EVL3H0000090828.00": ["BÁNH HẸ TÔM ÁP CHẢO 25G, KB", 12.173],
	"EVLH00000090868.AB": ["HÁ CẢO TÔM HOÀNG GIA 35G", 10.63],
	"EVLH00000090868.CD": ["HÁ CẢO TÔM HOÀNG GIA 35G, KB", 10.63],
	"EVLH00000090868.CE": ["HÁ CẢO TÔM HOÀNG GIA 35G, KB (PHUN DL719)", 10.63],
	"EVLK00000090803.BC": ["CÀNG BAO TÔM 41.7G", 11.55],
	"EVLK00000090804.BC": ["CHẠO TÔM 62.5G", 11.55],
	"EVL3K0000090804.00": ["CHẠO TÔM 62.5G, KB", 11.55],
	"EVLS00000090802.BD": ["XÍU MẠI TÔM 25G", 11.34],
	"EVLS00000090802.CE": ["XÍU MẠI TÔM 25G", 11.34],
	"EVLS00000090802.DF": ["XÍU MẠI TÔM 25G", 11.34],
	"EVLT00000090871.00": ["CHUỐI CHIÊN 100G", 8.996],
	"EVL3T0000090871.00": ["CHUỐI CHIÊN 100G", 8.995],
	"EVLT00000090872.00": ["CHUỐI CHIÊN DỪA 100G", 8.996],
	"EVLT00000090873.00": ["CHUỐI CHIÊN MÈ ĐEN 100G (CODE:)", 8.996],
	"EVL3T0000090873.00": ["CHUỐI CHIÊN MÈ ĐEN 100G", 7.125],
	"EVL3T0000090873.0A": ["CHUỐI CHIÊN MÈ ĐEN 100G \n(CODE EVL3 873.0A TĂNG 10CM CHIỀU C", 7.125],
	"EVLC00000090840.00": ["CHẢ GIÒ BÁNH TRÁNG PTO 25G VÀ SỐT CHUA NGỌT 225G/BOX, KB, HA", 6.044],
	"EVLC00000090841.00": ["CHẢ GIÒ RẾ TÔM 25G VÀ SỐT CHUA NGỌT 225G/BOX, KB, HA (DL719)", 6.274],
	"EVLC00000090842.00": ["CHẢ GIÒ RẾ TÔM PTO 25G VÀ SỐT CHUA NGỌT 225G/BOX, KB, HA (DL", 6.274],
	"EVLC00000090843.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G VÀ SỐT CHUA NGỌT 225G/BOX, KB, HA", 5.698],
	"EVRB000000EVR15.00": ["BÁNH BAO MÍT NON 55G", 8.499],
	"EVRB000000EVR15.0A": ["BÁNH BAO MÍT NON 55G", 8.814],
	"EVRC000000EVR01.0D": ["RẾ MỰC PHÔMAI 20G (BALL) (CODE:828A1.16)", 9.596],
	"EVRC000000EVR13.00": ["RẾ MỰC 20G (TRÒN), NG", 10.297],
	"EWB1000000ASD01.00": ["BÁNH MÌ TÔM MÈ 15G, TÔM BAP 4*", 2.035],
	"EWB100000ASD01A.00": ["BÁNH MÌ TÔM MÈ 15G, TÔM BAP 4*, NG\nSPEC 120 - 140 (AM BAO)", 2.035],
	"EWB10EWB1ASD01B.00": ["BÁNH MÌ TÔM MÈ 15G, TÔM BAP 4*, NG\nSPEC 120 - 140 (AM BAO)", 2.035],
	"EWB1C00000MOR19.00": ["CHẢ GIÒ BỘT MÌ RAU CỦ HOISIN CHIÊN 18G, VE", 7.655],
	"EWB1C00000MOR19.A0": ["CHẢ GIÒ BỘT MÌ RAU CỦ HOISIN CHIÊN 18G, VE", 7.655],
	"EWB1C0000ICE28A.00": ["TÔM FILO 12G, TÔM BAP 4*", 6.67],
	"EWB1C0000ICE28B.00": ["TÔM FILO 12G, TÔM BAP 4*, NG", 6.67],
	"EWB1C0000ICE28B.0A": ["TÔM FILO 12G, TÔM BAP 4*, NG (SPEC: 170G - 203g ÂM BAO)", 6.61],
	"EWB1G00ECPMOR12.A0": ["CHẢ GIÒ BỘT MÌ HOA 20G. CODE: 31A4.18", 10.012],
	"EWB1K00000ICE25.00": ["BÁNH MÌ TÔM NƯỚNG 30G", 3.164],
	"EWB1K00000ICE26.00": ["BỘ MIX CHIÊN 675G/HỘP\n 1. BÁNH MÌ TÔM MÈ CHIÊN 15G\n 2. TÚI M", 8.338],
	"EWB1K00000ICE27.00": ["BÁNH MÌ TÔM CHIÊN 35G", 3.459],
	"EWB1K00000ICE27.A0": ["BÁNH MÌ TÔM MÈ 35G, TÔM ASC, NG", 3.495],
	"EWB1K00000ICE30.00": ["BÁNH BỘT MÌ ÁO TÔM MÈ CHIÊN 30G, TÔM BAP 4*", 4.206],
	"EWB1K00000ICE31.00": ["BÁNH MÌ TOPPING NHÂN TÔM 25G, TÔM BAP 4* \n(SPEC: 200G - 224G", 6.325],
	"EWB1K0000ICE24A.00": ["BÁNH MÌ TÔM MÈ CHIÊN 15G", 4.831],
	"EWB1K000BIFFS02.00": ["BURGER MÍT 100G, VE (200G/BOX)", 2.997],
	"EWB1K000BIFFS03.00": ["CHẠO MÍT CHIÊN 50G (50G-55G), VE (700G/BAG)", 3.1],
	"EWB1K000BIFFS04.00": ["BURGER MÍT 100G, VE (800G/BAG)", 2.682],
	"EWB1K000ECPFS06.0A": ["BÁNH CÁ THÁI 30G", 7.706],
	"EWB1K00MOR17A.2.00": ["ĐH - BÁNH MÌ TÔM XIÊN QUE TẨM MÈ 25G", 7.662],
	"EWB1T0ECPMOR03A.0A": ["BÁNH RAU CỦ CHIÊN TEMPURA 30G", 7.43],
	"EWB2C00000TES20.00": ["BÁNH MÌ TÔM MÈ 15G, TÔM TESCO APPROVED", 4.043],
	"EWB2C00000TES20.0A": ["BÁNH MÌ TÔM MÈ 15G, TÔM TESCO APPROVED", 4.043],
	"EWB2C00000TES20.0B": ["BÁNH MÌ TÔM MÈ 15G, TÔM TESCO APPROVED", 4.043],
	"EWB2C00000TES23.00": ["BỘ MIX CHIÊN 490G/HỘP, TÔM TESCO APPROVED", 7.592],
	"EWB2C00000TES23.0A": ["BỘ MIX CHIÊN 490G/HỘP, TÔM TESCO APPROVED", 7.4],
	"EWB2C00000TES23.0B": ["BỘ MIX CHIÊN 490G/HỘP, TÔM TESCO APPROVED", 7.292],
	"EWB2C00000TES23.AB": ["BỘ MIX CHIÊN 490G/HỘP, TÔM TESCO APPROVED", 7.36],
	"EWB2C00000TES24.00": ["BỘ MIX DELIGHTS 240G/KHAY, TÔM TWA, NG (CODE 838A.23, HÀNG C", 7.504],
	"EWB2C0000TES20A.00": ["BÁNH MÌ TÔM MÈ 15G, TÔM TWA, NG", 3.947],
	"EWB2C0000TES23A.00": ["BỘ MIX CHIÊN 392G/HỘP, TÔM TWA, NG", 5.937],
	"EWB3C0000TES23A.00": ["BỘ MIX CHIÊN 392G/HỘP, TÔM TWA, NG", 5.937],
	"EWB3CEWB2TES23A.00": ["BỘ MIX CHIÊN 392G/HỘP, TÔM TWA, NG", 5.937],
	"EWB2K00000MOR18.00": ["BỘ CHIÊN GLUTEN FREE 300G/HỘP, GF", 4.883],
	"EWB2K00000MOR29.00": ["BÁNH MÌ TÔM MÈ 15G TÔM BAP 4* CODE 29C1.24", 2.938],
	"EWB3C00000TES20.0B": ["BÁNH MÌ TÔM MÈ 15G, TÔM TESCO APPROVED", 4.043],
	"EWB3C00000TES23.0B": ["BỘ MIX CHIÊN 490G/HỘP, TÔM TESCO APPROVED", 7.4],
	"EWB3C0000ICE28A.00": ["TÔM FILO 12G, TÔM BAP 4*", 6.725],
	"EWB3C0000TES20A.00": ["BÁNH MÌ TÔM MÈ 15G, TÔM TWA, NG", 3.947],
	"EWIC000000EWI07.0A": ["SAMOSA CHAY VỎ XANH CHIÊN 15G (CODE 425A.22)", 6.46],
	"EWIG000000EWI01.AB": ["HÁ CẢO TÔM 20G", 7.028],
	"EWIG000000EWI02.BC": ["TÚI MAY MẮN 20G (CODE EWI\n -S04B.20 (HẤP, TÚM MIỆNG))", 5.826],
	"EWIH000000EWI03.0A": ["HÁ CẢO CHAY MÀU XANH 25G (HÌNH TÚI TIỀN)", 11.63],
	"EWIH000000EWI04.AB": ["HÁ CẢO TÔM HÌNH SÒ ĐIỆP MÀU VÀNG 25G", 11.63],
	"EWIH000000EWI05.AA": ["HÁ CẢO HẢI SẢN MÀU ĐEN HÌNH TAM GIÁC 25G", 12.15],
	"EWIH000000EWI06.00": ["HÁ CẢO TÔM MÀU TÍM HÌNH THUYỀN 25G", 11.897],
	"HGFB000000HGF10.00": ["BÁNH MÌ TÔM 70G", 7.584],
	"HGFC000000HGF09.00": ["CHẢ GIÒ RẾ TÔM PTO 25G", 1.182],
	"HGFW00000HGF02.AA": ["HOÀNH THÁNH TÔM CHIÊN 20G", 7.64],
	"HIGP000000HIG04.00": ["ĐẾ PIZZA NƯỚNG 160G 10 INCHES (HA)", 4.742],
	"HIGP00000JIG001.00": ["ĐẾ PIZZA NƯỚNG 180G 10 INCHES, HA", 5.156],
	"HIGP00000JIG002.00": ["ĐẾ PIZZA NƯỚNG 180G 10 INCHES, HA", 5.137],
	"HKFC000000HKF01.00": ["CHẢ GIÒ TÔM QUE 25G (RAW)", 9.88],
	"HKFC000000HKF02.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM QUE 55G (RAW)", 9.514],
	"HKFK000000HKF03.00": ["BẮP QUE TẨM GIA VỊ NƯỚNG 500G/PA", 10.945],
	"HLH0000000HLH29.00": ["CHẢ GIÒ BỘT MÌ EDAMAME QUE 10G", 5.71],
	"HLHB000000HLH33.00": ["BÁNH BAO SANDWICH 30G", 8.185],
	"HLHB000000HLH33.0A": ["BÁNH BAO SANDWICH 30G", 8.185],
	"HLHB000000HLH33.AB": ["BÁNH BAO SANDWICH 30G (HA)", 8.185],
	"HLHB000000HLH46.AD": ["BÁNH MÌ SANDWICH TÔM MÈ 25G", 5.41],
	"HLHB000000HLH46.BF": ["BÁNH MÌ SANDWICH TÔM MÈ 25G (HALAL)", 5.41],
	"HLHB000000HLH87.00": ["BÁNH TART NHÂN GÀ KIỂU HONG KONG", 6.575],
	"HLHB000000HLH95.00": ["BÁNH BAO MÀN THẦU 30G (HALAL)", 3.625],
	"HLHB00000HLH104.00": ["BÁNH BAO ĐÀO TIÊN NHÂN HẠT SEN 50G (LOGO HA)", 8.07],
	"HLHB00000HLH105.00": ["KHOAI LANG TEMPURA 17.8-22.2G/PC (LOGO HA) (CODE HLH-S02B.21", 5.645],
	"HLHB00000HLH106.00": ["BÁNH BAO HÌNH PANDA NHÂN HẠT SEN 40G", 8.588],
	"HLHB00000HLH106.0A": ["BÁNH BAO HÌNH PANDA NHÂN HẠT SEN 40G", 8.588],
	"HLHB00000HLH107.00": ["BÁNH BAO ĐÀO TIÊN NHÂN HẠT SEN 35G (LOGO HA)", 5.888],
	"HLHB00000HLH110.0A": ["BÁNH BAO HÌNH PANDA NHÂN THỊT HEO RAU CỦ 40G", 8.743],
	"HLHB00000HLH111.0A": ["BÁNH BAO HÌNH PANDA NHÂN ĐẬU ĐỎ 40G", 8.743],
	"HLHB00000HLH112.0A": ["BÁNH BAO HÌNH PANDA NHÂN MÈ ĐEN 40G", 8.738],
	"HLHB00000HLH115.00": ["BÁNH BAO XOẮN 50G (LOGO HA)", 5.82],
	"HLHB00000HLH33A.00": ["BÁNH BAO SANDWICH 30G (IN HÌNH, LOGO HA)", 8.164],
	"HLHB00000HLH33B.00": ["BÁNH BAO SANDWICH 30G (IN HÌNH PANDA, LOGO HA)", 8.158],
	"HLHC000000HLH39.AA": ["CHẢ GIÒ RẾ PTO 15G", 4.86],
	"HLHC000000HLH39.AB": ["CHẢ GIÒ RẾ PTO 15G", 4.86],
	"HLHC000000HLH39.BC": ["CHẢ GIÒ RẾ PTO 15G", 4.86],
	"HLHC00000HLH07A.0D": ["CHẢ GIÒ TÔM QUE 25G", 9.83],
	"HLHC00000HLH07A.0E": ["CHẢ GIÒ TÔM QUE 25G", 9.83],
	"HLHC00000HLH102.00": ["BÁNH PANCAKE 40G", 5.482],
	"HLHC00000HLH27B.00": ["CHẢ GIÒ RẾ KHOAI MỠ 25G, LOGO HA", 6.542],
	"HLHC00000HLH27A.0A": ["CHẢ GIÒ RẾ KHOAI MỠ 25G (CODE: JIG17)", 6.542],
	"HLHC00000HLH27A.AC": ["CHẢ GIÒ RẾ KHOAI MỠ 25G (HA)", 6.542],
	"HLHC00000HLH27A.AD": ["CHẢ GIÒ RẾ KHOAI MỠ 25G (LOGO HA)", 6.542],
	"HLHC00000HLH27A.AE": ["CHẢ GIÒ RẾ KHOAI MỠ 25G (LOGO HA)", 6.542],
	"HLHD000000HLH06.0C": ["HOÀNH THÁNH HẢI SẢN 15G", 7.69],
	"HLHF000000HLH84.00": ["HÀNH TÂY TẨM BỘT", 11.13],
	"HLHF000000HLH85.00": ["HÀNH TÂY TẨM BỘT CHIÊN (CODE : 517C1.22)", 10.19],
	"HLHH000000HLH15.00": ["SỦI CẢO TÔM BẮP CẢI PTO 25G", 12],
	"HLHH000000HLH15.AA": ["SỦI CẢO TÔM BẮP CẢI PTO 25G", 12],
	"HLHK000000HLH16.AE": ["BÁNH MÌ TÔM MÈ 36G", 6.122],
	"HLHK000000HLH16.AF": ["BÁNH MÌ TÔM MÈ 36G", 6.122],
	"HLHK000000HLH19.AB": ["BÁNH MÌ TÔM MÈ 70G", 12.13],
	"HLHK000000HLH47.0C": ["RAU CỦ CHIÊN TÔM 50G", 4.936],
	"HLHK000000HLH65.00": ["BÍ ĐỎ TEMPURA 17-22G/PC", 5.605],
	"HLHK000000HLH65.0A": ["BÍ ĐỎ TEMPURA 17-22G/PC", 5.605],
	"HLHK000000HLH65.AB": ["BÍ ĐỎ TEMPURA 17-22G (HALAL)", 5.605],
	"HLHK000000HLH66.00": ["CÀ TÍM TEMPURA 12.4-23.3 G/PC", 5.605],
	"HLHK000000HLH66.0A": ["CÀ TÍM TEMPURA 12.4-23.3 G/PC", 5.605],
	"HLHK000000HLH66.AB": ["CÀ TÍM TEMPURA 12.4-23.3G (HALAL)", 5.605],
	"HLHK000000HLH68.00": ["CÁ TRỨNG TẨM BỘT 25G +/-3G (CHIÊN SẴN)", 4.554],
	"HLHK000000HLH73.00": ["TÔM CUỘN KHOAI TÂY 30G", 9.548],
	"HLHK000000HLH74.0A": ["ĐẾ PIZZA NƯỚNG 2 MẶT 270G, ĐK 29.5-31CM", 3.931],
	"HLHK000000HLH74.0B": ["ĐẾ PIZZA NƯỚNG 2 MẶT 270G, ĐK 29.5-31CM", 3.931],
	"HLHK000000HLH74.AC": ["ĐẾ PIZZA NƯỚNG 2 MẶT 270G, 12 INCHES, ĐK 29.5-31CM (HALAL)", 3.931],
	"HLHK000000HLH79.00": ["BỘ MIX RAU CỦ CHIÊN 450G\n 1. 150G PUMPKIN TEMPURA\n 2. 150G E", 6.152],
	"HLHK000000HLH97.00": ["BỘ MIX RAU CỦ CHIÊN CÀ TÍM BÍ ĐỎ VÀ KHOAI LANG, LOGO HA", 11.066],
	"HLHK000000HLH98.00": ["ĐẾ PIZZA NƯỚNG 2 MẶT 120G, 8 INCHES (LOGO HA)", 5.508],
	"HLHK000000HLH99.00": ["ĐẾ PIZZA NƯỚNG 2 MẶT 80G, 6 INCHES (LOGO HA)", 5.951],
	"HLHK00000HLH100.00": ["BÁNH PANCAKE NHÂN ĐẬU ĐỎ 50G (IN HÌNH, LOGO HA)", 6.71],
	"HLHK00000HLH103.00": ["BÁNH BỘT MÌ 30G (LOGO HA)", 9.756],
	"HLHK00000HLH108.00": ["BÌ NGÒI TEMPURA 1KG/PA (LOGO HA) (CODE 864.24)", 5.61],
	"HLHK00000HLH109.00": ["BÁNH PANCAKE NHÂN ĐẬU ĐỎ 50G (IN HÌNH, LOGO HA)", 6.71],
	"HLHK00000HLH113.00": ["NẤM TEMPURA 1KG (LOGO HALAL)", 5.549],
	"HLHK00000HLH114.00": ["CỦ SEN TEMPURA 1KG (LOGO HALAL)", 10.82],
	"HLHK00000HLH118.00": ["BÁNH PANCAKE NHÂN CUSTARD 50G (IN HÌNH KHỦNG LONG)", 6.77],
	"HLHK00000HLH119.00": ["BÁNH PANCAKE NHÂN LÁ DỨA 50G (IN HÌNH KHỦNG LONG)", 6.77],
	"HLHK0000HLH100A.00": ["BÁNH PANCAKE NHÂN ĐẬU ĐỎ 50G (LOGO HA)", 6.71],
	"HLHP00000000093.00": ["BÁNH NAAN BƠ TỎI (HÌNH OVAL) 70G (HALAL)", 10.038],
	"HLHP00000000093.0A": ["BÁNH NAAN BƠ TỎI (HÌNH OVAL) 70G (HALAL)", 9.971],
	"HLHP000000HLH43.0B": ["PIZZA MARGHERITA 18CM, 168G", 2.148],
	"HLHP000000HLH50.0A": ["MAGHERITA CALZONE 70G", 3.305],
	"HLHP000000HLH54.AB": ["BÁNH PHÔ MAI PANCAKE MINI 10G", 6.08],
	"HLHP000000HLH54.AC": ["BÁNH PHÔ MAI PANCAKE MINI 10G", 6.13],
	"HLHP000000HLH55.AB": ["BÁNH MÌ BƠ TỎI PHÔ MAI 40G", 4.8],
	"HLHP000000HLH55.AC": ["BÁNH MÌ BƠ TỎI PHÔ MAI 40G", 4.82],
	"HLHP000000HLH55.BD": ["BÁNH MÌ BƠ TỎI PHÔ MAI 40G (HA)", 4.852],
	"HLHP000000HLH55.BE": ["BÁNH MÌ BƠ TỎI PHÔ MAI 40G (HA)", 4.852],
	"HLHP000000HLH62.AA": ["BÁNH MÌ SỐT TRỨNG CÁ TUYẾT MAYONNAISE 40G", 4.793],
	"HLHP000000HLH62.AB": ["BÁNH MÌ SỐT TRỨNG CÁ TUYẾT MAYONNAISE 40G", 4.793],
	"HLHP00000HLH49A.00": ["ĐẾ PIZZA NƯỚNG 180G, 10 INCHES", 5.219],
	"HLHP00000HLH49A.AA": ["ĐẾ PIZZA NƯỚNG 2 MẶT 180G, 10 INCHES (HALAL)", 5.219],
	"HLHP00000HLH89A.00": ["BÁNH NAAN (HÌNH OVAL) 60G (LOGO HA)", 3.715],
	"HSFH000000HSF05.00": ["HÁ CẢO TÔM 25G", 11.571],
	"HSFP000000HSF03.00": ["PIZZA MARGHERITA 115G, 15-16CM", 3.384],
	"HSFP000000HSF03.0A": ["PIZZA MARGHERITA 115G, 15-16CM", 3.384],
	"HSFP000000HSF04.00": ["PIZZA 4 LOẠI PHÔ MAI 110G, 15-16CM", 3.384],
	"HSFP000000HSF04.0A": ["PIZZA 4 LOẠI PHÔ MAI 110G, 15-16CM", 3.264],
	"HSFP000000HSF06.00": ["PIZZA HẢI SẢN 120G 6 INCHES", 3.521],
	"HSFP000000HSF07.00": ["PIZZA MAYONAISE VÀ BẮP 120G 6 INCHES", 3.521],
	"HSVP000000HSV01.0A": ["PIZZA BỐN LOẠI PHÔ MAI 230G 9 INCHES", 6.949],
	"HSVP000000HSV02.0A": ["PIZZA MARGHERITA PIZZA 230G 9 INCHES", 6.929],
	"HSVP000000HSV03.0A": ["PIZZA TÔM SỐT MAYO 230G 9 INCHES", 6.964],
	"HWF00000FA2142V.00": ["HOÀNH THÁNH TÔM 9.5G", 1.825],
	"HWF00000FA5102V.00": ["HOÀNH THÁNH TÔM 9.5GR/PC . CODE 947.16", 1.727],
	"JAC2F0000JAC210.00": ["XOÀI KEO CẮT VUÔNG 25MM, 300G/PA", 4.01],
	"JAC2F0000JAC211.00": ["XOÀI KEO CẮT QUE 45G (40G-50G)", 9.36],
	"JAC2F0000JAC211.0A": ["XOÀI KEO CẮT QUE 45G (40G-50G)", 9.47],
	"JAC2F0000JAC212.00": ["XOÀI KEO CẮT VUÔNG 15MM, 500G/PA", 10.86],
	"JAC2V0000JAC205.0B": ["BẮP HẤP ĐÔNG LẠNH 280-350G, NG", 11.55],
	"JBEC000000JBE01.00": ["BÁNH TÁO NƯỚNG 60G", 11.614],
	"JBEC000000JBE03.00": ["BÁNH MÌ HÌNH DƯA LƯỚI 25G", 4.69],
	"JBEP000000JBE02.00": ["ĐẾ BÁNH PIZZA 200G", 8.235],
	"JBEP000000JBE02.0A": ["ĐẾ BÁNH PIZZA 200G", 8.283],
	"JCF2C00000JCF14.00": ["CHẢ GIÒ RẾ DÀI 35G", 5.052],
	"JCF2D00000JCF11.00": ["RAU CỦ CHIÊN TÔM 50G", 5.11],
	"JCF3C00000JCF14.00": ["CHẢ GIÒ RẾ DÀI 35G", 5.062],
	"JCF3C00000JCF19.00": ["CHẢ GIÒ TÔM QUE 25GR", 4.486],
	"JCFB000000JCF17.0B": ["PIZZA QUAI VẠC CÀ RI THÁI 100G", 1.652],
	"JCFB000000JCF18.0B": ["PIZZA QUAI VẠC PHÔ MAI CÀ CHUA 100G", 1.652],
	"JCFB000000JCF20.00": ["PIZZA QUAI VẠC KEM CÁ HỒI 100G", 1.652],
	"JCFB000000JCF21.00": ["PIZZA QUAI VẠC TRỨNG CÁ TUYẾT VÀ KHOAI TÂY NGHIỀN 100G", 1.652],
	"JCFB000000JCF25.00": ["BÁNH SAMOSA TÔM 30G, KB,NG", 9.18],
	"JCFB000000JCF27.00": ["BÁNH TART TRỨNG NƯỚNG 25G", 8.318],
	"VHF00053900.0A": ["Bánh Cuốn Sò Điệp Nấm Truffle 50 G (1000 G)", 7.609],
	"VHF00053900.00": ["Bánh Cuốn Sò Điệp Nấm Truffle 50 G (1000 G)", 7.609],
	"JCFC000000JCF14.BE": ["CHẢ GIÒ RẾ DÀI 35G", 5.085],
	"JCFC000000JCF14.BD": ["CHẢ GIÒ RẾ DÀI 35G", 5.085],
	"JCFC000000JCF14.AC": ["CHẢ GIÒ RẾ DÀI 35G", 5.085],
	"JCFC000000JCF19.00": ["CHẢ GIÒ TÔM QUE 25G (PASTRY RAW)", 4.489],
	"JCFD000000JCF11.0A": ["RAU CỦ CHIÊN TÔM 50G", 5.23],
	"JCFH000000JCF15.AA": ["HÁ CẢO TÔM 15G", 10.75],
	"JCHB00000A-1409.0A": ["BÁNH CUỐN TÔM QUE 9G", 8.015],
	"JCHB00000A-1701.00": ["BÁNH CUỐN TÔM QUE 20G", 10.574],
	"JCHB00000A-2403.0A": ["BÁNH CUỐN TÔM QUE 9G (CODE JCH-S03A1.23, KISCO'S PA)", 6.46],
	"JCHB00000A-2403.0B": ["BÁNH CUỐN TÔM QUE 9G", 6.46],
	"JCHB00000A-2602.00": ["BÁNH CUỐN TÔM QUE 9G", 6.46],
	"JCHC000000A-209.0A": ["CHẢ GIÒ RẾ TÔM 16G, GF", 5.246],
	"JCHC00000A-1101.0A": ["CHẢ GIÒ RẾ GHẸ 10G", 10.937],
	"JCHC00000A-1106.0A": ["CG BỘT MÌ PHÔ MAI 6G, 50PC/PE", 3.385],
	"JCHC00000A-1106.0B": ["CG BỘT MÌ PHÔ MAI 6G, 50PC/PE", 3.39],
	"JCHC00000A-1603.0A": ["CHẢ GIÒ BỘT MÌ HẢI SẢN PHOMAI 25GR.", 1.47],
	"JCHC00000A-2002.00": ["BÁNH BAO SANDWICH 32G", 10.972],
	"JCHD000000A-205.AA": ["BÁNH CUỐN HẢI SẢN 25G, GF", 5.783],
	"JCHD000000A-205.AB": ["BÁNH CUỐN HẢI SẢN 25G, GF", 5.783],
	"JCHD00000A-1403.0A": ["BÁNH CUỐN TÔM 45G (CODE: UWL3694674)", 9.77],
	"JCHH00000A-1201.0A": ["HÁ CẢO TÔM 15G", 7.862],
	"JCHH00000A-1218.0A": ["TÔM VIÊN SỢI PASTRY 20G", 5.955],
	"JCHH00000A-1504.00": ["HÁ CẢO TÔM 20G", 4.518],
	"JCHH00000A-1504.0A": ["HÁ CẢO TÔM 20G", 4.518],
	"JCHH00000A-1505.00": ["SAMOSA KHOAI TÂY 15GR", 4.975],
	"JCHH00000A-1505.0A": ["SAMOSA KHOAI TÂY 15G", 4.975],
	"JCHH00000A-1506.00": ["SAMOSA CÀ RI 15G", 4.975],
	"JCHH00000A-1506.0A": ["SAMOSA CÀ RI 15G", 4.975],
	"JCHH00000A-1508.0A": ["HÁ CẢO HÌNH NGÔI SAO 20GR/PC", 4.425],
	"JCHH00000A-1508.0B": ["HÁ CẢO HÌNH NGÔI SAO 20G", 4.425],
	"JCHH00000A-1601.00": ["HÁ CẢO XANH 20G, định hình 3 cánh", 4.445],
	"JCHH00000A-1601.0A": ["HÁ CẢO XANH 20G, định hình 3 cánh", 4.445],
	"JCHH00000A-1802.00": ["HÁ CẢO HÌNH SÒ ĐIỆP 20G (485D.18)", 10.43],
	"JCHH00000A-1804.0A": ["HÁ CẢO TÔM 20G", 5.283],
	"JCHH00000A-1804.0B": ["HÁ CẢO TÔM 20G", 5.283],
	"JCHH00000A-1805.0A": ["HÁ CẢO XANH 20G, định hình bình thường", 5.283],
	"JCHH00000A-1805.0B": ["HÁ CẢO XANH 20G", 5.283],
	"JCHH00000A-1806.00": ["XÍU MẠI TÔM 21G (FOR COOP) (CODE: 887B6.18)", 4.676],
	"JCHH00000A-1806.0A": ["XÍU MẠI TÔM 21G", 4.676],
	"JCHH00000A-2301.00": ["HÁ CẢO TÔM 20G", 10.49],
	"JCHH00000A-2301.0A": ["HÁ CẢO TÔM 20G", 10.49],
	"JCHH00000A-2301.0B": ["HÁ CẢO TÔM 20G", 10.49],
	"JCHH00000A-2305.00": ["SỦI CẢO TÔM PTO 20G", 7.83],
	"JCHH00000A-2404.00": ["HÁ CẢO HÌNH SÒ ĐIỆP 20G (CODE 485D4.18, KISCO'S PA)", 10.462],
	"JCHH00000A-2404.0A": ["HÁ CẢO HÌNH SÒ ĐIỆP 20G (CODE 485D4.18, KISCO'S PA)", 10.481],
	"JCHH00000A-2404.0B": ["HÁ CẢO HÌNH SÒ ĐIỆP 20G (CODE 485D4.18, KISCO'S PA)", 10.481],
	"JCHK000000A-212.0A": ["BÁNH TRÁNG RẾ 4GR", 3.393],
	"JCHK000000A-212.0B": ["BÁNH TRÁNG RẾ 18CM, GF", 3.393],
	"JCHK000000A-801.AA": ["CHẢ GIÒ RẾ HẢI SẢN 30GR", 5.36],
	"JCHK00000A-2302.0A": ["RAU CỦ TÔM 25G", 4.625],
	"JCHK00000A-2302.0B": ["RAU CỦ TÔM 25G", 4.625],
	"JCHK00000A-2303.00": ["HOÀNH THÁNH TÔM 8G", 7.18],
	"JCHK00000A-2303.0A": ["HOÀNH THÁNH TÔM 8G", 7.18],
	"JCHK00000A-2303.0B": ["HOÀNH THÁNH TÔM 8G", 7.18],
	"JCHK00000A-2304.0A": ["XÍU MẠI TÔM 20G", 7.01],
	"JCHK00000A-2304.0C": ["XÍU MẠI TÔM 20G", 6.997],
	"JCHK00000A-2309.00": ["BỘ MIX RAU CỦ CHIÊN TÔM VÀ SAUCE 300G/PA", 6.83],
	"JCHK00000A-2401.00": ["BÁNH Ú NHÂN HẢI SẢN 40G, KB (CODE 198A2.19, KISCO PA)", 9.068],
	"JCHK00000A-2401.0A": ["BÁNH Ú NHÂN HẢI SẢN 40G, KB (CODE 198A2.19, KISCO PA)", 9.068],
	"JCHK00000A-2604.00": ["BÁNH Ú NHÂN HẢI SẢN 40G, KB (BỔ SUNG BỘT TRỨNG)", 9.049],
	"JCHK00000A-2402.00": ["HOÀNH THÁNH TÔM 8G, KB", 10.66],
	"JCHK00000A-2402.0A": ["HOÀNH THÁNH TÔM 8G, KB", 10.66],
	"JCHK00000A-2402.AA": ["HOÀNH THÁNH TÔM 8G, KB (DATE: 24 THÁNG)", 10.66],
	"JCOX000000JCO01.A0": ["XIÊN QUE THẬP CẨM XÙ PANKO 360G/BAG", 5.7],
	"JCOX000000JCO02.00": ["BÁNH PIZZA PHÔ MAI CÀ CHUA 110G, 15-16CM", 3.288],
	"JCOX000000JCO03.00": ["BÁNH XÈO MỰC 25G (CODE 513C1.23, HÀNG ÁP CHẢO)", 6.69],
	"JCOX000000JCO03.0A": ["BÁNH XÈO MỰC 25G (CODE 513C1.23, HÀNG ÁP CHẢO)\nKHỐI LƯỢNG CÂ", 6.725],
	"JGL0000000JGL11.AA": ["BÁNH XÈO 20G", 8.658],
	"JGL0000000JGL11.AB": ["BÁNH XÈO 20G", 8.658],
	"JGL0000000JGL15.00": ["Bánh xèo mực 25g", 11.16],
	"JGL0000000JGL19.00": ["ĐẾ BÁNH PIZZA NƯỚNG 10 INCHES 210G", 2.67],
	"JGL0000000JGL20.00": ["MARGHERITA PIZZA 6 INCH 100G", 2.441],
	"JGL0000000JGL21.00": ["BÁNH MARGHERITA PIZZA 85G", 2.132],
	"JGL0000000JGL21.0A": ["BÁNH MARGHERITA PIZZA 85G", 2.132],
	"JGL000000JGL12B.00": ["PIZZA 135G 7 INCH CODE 942A2.19", 2.232],
	"JGL000000JGL12C.0A": ["PIZZA 7 INCH 140G", 2.34],
	"JGL000000JGL18B.0A": ["PIZZA PHÔ MAI 7 INCH 140G", 2.333],
	"JGL000000JGL18B.0B": ["PIZZA PHÔ MAI 7 INCHES 140G", 2.333],
	"JGL000000JGL20B.0B": ["BÁNH MARGHERITA PIZZA 85G", 2.115],
	"JGLK000000JGL11.AB": ["BÁNH XÈO 20G", 8.658],
	"JGLP000000JGL19.00": ["ĐẾ BÁNH PIZZA NƯỚNG 10 INCHES 210G", 2.67],
	"JGLP000000JGL21.0A": ["BÁNH MARGHERITA PIZZA 85G", 2.132],
	"JGM00000000G107.00": ["BÁNH MÌ BƠ TỎI 20G", 4.81],
	"JGM00000000G110.0A": ["MARGHERITA PIZZA 230G 9 INCHES (22.5-24 CM )", 5.629],
	"JGM00000000G113.0A": ["BÁNH NƯỚNG PHÔ MAI 17G", 2.778],
	"JGMB0000000G102.00": ["BÁNH MÌ BURGER MÈ 35G", 7.876],
	"JGMB0000000G104.AC": ["BÁNH MÌ VIỆT NAM 80G", 5.77],
	"JGMB0000000G106.00": ["BÁNH MÌ TRÒN 30G", 4.46],
	"JGMB0000000G111.AB": ["BÁNH MÌ HOTDOG 50G", 3.9],
	"JGMB0000000G111.0A": ["BÁNH MÌ HOTDOG 50G", 3.92],
	"JGMB0000000G116.00": ["BÁNH MÌ TRÒN 20G", 5.214],
	"JGMB0000000G119.00": ["BÁNH MÌ BURGER TRÒN 50G", 4.505],
	"JGMB0000000G130.00": ["BÁNH BAO SANDWICH ÁP CHẢO 40G", 5.668],
	"JGMB0000000G140.0B": ["BÁNH MÌ HÌNH DƯA LƯỚI 25G", 5.97],
	"JGMB0000000G141.0A": ["BÁNH CHUỐI 370G", 9.815],
	"JGMB0000000G142.0A": ["BÁNH MUFFIN CHUỐI 43G", 9.67],
	"JGMB0000000G143.0A": ["BÁNH MUFFIN SOCOLA 45G", 10.054],
	"JGMB0000000G144.0A": ["BÁNH MUFFIN 43G", 9.67],
	"JGMB0000000G402.00": ["BÁNH MÌ HÌNH DƯA LƯỚI 25G", 6.068],
	"JGMK0000000G406.00": ["BÁNH QUẨY CHIÊN PHỦ ĐƯỜNG 17G, RTE", 4.492],
	"JGMP0000000G103.00": ["BÁNH NƯỚNG 40G (CODE JGM-S18A.22, 2CTN/ BUNDLE)", 5.4],
	"JGMP0000000G105.A0": ["ĐẾ PIZZA NƯỚNG 250G", 5.99],
	"JGMP0000000G108.0A": ["PIZZA PHÔ MAI TÔM 285G, 9 INCHES (22.5-24 CM)", 6.915],
	"JGMP0000000G109.0A": ["PIZZA PHÔ MAI CÁ NGỪ 285G 9 INCHES (22.5-24CM)", 6.886],
	"JGMP0000000G112.00": ["BÁNH NƯỚNG 20G", 5.596],
	"JGMP0000000G121.00": ["PIZZA TÔM VÀ RAU CỦ 230G", 5.627],
	"JGMP0000000G123.00": ["PIZZA CÁ NGỪ PHÔ MAI 230G", 5.637],
	"JGMP0000000G124.00": ["PIZZA PHÔ MAI TÔM 230G", 5.647],
	"JGMP0000000G125.00": ["PIZZA SỐT TÔM 190G", 4.847],
	"JGMP0000000G126.00": ["PIZZA SỐT CÀ CHUA 190G", 4.837],
	"JGMP0000000G127.00": ["PIZZA SỐT KEM SỮA 190G", 4.827],
	"JGMP0000000G128.0A": ["BÁNH NAAN NƯỚNG PHÔ MAI 120G", 5.562],
	"JGMP0000000G129.0A": ["BÁNH NAAN NƯỚNG PHÔ MAI 150G", 5.11],
	"JGMP0000000G132.00": ["PIZZA OVAL SỐT CÀ CHUA 125G", 4.575],
	"JGMP0000000G133.00": ["PIZZA OVAL MARGHERITA 150G", 5.285],
	"JGMP0000000G134.00": ["PIZZA OVAL PHOMAI 150G", 5.3],
	"JGMP0000000G135.00": ["PIZZA OVAL CORN VÀ MAYONAISE 160G", 5.585],
	"JGMP0000000G135.0A": ["PIZZA OVAL BẮP VÀ SỐT MAYONAISE 160G", 5.585],
	"JGMP0000000G201.0A": ["ĐẾ PIZZA NƯỚNG 80G 6 INCHES", 4.744],
	"JGMP0000000G202.0A": ["MARGHERITA PIZZA 100G 6 INCHES", 5.672],
	"JGMP0000000G203.00": ["ĐẾ PIZZA NƯỚNG 80G 6 INCHES", 4.744],
	"JGMP0000000G204.00": ["MARGHERITA PIZZA 100G 6 INCHES", 5.672],
	"JGMP0000000G301.00": ["PIZZA PHÔ MAI CÁ NGỪ 100G", 3.846],
	"JGMP0000000G302.00": ["PIZZA TÔM VÀ RAU CỦ 100G", 3.846],
	"JGMP0000000G303.00": ["PIZZA PHÔ MAI TÔM 100G", 3.846],
	"JGMP0000000G403.0A": ["BÁNH MÌ BƠ TỎI CẮT LÁT NƯỚNG 15G (RTE)", 3.915],
	"JGMP0000000G404.00": ["BÁNH MÌ VIỆT NAM 20G, RTE", 5.74],
	"JGMP0000000G405.0A": ["BÁNH MÌ CUỘN BƠ NƯỚNG 25G, RTE", 6.32],
	"JGMP0000000G405.AA": ["BÁNH MÌ CUỘN BƠ NƯỚNG 25G, RTE", 6.32],
	"JGMP0000000G501.00": ["PIZZA SỐT TÔM 200G, 8 INCHES", 2.176],
	"JGMP000000G501A.00": ["PIZZA SỐT TÔM 200G, 8 INCHES", 5.13],
	"JHIB000000JHI01.00": ["BÁNH MÌ 80G", 4.195],
	"JHIB000000JHI08.00": ["BÁNH BAO SANDWICH 36G", 8.086],
	"JHIB000000JHI17.00": ["BÁNH BAO SANDWICH 45G", 10],
	"JHIB000000JHI17.0B": ["BÁNH BAO SANDWICH 45G", 10.035],
	"JHIB000000JHI17.0A": ["BÁNH BAO SANDWICH 45G", 10],
	"JHIC000000JHI05.00": ["CHẢ GIÒ RẾ TÔM 25G (VÀO THÙNG NHÃN NẰM DƯỚI)\nspec 502 - 540", 10.906],
	"JHID000000JHI02.AA": ["BÁNH CUỐN HẢI SẢN 30G", 13.985],
	"JHID000000JHI06.0A": ["PIZZA QUAI VẠC CÀ CHUA PHÔ MAI VỚI RAU CỦ XÀO 125G", 11.22],
	"JHID000000JHI12.00": ["CỦ SEN CUỘN HẢI SẢN 15G", 6.29],
	"JHID000000JHI19.00": ["BÁNH CUỐN TÔM PTO RONG BIỂN 30G", 11.72],
	"JHIG000000JHI09.00": ["XÔI HẢI SẢN 40G", 8.93],
	"JHIG000000JHI09.0A": ["XÔI HẢI SẢN 40G\n(KHỐI LƯỢNG THÙNG KHÔNG VƯỢT QUA 15KG)", 11.44],
	"JHIG000000JHI09.0B": ["XÔI HẢI SẢN 40G\n(KHỐI LƯỢNG THÙNG KHÔNG VƯỢT QUA 15KG)", 11.44],
	"JHIG000000JHI10.00": ["XÔI HẢI SẢN 40G ( SPEC 152G 1 GÓI NHỎ - ÂM KHAY)\n (KHỐI LƯỢN", 13.86],
	"JHIG000000JHI10.0A": ["XÔI HẢI SẢN 40G ( SPEC 152G 1 GÓI NHỎ - ÂM KHAY)\n (KHỐI LƯỢN", 13.86],
	"JHIG000000JHI10.0B": ["XÔI HẢI SẢN 40G, 3 VIÊN/TÚI (ĐỔI QUY CÁCH ĐÓNG GÓI)", 10.979],
	"JHIG000000JHI10.0C": ["XÔI HẢI SẢN 40G, 3 VIÊN/TÚI (ĐỔI QUY CÁCH ĐÓNG GÓI)", 10.979],
	"JHIK000000JHI03.00": ["VIÊN HẢI SẢN RAU CỦ 45G (CODE: 485F.21)", 10.49],
	"JHIK000000JHI03.AA": ["VIÊN HẢI SẢN RAU CỦ 45G (SPEC CHUẨN: 407 - 435,  ÂM BAO)", 10.48],
	"JHIK000000JHI03.AB": ["VIÊN HẢI SẢN RAU CỦ 45G \n(SPEC CHUẨN: 407 - 435,  ÂM BAO)", 10.48],
	"JHIK000000JHI04.00": ["VIÊN HẢI SẢN RAU CỦ 25G", 10.95],
	"JHIK000000JHI04.A0": ["VIÊN HẢI SẢN RAU CỦ 25G\n(spec: 502 - 560)", 10.91],
	"JHIK000000JHI04.AA": ["VIÊN HẢI SẢN RAU CỦ 25G\n(spec: 502 - 560)", 10.91],
	"JHIK000000JHI07.00": ["CỦ SEN NHỒI NHÂN HẤP 28G", 9.9],
	"JHIK000000JHI11.00": ["MIẾNG CỦ SEN 45G", 9.79],
	"JHIK000000JHI14.00": ["CUỐN RẾ-RẾ MỰC PHÔ MAI 20G", 7.55],
	"JHIK000000JHI15.0A": ["TÔM FILO 12G", 7.478],
	"JHIK000000JHI15.0B": ["TÔM FILO 12G", 7.478],
	"JHIK000000JHI16.0A": ["NẤM DỒN TÔM PHỦ BỘT 20G", 13.047],
	"JHIK000000JHI16.0B": ["NẤM DỒN TÔM PHỦ BỘT 20G", 13.047],
	"JHIK00000JHI07A.0A": ["CỦ SEN NHỒI NHÂN HẤP 28G", 9.9],
	"JHIK00000JHI07A.0B": ["CỦ SEN NHỒI NHÂN HẤP 28G", 9.9],
	"JHIR000000JHI18.00": ["NẾP BẠCH TUỘC LÁ CHUỐI 50G (KHỐI LƯỢNG KHÔNG VƯỢT QUA 15KG)", 12.284],
	"JIG1K0000JIG105.AA": ["DƯA LƯỚI INTHANON VỎ VÀNG RUỘT XANH ĐÔNG LẠNH 500G", 10.75],
	"JIG1K0000JIG107.00": ["DƯA LƯỚI NỮ HOÀNG VỎ XANH RUỘT CAM ĐÔNG LẠNH 500G", 10.802],
	"JIG1K0000JIG108.00": ["DƯA LƯỚI DAIGOJI VỎ VÀNG RUỘT CAM ĐÔNG LẠNH 500G", 10.802],
	"JIG1P0000JIG103.00": ["ĐẾ PIZZA NƯỚNG 180G 10 INCHES, HA", 5.156],
	"JIG1P0000JIG104.00": ["ĐẾ PIZZA NƯỚNG 250G 12 INCHES, HA", 3.721],
	"JIGB000000JIG70.00": ["BÁNH TÁO 75G", 2.396],
	"JIGC000000JIG52.00": ["CHẢ GIÒ RẾ TÔM 22G", 5.419],
	"JIGC000000JIG52.0A": ["CHẢ GIÒ RẾ TÔM 22G", 4.49],
	"JIGC000000JIG54.00": ["CHẢ GIÒ RẾ VÀNG HẢI SẢN CÀ RI 20G", 4.53],
	"JIGC000000JIG54.0A": ["CHẢ GIÒ RẾ VÀNG HẢI SẢN CÀ RI 20G", 4.53],
	"JIGC000000JIG55.0A": ["HOÀNH THÁNH TÔM MAYO 20G", 4.848],
	"JIGC000000JIG56.00": ["DƯA LƯỚI VỎ XANH, RUỘT XANH ĐÔNG LẠNH 500G", 10.8],
	"JIGC000000JIG56.A0": ["DƯA LƯỚI VỎ XANH, RUỘT XANH ĐÔNG LẠNH 8G+-2G, 500G/PA", 10.8],
	"JIGC000000JIG56.B0": ["DƯA LƯỚI VỎ XANH, RUỘT XANH ĐÔNG LẠNH 8G+-2G, 500G/PA", 10.8],
	"JIGC00000JIG65A.00": ["CHẢ GIÒ RẾ BÍ ĐỎ 22G", 2.67],
	"JIGD000000JIG17.0A": ["CHẢ GIÒ RẾ KHOAI MỠ 25G", 6.4946],
	"JIGD000000JIG17.0B": ["CHẢ GIÒ RẾ KHOAI MỠ 25G.", 6.556],
	"JIGD000000JIG32.00": ["CHẢ GIÒ RẾ TÔM 22G (YAOKO) (CODE: 220E4B4.18)", 2.041],
	"JIGD000000JIG32.0A": ["CHẢ GIÒ RẾ TÔM 22G (NHÃN NẰM TRÊN)", 2.023],
	"JIGD000000JIG36.00": ["BÁNH CUỐN TÔM 46G", 3.28],
	"JIGD000000JIG37.00": ["BÁNH TÔM HẸ 30G (YAOKO) (CODE: JIG-S46B.18)", 4.399],
	"JIGD000000JIG44.00": ["CHẢ GIÒ BÁNH TRÁNG CUA 22G ((BAMBOO) JIG-S13A.20)", 3.98],
	"JIGD000000JIG44.0A": ["CHẢ GIÒ BÁNH TRÁNG CUA 22G ((BAMBOO) JIG-S13A.20)", 3.98],
	"JIGD000000JIG48.00": ["BÁNH XẾP TÔM 25G", 5.636],
	"JIGD000000JIG48.0A": ["BÁNH XẾP TÔM 25G", 5.636],
	"JIGD000000JIG59.00": ["BÁNH CUỐN NẤM 48G", 8.385],
	"JIGD000000JIG67.0A": ["BÁNH TÔM HẸ 25G", 2.796],
	"JIGD00000JIG31B.A0": ["HOÀNH THÁNH TÔM 13G", 6.625],
	"JIGD00000JIG31B.AA": ["HOÀNH THÁNH TÔM 13G", 6.305],
	"JIGD00000JIG32A.00": ["CHẢ GIÒ RẾ TÔM 22G", 3.338],
	"JIGD00000JIG32A.0A": ["CHẢ GIÒ RẾ TÔM 22G", 3.338],
	"JIGD00000JIG32B.00": ["CHẢ GIÒ RẾ TÔM 22G (NHÃN NẰM TRÊN)", 9.701],
	"JIGD00000JIG32B.0A": ["CHẢ GIÒ RẾ TÔM 22G", 9.701],
	"JIGD00000JIG36A.00": ["BÁNH CUỐN TÔM 46G", 5.28],
	"JIGD00000JIG36A.0A": ["BÁNH CUỐN TÔM 46G", 5.29],
	"JIGD00000JIG36B.00": ["BÁNH CUỐN TÔM 46G", 10.017],
	"JIGD00000JIG43A.00": ["CHẢ GIÒ BÁNH TRÁNG CHAY", 3.99],
	"JIGD00000JIG44A.00": ["CHẢ GIÒ BÁNH TRÁNG CUA 22G", 9.643],
	"JIGD00000JIG44A.0A": ["CHẢ GIÒ BÁNH TRÁNG GHẸ 22G", 9.643],
	"JIGH000000JIG09.00": ["HÁ CẢO TÔM 15G", 9.835],
	"JIGH000000JIG09.0A": ["HÁ CẢO TÔM 15G", 9.815],
	"JIGH000000JIG09.0B": ["HÁ CẢO TÔM 15G", 9.815],
	"JIGH000000JIG19.0A": ["HÁ CẢO CÁ VÀNG 20G, 10PC/TRAY", 7.763],
	"JIGH000000JIG22.0A": ["HÁ CẢO TÔM 20G, 30PC/PE. CODE : 370C.16", 7.7328],
	"JIGH000000JIG22.0B": ["HÁ CẢO TÔM 20G", 7.751],
	"JIGH000000JIG23.0A": ["HÁ CẢO TÔM 22G, 30PC/PE", 8.485],
	"JIGH000000JIG23.0B": ["HÁ CẢO TÔM 22G", 8.485],
	JIGH000000JIG29: ["HÁ CẢO TÔM 16G (FOR SOUP).", 10.67],
	"JIGH000000JIG46.AA": ["HÁ CẢO TÔM BABY MÀU XANH 25G, KB", 5.96],
	"JIGH000000JIG53.0A": ["HÁ CẢO TÔM 25G", 3.056],
	"JIGH00000JIG53A.00": ["HÁ CẢO TÔM  25G", 3.04],
	"JIGH00000JIG46A.00": ["HÁ CẢO TÔM BABY MÀU XANH 25G, KB", 5.56],
	"JIGH00000JIG49A.0A": ["HÁ CẢO TÔM 22G", 2.17],
	"JIGH00000JIG49A.0B": ["HÁ CẢO TÔM 22G", 2.17],
	"JIGK000000JIG58.00": ["BÁNH XOÀI 20G", 5.43],
	"JIGK000000JIG61.A0": ["DƯA LƯỚI RUỘT XANH ĐÔNG LẠNH 125G, JAS ORGANIC", 2.935],
	"JIGK000000JIG62.A0": ["DƯA LƯỚI RUỘT XANH ĐÔNG LẠNH 350G, JAS ORGANIC", 7.62],
	"JIGK000000JIG63.00": ["DƯA LƯỚI RUỘT CAM ĐÔNG LẠNH 125G, JAS", 2.935],
	"JIGK000000JIG64.00": ["DƯA LƯỚI RUỘT CAM ĐÔNG LẠNH 350G, JAS", 7.62],
	"JIGK00000JIG60A.00": ["CÀ TÍM CHIÊN SỐT 140G/KHAY", 3.58],
	"JIGP000000JIG45.00": ["PIZZA MARGHERITA 115G, 15-16CM", 3.427],
	"JIGP000000JIG45.0A": ["PIZZA MARGHERITA 115G, 15-16CM", 3.474],
	"JIGP000000JIG45.AC": ["PIZZA MARGHERITA 115G, 15-16CM", 3.486],
	"JIGP000000JIG50.00": ["ĐẾ PIZZA 80GR, 15-16CM", 2.579],
	"JIGP000000JIG50.0A": ["ĐẾ PIZZA 80GR, 15-16CM", 2.579],
	"JIGP000000JIG57.00": ["PIZZA PHÔ MAI 110G, 15-16CM", 3.306],
	"JIGP000000JIG57.0A": ["PIZZA PHÔ MAI 110G, 15-16CM", 3.306],
	"JIGP000000JIG68.0A": ["ĐẾ PIZZA 100G, 8 INCHES", 5.948],
	"JIGP000000JIG71.00": ["ĐẾ PIZZA 130G, 9 INCHES", 9.275],
	"JIGH000000JIG75.0A": ["HÁ CẢO TÔM NGÔI SAO XANH 20G", 10.844],
	"JIGP00000JIG66A.00": ["ĐẾ PIZZA 100G, 8 INCHES", 7.25],
	"JIGP00000JIG66A.0A": ["ĐẾ PIZZA 100G, 8 INCHES", 7.2],
	"JIGR000000JIG51.00": ["BÁNH CUỐN TÔM 40G", 4.882],
	"JIGR000000JIG51.0A": ["BÁNH CUỐN TÔM 40G", 3.566],
	"JIK0000JIKC0001.0A": ["HẢI SẢN VIÊN ÁO CROUTON 25G", 5.094],
	"JKAB000000JKA02.00": ["BÁNH MÌ BƠ TỎI 25G", 4.794],
	"JKAP000000JKA01.00": ["PIZZA PHÔ MAI 22CM, 210G", 5.796],
	"JKAP000000JKA01.A0": ["PIZZA PHÔ MAI 22CM, 210G", 5.778],
	"JKAP000000JKA01.B0": ["PIZZA PHÔ MAI 22CM, 210G", 5.778],
	"JKAP000000JKA03.00": ["PIZZA MARGHERITA PIZZA 22CM, 210G", 5.771],
	"JKAP000000JKA03.A0": ["PIZZA MARGHERITA PIZZA 22CM, 210G", 5.73],
	"JKAP000000JKA03.B0": ["PIZZA MARGHERITA PIZZA 22CM, 210G", 5.73],
	"JKAP000000JKA04.00": ["ĐẾ PIZZA NƯỚNG 24CM, 180G", 7.918],
	"JKAP000000JKA04.0A": ["ĐẾ PIZZA NƯỚNG 24CM, 180G", 7.956],
	"JKYK000000JKY04.00": ["RAU CỦ XÀO. CODE 544C.18", 10.54],
	"JKYK000000JKY04.0A": ["RAU CỦ XÀO 500G", 5.428],
	"JKYK000000JKY05.00": ["CÀ TÍM CHIÊN SAUCE. CODE 813A.18", 5.44],
	"JKYK00000JKY02B.00": ["CÀ RỐT & CỦ CẢI TRẮNG XÀO. CODE 1111C.17 - ĐỔI CHIẾT XUẤT CÁ", 5.5],
	"JKYK00000JKY02B.0A": ["CÀ RỐT & CỦ CẢI TRẮNG XÀO", 5.51],
	"JKYK00000JKY02B.AA": ["CÀ RỐT & CỦ CẢI TRẮNG XÀO 500G", 5.51],
	"JLFK00000021001.00": ["MIX RAU CỦ CHIÊN SƠ 200G", 4.568],
	"JLFK00000021002.00": ["MIX RAU CỦ HẢI SẢN HẤP 180G", 4.145],
	"JLFV00000021917.0A": ["BẮP CẮT NỬA 4-5CM, NG", 10.855],
	"JLFV00000021918.0A": ["BẮP CẮT NỬA 2.5-4CM, NG", 5.76],
	"JLFV00000021921.0A": ["BẮP HẤP ĐÔNG LẠNH 280-350G, NG", 11.55],
	"JMKC000000JMK01.00": ["CHẢ GIÒ BỘT MÌ TÁO 25G VÀ CARAMEL SAUCE 50G", 9.654],
	"JMRG0000JMRHE08.00": ["TRỨNG CÁ TRÍCH NGÂM TƯƠNG ĐÔNG LẠNH (USA) 160G/PA", 19.694],
	"JMS1C0000028001.00": ["CHẢ GIÒ RẾ TÔM 16G", 5.325],
	"JMS1C0000028006.00": ["CHẢ GIÒ RẾ TÔM DÀI 35G", 6.161],
	"JMS1C0007220694.00": ["CHẢ GIÒ BỘT MÌ PHÔ MAI RONG BIỂN 13G", 3.765],
	"JMS1C0007221112.A0": ["BÁNH TẤM VUÔNG NƯỚNG 15G", .826],
	"JMS1C0007221112.00": ["BÁNH TẤM VUÔNG NƯỚNG 15G", .826],
	"JMS1C0007221163.00": ["CHẢ GIÒ BỘT MÌ PHÔ MAI RONG BIỂN 13G", 3.765],
	"JMS1C0007221163.0A": ["CHẢ GIÒ BỘT MÌ PHÔ MAI RONG BIỂN 13G", 3.765],
	"JMS1C0007111243.00": ["CHẢ GIÒ BỘT MÌ PHÔ MAI RONG BIỂN 13G (khác TP phomai so với ", 3.765],
	"JMS1C0007221243.00": ["CHẢ GIÒ BỘT MÌ PHÔ MAI RONG BIỂN 13G (khác TP phomai so với ", 3.765],
	"JMS1H0000022001.00": ["HÁ CẢO TÔM 20G", 5.232],
	"JMS1H0000022001.A0": ["HÁ CẢO TÔM 20G", 5.232],
	"JMS1H0000022001.B0": ["HÁ CẢO TÔM 20G", 5.232],
	"JMS1H0007220831.00": ["HÁ CẢO TÔM HẸ PTO 20G", 2.986],
	"JMS1H0007220831.A0": ["HÁ CẢO TÔM HẸ PTO 20G", 2.986],
	"JMS1K0000048051.00": ["BÁNH XÈO MỰC 90G/PC", 6.042],
	"JMS1K0000048051.A0": ["BÁNH XÈO MỰC 90G", 6.042],
	"JMS1K0007221267.00": ["BÁNH XÈO MỰC 40G", 5.153],
	"JMS1K0007221268.00": ["BÁNH XÈO MỰC 60G", 6.397],
	"JMS1K0000048071.00": ["BÁNH XÈO MỰC 50G/PC", 6.436],
	"JMS1K0000048071.A0": ["BÁNH XÈO MỰC 50G/PC", 6.436],
	"JMS1S0007220832.00": ["XÍU MẠI HẢI SẢN HÌNH HOA VÀNG 25G", 6.488],
	"JMS1S0007220833.00": ["XÍU MẠI CÁ HÌNH HOA CAM 25G", 6.488],
	"JMS1X0000022002.A0": ["TÔM VIÊN 25G", 5.071],
	"JMS1X0000022002.B0": ["TÔM VIÊN 25G", 5.071],
	"JMS1X0000022002.00": ["TÔM VIÊN 25G", 5.071],
	"JGLX000000JGL22.00": ["PHÔ MAI QUE XÙ 25G", 5.514],
	"JMS1X0007220603.00": ["PHÔ MAI QUE 25G", 5.514],
	"JMS2C0007708060.00": ["BÁNH SAMOSA RẾ CAM 18G", 2.654],
	"JMS2C0007708059.00": ["BÁNH SAMOSA RẾ SÒ ĐIỆP 20G", 2.881],
	"JMS2C0000008033.0A": ["BÁNH SAMOSA RẾ SÒ ĐIỆP 20G", 2.852],
	"JMS2C0000008039.00": ["CÀRI RẾ NÓN 20GR", 2.876],
	"JMS2C0000008039.0B": ["CÀRI RẾ NÓN 20GR", 2.876],
	"JMS2C0007708058.00": ["CÀRI RẾ NÓN 20G", 2.899],
	"JMS2C0000008039.0A": ["CÀRI RẾ NÓN 20GR", 2.876],
	"JMS2C0000008046.0A": ["BÁNH SAMOSA RẾ CAM 18G", 2.621],
	"JMS2C0007708055.00": ["SAMOSA RẾ TÔM MÀU CAM 18G", 2.654],
	"JMS2C0000008055.0A": ["SAMOSA RẾ TÔM MÀU CAM 18G", 2.654],
	"JMS2C0000008055.00": ["SAMOSA RẾ TÔM MÀU CAM 18G", 2.654],
	"JNIC000000JNI32.AA": ["ĐẾ BÁNH TART NƯỚNG 20CM 85G", 1.645],
	"JNIC000000JNI33.AA": ["BÁNH TART SÔ CÔ LA NƯỚNG 50G, RTE, VE, GF", 4.166],
	"JNIC000000JNI33.00": ["BÁNH TART SÔ CÔ LA NƯỚNG 50G, RTE, VE, GF", 4.161],
	"JNIC000000JNI33.0A": ["BÁNH TART SÔ CÔ LA NƯỚNG 50G, RTE, VE, GF", 4.166],
	"JNID000000JNI01.00": ["BÁNH MÌ DÀI 210G NILAX ( CODE: 1082D.17 --> 1082E.17 ct moi ", 2.173],
	"JNIP000000JNI17.CA": ["PIZZA MARGHERITA 22CM, 260G", 3.206],
	"JNIP000000JNI18.CA": ["PIZZA 4 LOẠI PHOMAI 22CM, 215G", 2.686],
	"JNIP000000JNI23.00": ["BÁNH MÌ BƠ TỎI 25G", 2.495],
	"JNIP000000JNI24.00": ["PIZZA MARGHERITA 22CM, 244G", 3.014],
	"JNIP000000JNI25.00": ["PIZZA NẤM PHÔ MAI 22CM, 200G", 2.589],
	"JNIP000000JNI26.0A": ["PIZZA PHÔ MAI CÁ MỜM SỮA 22CM, 200G", 2.565],
	"JNIP000000JNI27.0B": ["PIZZA QUAI VẠC PHÔ MAI CÀ CHUA 115G", 5.542],
	"JNIP000000JNI27.0A": ["PIZZA QUAI VẠC PHÔ MAI CÀ CHUA 115G", 5.517],
	"JNIP000000JNI28.00": ["PIZZA QUAI VẠC TÁO 115G", 2.996],
	"JNIP000000JNI29.00": ["ĐẾ PIZZA NƯỚNG 29.5-31CM 270G", 3.912],
	"JNIP000000JNI30.00": ["PIZZA MARGHERITA 18CM 193G", 2.33],
	"JNIP000000JNI31.00": ["PIZZA 4 LOẠI PHOMAI 18CM 172G (CODE 364B1.24)", 2.07],
	"JNIP000000JNI34.00": ["PIZZA MARGHERITA 18CM 193G", 4.605],
	"JNIP000000JNI35.0A": ["PIZZA 4 LOẠI PHOMAI 18CM 172G", 4.185],
	"JNIP000000JNI35.00": ["PIZZA 4 LOẠI PHOMAI 18CM 172G", 4.185],
	"JNIP00000JNI20A.AB": ["PIZZA MARGHERITA 18CM 193G", 2.324],
	"JNIP00000JNI22C.00": ["PIZZA MARGHERITA 21CM 200G", 2.51],
	"JNMH000000NMP20.0A": ["HÁ CẢO TÔM 12.5G . Code 224D.18. (1KG/PE (80PCS) X 10PE/CTN ", 10.756],
	"JNMH000000NMP21.0A": ["HÁ CẢO CUA 12.5G . Code 226E.18. (1KG/PE (80PCS) X 10PE/CTN ", 10.756],
	"JNNK000000JNN02.00": ["RAU CỦ CHIÊN 70G", 3.2356],
	"JNNK000000JNN02.AA": ["RAU CỦ CHIÊN 75G", 3.2356],
	"JNNK000000JNN02.AC": ["RAU CỦ CHIÊN 75G", 3.2356],
	"JNNK000000JNN05.CD": ["BÁNH PANCAKE TRÀ XANH 20G", 4.715],
	"JNNP000000JNN01.AA": ["BÁNH PANCAKE 20G", 4.716],
	"JNNP000000JNN01.AD": ["BÁNH PANCAKE 20G", 4.709],
	"JNNP000000JNN01.AF": ["BÁNH PANCAKE 20G", 4.709],
	"JNNP000000JNN01.AG": ["BÁNH PANCAKE 20G", 4.709],
	"JNNP000000JNN01.AH": ["BÁNH PANCAKE 20G", 4.709],
	"JNNP000000JNN01.AJ": ["BÁNH PANCAKE 20G", 4.709],
	"JNPC000000JNP01.00": ["BÁNH TART TRỨNG NƯỚNG 25G", 8.83],
	"JNPC000000JNP01.0A": ["BÁNH TART TRỨNG NƯỚNG 25G", 8.83],
	"JNPC000000JNP02.00": ["BÁNH TART TRỨNG NƯỚNG 30G", 6.853],
	"JNPC000000JNP03.00": ["BÁNH TART TRỨNG SÔ CÔ LA NƯỚNG 30G", 6.853],
	"JNPS000000JNP06.0A": ["SAUCE SOCOLA 300G", 6.538],
	"JNPS000000JNP06.00": ["SAUCE SOCOLA 300G", 6.57],
	"JNSK00000NIS06A.00": ["KHOAI LANG CẮT KHOANH NƯỚC ĐƯỜNG 600G/BAG", 13.205],
	"JNSK00000NIS07A.00": ["KHOAI LANG CẮT XÉO NƯỚC ĐƯỜNG 600G/BAG", 13.18],
	"JNSK00000NIS07A.A0": ["KHOAI LANG CẮT XÉO NƯỚC ĐƯỜNG 600G/BAG", 13.18],
	"JNSK00000NIS26B.00": ["BÁNH MÌ NƯỚNG ĐƯỜNG 6.5G. CODE 66E.18 (NƯỚNG TRUNG BÌNH). (S", 5.895],
	"JNSK00000NIS26B.0A": ["BÁNH MÌ NƯỚNG ĐƯỜNG 6.5G", 5.71],
	"JNSP00000NIS36A.00": ["BÁNH MÌ BƠ TỎI NƯỚNG 25G", 4.872],
	"JNSS00000NIS33A.00": ["SOUP RAU CỦ XANH ĐẬM ĐẶC 800G", 5.228],
	"JSAD000000JSA01.00": ["HOÀNH THÁNH TÔM 13G", 12.59],
	"JSBC000000JSB01.00": ["BÁNH NƯỚNG 30G, RTE", 2.866],
	"JTMC00007220444.00": ["CHẢ GIÒ BỘT MÌ PHÔ MAI RONG BIỂN 13G", 3.759],
	"JTMX00007220523.00": ["PHÔ MAI QUE 25G (LOTTERIA JP) (CODE: 56B.19)", 5.514],
	"JTUB00000000019.0A": ["BÁNH MÌ MỀM TRÒN 25G", 5.745],
	"JTUB00000000023.00": ["BÁNH MÌ HÌNH DƯA LƯỚI 30G", 3.101],
	"JTUK00000000006.0A": ["BÁNH MÌ HOT DOG 80G, 21CM", 6.178],
	"JTUP00000000002.0A": ["PIZZA 4 LOẠI PHÔ MAI 110G, 6 INCHES", 6.254],
	"JTUP00000000003.0A": ["PIZZA PHÔ MAI CÀ CHUA 125G, 6 INCHES", 6.998],
	"JTUP00000000003.AA": ["PIZZA PHÔ MAI CÀ CHUA 125G, 6 INCHES", 6.998],
	"JTUP00000000005.0A": ["ĐẾ PIZZA NƯỚNG 80G 6 INCHES", 4.814],
	"JTUP00000000005.AA": ["ĐẾ PIZZA NƯỚNG 80G 6 INCHES", 4.814],
	"JTUP00000000008.00": ["PIZZA 4 LOẠI PHÔ MAI 240G, 9 INCHES", 13.32],
	"JTUP00000000009.00": ["PIZZA PHÔ MAI CÀ CHUA 240G, 9 INCHES", 13.32],
	"JTUP00000000009.A0": ["PIZZA PHÔ MAI CÀ CHUA 240G, 9 INCHES", 13.32],
	"JTUP00000000010.00": ["ĐẾ PIZZA NƯỚNG 150G, 9 INCHES", 8.926],
	"JTUP00000000011.00": ["PIZZA 4 LOẠI PHÔ MAI 110G, 6 INCHES", 6.254],
	"JTUP00000000011.A0": ["PIZZA 4 LOẠI PHÔ MAI 110G, 6 INCHES", 6.254],
	"JTUP00000000012.00": ["PIZZA 4 LOẠI PHÔ MAI 240G, 9 INCHES", 13.32],
	"JTUP00000000012.A0": ["PIZZA 4 LOẠI PHÔ MAI 240G, 9 INCHES", 13.32],
	"JTUP00000000020.AB": ["PIZZA 4 LOẠI PHÔ MAI 95G 5 INCHES", 5.488],
	"JTUP00000000021.AB": ["PIZZA PHÔ MAI CÀ CHUA 95G 5 INCHES", 5.446],
	"JTUP00000000022.AA": ["ĐẾ PIZZA NƯỚNG 65G, 5 INCHES", 4.297],
	"JTUP00000000022.0A": ["ĐẾ PIZZA NƯỚNG 65G 5 INCHES", 4.297],
	"JTUP00000000024.00": ["ĐẾ PIZZA NƯỚNG CẦM TAY 70G", 4.056],
	"JTUP00000000025.00": ["ĐẾ PIZZA NƯỚNG 140G, 9 INCHES", 8.246],
	"JTUP00000000025.0A": ["ĐẾ PIZZA NƯỚNG 140G, 9 INCHES", 8.246],
	"JTUP000000JTU28.0A": ["BÁNH MÌ VIỆT NAM 70G", 3.837],
	"JTUP000000JTU28.00": ["BÁNH MÌ VIỆT NAM 70G", 3.837],
	"JTUP000000JTU36.00": ["BÁNH XÈO RONG BIỂN ÁP CHẢO 100G", 10.575],
	"JTUP000000JTU37.00": ["BÁNH XÈO RONG BIỂN ÁP CHẢO 200G", 12.679],
	"JTYC000000JTY03.0A": ["RẾ MỰC PHÔ MAI HAI MÀU 20G", 5.808],
	"JTYC000000JTY04.00": ["RAU CỦ XÀO 100G", 3.515],
	"JTYC000000JTY05.00": ["CHẢ GIÒ BỘT MỲ TÔM CÀ RI 15G", 7.22],
	"JTYC000000JTY06.0A": ["SAMOSA RẾ SÒ ĐIỆP HÌNH NÓN 25G", 5.95],
	"JTYC000000JTY07.00": ["CHẢ GIÒ RẾ TÔM DÀI 35G", 9.246],
	"JTYG000000JTY08.00": ["SỦI CẢO TÔM PTO 25G", 11.68],
	"JTYK000000JTY09.00": ["RAU CỦ CHIÊN 30G", 5.568],
	"JWFC000000JWF86.0D": ["IKA SHAOMAI 25G", 2.052],
	"JWFC000000JWF86.0E": ["IKA SHAOMAI 25G", 2.062],
	"JWFC000000WG01A.00": ["BÁNH XÈO MỰC 35G", 11.095],
	"JWFC000000WG01A.0A": ["BÁNH XÈO MỰC 35G (THAY ĐỔI KÍCH THƯỚC THÙNG)", 11.067],
	"JWFC00000JWF86A.0B": ["XÍU MẠI MỰC 25G", 6.334],
	"JWFC00000JWF86A.0C": ["IKA SHAOMAI 25G", 6.294],
	"JWFC00000JWF86B.00": ["IKA SHAOMAI 25G", 6.294],
	"JWFH0000000WF03.0B": ["HÁ CẢO TÔM 500GR/PE", 10.88],
	"JWFH0000000WF03.0C": ["HÁ CẢO TÔM 20G", 10.88],
	"JWFH000000WF03A.0A": ["HÁ CẢO TÔM 20G", 10.88],
	"JWFH000000WF03A.0B": ["HÁ CẢO TÔM 20G", 10.88],
	"JWFH000000WF03B.00": ["HÁ CẢO TÔM 20G", 10.88],
	"JWFH000000WF03B.0A": ["HÁ CẢO TÔM 20G (THAY ĐỔI KÍCH THƯỚC THÙNG)", 10.815],
	"JWFH000000WF16B.00": ["BÁNH TIỂU LONG 27G (GIỐNG WF16A NHƯNG ĐÓNG KHAY 6 Ô)", 2.175],
	"JWFK0000000WG03.00": ["BẮP TEMPURA CHIÊN 120G/PA", 5.48],
	"JWFK00000JWF109.0A": ["BỘ TEMPURA MIX CHIÊN 150G & SOY SAUCE 25G X 2", 6.22],
	"JWFP0000000WG02.00": ["BÁNH PIZZA MARGHERITA 105G", 5.017],
	"JWFP00000JWF110.00": ["BÁNH PIZZA MARGHERITA 105G", 4.982],
	"JWFP00000JWF112.00": ["BÁNH PIZZA MARGHERITA 105G", 4.982],
	"JWFYC000000WF68.00": ["CHẢ GIÒ RẾ CÁ 20G", 12.831],
	"JWFYC000000WF68.0A": ["CHẢ GIÒ RẾ CÁ 20G", 12.814],
	"ECCW0FINT02-240.00": ["HOÀNH THÁNH TÔM HẸ 19.2G, KB", 3.784],
	"ECCW0FINT02-240.0A": ["HOÀNH THÁNH TÔM HẸ 19.2G, KB", 3.784],
	"ECT0000000ECT01.00": ["HÁ CẢO TÔM 25G", 6.952],
	"ECT0000000ECT04.00": ["HÁ CẢO TÔM 25G", 4.59],
	"KATH000000KAT01.0A": ["HÁ CẢO TÔM 20G", 4.715],
	"KDSC000000KDS19.00": ["CHẢ GIÒ BÁNH TRÁNG MINI 10G", 11.114],
	"KDSH000000KDS06.00": ["HÁ CẢO TÔM MÀU XANH 18G", 8.615],
	"KDSH000000KDS06.0A": ["HÁ CẢO TÔM MÀU XANH 18G", 8.615],
	"KDSH000000KDS06.0B": ["HÁ CẢO TÔM MÀU XANH 18G", 8.615],
	"KDSH000000KDS06.0C": ["HÁ CẢO TÔM MÀU XANH 18G", 8.615],
	"KDSH000000KDS07.00": ["HÁ CẢO TÔM 4 MÀU 18G", 8.282],
	"KDSH000000KDS18.00": ["SỦI CẢO TÔM PTO 20G", 7.218],
	"KDSH000000KDS18.0A": ["SỦI CẢO TÔM PTO 20G", 7.218],
	"KDSH000000KDS18.0B": ["SỦI CẢO TÔM PTO 20G", 7.218],
	"KDSH000000KDS20.00": ["HÁ CẢO TÔM 20G", 9.5],
	"KDSH000000KDS20.0A": ["HÁ CẢO TÔM 20G", 9.5],
	"KDSS000000KDS17.0A": ["XÍU MẠI HẢI SẢN 13.5G CODE 290A.18", 6.685],
	"KDSS000000KDS21.0A": ["XÍU MẠI HẢI SẢN 20G", 9.37],
	"KEM0000000KEM20.00": ["CHẢ GIÒ BỘT MÌ TÔM 25G", 11.25],
	"KEMC000000KEM17.0B": ["CHẢ GIÒ BỘT MÌ TÔM 25G", 5.69],
	"KEMH000000KEM09.0A": ["HÁ CẢO HOÀNG GIA 15G", 4.54],
	"KEMH000000KEM09.0C": ["HÁ CẢO HOÀNG GIA 15G", 4.54],
	"KEMH000000KEM15.0B": ["HÁ CẢO TÔM 15G", 5.43],
	"KEMH000000KEM15.0C": ["HÁ CẢO TÔM 15G", 5.43],
	"KEMH000000KEM15.0D": ["HÁ CẢO TÔM 15G", 5.43],
	"KEMH000000KEM25.00": ["HÁ CẢO TÔM 20G", 5.613],
	"KEMH00000KEM04B.0A": ["HÁ CẢO TÔM HẸ 25G", 6.98],
	"KEMH00000KEM04B.0C": ["HÁ CẢO TÔM HẸ 25G (HÌNH PAU)", 6.98],
	"KEMH00000KEM06B.0A": ["HÁ CẢO TÔM 20G", 5.73],
	"KEMH00000KEM06B.0C": ["HÁ CẢO TÔM 20G", 5.73],
	"KEMS000000KEM16.0A": ["XÍU MẠI TÔM 20G", 6.92],
	"KEMS000000KEM18.0A": ["SỦI CẢO TÔM PTO 20G", 5.03],
	"KEMS000000KEM21.00": ["SỦI CẢO CUỘN TÔM PTO 40G (CODE 389B.24)", 11.206],
	"KEMS000000KEM21.AA": ["SỦI CẢO CUỘN TÔM PTO 40G (CODE 389B.24)", 11.206],
	"KEMS000000KEM22.00": ["2. NƯỚC MẮM 60G/GÓI X 1 (KJU-S03.24))", 4.966],
	"KEMS00000KEM02B.0A": ["XÍU MẠI GHẸ 25G", 6.984],
	"KEMS00000KEM02B.0C": ["XÍU MẠI GHẸ 25G", 6.984],
	"KEMS00000KEM08B.0A": ["XÍU MẠI TÔM 20G", 5.76],
	"KEMS00000KEM08B.0C": ["XÍU MẠI TÔM 20G", 5.7],
	"KEMS00000KEM18A.00": ["SỦI CẢO TÔM PTO 20G", 3.583],
	"KEMS00000KEM21A.00": ["SỦI CẢO CUỘN TÔM PTO 40G", 4.682],
	"KEMS000000KEM27.00": ["HÁ CẢO TÔM HẸ (HÌNH SỦI CẢO) 20G", 3.606],
	"KGFH000000KGF04.00": ["HÁ CẢO TÔM 20G", 9.43],
	"KGFH000000KGF04.AA": ["HÁ CẢO TÔM 20G", 9.45],
	"KHT0000000KHT01.00": ["HÁ CẢO TÔM BA MÀU 25G", 6.912],
	"KHT0000000KHT03.00": ["BÁNH CUỐN HẢI SẢN 40G", 6.434],
	"KHT0000000KHT05.00": ["HÁ CẢO TÔM HẸ 25G", 6.974],
	"KHT0000000KHT06.00": ["HÁ CẢO TÔM 20G CODE", 5.774],
	"KHT0000000KHT07.00": ["HÁ CẢO TÔM PTO 20G", 4.866],
	"KHT0000000KHT08.00": ["XÍU MẠI GHẸ 25G", 6.99],
	"KHT0000000KHT09.00": ["XÍU MẠI TÔM 20G", 5.678],
	"KHT0000000KHT10.00": ["HOÀNH THÁNH TÔM 20G", 7.03],
	"KIGK000000KIG05.00": ["DƯA LƯỚI INTHANON VỎ VÀNG RUỘT XANH ĐÔNG LẠNH 500G", 10.8],
	"KIGK000000KIG06.00": ["DƯA LƯỚI TL3 VỎ XANH RUỘT CAM ĐÔNG LẠNH 500G", 10.8],
	"KIGP000000KIG03.00": ["ĐẾ PIZZA NƯỚNG 100G 8 INCHES", 5.986],
	"KIGP000000KIG03.0A": ["ĐẾ PIZZA NƯỚNG 100G 8 INCHES", 5.986],
	"KIGP000000KIG04.0A": ["ĐẾ PIZZA NƯỚNG 75G 6 INCHES", 4.423],
	"KIGP000000KIG07.00": ["ĐẾ PIZZA NƯỚNG 180G 10 INCHES", 5.177],
	"KIGP000000KIG08.00": ["ĐẾ PIZZA NƯỚNG 130G", 7.343],
	"KJDP000000KJD01.00": ["BÁNH CUỐN TÔM 48G", 11.13],
	"KJDP000000KJD01.0A": ["BÁNH CUỐN TÔM 48G", 11.18],
	"KJGB000000KJG01.00": ["BÁNH SỪNG TRÂU BƠ TỎI 20G", 4.166],
	"KJGB000000KJG02.00": ["BÁNH BẮP CHIÊN 30G, NG", 11.382],
	"KJGB00000KJG01A.00": ["BÁNH SỪNG TRÂU BƠ TỎI 20G", 4.166],
	"KJGB00000KJG01A.0A": ["BÁNH SỪNG TRÂU BƠ TỎI 20G", 4.166],
	"KJUP000000KJU01.00": ["BÁNH XÈO TÔM 115G VÀ GÓI NƯỚC MẮM 290G/KHAY (CODE KJU-S01B.2", 7.395],
	"KJUP000000KJU02.00": ["BÁNH CUỐN TÔM 48G VÀ NƯỚC TƯƠNG 580G/KHAY", 13.185],
	"KMF1P0000KMF101.00": ["BÁNH XÈO TÔM 115G VÀ GÓI NƯỚC MẮM 290G/KHAY", 7.38],
	"KMF1P0000KMF101.AA": ["BÁNH XÈO TÔM 115G VÀ GÓI NƯỚC MẮM 290G/KHAY", 7.38],
	"KMFP000000KMF14.00": ["BÁNH XÈO TÔM 115G VÀ GÓI NƯỚC MẮM 290G/KHAY, NG", 7.34],
	"KMF1P0000KMF102.0A": ["BÁNH CUỐN TÔM 48G VÀ NƯỚC TƯƠNG 580G/KHAY", 13.175],
	"KMF1P0000KMF102.00": ["BÁNH CUỐN TÔM 48G VÀ NƯỚC TƯƠNG 580G/KHAY", 13.175],
	"KMFB000000KMF03.0A": ["BÁNH MÌ VIỆT NAM 65G", 4.424],
	"KMFB000000KMF07.00": ["BÁNH MÌ VIỆT NAM 90G", 4.808],
	"KMFC000000KMF01.0B": ["CHẢ GIÒ RẾ TÔM CUA 20.8G", 11.264],
	"KMFC000000KMF01.0C": ["CHẢ GIÒ RẾ TÔM CUA 20.8G", 11.264],
	"KMFC000000KMF01.0F": ["CHẢ GIÒ RẾ TÔM CUA 20.8G", 11.264],
	"KMFP000000KMF04.00": ["ĐẾ PIZZA NƯỚNG 100G, 8 INCHES", 6.095],
	"KMFP000000KMF05.00": ["ĐẾ PIZZA NƯỚNG 210G, 10 INCHES", 7.26],
	"KMFP000000KMF06.00": ["ĐẾ PIZZA NƯỚNG 250G, 12 INCHES", 8.73],
	"KMFC000000KMF08.00": ["NEM CUA BỂ 75G", 12.028],
	"KMKUKC00KMKUK01.00": ["CHẢ GIÒ BỘT MÌ TÁO 25G VÀ CARAMEL SAUCE 50G, VE, NG \n 1. CHẢ", 9.654],
	"KOFS000000KOF01.00": ["SỦI CẢO TÔM PTO 40G - CODE: 592A1A.19 - NON GMO", 9.29],
	"MAPWC0000MAPW08.00": ["CHẢ GIÒ BỘT MÌ QUE PHOMAI 15G", 5.092],
	"MAPWK0000MAPW07.00": ["CHẢ GIÒ MAYONNAISE TÔM 40G", 8.862],
	"MASFK0000MASF01.00": ["BÁNH TRÁNG RẾ 7G 21CM", 10.97],
	"MSFC000000MSF01.AA": ["CHẢ GIÒ BỘT MÌ CHAY 25G", 11.44],
	"MSFH000000MSF02.0A": ["HÁ CẢO TÔM 25G", 7],
	"MSFH000000MSF02.0B": ["HÁ CẢO TÔM 25G", 7],
	"MSFK000000MSF03.0B": ["BÁNH BAO SANDWICH 30G", 8.332],
	"NTMB00000HF05-C.00": ["BÁNH BAO SANDWICH 40G, VE", 3.382],
	"NTMG00000HF04-C.00": ["SỦI CẢO CHAY 25G, VE, 10PCS/TRAY", 3.18],
	"NTMW00000HF01-C.00": ["HOÀNH THÁNH TÔM HẸ 20G", 3.11],
	"NUFG00000002809.00": ["SỦI CẢO CHAY 35G CODE NUF-S06.21 (CÔNG THỨC GIỐNG NUF25.0A N", 4.8],
	"NUFG00000002861.00": ["SỦI CẢO CHAY 35G CODE NUF\n -S05.21 (GIỐNG CÔNG THỨC NUFG0000", 4.8],
	"NUFG00000002882.00": ["SỦI CẢO TÔM GỪNG 35G", 4.8],
	"NUFG000000NUF05.0C": ["SỦI CẢO TÔM GỪNG 25G", 3.78],
	"NUFG000000NUF11.AA": ["SỦI CẢO TÔM GỪNG 35G \n CODE 633A.17 (ĐỔI STTP SANG BRISOL NE", 9.17],
	"NUFG000000NUF13.0A": ["SỦI CẢO TÔM HẸ 35G CODE: 635A1.17", 9.17],
	"NUFG000000NUF14.AB": ["SỦI CẢO CHAY 35G \n ( CODE: 398D.19) (ĐỔI SLEEVE SANG TÚI IN,", 9.17],
	"NUFG000000NUF25.0A": ["SỦI CẢO CHAY 35G\n CODE 796B3.18. (ĐỔI SLEEVE SANG TÚI IN, TH", 9.17],
	"NUFG00000NUF21A.0A": ["XÍU MẠI TÔM 25G CODE : AVR-S13A1.16", 3.8],
	"NUFH00000002902.00": ["XÍU MẠI TÔM 35G CODE NUF-\n S03.21", 4.8],
	"NUFH000000NUF04.0C": ["HÁ CẢO TÔM 25G", 3.83],
	"NUFH000000NUF10.AA": ["HÁ CẢO TÔM HOÀNG GIA 35G ( 50% SHRIMP) (CODE: 632C.17).", 9.17],
	"NUFH000000NUF12.AA": ["XÍU MẠI TÔM 35G CODE: 634D.17", 9.17],
	"NUFK000000NUF03.0C": ["BÁNH BAO SANDWICH 60G", 10.551],
	"NUFK000000NUF03.0D": ["BÁNH BAO SANDWICH 60G \n (58-65G) - 8 túi/thùng (GN TỰ MUA BA", 4.374],
	"NUFK000000NUF15.A0": ["BÁNH QUAI VẠC NHÂN TÔM\n  (COOKED) 50G ( CODE: 239D.16 (ĐỔI S", 9.735],
	"NUFK000000NUF16.00": ["BÁNH QUAI VẠC NHÂN GHẸ 50G", 9.696],
	"NUFK00000NUF17A.BA": ["TÔM VIÊN 40G", 11.09],
	"NUFK00000NUF23A.A0": ["BÁNH CÁ HOKI 75G", 3.238],
	"NUTB00000009197.0A": ["BÁNH BAO SANDWICH 60G, 900G/PA", 8.458],
	"NUTB00000009199.00": ["BÁNH BAO SANDWICH 60G, 8PA/CTN", 4.374],
	"NUTB00000009199.0A": ["BÁNH BAO SANDWICH 60G, 8PA/CTN", 4.374],
	"NUTB00000009199.0B": ["BÁNH BAO SANDWICH 60G, 8PA/CTN", 4.374],
	"NUTB00000009200.00": ["BÁNH BAO SANDWICH 60G, 20PA/CTN", 10.551],
	"NUTB00000009200.0A": ["BÁNH BAO SANDWICH 60G, 20PA/CTN", 10.588],
	"NUTB00000009200.0B": ["BÁNH BAO SANDWICH 60G, 20PA/CTN", 10.588],
	"NUTB00000009200.0C": ["BÁNH BAO SANDWICH 60G, 20PA/CTN", 10.588],
	"NUTB00000009203.00": ["BÁNH BAO SANDWICH 60G, 3KG/PE", 3.53],
	"NUTB00000009205.00": ["BÁNH BAO SANDWICH 32G", 10.548],
	"NUTB00000009205.0A": ["BÁNH BAO SANDWICH 32G", 10.633],
	"NUTB00000009205.0B": ["BÁNH BAO SANDWICH 32G", 10.633],
	"NUTB00000009205.0C": ["BÁNH BAO SANDWICH 32G", 10.633],
	"NUTB00000009210.00": ["BÁNH BAO HOT DOG 60G", 3.576],
	"NUTB00000009210.AA": ["BÁNH BAO HOT DOG 60G, 3KG/PE", 3.576],
	"NUTB00000009211.00": ["BÁNH BAO BURGER ĐEN 32G", 10.61],
	"NUTC00000002868.00": ["BÁNH MÌ TÔM MÈ 22.5G", 6.654],
	"NUTC00000002868.0A": ["BÁNH MÌ TÔM MÈ 22.5G", 6.707],
	"NUTC00000002874.00": ["HOÀNH THÁNH VỎ PASTRY CHIÊN 15G", 6.707],
	"NUTC00000002874.0A": ["HOÀNH THÁNH VỎ PASTRY CHIÊN 15G", 6.707],
	"NUTC0ORNMBPR240.00": ["HOÀNH THÁNH HẢI SẢN VỎ PASTRY CHIÊN 15G, TÔM BAP 4*, CÁ ASC", 4.212],
	"NUT1CORNMBPR240.00": ["HOÀNH THÁNH HẢI SẢN VỎ PASTRY CHIÊN 15G, TÔM BAP 4*, CÁ ASC", 4.212],
	"NUTC00000002876.00": ["HOÀNH THÁNH HẢI SẢN VỎ PASTRY CHIÊN 15G", 4.213],
	"NUT1CORNTSPR250.00": ["BÁNH MÌ TÔM MÈ 25G, TÔM BAP 4*", 4.049],
	"NUTC0ORNTSPR250.00": ["BÁNH MÌ TÔM MÈ 25G, TÔM BAP 4*", 4.049],
	"NUTC00000002859.00": ["BÁNH MÌ TÔM MÈ 25G", 4.049],
	"NUTD00000002896.0A": ["DIMSUM THẬP CẨM HẤP 35G \n 1. SHRIMP HARGOW 35G \n 2. GINGER S", 4.8],
	"NUTD00000002896.0B": ["DIMSUM THẬP CẨM HẤP 35G \n 1. SHRIMP HARGOW 35G \n 2. GINGER S", 4.8],
	"NUTD00000002897.00": ["DIMSUM THẬP CẨM HẤP 300G/PA (PHUN LÔ TÔM TRÊN BAO BÌ)", 3.551],
	"NUTG00000002801.0A": ["SỦI CẢO CẢI THÌA CHAY 35G, 840G/PA", 9.17],
	"NUTG00000002801.0B": ["SỦI CẢO CẢI THÌA CHAY 35G, 840G/PA", 9.17],
	"NUTG00000002809.00": ["SỦI CẢO CHAY 35G CODE NUF", 4.8],
	"NUTG00000002861.00": ["SỦI CẢO CHAY 35G CODE NUF\n -S05.21 (GIỐNG CÔNG THỨC NUFG0000", 4.8],
	"NUTG00000002862.00": ["SỦI CẢO NẤM CHAY 25G, 5KGS/CTN", 5.454],
	"NUTG00000002865.0A": ["SỦI CẢO NẤM CHAY 35G, 840G/PA", 9.17],
	"NUTG00000002865.0B": ["SỦI CẢO NẤM CHAY 35G, 840G/PA", 9.17],
	"NUTG00000002871.0A": ["SỦI CẢO TÔM HẸ 35G, 840G/PA (PHUN LÔ TÔM V1,V2)", 9.17],
	"NUTG00000002873.00": ["SỦI CẢO TÔM HẸ 35G", 10.838],
	"NUTG00000002873.0A": ["SỦI CẢO TÔM HẸ 35G", 10.838],
	"NUTG00000002873.0B": ["SỦI CẢO TÔM HẸ 35G (PHUN LÔ TÔM TRÊN BAO)", 10.838],
	"NUTG00000002877.00": ["SỦI CẢO TÔM GỪNG 25G, 5KGS/CTN", 5.454],
	"NUTG00000002882.00": ["SỦI CẢO TÔM GỪNG 35G", 4.8],
	"NUTG00000002882.0A": ["SỦI CẢO TÔM GỪNG 35G", 4.8],
	"NUTG00000002883.00": ["SỦI CẢO TÔM GỪNG 25G, 300G/PA (PHUN LÔ TÔM TRÊN BAO)", 3.551],
	"NUTG00000002891.00": ["SỦI CẢO TÔM GỪNG 35G \n CODE 633A.17 (ĐỔI STTP SANG BRISOL NE", 9.17],
	"NUTG00000002891.0A": ["SỦI CẢO TÔM GỪNG 35G", 9.17],
	"NUTG00000002891.0B": ["SỦI CẢO TÔM GỪNG 35G (PHUN LÔ TÔM V1,V2)", 9.17],
	"NUTG00000002892.A0": ["SỦI CẢO TÔM GỪNG 35G (PHUN LÔ TÔM TRÊN BAO)", 9.23],
	"NUTH00000002899.0A": ["XÍU MẠI TÔM 35G", 9.17],
	"NUTH00000002899.0B": ["XÍU MẠI TÔM 35G (PHUN LÔ TÔM V1,V2)", 9.17],
	"NUTH00000002902.0A": ["XÍU MẠI TÔM 35G CODE NUF-\n S03.21", 4.8],
	"NUTH00000002903.00": ["XÍU MẠI TÔM 35G (PHUN LÔ TÔM  TRÊN BAO)", 9.23],
	"NUTH00000002903.AA": ["XÍU MẠI TÔM 35G (PHUN LÔ TÔM  TRÊN BAO + DÁN STICKER PHỤ TRÊ", 9.23],
	"NUTH00000002904.00": ["XÍU MẠI TÔM 25G, 5KGS/CTN", 5.423],
	"NUTH00000002905.0A": ["HÁ CẢO TÔM HOÀNG GIA 35G", 4.8],
	"NUTH00000002906.00": ["HÁ CẢO TÔM 25G, 300G/PA (PHUN LÔ TÔM TRÊN BAO BÌ)", 3.551],
	"NUTH00000002921.0A": ["HÁ CẢO TÔM HOÀNG GIA 35G", 9.14],
	"NUTH00000002921.0B": ["HÁ CẢO TÔM HOÀNG GIA 35G (PHUN LÔ TÔM TRÊN BAO)", 9.14],
	"NUTH00000002922.00": ["HÁ CẢO TÔM HOÀNG GIA 35G", 9.23],
	"NUTH00000002922.0A": ["HÁ CẢO TÔM HOÀNG GIA 35G (PHUN  LÔ TÔM V1,V2)", 9.23],
	"NUTH00000002924.00": ["HÁ CẢO TÔM HOÀNG GIA 25G, 5KGS/CTN", 5.42],
	"NUTH00000002924.AA": ["HÁ CẢO TÔM HOÀNG GIA 25G, 5KGS/CTN", 5.41],
	"NUTH00000002924.AB": ["HÁ CẢO TÔM HOÀNG GIA 25G, 5KGS/CTN", 5.41],
	"NUTH00000002938.00": ["XÍU MẠI TÔM 25G, 300G/PA (PHUN LÔ TÔM TRÊN BAO BÌ)", 3.551],
	"NUTK00000002925.00": ["TÔM VIÊN 40G", 11.095],
	"NUTK00000002928.00": ["BÁNH QUAI VẠC NHÂN TÔM", 9.735],
	"NUTK00000002928.0A": ["BÁNH QUAI VẠC NHÂN TÔM MỰC 50G (PHUN LÔ TÔM V1,V2)", 9.735],
	"NUTK00000002936.00": ["BÁNH QUAI VẠC NHÂN GHẸ 50G (PHUN LÔ TÔM V1,V2)", 9.336],
	"NUTK00000002936.0A": ["BÁNH QUAI VẠC NHÂN GHẸ 50G", 9.506],
	"NUTK00000008061.00": ["BẮP QUE TẨM GIA VỊ NƯỚNG 3KG/BULK", 3.363],
	"NUTK00000009245.00": ["BỘ MIX BÁNH BỘT MÌ 30G, CÁ TRA TEMPURA 60G VÀ RED SAUCE 120G", 8.376],
	"NUTK00000009250.00": ["BỘ MIX BÁNH BAO 60G, TÔM XÙ 23G VÀ SRIRACHA SAUCE 100G", 9.676],
	"NUTK00000009250.A0": ["BỘ MIX BÁNH BAO 60G, TÔM XÙ 23G VÀ SRIRACHA SAUCE 100G", 9.676],
	"NUTR00000009300.00": ["BÁNH CUỐN TÔM 65G & NƯỚC TƯƠNG 50G/SACHET & HÀNH PHI & HÀNH ", 8.467],
	"NUTR00000009281.00": ["MÌ TRỘN DAN DAN CHAY 308G", 6.726],
	"NUTR00000009274.00": ["MÌ HOÀNH THÁNH TÔM SOUP 308G (CODE: NUT-S32I2.21)", 6.726],
	"NUTR00000009270.00": ["MÌ RAMEN CHAY VỊ TONKOTSU 308G (CODE: NUT-S88A6.24, TÔ BẢ MÍ", 6.726],
	"NUTS00000002798.00": ["SỦI CẢO CHAY 35G (SỬ DỤNG CHUNG BAO BÌ AUT DUVP8)", 10.146],
	"NUTS000ORNDUVP8.00": ["SỦI CẢO CHAY 35G (SỬ DỤNG CHUNG BAO BÌ AUT DUVP8)", 10.146],
	"AUTS000ORNDUVP8.00": ["SỦI CẢO CHAY 35G (CODE 931)", 10.146],
	"SFFP000000SFF02.00": ["ĐẾ BÁNH PIZZA NƯỚNG 210G, 10 INCHES, HA", 7.183],
	"SFFP000000SFF03.00": ["ĐẾ BÁNH PIZZA NƯỚNG 250G, 12 INCHES, HA", 8.626],
	"SFFP000000SFF05.00": ["BÁNH PANCAKE 40G, HA (CODE SFF-S02A1.25)", 5.449],
	"SFFP000000SFF05.0A": ["BÁNH PANCAKE 40G, HA (THAY ĐỔI THÙNG)", 5.561],
	"SGPB00000GPBV02.00": ["BÁNH MÌ BURGER MÈ 35G", 6.206],
	"SGPC00000GPFF31.AB": ["CHẢ GIÒ RẾ CHAY 25G", 6.595],
	"SGPD0000000VN07.0A": ["BÁNH CỦ CẢI 100G", 9.03],
	"SGPD0000000VN12.0A": ["BÁNH TÔM HẸ 30G", 10.47],
	"SGPD0000000VN12.AA": ["BÁNH TÔM HẸ 30G", 10.47],
	"SGPD0000000VN18.AA": ["HOÀNH THÁNH HẢI SẢN 20G", 9.72],
	"SGPD00000GPDS28.0A": ["XÍU MẠI HẢI SẢN 25G", 6.96],
	"SGPH0000000GN02.AA": ["SỦI CẢO CHAY 25G", 11.48],
	"SGPH0000000VN08.0A": ["HÁ CẢO TÔM 25G", 6.83],
	"SGPH0000000VN08.0B": ["HÁ CẢO TÔM 25G, 12PC/TRAY", 6.75],
	"SGPK0000000GN04.0A": ["HẢI SẢN VIÊN 40G", 11.688],
	"SGPK0000000GN05.00": ["TÔM XÙ CÁNH BƯỚM 25G", 12.79],
	"SGPK0000000GN05.0A": ["TÔM XÙ CÁNH BƯỚM 25G", 12.79],
	"SGPK0000000VN14.0A": ["BÁNH XẾP TÔM CỦ SẮN 25G", 11.07],
	"SGPK00000GPRM10.AB": ["XOÀI CẮT ĐÔNG LẠNH 2KG/PE, LOGO HA", 10.72],
	"SGPK00000SW670V.0A": ["BÁNH BAO SANDWICH 36G", 8.095],
	"SGPK00000SW671V.0A": ["BÁNH BAO SANDWICH 48G", 8.704],
	"SGPK0000SW669VN.0A": ["BÁNH BAO SANDWICH 30G", 6.805],
	"SGPP0000000VN15.0A": ["BÁNH NƯỚNG 25G", 8.612],
	"SGPP0000000VN21.0A": ["BÁNH XÈO 130G", 8.488],
	"SGPP0000000VN21.0B": ["BÁNH XÈO 130G", 8.488],
	"SGPP000000VN15A.00": ["BÁNH NƯỚNG 20G", 4.783],
	"SGPP000000VN16A.0A": ["BÁNH NƯỚNG 40G", 8.975],
	"SGPS0000GPDS26A.0A": ["SỦI CẢO HẢI SẢN 25G", 13.549],
	"SSFB000000SSF03.00": ["BÁNH MÌ BƠ TỎI 40G", 4.608],
	"SSFB000000SSF03.0A": ["BÁNH MÌ BƠ TỎI 20G", 5.316],
	"SSFB000000SSF03.0D": ["BÁNH MÌ BƠ TỎI 20G", 5.316],
	"SSFB000000SSF03.0E": ["BÁNH MÌ BƠ TỎI 20G", 5.316],
	"SSFB000000SSF03.0F": ["BÁNH MÌ BƠ TỎI 20G, LOGO HA", 5.316],
	"SSFB000000SSF18.0C": ["BÁNH MÌ BURGER 55G, HL", 4.453],
	"SSFC000000SSF01.00": ["TÔM VIÊN 40G", 10.74],
	"SSFF000000SSF17.0B": ["HÀNH TÂY TẨM BỘT 1KG/PE", 11.082],
	"SSFH000000SSF11.0A": ["HÁ CẢO TÔM HÌNH HOA HỒNG 25G", 10.22],
	"SSFH000000SSF11.0B": ["HÁ CẢO TÔM HÌNH HOA HỒNG 25G", 10.22],
	"SSFH000000SSF11.0C": ["HÁ CẢO TÔM HÌNH HOA HỒNG 25G", 10.22],
	"SSFK000000SSF07.0B": ["HÀNH TÂY XÀO 500G/PA", 10.68],
	"SSFK000000SSF10.0A": ["BÁNH BURRITOS TÔM 20G", 8.765],
	"SSFK000000SSF12.00": ["BÁNH MÌ TÔM MÈ 25G", 5.682],
	"SSFK000000SSF12.0A": ["BÁNH MÌ TÔM MÈ 25G", 5.682],
	"SSFK000000SSF12.0B": ["BÁNH MÌ TÔM MÈ 25G\n(LÓT MANH BONG BÓNG TỪNG LỚP, BĂNG KEO CA", 5.682],
	"SSFK000000SSF14.0B": ["NẤM XÀO 800G/PA", 10.233],
	"SSFK000000SSF15.0B": ["BÁNH TIRAMISU 150G", 8.648],
	"SSFK000000SSF19.00": ["BÁNH CHIÊN PHỦ ĐƯỜNG 55G", 4.741],
	"SSFP000000SSF21.00": ["SỦI CẢO TÔM HẸ 25G, LOGO HA", 5.515],
	"SSFP000000SSF21.0A": ["SỦI CẢO TÔM 25G, LOGO HA", 5.515],
	"SSFK00000SSF08A.A0": ["RAU CỦ XÀO 800G", 10.36],
	"SSFN000000SSF05.BA": ["MÌ Ý LUỘC ĐÔNG LẠNH 160G", 8.581],
	"SSFN000000SSF05.BE": ["MÌ Ý LUỘC ĐÔNG LẠNH 160G/PE", 8.581],
	"SSFP000000SSF02.00": ["ĐẾ BÁNH PIZZA NƯỚNG 10 INCH 210G", 5.177],
	"SSFP000000SSF02.0A": ["ĐẾ BÁNH PIZZA NƯỚNG 10 INCH 210G", 5.206],
	"SSFP000000SSF02.0F": ["ĐẾ BÁNH PIZZA NƯỚNG 10 INCHES 210G, HL", 5.206],
	"SSFP000000SSF13.0C": ["BÁNH NƯỚNG PHÔ MAI 40G", 10.64],
	"SSFP000000SSF16.00": ["PIZZA CÀ CHUA 130G", 4.717],
	"SSFV000000SSF04.0C": ["BẮP HẤP ĐÔNG LẠNH 1KG (CẮT KHÚC 2CM), HL", 10.72],
	"SSFX000000SSF06.0C": ["CÁ TRA TẨM BỘT XÙ 280G", 6.029],
	"SSGB000000SSG03.00": ["BÁNH MÌ BƠ TỎI 20G (LOGO HA)", 5.316],
	"SSGB000000SSG03.0B": ["BÁNH MÌ BƠ TỎI 20G, LOGO HA", 5.316],
	"SSGB000000SSG03.0A": ["BÁNH MÌ BƠ TỎI 20G (LOGO HA)", 5.316],
	"SSGB000000SSG05.00": ["BÁNH MÌ BURGER 55G (LOGO HA)", 4.453],
	"SSGB000000SSG05.0A": ["BÁNH MÌ BURGER 55G (LOGO HA)", 4.453],
	"SSGB000000SSG05.0B": ["BÁNH MÌ BURGER 55G, LOGO HA", 4.453],
	"SSGK000000SSG06.0A": ["SỐT CHIMICHURRI 500G/PA (LOGO HA)", 10.71],
	"SSGK000000SSG06.0B": ["SỐT CHIMICHURRI 500G/PA (LOGO HA)", 10.71],
	"SSGK000000SSG07.00": ["HÀNH TÂY XÀO 500G/PA (LOGO HA)", 10.66],
	"SSGK000000SSG07.0A": ["HÀNH TÂY XÀO 500G/PA (LOGO HA)", 10.66],
	"SSGP000000SSG01.00": ["ĐẾ BÁNH PIZZA NƯỚNG 10 INCHES 210G (LOGO HA)", 5.206],
	"SSGP000000SSG01.0A": ["ĐẾ BÁNH PIZZA NƯỚNG 10 INCHES 210G (LOGO HA)", 5.206],
	"SSGP000000SSG01.0B": ["ĐẾ BÁNH PIZZA NƯỚNG 10 INCHES 210G, LOGO HA", 5.206],
	"SSGR000000SSG02.00": ["MÌ Ý LUỘC ĐÔNG LẠNH 160G/PE (LOGO HA)", 8.518],
	"SSGR000000SSG02.0B": ["MÌ Ý LUỘC ĐÔNG LẠNH 160G/PE, LOGO HA", 8.518],
	"SSGR000000SSG02.0A": ["MÌ Ý LUỘC ĐÔNG LẠNH 160G/PE (LOGO HA)", 8.518],
	"SSMB000000SMH60.0A": ["BÁNH CUỐN TÔM 48G & 40G SOY SAUCE", 9.944],
	"SSMB000000SMH60.AA": ["BÁNH CUỐN TÔM 48G & 40G SOY SAUCE", 9.944],
	"SSMB000000SMH60.BA": ["BÁNH CUỐN TÔM 48G & 40G SOY SAUCE", 9.944],
	"SSMB000000SMH60.BB": ["BÁNH CUỐN TÔM 48G & 40G SOY SAUCE", 9.944],
	"SSMB000000SMH60.BC": ["BÁNH CUỐN TÔM 48G & 40G SOY SAUCE, LOGO HA", 9.944],
	"SSMB000000SMH60.BD": ["BÁNH CUỐN TÔM 48G, SỐT NƯỚC TƯƠNG 40G, LOGO HA", 9.944],
	"SSMB000000SMH62.00": ["BÁNH BAO MÍT NON 55G", 10.902],
	"SSMB000000SMH75.00": ["BÁNH CUỐN TÔM 48G & SỐT NƯỚC TƯƠNG 40G, LOGO HA", 9.885],
	"SSMB000000SMH77.00": ["BÁNH CUỐN TÔM 48G VÀ SỐT NƯỚC TƯƠNG 60G, LOGO HA", 11.53],
	"SSMB000000SMH78.00": ["HOÀNH THÁNH HẢI SẢN 20G, LOGO HA (CODE ESM-S01A.24, HÀNG HẤP", 7.726],
	"SSMB000000SMH78.0A": ["HOÀNH THÁNH HẢI SẢN 20G, LOGO HA (TÂY NINH)", 7.726],
	"SSMB000000SMH79.00": ["HÁ CẢO TÔM 35G, LOGO HA (CODE ESM-S02A.24)", 11.294],
	"SSMB000000SMH79.0A": ["HÁ CẢO TÔM 35G, LOGO HA (TÂY NINH)", 11.294],
	"SSMC000000SMH01.0A": ["CHẢ GIÒ RẾ TÔM PTO 25G", 11.661],
	"SSMC000000SMH01.0B": ["CHẢ GIÒ RẾ TÔM PTO 25G, LOGO HA", 11.661],
	"SSMC000000SMH01.0C": ["CHẢ GIÒ RẾ TÔM PTO 25G, LOGO HA (NHẢY CODE 0C TĂNG CHIỀU CAO", 11.662],
	"SSMC000000SMH28.00": ["CHẢ GIÒ BỘT MÌ CHAY 20G", 8.69],
	"SSMC000000SMH28.0A": ["CHẢ GIÒ BỘT MÌ CHAY 20G", 8.69],
	"SSMC000000SMH28.0B": ["CHẢ GIÒ BỘT MÌ CHAY 20G", 8.69],
	"SSMC00000SMH11A.0A": ["CHẢ GIÒ RẾ KHOAI LANG 25G", 5.463],
	"SSMC00000SMH11A.0B": ["CHẢ GIÒ RẾ KHOAI LANG 25G", 5.463],
	"SSMD00000SMH20A.00": ["SỦI CẢO CHAY 25G", 10.694],
	"SSMD00000SMH20A.0A": ["SỦI CẢO CHAY 25G", 10.694],
	"SSMD00000SMH20A.0B": ["SỦI CẢO CHAY 25G, LOGO HA", 10.694],
	"SSMD00000SMH20A.0C": ["SỦI CẢO CHAY 25G, LOGO HA (TĂNG CHIỀU CAO THÙNG 3CM)", 10.701],
	"SSMG000000SMH40.00": ["SỦI CẢO TÔM HẸ 25G", 10.687],
	"SSMG000000SMH40.0A": ["SỦI CẢO TÔM HẸ 25G", 10.687],
	"SSMG000000SMH40.0B": ["SỦI CẢO TÔM HẸ 25G", 10.687],
	"SSMG000000SMH41.00": ["HOÀNH THÁNH TÔM 15G", 7.585],
	"SSMG000000SMH41.0A": ["HOÀNH THÁNH TÔM 15G", 7.585],
	"SSMG000000SMH41.0B": ["HOÀNH THÁNH TÔM 15G", 7.585],
	"SSMH000000SMH02.A0": ["HÁ CẢO TÔM 15G", 6.509],
	"SSMH000000SMH02.AA": ["HÁ CẢO TÔM 15G", 6.511],
	"SSMH000000SMH02.AB": ["HÁ CẢO TÔM 15G, LOGO HA", 6.511],
	"SSMH000000SMH03.A0": ["HÁ CẢO TÔM 25G", 10.632],
	"SSMH000000SMH03.AA": ["HÁ CẢO TÔM 25G", 10.632],
	"SSMH000000SMH03.AB": ["HÁ CẢO TÔM 25G, LOGO HALAL", 10.632],
	"SSMH000000SMH03.AC": ["HÁ CẢO TÔM 25G, LOGO HALAL", 10.632],
	"SSMH000000SMH14.00": ["HÁ CẢO TÔM PTO 35G", 8.209],
	"SSMH000000SMH14.0A": ["HÁ CẢO TÔM PTO 35G", 8.215],
	"SSMH000000SMH14.0B": ["HÁ CẢO TÔM PTO 35G", 8.215],
	"SSMH000000SMH16.0A": ["HÁ CẢO TÔM (VỎ CARROT XAY) 20G", 8.582],
	"SSMH000000SMH16.0B": ["HÁ CẢO TÔM (VỎ CARROT XAY) 20G", 8.582],
	"SSMH000000SMH22.0A": ["HÁ CẢO SÒ ĐIỆP 25G, LOGO HA", 10.642],
	"SSMH000000SMH22.0B": ["HÁ CẢO SÒ ĐIỆP 25G, LOGO HA", 10.642],
	"SSMH000000SMH43.A0": ["HÁ CẢO TÔM 30G", 12.756],
	"SSMH000000SMH43.AA": ["HÁ CẢO TÔM 30G", 12.756],
	"SSMH000000SMH43.AB": ["HÁ CẢO TÔM 30G", 12.756],
	"SSMH000000SMH44.0A": ["HOÀNH THÁNH HẢI SẢN 25G, HA", 11.34],
	"SSMH000000SMH76.00": ["HÁ CẢO TÔM 30G, LOGO HA (CODE SSM-S13.24, KHÔNG BỘT TRỨNG)", 12.731],
	"SSMK000000SMH71.0A": ["BÁNH CỦ CẢI 100G, LOGO HA", 10.137],
	"SSMB0SMH76A-KOR.00": ["HÁ CẢO TÔM 30G, LOGO HA\n(trên bao đóng mã code mặt hàng nhận", 12.731],
	"SSMB0SMH76A-KOR.0A": ["HÁ CẢO TÔM 30G, LOGO HA (TÂY NINH)\n(trên bao đóng mã code mặ", 12.731],
	"SSMH00000SMH35A.00": ["BẮP CẢI CUỘN TÔM 30G", 12.797],
	"SSMH00000SMH35A.0A": ["BẮP CẢI CUỘN TÔM 30G", 12.797],
	"SSMH00000SMH35A.0B": ["BẮP CẢI CUỘN TÔM 30G", 12.797],
	"SSMH00000SMH37A.00": ["SỦI CẢO CHAY 25G, LOGO HA", 10.707],
	"SSMK000000SMH61.0B": ["TÔM VÀ RAU CỦ TẨM BỘT CHIÊN 25G, LOGO HA", 9.524],
	"SSMK000000SMH61.0A": ["TÔM VÀ RAU CỦ TẨM BỘT CHIÊN 25G, LOGO HA", 9.524],
	"SSMK000000SMH72.00": ["HẢI SẢN VIÊN TẨM BỘT 40G, HA", 8.712],
	"SSMK000000SMH73.00": ["TÔM FILO HAI MÀU 22G, HA", 10.544],
	"SSMK000000SMH74.00": ["RAU CỦ MIẾNG TẨM BỘT 60G, HA", 12.416],
	"SSMB000000SMH81.00": ["HÁ CẢO TÔM 25G, LOGO HA", 10.632],
	"TMFP000000TMF01.00": ["BÁNH NAAN (HÌNH OVAL) 65G", 4.465],
	"TMKC000000TMK01.00": ["CHẢ GIÒ BỘT MÌ TÁO 25G VÀ CARAMEL SAUCE 50G", 9.654],
	"TMWB00000TMW06A.0B": ["BÁNH BAO CHAY WO-WO 30G", 9.99],
	"TMWD000000TMW16.0B": ["BÁNH CUỐN CHAY 60G", 6.956],
	"TMWD000000TMW16.0D": ["BÁNH CUỐN CHAY 60G", 6.97],
	"TMWH000000TMW18.00": ["HOÀNH THÁNH HẢI SẢN 25G", 11.59],
	"TMWK000000TMW17.00": ["BÁNH KHOAI MÔN 450G - CODE: 350.19", 9.97],
	"TMWK000000TMW17.0B": ["BÁNH KHOAI MÔN 450G", 9.97],
	"TMWK000000TMW19.00": ["BÁNH PIE KHOAI MÔN CHIÊN 25G", 7.52],
	"TSTB00TST03-FTR.0B": ["BÁNH CUỐN 35G", 4.126],
	"TSTB00TST03-FTR.0C": ["BÁNH CUỐN HẢI SẢN 35G, KB", 4.126],
	"TSTB00TST03-FTR.0D": ["BÁNH CUỐN HẢI SẢN 35G, KB", 4.126],
	"TSTB00TST03-FTR.0E": ["BÁNH CUỐN HẢI SẢN 35G, KB", 4.126],
	"TSTB00TST03-FTR.0F": ["BÁNH CUỐN HẢI SẢN 35G, KB", 4.126],
	"TSTC000TST02-FT.0B": ["CHẢ GIÒ RẾ KHOAI MỠ 30G", 7.09],
	"TSTH00TST01-FTR.0B": ["HÁ CẢO TÔM PTO 35G", 8.38],
	"TSTH00TST01-FTR.0C": ["HÁ CẢO TÔM PTO 35G", 8.346],
	"TSTH00TST01-FTR.0D": ["HÁ CẢO TÔM PTO 35G", 8.346],
	"TSTH00TST01-FTR.0E": ["HÁ CẢO TÔM PTO 35G", 8.346],
	"TSTH00TST01-FTR.0F": ["HÁ CẢO TÔM PTO 35G", 8.346],
	"TSTH00TST01-FTR.0G": ["HÁ CẢO TÔM PTO 35G, KB", 8.346],
	"TSTH00TST04-FTR.0B": ["HÁ CẢO CÁ VÀNG MẮT ĐỎ 20G", 4.9],
	"TSTH00TST04-FTR.0C": ["HÁ CẢO CÁ VÀNG MẮT ĐỎ 20G, KB", 4.9],
	"TSTH00TST04-FTR.0D": ["HÁ CẢO CÁ VÀNG MẮT ĐỎ 20G, KB", 4.9],
	"TSTH00TST04-FTR.0E": ["HÁ CẢO CÁ VÀNG MẮT ĐỎ 20G", 4.9],
	"TSTH00TST04-FTR.0F": ["HÁ CẢO CÁ VÀNG MẮT ĐỎ 20G", 4.9],
	"TSTH00TST04-FTR.0G": ["HÁ CẢO CÁ VÀNG MẮT ĐỎ 20G", 4.9],
	"TSTH00TST04-FTR.0H": ["HÁ CẢO CÁ VÀNG MẮT ĐỎ 20G", 4.9],
	"TSTH00TST05-FTR.0C": ["HÁ CẢO TÔM 20G, KB", 5.14],
	"TSTH00TST05-FTR.0D": ["HÁ CẢO TÔM 20G", 4.666],
	"TSTH00TST05-FTR.0E": ["HÁ CẢO TÔM 20G, KB", 4.69],
	"TSTH00TST05-FTR.0F": ["HÁ CẢO TÔM 20G, KB", 4.69],
	"TSTH00TST05-FTR.0G": ["HÁ CẢO TÔM 20G, KB", 4.69],
	"TSTH00TST05-FTR.0H": ["HÁ CẢO TÔM 20G, KB", 4.69],
	"TSTH00TST05-FTR.0I": ["HÁ CẢO TÔM 20G, KB", 4.69],
	"TSTH00TST05-FTR.0J": ["HÁ CẢO TÔM 20G, KB", 4.69],
	"TSTK000TST06-FT.0B": ["TÔM CUỐN KHOAI TÂY 30G (NHÃN MỚI TỪ LSX 951/2019)", 9.52],
	"TSTK000TST06-FT.0D": ["TÔM CUỐN KHOAI TÂY 30G", 9.52],
	"TSTK000TST06-FT.0E": ["TÔM CUỐN KHOAI TÂY 30G", 9.52],
	"TSTK000TST06-FT.AF": ["TÔM CUỐN KHOAI TÂY 30G", 9.52],
	"TSTK000TST11-FT.00": ["BÁNH TÔM HẸ 30G (CODE: TST-S01A3.21)", 6.81],
	"TSTK000TST11-FT.0A": ["BÁNH TÔM HẸ 30G", 6.81],
	"TTGH000000TTG02.00": ["HÁ CẢO TÔM VỎ MÀU ĐEN 25G\n(252g - 270g)", 10.396],
	"TTGH000000TTG02.0A": ["HÁ CẢO TÔM VỎ MÀU ĐEN 25G\n(252g - 270g)", 10.396],
	"TTGH000000TTG04.00": ["HÁ CẢO TÔM 25G \n(252g - 270g)", 10.396],
	"TTGH000000TTG04.0A": ["HÁ CẢO TÔM 25G \n(252g - 270g)", 10.396],
	"UALK000000UAL01.0A": ["CÁ CHẼM TẨM BỘT CHIÊN GIÒN 340G ĐÔNG LẠNH", 4.716],
	"UALK000000UAL01.00": ["CÁ CHẼM TẨM BỘT XÙ CHIÊN 340G/TÚI (3-5 VIÊN)", 4.716],
	"UBBP000000UBB01.0B": ["ĐẾ BÁNH PIZZA NƯỚNG SƠ 25CM 250G", 5.66],
	"UBBP000000UBB01.0C": ["ĐẾ BÁNH PIZZA NƯỚNG SƠ 25CM 250G", 5.66],
	"UBBP000000UBB02.00": ["ĐẾ BÁNH PIZZA NƯỚNG SƠ 30CM 370G", 8.337],
	"UBBP000000UBB02.0B": ["ĐẾ BÁNH PIZZA NƯỚNG SƠ 30CM 370G", 8.295],
	"UBBP000000UBB02.0C": ["ĐẾ BÁNH PIZZA NƯỚNG SƠ 30CM 370G", 8.295],
	"UBBX000000UBB03.0A": ["XÍU MẠI MỰC 25G", 11.41],
	"UGTD00000092026.00": ["DIMSUM THẬP CẨM HẤP", 11.6],
	"UGTD00000092026.AA": ["DIMSUM THẬP CẨM HẤP", 11.6],
	"UGTD00000092026.BB": ["DIMSUM THẬP CẨM HẤP", 11.6],
	"UGTD00000336113.00": ["DIMSUM THẬP CẨM HẤP", 11.6],
	"UGTD00000336113.AA": ["DIMSUM THẬP CẨM HẤP", 11.6],
	"UGTD00000336113.BC": ["DIMSUM THẬP CẨM HẤP", 11.6],
	"UGTD00000336128.00": ["BÁNH XẾP HẢI SẢN 50G", 7.029],
	"UGTD00000336129.00": ["BÁNH XẾP TÔM CỦ SẮN 25G", 6.664],
	"UGTD00000336130.00": ["BÁNH XẾP CHAY 40G", 5.941],
	"UGTD00000884467.00": ["DIMSUM THẬP CẨM HẤP", 11.662],
	"UGTD00000LA-099.00": ["BÁNH XẾP HẢI SẢN 50G", 7.029],
	"UGTD00000LA-101.00": ["BÁNH XẾP CHAY 40G", 5.941],
	"UGTD000023095-3.00": ["DIMSUM THẬP CẨM HẤP ((Code: ETF), HÀNG CANADA THAI INDO, CÓ ", 11.6],
	"UGTD000023095-3.AA": ["DIMSUM THẬP CẨM HẤP", 11.6],
	"UGTD000023095-3.BB": ["DIMSUM THẬP CẨM HẤP", 11.6],
	"UGTD00082000039.00": ["DIMSUM THẬP CẨM HẤP\n  (HÀNG ĐI CANADA THAI UNITED, CÓ KIỂM D", 11.7],
	"UGTH00000092024.00": ["HÁ CẢO TÔM 25G", 11.58],
	"UGTH00000092024.AA": ["HÁ CẢO TÔM 25G", 11.58],
	"UGTH00000336112.00": ["HÁ CẢO TÔM 25G", 11.58],
	"UGTH00000336112.AA": ["HÁ CẢO TÔM 25G", 11.58],
	"UGTH00000336112.BC": ["HÁ CẢO TÔM 25G", 11.58],
	"UGTH00000LA-694.00": ["HÁ CẢO TÔM 25G, 1KG/BAG", 11.25],
	"UGTH00000LA-694.AA": ["HÁ CẢO TÔM 25G, 1KG/BAG", 11.25],
	"UGTH000023094-6.00": ["HÁ CẢO TÔM 25G", 11.55],
	"UGTH000023094-6.AA": ["HÁ CẢO TÔM 25G", 11.55],
	"UGTH000023094-6.AB": ["HÁ CẢO TÔM 25G", 11.55],
	"UGTH00082000046.00": ["HÁ CẢO TÔM 25G", 11.65],
	"UGTS00000092025.00": ["XÍU MẠI TÔM 25G", 11.314],
	"UGTS00000092025.AA": ["XÍU MẠI TÔM 25G", 11.314],
	"UGTS0000023093-9.00": ["XÍU MẠI TÔM 25G", 11.55],
	"UGTS00000336114.00": ["XÍU MẠI TÔM 25G", 11.574],
	"UGTS00000336114.AA": ["XÍU MẠI TÔM 25G", 11.574],
	"UGTS00000336114.BC": ["XÍU MẠI TÔM 25G", 11.5],
	"UGTS000023093-9.00": ["XÍU MẠI TÔM 25G", 11.55],
	"UGTS000023093-9.AA": ["XÍU MẠI TÔM 25G", 11.55],
	"UGTS000023093-9.BB": ["XÍU MẠI TÔM 25G", 11.55],
	"UGTS00000884466.00": ["XÍU MẠI TÔM 25G", 11.56],
	"UGTS00082000053.00": ["XÍU MẠI TÔM 25G (CODE: ETF, HÀNG CANADA, THAI, UNITED KIỂM D", 11.56],
	"UGTC00000336136.00": ["CHẢ GIÒ BỘT MÌ CHAY CHIÊN 25G", 11.248],
	"UGTR00000336139.00": ["MÌ HOÀNH THÁNH TÔM SÚP 308G/TÔ", 9.528],
	"UHAB00000036220.00": ["BÁNH CÀ RI RAU CỦ CHAY 130G, RTE", 7.13],
	"UHAB00000036620.00": ["BÁNH CÀ RI RAU CỦ CHAY 130G, RTE", 6.89],
	"UHAC00000082096.00": ["SAMOSA VỊ CÀ RI RAU CỦ 25G", 10.98],
	"UHAC00000082096.0A": ["SAMOSA VỊ CÀ RI RAU CỦ 25G", 10.98],
	"UHAC00000082096.0B": ["SAMOSA VỊ CÀ RI RAU CỦ 25G", 11.03],
	"UHAC00000082096.0C": ["SAMOSA VỊ CÀ RI RAU CỦ 25G", 11.03],
	"UHAG00000082093.00": ["SỦI CẢO TÔM PTO ÁP CHẢO 25G", 7.168],
	"UHAG00000082093.0A": ["SỦI CẢO TÔM PTO ÁP CHẢO 25G", 7.168],
	"UHAG00000082095.00": ["SỦI CẢO TÔM 25G, GF", 10.89],
	"UHAS00000082094.00": ["XÍU MẠI TÔM 35G", 7.89],
	"UHAS00000082094.AA": ["XÍU MẠI TÔM 35G", 7.89],
	"UHAS0000082094A.00": ["XÍU MẠI TÔM 35G", 7.89],
	"UHAS0000082094A.A0": ["XÍU MẠI TÔM 35G (PHUN LÔ TÔM TRÊN BAO BÌ)", 7.89],
	"CAHAS0000082094.00": ["XÍU MẠI TÔM 35G", 7.847],
	"CAHAS0000048031.00": ["XÍU MẠI GHẸ 35G", 7.847],
	"UHAC00000037643.00": ["CHẢ GIÒ RẾ TÔM 22G (PHUN LÔ TÔM TRÊN BAO BÌ)", 9.675],
	"UHAK00000037640.00": ["TÔM CUỘN KHOAI TÂY 30G", 9.52],
	"UHAS00000036238.00": ["XÍU MẠI TÔM 15G (PHUN LÔ TÔM V1,V2)", 2.3],
	"UHAS00000082913.00": ["XÍU MẠI TÔM 15G (PHUN LÔ TÔM V1,V2)", 4.918],
	"UHGK000000UHG01.00": ["BÁNH CÀ RI RAU CỦ CHAY 70G", 7.845],
	"UHGK000000UHG01.AB": ["BÁNH CÀ RI RAU CỦ CHAY 70G", 7.845],
	"UHGK000000UHG01.0A": ["BÁNH CÀ RI RAU CỦ CHAY 70G", 7.845],
	"UHT0000000UHT01.00": ["HÁ CẢO TÔM BA MÀU 25G", 6.914],
	"UHT0000000UHT03.00": ["BÁNH CUỐN HẢI SẢN 40G", 6.434],
	"UHT0000000UHT05.00": ["HÁ CẢO TÔM HẸ 25G", 6.974],
	"UHT0000000UHT06.00": ["HÁ CẢO TÔM 20G", 5.774],
	"UHT0000000UHT07.00": ["HÁ CẢO TÔM PTO 20G", 4.866],
	"UHT0000000UHT08.00": ["XÍU MẠI GHẸ 25G", 6.99],
	"UHT0000000UHT09.00": ["XÍU MẠI TÔM 20G", 5.68],
	"UHT0000000UHT10.00": ["HOÀNH THÁNH TÔM 20G", 7.03],
	"UHT0000000UHT13.00": ["SỦI CẢO TÔM HẸ 20G", 9.56],
	"CAHT00000EG3021.00": ["SỦI CẢO TÔM HẸ 20G", 9.56],
	"KHT100000000001.00": ["SỦI CẢO TÔM HẸ 20G", 9.56],
	"UHT0000000UHT14.00": ["XÍU MẠI TÔM 25G", 11.42],
	"CAHT00000EG3022.00": ["XÍU MẠI TÔM 25G\n(SỬ DỤNG CHUNG BAO BÌ UHT14)", 11.42],
	"KHT100000000002.00": ["XÍU MẠI TÔM 25G (RỚT NGÀY 23 SX)", 11.42],
	"UHT0000000UHT15.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM CUA 22G", 9.58],
	"KHT100000000003.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM CUA 22G", 9.58],
	"CAHT00000EG3024.00": ["CHẢ GIÒ RẾ TÔM 20.8G", 11.47],
	"UHT0000000UHT16.00": ["CHẢ GIÒ RẾ TÔM 20.8G", 11.47],
	"KHT100000000004.00": ["CHẢ GIÒ RẾ TÔM 20.8G", 11.47],
	"UHT0000000UHT17.00": ["HÁ CẢO TÔM 25G", 11.57],
	"KHT100000000005.00": ["HÁ CẢO TÔM 25G", 11.57],
	"CAHT00000EG3025.00": ["HÁ CẢO TÔM 25G \n(SỬ DỤNG BAO BÌ UHT17)", 11.57],
	"CAHT00000EG3026.00": ["BÁNH CUỐN TÔM 450G/PA", 6.862],
	"UHT0000000UHT18.00": ["BÁNH CUỐN TÔM SAUCE 450G/PA", 6.862],
	"ULKD000000ULK03.00": ["DIMSUM HẤP 500G/TRAY", 6.908],
	"ULKH000000ULK01.00": ["HÁ CẢO TÔM 25G", 6.9],
	"CALKS0000CALK01.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM CUA 25G (CODE CALK-S01.25)", 6.811],
	"CALKH0000CALK02.00": ["HÁ CẢO TÔM 25G", 6.9],
	"ULKH000000ULK04.00": ["HÁ CẢO HẢI SẢN 25G", 6.972],
	"ULKS000000ULK02.00": ["XÍU MẠI TÔM 25G", 6.9],
	"CALKS0000CALK03.00": ["XÍU MẠI TÔM 25G (CODE CALK-S03.25)", 6.9],
	"UWUH000000UWU01.00": ["HÁ CẢO TÔM 25G", 11.563],
	"UMNK000000UMN01.0A": ["BÁNH BAO SANDWICH 30G", 6.658],
	"UMNK000000UMN01.0B": ["BÁNH BAO SANDWICH 30G", 6.658],
	"UMRB0000EF21036.00": ["BÁNH TIỂU LONG TÔM 30G, RTE, KB (CODE UMR-S44A.24)", 7.367],
	"UMRB0000EF21037.00": ["BÁNH BAO SANDWICH TÔM 90G, RTE, KB", 8.874],
	"UMRB0000EF21046.00": ["BÁNH TIỂU LONG SÔ CÔ LA 25G, RTE, KB (CODE 380A1.24)", 6.672],
	"UMRB0000EF21046.0A": ["BÁNH TIỂU LONG SÔ CÔ LA 25G, RTE, KB (CODE 380A1.24)", 6.672],
	"UMRB0000EF21046.0B": ["BÁNH TIỂU LONG SÔ CÔ LA 25G, RTE, KB (CODE 380A1.24)", 6.672],
	"MEEFB000EF21051.00": ["BÁNH TIỂU LONG SÔ CÔ LA 25G, RTE, KB", 8.212],
	"EMR1S000EF21047.00": ["CHẢ GIÒ BỘT MÌ EDAMAME VỚI SỐT ỚT 250G/HỘP, RTE, KB, FSC LOG", 4.601],
	"UMRB0000EF21048.00": ["BÁNH BAO SANDWICH TÔM 90G, RTE, KB", 5.363],
	"UMRC0000EF21003.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM 20G (CODE: JMR-S37B.21)", 9.46],
	"UMRC0000EF21019.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM 20G VÀ SỐT ỚT 60G/GÓI, RTE, KB", 4.39],
	"UMRC0000EF21019.AA": ["CHẢ GIÒ BÁNH TRÁNG TÔM 20G VÀ SỐT ỚT 60G/GÓI, RTE, KB, TÔM B", 4.39],
	"UMRC0000EF21019.AB": ["CHẢ GIÒ BÁNH TRÁNG TÔM 20G VÀ SỐT ỚT 60G/GÓI", 3.8],
	"UMRC0000EF21019.AC": ["CHẢ GIÒ BÁNH TRÁNG TÔM 20G VÀ SỐT ỚT 60G/GÓI", 3.8],
	"UMRC0000EF21035.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM 20G, RTE, KB, TÔM BAP 4*", 5.737],
	"UMRD0000EF21016.00": ["MIX DIMSUM HẤP VÀ SỐT PONZU 310G, RTE, KB", 3.91],
	"UMRD0000EF21016.A0": ["MIX DIMSUM HẤP VÀ SỐT PONZU 310G, RTE, KB", 3.88],
	"UMRD0000EF21016.AA": ["MIX DIMSUM HẤP VÀ SỐT PONZU 310G, RTE, KB", 3.88],
	"UMRG0000EF21040.00": ["SỦI CẢO TÔM HẸ 25G, RTE, KB (CODE UMR-S23A.24)", 5.515],
	"UMRG0000EF21040.0A": ["SỦI CẢO TÔM HẸ 25G, RTE, KB (THÙNG PHUN DATE SẴN)", 5.515],
	"UMRH0000EF21000.00": ["HÁ CẢO TÔM 25G (CODE: UMR-S07B.21)", 5.96],
	"UMRH0000EF21000.BC": ["HÁ CẢO TÔM 25G, RTE, KB, TÔM BAP 4*", 5.96],
	"UMRH0000EF21000.BD": ["HÁ CẢO TÔM 25G, RTE, KB, TÔM BAP 4*", 5.96],
	"UMRH0000EF21000.CE": ["HÁ CẢO TÔM 25G, RTE, KB, TÔM BAP 4*", 5.96],
	"UMRH0000EF21001.00": ["HÁ CẢO TÔM 25G (HÌNH SỦI CẢO) (CODE: JMR-S33.21)", 6.12],
	"UMRH0000EF21001.AA": ["HÁ CẢO TÔM 25G (HÌNH SỦI CẢO) (CODE: JMR-S33.21)", 6.12],
	"UMRH0000EF21004.00": ["HÁ CẢO TÔM GỪNG 25G", 5.959],
	"UMRH0000EF21004.AA": ["HÁ CẢO TÔM GỪNG 25G", 5.959],
	"UMRH0000EF21004.BB": ["HÁ CẢO TÔM GỪNG 25G", 5.959],
	"UMRH0000EF21005.00": ["HÁ CẢO TÔM HẸ MÀU XANH 25G", 11.7],
	"UMRH0000EF21005.AA": ["HÁ CẢO TÔM HẸ MÀU XANH 25G", 11.7],
	"UMRH0000EF21005.BB": ["HÁ CẢO TÔM HẸ MÀU XANH 25G, RTE, KB, TÔM BAP 4*", 11.7],
	"UMRK0000EF21006.AB": ["BÁNH MÌ HẢI SẢN MÈ 40G", 6.792],
	"UMRK0000EF21023.00": ["BÁNH MÌ HẢI SẢN MÈ 40G", 3.77],
	"UMRK0000EF21023.0A": ["BÁNH MÌ HẢI SẢN MÈ 40G", 3.77],
	"UMRK0000EF21023.0B": ["BÁNH MÌ HẢI SẢN MÈ 40G", 3.76],
	"UMRS0000EF21007.AA": ["CHẢ GIÒ BỘT MÌ EDAMAME 25G", 7.266],
	"UMRS0000EF21008.AB": ["XÍU MẠI TÔM 30G", 7.02],
	"UMRS0000EF21014.0A": ["CHẢ GIÒ BỘT MÌ EDAMAME 25G, RTE, KB", 7.226],
	"UMRW0000EF21002.AA": ["HOÀNH THÁNH TÔM CHIÊN 25G (CODE: JMR-S36.21)", 5.21],
	"UMRW0000EF21018.00": ["HOÀNH THÁNH TÔM CHIÊN 25G VÀ SỐT ỚT 60G/GÓI, RTE, KB", 3.86],
	"UMRW0000EF21018.A0": ["HOÀNH THÁNH TÔM CHIÊN 25G VÀ SỐT ỚT 60G/GÓI, RTE, KB", 3.86],
	"UMRW0000EF21018.AA": ["HOÀNH THÁNH TÔM CHIÊN 25G VÀ SỐT ỚT 60G/GÓI, RTE, KB", 3.91],
	"UMRW0000EF21018.AB": ["HOÀNH THÁNH TÔM CHIÊN 25G VÀ SỐT ỚT 60G/GÓI, RTE, KB", 3.91],
	"UMRW0000EF21018.AC": ["HOÀNH THÁNH TÔM CHIÊN 25G VÀ SỐT ỚT 60G/GÓI, RTE, KB", 3.91],
	"UMRW0000EF21039.AA": ["HOÀNH THÁNH HẢI SẢN CHIÊN 20G, RTE, KB", 4.71],
	"UMRW0000EF21039.AB": ["HOÀNH THÁNH HẢI SẢN CHIÊN 20G, RTE, KB", 4.71],
	"UMRX0000EF21017.00": ["XÍU MẠI TÔM 25G VÀ SỐT PONZU 60G/GÓI, RTE, KB", 3.86],
	"UMRX0000EF21017.A0": ["XÍU MẠI TÔM 25G VÀ SỐT PONZU 60G/GÓI, RTE, KB", 3.86],
	"UMRX0000EF21017.AA": ["XÍU MẠI TÔM 25G VÀ SỐT PONZU 60G/GÓI, RTE, KB", 3.91],
	"UMRX0000EF21017.AB": ["XÍU MẠI TÔM 25G VÀ SỐT PONZU 60G/GÓI, RTE, KB", 3.91],
	"UMRX0000EF21017.BC": ["XÍU MẠI TÔM 25G VÀ SỐT PONZU 60G/GÓI, RTE, KB", 3.91],
	"UMRX0000EF21041.00": ["XÍU MẠI CHAY 25G, RTE, KB (CODE 379A.24)", 5.443],
	"UMS1R0007221130.00": ["MÌ SOUP RAU CỦ VỊ HEO CHAY 270G (CODE 303K.23)", 4.652],
	"UMS1R0007221130.0A": ["MÌ SOUP RAU CỦ VỊ HEO CHAY 270G (GIẢM 1CM CHỀU CAO)", 4.564],
	"UMS1R0007221131.00": ["MÌ SOUP RAU CỦ VỊ NƯỚC TƯƠNG 270G (CODE 302J.23)", 4.652],
	"UMS1R0007221131.0A": ["MÌ SOUP RAU CỦ VỊ NƯỚC TƯƠNG 270G (GIẢM CHIỀU CAO THÙNG)", 4.564],
	"UMS1R0007221132.00": ["MÌ SOUP RAU CỦ VỊ MISO 270G (CODE 794H.23)", 4.652],
	"UMS1R0007221132.0A": ["MÌ SOUP RAU CỦ VỊ MISO 270G (GIẢM 1CM CHIỀU CAO THÙNG, CHỈNH", 4.564],
	"UMS1R0007221133.00": ["MÌ KHÔ RAU CỦ CHAY 300G", 4.71],
	"UMS1R0007221133.0A": ["MÌ KHÔ RAU CỦ CHAY 300G (GIẢM CHIỀU CAO THÙNG)", 4.582],
	"UMS1K0007221204.00": ["BÁNH MÌ HẢI SẢN MÈ 40G VÀ SỐT ỚT 50G/GÓI, KB, TÔM BAP 4* (CO", 7.376],
	"UMS1X0007221196.00": ["XÍU MẠI TÔM 15G", 5.194],
	"UMS1X0007221196.0A": ["XÍU MẠI TÔM 15G (CODE 0A ĐỔI KHAY)", 5.224],
	"UMS1X0007221196.0B": ["XÍU MẠI TÔM 15G (GIẢM 1.5CM CHIỀU CAO THÙNG)", 5.233],
	"UMTC00000070190.0D": ["CHẢ GIÒ RẾ TÔM 16G", 10.355],
	"UMTC00000070191.0A": ["CHẢ GIÒ RẾ TÔM DÀI 35G", 12.084],
	"UMTC00000070191.0C": ["CHẢ GIÒ RẾ TÔM DÀI 35G", 12.084],
	"UMTK00000006815.0D": ["BÁNH RAU CỦ CHIÊN TÔM 40G", 4.67],
	"UMTK00000071521.0A": ["KHOAI TÂY CUỘN TÔM 30G", 6.88],
	"UMTK00000071644.00": ["KHOAI TÂY CUỘN TÔM 30G", 9.52],
	"UMTK00000031355.00": ["KHOAI TÂY CUỘN TÔM 30G", 9.52],
	"UMTK00000031355.0A": ["KHOAI TÂY CUỘN TÔM 30G", 9.52],
	"UNPG000000UNP03.00": ["SỦI CẢO CHAY 5 MÀU ÁP CHẢO 500G/PA (GF, VE, KB, RTE)", 11.701],
	"UNPG000000UNP03.0A": ["SỦI CẢO CHAY 5 MÀU ÁP CHẢO 500G/PA (GF, VE, KB, RTE)", 11.701],
	"UNPG000000UNP03.0B": ["SỦI CẢO CHAY 5 MÀU ÁP CHẢO 500G/PA, GF, VE, KB, RTE", 11.701],
	"UNPG00000UNP01A.00": ["SỦI CẢO CHAY ÁP CHẢO 25G", 11.7],
	"UNPG00000UNP02A.00": ["SỦI CẢO TÔM PTO ÁP CHẢO 25G (TÔM BAP 4*), GF, RTE", 11.71],
	"UNPG00000UNP02A.AA": ["SỦI CẢO TÔM PTO ÁP CHẢO 25G (TÔM BAP 4*), GF, RTE", 11.71],
	"UNPG00000UNP02A.AB": ["SỦI CẢO TÔM PTO ÁP CHẢO 25G, TÔM BAP 4*, GF, RTE", 11.71],
	"UNPK000000UNP05.00": ["BÁNH BẮP CHIÊN 30G, GF, VE, KB", 6.896],
	"UNPT000000UNP04.00": ["BỘ MIX RAU CỦ CHIÊN 500G/PA, GF, VE, KB", 3.878],
	"UNPT000000UNP04.0A": ["BỘ MIX RAU CỦ CHIÊN 500G/PA, GF, VE, KB", 3.878],
	"UOPH000000UOP01.00": ["HÁ CẢO TÔM 25G (CODE UOP-S01.22 KHÔNG BỘT TRẮNG TRỨNG)", 11.64],
	"UTT1D0000501349.00": ["HÁ CẢO TÔM 26G (CODE CATT-S07.23)", 9.898],
	"UTT1D0000501349.0A": ["HÁ CẢO TÔM 26G", 9.898],
	"UTT1D0000507718.00": ["BÁNH CUỐN TÔM 48G VỚI SỐT 50G/GÓI", 13.274],
	"UTT1D0000510765.00": ["XÍU MẠI TÔM 25G (CODE CATT-S10A.23)", 12.508],
	"UTT1D0000510765.0A": ["XÍU MẠI TÔM 25G", 12.508],
	"UTT1D0000510767.00": ["BÁNH CUỐN HẢI SẢN 48G VỚI SỐT 46G/GÓI", 12.584],
	"UTT1D0000510768.00": ["BÁNH CUỐN TÔM 48G VỚI SỐT 46G/GÓI", 12.566],
	"UTT1D0000519019.00": ["CHẢ GIÒ CHAY CHIÊN 50G", 11.97],
	"UTT1D0000519019.0A": ["CHẢ GIÒ CHAY CHIÊN 50G", 11.97],
	"UTT1D0000786937.00": ["HÁ CẢO TÔM 25G (CODE CATT-S11.23)", 11.46],
	"UTT1D0000786937.0A": ["HÁ CẢO TÔM 25G", 11.672],
	"UTT2D0000501349.00": ["Há cảo tôm 26g", 9.962],
	"UTT2D0000507718.00": ["BÁNH CUỐN TÔM 48G VỚI SỐT 50G/GÓI", 13.274],
	"UTT2D0000510765.00": ["XÍU MẠI TÔM 25G (CODE CATT-S10A.23)", 12.508],
	"UTT2D0000510767.00": ["BÁNH CUỐN HẢI SẢN 48G VỚI SỐT 46G/GÓI", 12.566],
	"UTT2D0000510768.00": ["BÁNH CUỐN TÔM 48G VỚI SỐT 46G/GÓI", 12.566],
	"UTT2D0000519019.00": ["CHẢ GIÒ CHAY CHIÊN 50G", 11.97],
	"UTT2D0000786937.00": ["HÁ CẢO TÔM 25G (CODE CATT-S11.23)", 11.46],
	"UUGB000000UUG05.00": ["BÁNH BAO KHOAI MÔN 40G", 7.421],
	"UUGB000000UUG06.00": ["BÁNH BAO ĐẬU ĐỎ 40G", 7.421],
	"UUGG000000UUG02.00": ["XÍU MẠI TÔM 25G", 11.58],
	"UUGX00081147502.00": ["XÍU MẠI TÔM 25G", 11.457],
	"UUGH000000UUG01.00": ["HÁ CẢO TÔM 25G", 11.58],
	"UUGH000000UUG01.AA": ["HÁ CẢO TÔM 25G", 11.58],
	"UUGH00081147500.00": ["HÁ CẢO TÔM 25G", 11.467],
	"UUGK00081147509.00": ["BÁNH NẾP TÔM LÁ SEN 80G", 6.446],
	"UUGH00081147507.00": ["HÁ CẢO TÔM HẸ 25G", 6.973],
	"UUGR000000UUG03.00": ["MÌ XÀO HẢI SẢN SINGAPORE 300G", 7.2],
	"UUGR000000UUG04.00": ["MIẾN XÀO GHẸ 250G", 7.268],
	"UUGR000000UUG07.00": ["BÁNH CUỐN TÔM 46G VÀ SOY SAUCE", 9.388],
	"EUGC000000EUG04.00": ["CHẢ GIÒ BỘT MÌ RAU CỦ CHIÊN 340G/HỘP", 8.261],
	"EUGC000000EUG04.0A": ["CHẢ GIÒ BỘT MÌ RAU CỦ CHIÊN 340G/HỘP", 8.261],
	"EUGC000000EUG04.0B": ["CHẢ GIÒ BỘT MÌ RAU CỦ CHIÊN 340G/HỘP (DL719)", 8.261],
	"EUGG000000EUG05.00": ["SỦI CẢO CHAY CHIÊN 340G/HỘP", 8.558],
	"EUGG000000EUG05.0A": ["SỦI CẢO CHAY CHIÊN 340G/HỘP", 8.558],
	"EUGG000000EUG05.0B": ["SỦI CẢO CHAY CHIÊN 340G/HỘP (DL719)", 8.307],
	"UWED00000001731.00": ["BÁNH CUỐN HẢI SẢN 45G & SOY SAUCE 50G", 12.582],
	"UWEH00000001730.00": ["HÁ CẢO HOÀNG GIA 25G", 11.478],
	"UWEK00000230094.AB": ["BÁNH BAO SANDWICH 30G. 10PC/PET BAG", 8.165],
	"UWLC00001692592.AA": ["DIMSUM THẬP CẨM CHIÊN 520G/TRAY", 7.151],
	"UWLC00001692592.BB": ["DIMSUM THẬP CẨM CHIÊN 520G/TRAY", 7.151],
	"UWLC00001692592.BC": ["DIMSUM THẬP CẨM CHIÊN 520G/TRAY", 7.151],
	"UWLC00001692595.AB": ["CHẢ GIÒ BÁNH TRÁNG ỐNG TRÚC 8G", 6.86],
	"UWLC00001692595.AA": ["CHẢ GIÒ BÁNH TRÁNG ỐNG TRÚC 8G", 6.86],
	"UWLC00001692634.0A": ["CHẢ GIÒ BỘT MÌ CHAY 25G", 6.784],
	"UWLC00001692634.0B": ["CHẢ GIÒ BỘT MÌ CHAY 25G", 6.784],
	"UWLC00001692635.0A": ["CHẢ GIÒ BÁNH TRÁNG TÔM CUA 25G", 6.828],
	"UWLC00001692635.AB": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G", 6.828],
	"UWLC00001692635.AC": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G", 6.828],
	"UWLC0001692592A.00": ["DIMSUM THẬP CẨM CHIÊN 520G/TRAY", 7.151],
	"UWLC0001692592A.AA": ["DIMSUM THẬP CẨM CHIÊN 520G/TRAY", 7.151],
	"UWLC0001692592A.AB": ["DIMSUM THẬP CẨM CHIÊN 520G/TRAY", 7.151],
	"UWLC0001692595A.00": ["CHẢ GIÒ BÁNH TRÁNG ỐNG TRÚC 8G", 6.86],
	"UWLC0001692595A.0A": ["CHẢ GIÒ BÁNH TRÁNG ỐNG TRÚC 8G", 6.86],
	"UWLC0001692634A.00": ["CHẢ GIÒ BỘT MÌ CHAY 25G", 6.784],
	"UWLC0001692634A.0A": ["CHẢ GIÒ BỘT MÌ CHAY 25G", 6.784],
	"UWLC0001692635A.00": ["CHẢ GIÒ BÁNH TRÁNG TÔM CUA 25G", 6.828],
	"UWLC0001692635A.AA": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G", 6.828],
	"UWLC0001692635A.AB": ["CHẢ GIÒ BÁNH TRÁNG TÔM 25G", 6.828],
	"UWLD00001692591.AB": ["DIMSUM THẬP CẨM HẤP 500G/TRAY", 7.003],
	"UWLD00001692591.BC": ["DIMSUM THẬP CẨM HẤP 500G/TRAY", 7.003],
	"UWLD00001692591.BD": ["DIMSUM THẬP CẨM HẤP 500G/TRAY", 7.003],
	"UWLD00001692633.AA": ["BÁNH QUAI VẠC 50G", 7.074],
	"UWLD00001692633.BB": ["BÁNH QUAI VẠC 50G", 7.074],
	"UWLD00001692633.BC": ["BÁNH QUAI VẠC 50G", 7.074],
	"UWLD0001692633A.00": ["BÁNH QUAI VẠC 50G", 7.074],
	"UWLD0001692633A.AA": ["BÁNH QUAI VẠC 50G", 7.074],
	"UWLD00002001550.0A": ["BÁNH XẾP HẢI SẢN (FAN GUO) 25G", 6.922],
	"UWLD00002001550.AA": ["BÁNH XẾP HẢI SẢN (FAN GUO) 25G", 6.922],
	"UWLD00003692598.00": ["BÁNH CUỐN TÔM 45G", 10.59],
	"UWLD00003693081.0A": ["HOÀNH THÁNH TÔM 15G", 4.715],
	"UWLD00003693081.AB": ["HOÀNH THÁNH TÔM 15G", 4.715],
	"UWLD00003693081.AC": ["HOÀNH THÁNH TÔM 15G", 4.715],
	"UWLD00003693082.0A": ["BÁNH TÔM HẸ 30G", 6.657],
	"UWLD00003694674.0A": ["BÁNH CUỐN TÔM 45G", 6.106],
	"UWLD00003694676.0A": ["CHẢ GIÒ RẾ TÔM PTO 20G", 5.81],
	"UWLD00003694676.AC": ["CHẢ GIÒ RẾ TÔM PTO 20G", 5.81],
	"UWLD00003694677.0A": ["CHẢ GIÒ RẾ CÀNG GHẸ 20G", 5.816],
	"UWLD00003694678.0A": ["CÀNG BAO TÔM 31.25G", 3.6038],
	"UWLD00003694679.0A": ["CHẠO TÔM 50G", 4.261],
	"UWLD00003694679.AB": ["CHẠO TÔM 50G", 4.261],
	"UWLD00003694679.AC": ["CHẠO TÔM 50G", 4.261],
	"UWLD00003694680.0A": ["CHẢ GIÒ RẾ TÔM MỰC 20G", 5.785],
	"UWLD00003694680.AB": ["CHẢ GIÒ RẾ TÔM 20G", 5.785],
	"UWLD00003694680.AC": ["CHẢ GIÒ RẾ TÔM 20G", 5.785],
	"UWLD0001692591A.00": ["DIMSUM THẬP CẨM HẤP 500G/TRAY", 7.003],
	"UWLD0001692591A.AA": ["DIMSUM THẬP CẨM HẤP 500G/TRAY", 7.003],
	"UWLD0001692591A.AB": ["DIMSUM THẬP CẨM HẤP 500G/TRAY", 7.003],
	"UWLD0003692598A.00": ["BÁNH CUỐN TÔM 45G", 10.59],
	"UWLD0003693081A.00": ["HOÀNH THÁNH TÔM 15G", 4.715],
	"UWLD0003693081A.AA": ["HOÀNH THÁNH TÔM 15G", 4.715],
	"UWLD0003693081A.AB": ["HOÀNH THÁNH TÔM 15G", 4.715],
	"UWLD0003694674A.00": ["BÁNH CUỐN TÔM 45G", 6.106],
	"UWLD0003694676A.00": ["CHẢ GIÒ RẾ TÔM PTO 20G", 5.81],
	"UWLD0003694676A.AA": ["CHẢ GIÒ RẾ TÔM PTO 20G", 5.81],
	"UWLD0003694676A.AB": ["CHẢ GIÒ RẾ TÔM PTO 20G", 5.81],
	"UWLD0003694678A.00": ["CÀNG BAO TÔM 31.25G", 3.6038],
	"UWLD0003694679A.00": ["CHẠO TÔM 50G", 4.261],
	"UWLD0003694679A.AA": ["CHẠO TÔM 50G", 4.261],
	"UWLD0003694679A.AB": ["CHẠO TÔM 50G", 4.261],
	"UWLD0003694680A.00": ["CHẢ GIÒ RẾ TÔM MỰC 20G", 5.785],
	"UWLD0003694680A.AB": ["CHẢ GIÒ RẾ TÔM 20G", 5.785],
	"UWLH00001692594.AA": ["HÁ CẢO TÔM 25G", 7.032],
	"UWLH00001692594.BB": ["HÁ CẢO TÔM 25G", 7.008],
	"UWLH00001692594.BC": ["HÁ CẢO TÔM 25G", 7.008],
	"UWLH00001692637.AA": ["HÁ CẢO TÔM HOA HỒNG 33.33G", 6.872],
	"UWLH00001692642.AA": ["HÁ CẢO HẸ 25G", 7.041],
	"UWLH00001692642.BB": ["HÁ CẢO HẸ 25G", 7.041],
	"UWLH00001692642.BC": ["HÁ CẢO HẸ 25G", 7.041],
	"UWLH00001692643.AA": ["HÁ CẢO HOÀNG GIA 25G", 7.05],
	"UWLH00001692643.BB": ["HÁ CẢO HOÀNG GIA 25G", 7.05],
	"UWLH00001692643.BC": ["HÁ CẢO HOÀNG GIA 25G", 7.05],
	"UWLH00001692908.AA": ["HÁ CẢO HẸ HẢI SẢN 25G", 7.005],
	"UWLH00001692908.BB": ["HÁ CẢO HẸ HẢI SẢN 25G", 7.005],
	"UWLH00001692908.BC": ["HÁ CẢO HẸ HẢI SẢN 25G", 7.005],
	"UWLH00001692909.0A": ["BÁNH XẾP TÔM 25G", 7.052],
	"UWLH00002001538.AA": ["HÁ CẢO SÒ ĐIỆP 25G", 7.07],
	"UWLH00002001538.AB": ["HÁ CẢO SÒ ĐIỆP 25G", 7.07],
	"UWLH00002001539.0A": ["HÁ CẢO 3 MÀU 25G", 6.98],
	"UWLH00002001539.AA": ["HÁ CẢO 3 MÀU 25G", 6.98],
	"UWLH00002001539.BC": ["HÁ CẢO 3 MÀU 25G", 6.98],
	"UWLH0001692594A.00": ["HÁ CẢO TÔM 25G", 7.008],
	"UWLH0001692594A.AA": ["HÁ CẢO TÔM 25G", 7.008],
	"UWLH0001692594A.AB": ["HÁ CẢO TÔM 25G", 7.008],
	"UWLH0001692642A.00": ["HÁ CẢO HẸ 25G", 7.041],
	"UWLH0001692642A.AA": ["HÁ CẢO HẸ 25G", 7.041],
	"UWLH0001692642A.AB": ["HÁ CẢO HẸ 25G", 7.041],
	"UWLH0001692643A.00": ["HÁ CẢO HOÀNG GIA 25G", 7.05],
	"UWLH0001692643A.AA": ["HÁ CẢO HOÀNG GIA 25G", 7.05],
	"UWLH0001692643A.AB": ["HÁ CẢO HOÀNG GIA 25G", 7.05],
	"UWLH0001692908A.00": ["HÁ CẢO HẸ HẢI SẢN 25G", 7.005],
	"UWLH0001692908A.AA": ["HÁ CẢO HẸ HẢI SẢN 25G", 7.005],
	"UWLH0002001538A.00": ["HÁ CẢO SÒ ĐIỆP 25G", 7.07],
	"UWLH0002001538A.0A": ["HÁ CẢO SÒ ĐIỆP 25G", 7.07],
	"UWLK00003693080.0A": ["BÁNH NẾP TÔM LÁ SEN 80G", 6.556],
	"UWLK00003693080.0B": ["BÁNH NẾP TÔM LÁ SEN 80G", 6.556],
	"UWLK0003693080A.00": ["BÁNH NẾP TÔM LÁ SEN 80G", 6.556],
	"UWLK0003693080A.0A": ["BÁNH NẾP TÔM LÁ SEN 80G", 6.556],
	"UWLS00001692597.AA": ["XÍU MẠI TÔM 25G", 6.92],
	"UWLS00001692597.BB": ["XÍU MẠI TÔM 25G", 6.92],
	"UWLS00001692597.BC": ["XÍU MẠI TÔM 25G", 6.92],
	"UWLS0001692597A.00": ["XÍU MẠI TÔM 25G", 6.92],
	"UWLS0001692597A.AA": ["XÍU MẠI TÔM 25G", 6.92],
	"UWLS0001692597A.AB": ["XÍU MẠI TÔM 25G (CHỈNH VỊ TRÍ PHUN DATE)", 6.92],
	"UAHH000000UAH01.00": ["HÁ CẢO TÔM 25G", 11.73],
	"V4P00000100.B0": ["Margherita pizza 23cm (267g)", 4.376],
	"V4P00000100.D0": ["Margherita pizza 23cm (267g)", 4.376],
	"V4P00000100.DA": ["Margherita pizza 23cm (267g)", 5.632],
	"V4P00000100.DB": ["Margherita pizza 23cm (267g)", 5.38],
	"V4P00000200.A0": ["Cheese pizza 23cm (277g)", 5.636],
	"V4P00000200.D0": ["Cheese pizza 23 cm (277 g)", 5.636],
	"V4P00000200.DA": ["Cheese pizza 23 cm (277 g)", 5.636],
	"V4P00000300.00": ["Terriyaki chicken pizza 23cm (315g)", 6.031],
	"V4P00000300.A0": ["Terriyaki chicken pizza 23cm (315g)", 6.031],
	"V4P00000300.B0": ["Teriyaki chicken pizza 23cm (315g)", 6.031],
	"V4P00000300.CA": ["Teriyaki chicken pizza 23cm (315g)", 6.243],
	"V4P00000300.CB": ["Teriyaki chicken pizza 23cm (315g)", 6.033],
	"V4P00000300.CC": ["Teriyaki chicken pizza 23cm (315g)", 6.033],
	"V4P00000400.00": ["Spicy seafood pizza 23cm (316g)", 6.276],
	"V4P00000500.00": ["Salami pizza 23cm (285g)", 5.823],
	"V4P00000600.00": ["Half Cheese pizza (143 g)", 6.047],
	"V4P00000600.0A": ["Half Cheese pizza (143 g)", 6.047],
	"V4P00000600.0B": ["Half Cheese pizza (143 g)", 5.828],
	"V4P00000700.00": ["Half Margherita pizza ( 133 g)", 5.739],
	"V4P00000700.0A": ["Half Margherita pizza (133 g)", 5.464],
	"V4P00000700.0C": ["Half Margherita pizza (133 g)", 5.464],
	"V4P00000900.00": ["Half Teriyaki chicken pizza (157 g)", 6.136],
	"V4P00000900.0A": ["Half Teriyaki chicken pizza (157 g)", 6.136],
	"V7E00000100.00": ["BÁNH BAO GÀ NẤM PHÔ MAI 110 G (440 G/ GÓI)\nBỎ KHÔNG PHUN \"11", 7.096],
	"V7E00000100.A0": ["BÁNH BAO GÀ NẤM PHÔ MAI 110 G (440 G/ GÓI)\nQA BỎ KHÔNG PHUN ", 7.096],
	"V7E00000500.00": ["Bánh Bao Gà Quay Kiểu Hồng Kông 120 g (480 g)\n(KHÔNG PHUN SỐ", 6.537],
	"VAE00000400.00": ["Chả giò mayonaise 40g (1kg/gói)", 16.01],
	"VAE00000400.0A": ["Chả giò mayonnaise 40g (1kg/gói) (ĐỔI NHÃN CẬP NHẬT DINH DƯỠ", 16.01],
	"VAJ-S1A.25": ["THỊT HEO CHIÊN XÙ 120 G (240 G/GÓI) (VAJ-S1A.25)", 2.795],
	"VAJ-S1A1.25": ["THỊT HEO CHIÊN XÙ 120 G (240 G/GÓI) (VAJ-S1A1.25)", 2.795],
	"VAJ-S1A2.25": ["THỊT HEO CHIÊN XÙ 120 G (240 G/GÓI) (VAJ-S1A2.25)", 2.865],
	"VAJ00000100.A0": ["Xốt dùng ngay kho quẹt 200 g", 5.509],
	"VAJ00000300.00": ["THỊT HEO CHIÊN XÙ KIỂU NHẬT TONKATSU 120 G (240 G/GÓI) \nKHỐI", 2.875],
	"VAJ00000300.0A": ["THỊT HEO CHIÊN XÙ KIỂU NHẬT TONKATSU 120 G (240 G/GÓI) \nKHỐI", 2.875],
	"VAJ00000600.00": ["GÀ CHIÊN KIỂU NHẬT (180 G/GÓI) (KARAAGE 180 G/ GÓI)\nKHỐI LƯỢ", 2.157],
	"VAJ00000700.00": ["BÁNH TÔM CHIÊN XÙ KIỂU NHẬT (240 G/GÓI) ( EBIKATSU 240 G/ GÓ", 2.86],
	VBK001: ["Burger cá 70g", 8.4],
	VBK003: ["Cánh gà nướng BBQ", 10],
	VBK03A: ["Cánh gà nướng BBQ (Thay đổi quy trình ướp)", 10.18],
	"VCB00000100.00": ["CHEESE PIZZA 110 G (220 G/GÓI)", 4.736],
	"VCO00001800.0A": ["Há cảo hoa hồng 25g (375g/gói)", 11.928],
	"VCO00001800.0C": ["Há cảo hoa hồng 25g (375g/gói)", 11.928],
	"VCO00001800.0D": ["Há cảo hoa hồng 25 g (375 g)", 11.928],
	"VCO00001900.AA": ["Nem cua bể 62.5 g (500g/gói)", 16.44],
	"VCO00001900.BC": ["Nem cua bể 45 g ( 360 g/gói)", 9.822],
	"VCO00001900.BD": ["Nem cua bể 45 g (360 g/gói) (Chỉnh thiết kế túi in)", 9.822],
	"VCO00002000.AA": ["Chả giò tôm baby COOP (500g/gói)", 13.745],
	"VCO00002000.AC": ["Chả giò tôm baby 8 g ( 500 g)", 13.745],
	"VCO00002000.AD": ["Chả giò tôm baby 8 g ( 500 g)", 13.745],
	"VCO00002100.AA": ["Hoành thánh tôm COOP (340g/gói)", 10.136],
	"VCO00002100.AC": ["Hoành thánh tôm COOP (340g/gói)", 10.136],
	"VCO00002100.AD": ["Hoành thánh tôm (340 g) (Chỉnh thiết kế túi in)", 10.136],
	"VCO00002200.0A": ["Bánh bao không nhân 30g (240g/gói)", 4.964],
	"VCO00002300.00": ["Bánh bao đậu xanh", 5.128],
	"VCO00002300.0A": ["Bánh bao sữa đậu xanh 50g (300g/gói)", 5.494],
	"VCO00002400.0A": ["Bánh xếp thịt 60g (360g/gói)", 9.918],
	"VCO00002400.0B": ["Bánh xếp thịt 60g (360g/gói)", 9.918],
	"VCO00002400.0C": ["Bánh xếp thịt 60 g (360 g/gói) (Chỉnh thiết kế nhãn)", 9.918],
	"VCO00002500.AA": ["Chả giò mayonnaise hải sản", 12.492],
	"VCO00002500.AC": ["Chả giò Hải Sản Mayo 40g (400g/gói)", 12.492],
	"VCO00002500.AD": ["Chả giò hải sản mayo 40 g (400 g) (Chỉnh thiết kế túi in)", 12.492],
	"VCO00002600.AA": ["Chạo tôm 41.67g (500g/gói)", 8.76],
	"VCO00002600.AB": ["Chạo tôm 41.67g (500g/gói)", 8.76],
	"VCO00002600.AC": ["Chạo tôm 41.67 g (500 g/gói)", 8.76],
	"VCO00002700.AA": ["Há cảo mini tôm thịt", 12.192],
	"VCO00002700.AB": ["Há cảo mini tôm thịt 17 g (500g/ gói)", 12.192],
	"VCO00002700.AC": ["Há cảo mini tôm thịt 17 g (500g/ gói)", 12.192],
	"VCO00002700.AD": ["Há cảo mini tôm thịt 17 g (500 g/ gói)", 12.192],
	"VCO00002800.0A": ["XÍU MẠI TÔM THỊT", 10.4],
	"VCO00002800.0B": ["Xíu mại tôm thịt 20g (300g/gói)", 10.4],
	"VCO00002800.0C": ["Xíu mại tôm thịt 20 g (300 g/gói)", 10.4],
	"VCO00002900.00": ["Bánh cuốn tôm Coop 28g (300g/gói)", 8.526],
	"VCO00002900.0B": ["Bánh cuốn tôm Coop 28g (300g/gói)", 8.492],
	"VCO00003000.0A": ["Dimsum 3 món 450g", 7.985],
	"VCO00003000.0B": ["Dimsum 3 món (450g/gói)", 7.985],
	"VCO00003000.0C": ["Dimsum 3 món (450 g/gói) (Chỉnh thiết kế nhãn)", 7.985],
	"VCO00003100.0A": ["Chả giò xốp con tôm 15g", 7.37],
	"VCO00003100.0B": ["Chả giò xốp con tôm 15g (350g/gói)", 7.37],
	"VCO00003100.0C": ["Chả giò xốp con tôm 15 g (350 g/gói) (Chỉnh thiết kế nhãn)", 7.37],
	"VCO00003200.0A": ["Há cảo sò điệp vỏ hồng18g \n (530g/gói)", 12.84],
	"VCO00003200.AB": ["Há cảo sò điệp vỏ hồng18g \n (530g/gói)", 12.84],
	"VCO00003200.AC": ["Há cảo sò điệp 18 g (530 g)", 12.84],
	"VCO00003300.0A": ["Sủi cảo chay 25g (530g/gói)", 9.18],
	"VCO00003300.0B": ["Sủi cảo chay 25 g (530 g/gói)", 9.18],
	"VCO00003400.0A": ["Cá viên nhân phomai 22g (500g/gói)", 12.193],
	"VCO00003400.AB": ["Cá viên nhân phomai 22g (500g/gói)", 12.193],
	"VCO00003400.AC": ["Cá viên phomai 22 g (500 g) (Chỉnh thiết kế túi in)", 12.193],
	"VCO00003500.0B": ["Cá viên nhân trứng cá chuồn 22g (500g/gói)", 12.202],
	"VCO00003500.0C": ["Cá viên trứng cá chuồn 22 g (500 g) (Chỉnh thiết kế túi ", 12.202],
	"VCO00003600.00": ["Bánh cuốn tôm thịt 50g (360g/gói)", 12.15],
	"VCO00003600.0A": ["Bánh cuốn tôm thịt 50g (360g/gói)", 12.15],
	"VCO00003700.0A": ["Chả giò rế con tôm phomai 20g (200g/gói)", 7.5],
	"VCO00003700.0B": ["Chả giò rế con tôm phomai 20 g (200 g/gói) \n(Chỉnh thiết kế ", 7.5],
	"VCO00003800.A0": ["Bánh bao nấm 40g (240g/gói)", 7.038],
	"VCO00003800.BA": ["Bánh bao nấm 40 g (240 g/gói)", 7.014],
	"VCO00004000.00": ["Sủi cảo con tôm 25 g (220 g/gói)", 8.534],
	"VCO00004000.0A": ["Sủi cảo con tôm 25 g (220 g/gói) (Chỉnh thiết kế nhãn)", 8.534],
	"VCO00004100.AA": ["Lẩu viên thập cẩm 500 g/gói", 10.08],
	"VCO00004100.AB": ["Lẩu viên thập cẩm 500 g/gói (Chỉnh thiết kế nhãn)", 10.08],
	"VCO00004200.00": ["Chả mực phô mai 40g (480g /gói)", 10.79],
	"VCO00004200.0A": ["Chả mực phô mai 40 g  (480 g /gói)", 10.79],
	"VCO00004300.A0": ["Cá trứng 350 g ( NAUY)", 8.217],
	"VCO00004400.00": ["Bánh mì que thịt nướng 85 g (255 g/gói)", 4.777],
	"VCO00004400.AA": ["Bánh mì que thịt nướng 63.75g (255G/gói)", 4.355],
	"VCO00004400.AB": ["Bánh mì que thịt nướng 63.75 g (255 g/gói) (Chỉnh thiết kế n", 4.355],
	"VCO00004500.AA": ["Bánh mì que gà nướng kiểu Hàn Quốc 63.75g (255g/gói)", 4.355],
	"VCO00004500.AB": ["Bánh mì que gà nướng kiểu Hàn Quốc 63.75 g (255 g/gói) (Chỉn", 4.355],
	"VCO00004800.BC": ["Pizza thập cẩm 280 g", 6.458],
	"VCO00004800.BB": ["Pizza thập cẩm 280 g", 6.458],
	"VCO00004800.BD": ["Pizza thập cẩm 280 g", 6.458],
	"VCO00004900.0A": ["Pizza thập cẩm 120 g", 2.793],
	"VCO00004900.00": ["Pizza thập cẩm 120 g", 2.793],
	"VCO00005000.BD": ["Pizza hải sản 280 g", 6.458],
	"VCO00005000.BC": ["Pizza hải sản 280 g", 6.458],
	"VCO00005000.BB": ["Pizza hải sản 280 g", 6.458],
	"VCO00005100.0A": ["Pizza hải sản 120 g", 2.793],
	"VCO00005100.00": ["Pizza hải sản 120 g", 2.793],
	"VCO00005200.BD": ["Pizza xúc xích phomai 280 g", 6.458],
	"VCO00005200.BC": ["Pizza xúc xích phomai 280 g", 6.458],
	"VCO00005200.BB": ["Pizza xúc xích phomai 280 g", 6.458],
	"VCO00005300.0A": ["Pizza xúc xích phô mai 120 g", 2.793],
	"VCO00005300.00": ["Pizza xúc xích phô mai 120 g", 2.793],
	"VCO00005400.00": ["Mì áp chảo tôm rau củ 200 g", 4.421],
	"VCO00005500.00": ["Mì xào hải sản kiểu Hồng Kong 200 g", 4.421],
	"VCO00005500.0A": ["Mì xào hải sản kiểu Hồng Kong 200 g", 3.962],
	"VCO00005500.0B": ["Mì xào hải sản kiểu Hồng Kong 200 g", 3.962],
	"VCO00005600.00": ["Mì sủi cảo chay 200 g", 4.421],
	"VCO00005600.0A": ["Mì sủi cảo chay 200 g", 3.962],
	"VCO00005600.0B": ["Mì sủi cảo chay 200 g", 3.962],
	"VCO00005700.0B": ["Miến xào ghẹ 200 g", 4.83],
	"VCO00005700.0A": ["Miến xào ghẹ 200 g", 4.83],
	"VCO00005800.00": ["Mì viên hải sản vị lẩu Thái 250 g", 5.321],
	"VCO00005900.00": ["Pizza thập cẩm 120 g (DELI)", .024],
	"VCO00006200.0A": ["Pizza phomai 120g", 3.543],
	"VCO00006200.00": ["Pizza phomai 120g", 3.543],
	"VCO00006300.0A": ["Đế pizza 80 g (160 g)", 2.488],
	"VCO00006300.00": ["Đế pizza 80 g (160 g)", 2.488],
	"VCO00006400.00": ["Bánh mì cóc 60 g (360 g)", 3.764],
	"VCO00006400.A0": ["Bánh mì cóc 60 g (360 g)", 3.764],
	"VCO00006400.CA": ["Bánh mì cóc 60 g (360 g)", 2.972],
	"VCO00006400.CB": ["Bánh mì cóc 60 g (360 g)", 2.972],
	"VCO00006600.00": ["Bánh mì bơ tỏi phô mai 70 g", 3.578],
	"VCO00007100.0A": ["Bánh xếp xá xíu 25 g (340 g)", 8.676],
	"VCO00007100.0B": ["Bánh xếp xá xíu 25 g (340 g)", 8.676],
	"VCO00007200.00": ["Há cảo chay 25 g (415 g)", 9.54],
	"VCO00007200.0A": ["HÁ CẢO CHAY 25 G (415 G/GÓI)", 9.54],
	"VCO00007300.0A": ["Bánh bao không nhân 30 g (360 g) (xoắn ốc)", 6.938],
	"VCO00007300.00": ["Bánh bao không nhân 30 g (360 g) (xoắn ốc)", 6.938],
	"VCO00007400.A0": ["Mandu thịt nướng kiểu Hàn Quốc 35 g", 6.3],
	"VCO00007400.AA": ["Mandu thịt nướng kiểu Hàn Quốc 35 g (420 g) (Chỉnh thiết kế ", 6.3],
	"VCO00007800.00": ["Bánh mì que pate kiểu Hải Phòng 55 g (220 g)", 4.238],
	"VCO00007800.0A": ["Bánh mì que pate kiểu Hải Phòng 55 g (220 g)", 4.238],
	"VCO00008000.0A": ["Chả giò chay 25 g (400 g)", 10.711],
	"VCO00008200.00": ["Há Cảo Tôm Trứng Cá 30 G (330 G)", 4.696],
	"VCO00008300.00": ["Cá Viên Xốt Tom Yum Trứng Cá 22 G (500 G)", 11.22],
	"VCO00008400.00": ["XÍU MẠI TÔM THỊT TRỨNG CÁ 30G (390G)", 5.416],
	VCO017: ["Há cảo mini tôm thịt 500g", 12.202],
	VCOCT0018: ["Há cảo hoa hồng 25g", 11.904],
	VCOCT0020: ["Chả giò baby", 13.745],
	VCOCT0024: ["Bánh xếp thịt", 9.908],
	VCOCT0026: ["Chạo tôm", 8.75],
	"VFM00001900.0A": ["Bắp cải cuộn tôm 25 g", 10.88],
	"VFM00001900.0B": ["Bắp cải cuộn tôm 25 g", 10.88],
	"VFM00005800.00": ["Há cảo tôm 20g (270g/gói)", 7.542],
	"VFM00005800.0A": ["Há cảo tôm 20g (270g/gói)", 7.542],
	"VFM00005800.0B": ["Há cảo tôm 20g (270g/gói)", 7.542],
	"VFM00005800.0C": ["HÁ CẢO TÔM 20 G (270 G/GÓI)", 7.59],
	"VFM00006200.0A": ["Bánh bao xá xíu 110 g \n (660 g/gói)", 8.858],
	"VFM00006800.00": ["Soup lẩu hotpot 120 g", 8.806],
	"VFM00006800.AA": ["Soup lẩu hotpot 122 g", 8.857],
	"VFM00006800.BB": ["Soup lẩu hotpot 123 g", 8.81],
	"VFM00006900.00": ["Soup lẩu hotpot 360 g", 10.26],
	"VFM00006900.AA": ["Soup lẩu hotpot 366 g", 10.034],
	"VFM00006900.BB": ["Soup lẩu hotpot 369 g", 9.94],
	"VFM00007100.00": ["CÁ VIÊN NHÂN NGHÊU XÀO CAY 30 G", 7.81],
	"VFM00007200.00": ["CÁ VIÊN NHÂN THỊT BÒ BẰM 30g", 7.81],
	"VFM00007200.A0": ["CÁ VIÊN NHÂN THỊT BÒ BẰM 30g", 7.81],
	"VFM00007600.0A": ["Hải sản viên nhân trứng cá 23 g", 10.695],
	"VFM00007600.0B": ["HẢI SẢN VIÊN NHÂN TRỨNG CÁ 23 G (1 KG/GÓI)", 10.695],
	"VFM00011400.00": ["HẢI SẢN VIÊN NHÂN TRỨNG CÁ 30 G (1.29 KG/GÓI)", 11.038],
	"VFM00011500.00": ["BẮP CẢI CUỘN TÔM 30 G (1.2 KG/GÓI) (VFM-S56A.25)", 12.94],
	"VFM00007700.00": ["Mì tươi 100 g", 12.92],
	"VFM00007900.00": ["Bánh bao thập cẩm 120 g", 8.12],
	"VFM00007900.0A": ["BÁNH BAO THẬP CẨM 120 G (720 G/GÓI)", 8.12],
	"VFM00008000.00": ["Bánh bao xá xíu 110 g", 8.876],
	"VFM00008000.A0": ["Bánh bao xá xíu 110 g (660 g/gói)", 8.876],
	"VFM00008000.AA": ["BÁNH BAO XÁ XÍU 110 G (660 G/GÓI)", 8.876],
	"VFM00008500.00": ["Há cảo thịt bắp mỹ 25 g", 8.61],
	"VFM00008600.00": ["Xíu mại tôm 22 g", 15.03],
	"VFM00008800.00": ["( Gyoza ) Bánh xếp thịt nướng 50 g", 12.92],
	"VFM00008900.00": ["Bánh bao Pizza phô mai Hokkaido 100 g (600 g/gói)", 5.406],
	"VFM00009000.00": ["Xôi gà tôm nấm 150 g ( 600 g/gói)", 9.795],
	"VFM00009100.00": ["Bánh bao cà ri gà kiểu Nhật 110 g ( 660 g/gói)", 7.51],
	"VFM00009400.00": ["Mì Ramen 120 g", 4.34],
	"VFM00009500.00": ["Bánh bao thịt bò vị Sukiyaki 100 g (600 g/gói)", 8.102],
	"VFM00010000.00": ["Rau củ tẩm bột 60 g (600g/gói)", 11.816],
	"VFM00010400.00": ["MANDU GÀ NƯỚNG XỐT KIM QUẤT 50 G (500 G/GÓI) (CODE: VFM-S1A.", 10.992],
	"VFM00010600.00": ["BÁNH HOTTEOK NHÂN PHÔ MAI XÚC XÍCH VÀ BẮP 50 G (600 G/GÓI)", 9.111],
	"VFM00010700.00": ["VIÊN THẢ LẨU XỐT CHUA NGỌT 25 G (1 KG/GÓI) (VFM-S27C.25)", 8.642],
	"VFM00011800.00": ["CƠM NGHÊU VÀ THỊT XÀO CAY 290 G", 6.97],
	"VFM00012100.00": ["CƠM THỊT HEO XÀO CAY HÀN QUỐC 361 G", 8.39],
	"VFM00012000.00": ["CƠM CHIÊN GÀ NƯỚNG PHÔ MAI CAY 296 G", 7.09],
	"VFM00012200.00": ["MÌ Ý XÚC XÍCH XÔNG KHÓI XỐT RAU CỦ 260 G", 6.37],
	"VFM00012300.00": ["MÌ Ý BÒ BẰM 243 G", 6.03],
	"VFM00012400.00": ["CƠM CÀ RI NHẬT VÀ ỨC GÀ ÁP CHẢO 363 G", 8.43],
	"VFM00012500.00": ["PIZUBI CƠM CHIÊN BẮP PHÔ MAI (CƠM CHIÊN BẮP PHÔ MAI) 95 G", 2.805],
	"VFM00012600.00": ["PIZUBI CƠM GÀ NƯỚNG CAY HÀN QUỐC PHÔ MAI (CƠM GÀ NƯỚNG CAY H", 3.093],
	"VFM00012800.00": ["CƠM CHIÊN TRỨNG 195 G", 3.01],
	"VFM00013100.00": ["DIMSUM NGŨ SẮC 115 G (115 G/KHAY)", 2.396],
	VFMLBB51: ["Hoành thánh tôm thịt 14g VDLC (code S-DL009A1)", 4.946],
	"VGN00000100.0B": ["Há cảo tôm 20g (270 g/gói)", 7.542],
	"VGN00000100.0C": ["HÁ CẢO TÔM 20 G (270 G/GÓI)", 7.59],
	"VGN00000100.0D": ["HÁ CẢO TÔM 20 G (270 G/GÓI) (ĐỔI THIẾT KẾ MỚI,THAY ĐỔI ĐỊA C", 7.59],
	"CPCMH0000CPCM01.00": ["HÁ CẢO TÔM 270G/TÚI (VGN 001.0C)", 7.542],
	"CPCMH0000CPCM01.0A": ["HÁ CẢO TÔM 270G/TÚI (VGN 001.0C)", 7.542],
	"VGN00000500.00": ["Tôm xù rế ba màu GNFood 30g (300g/gói)", 8.794],
	"VGN00000500.0A": ["Tôm xù rế 3 màu 30g (300g/ gói)", 8.794],
	"VGN00000500.AA": ["Tôm xù rế 3 màu 30g (300g/ gói)", 8.794],
	"VGN00000500.AB": ["Tôm xù rế ba màu 30 g (300g/ gói)", 8.794],
	"VGN00000600.DB": ["Chả giò hải sản mayo 40g (320 g/gói)", 8.67],
	"VGN00000600.DC": ["CHẢ GIÒ HẢI SẢN MAYO 40 G (320 G /GÓI) (DÁN THÊM TEM: \"DIỆN ", 8.79],
	"VGN00000600.DD": ["CHẢ GIÒ HẢI SẢN MAYO 40 G (320 G /GÓI)", 8.95],
	"CPCMC0000CPCM07.00": ["CHẢ GIÒ MAYONNAISE HẢI SẢN 40G", 8.95],
	"CPCMC0000CPCM07.0A": ["CHẢ GIÒ MAYONNAISE HẢI SẢN 40G", 8.95],
	"VGN00000900.AE": ["Há cảo baby Bamboo 17g (300g/gói)", 9.498],
	"VGN00000900.AG": ["HÁ CẢO BABY BAMBOO 17 G (300 G/GÓI)", 9.554],
	"VGN00001200.00": ["Hoành thánh tôm 250g/hộp", 5.334],
	"VGN00001400.0C": ["BÁNH BAO KIM SA 40 G (240 G/GÓI)", 5.741],
	"VGN00001400.00": ["Bánh bao kim sa 40g (240g/gói)", 5.725],
	"VGN00001400.0B": ["Bánh bao kim sa 40 g (240 g/gói)", 5.725],
	"VGN00001500.0A": ["Bánh cuốn hải sản 45g (250g/ gói)", 9.15],
	"VGN00001500.0B": ["Bánh cuốn hải sản 45g (250g/gói)", 9.15],
	"VGN00001800.00": ["Bánh bao xá xíu Bamboo 30g (180g/gói)", 5.206],
	"VGN00001800.0B": ["Bánh bao xá xíu Bamboo 30g (180g/gói)", 5.206],
	"VGN00001900.00": ["Bánh bao thập cẩm 100g", 5.606],
	"VGN00001900.AB": ["Bánh bao thập cẩm 100 g (600g/ gói)", 5.606],
	"VGN00002300.A0": ["Xiu mại thịt 23g (300g)", 8.278],
	"VGN00002300.AB": ["Xiu mại thịt 23g (300g)", 8.278],
	"VGN00002300.AC": ["Xiu mại thịt 23g (300g)", 8.302],
	"VGN00002300.AD": ["Xiu mại thịt 23g (300g)", 8.302],
	"VGN00002500.00": ["Bánh xếp tôm thịt 38g (250g/gói)", 8.138],
	"VGN00002500.0B": ["Bánh xếp tôm thịt 38g (250g/gói)", 8.138],
	"VGN00002500.0C": ["BÁNH XẾP TÔM THỊT 38 G (250 G/GÓI) (DÁN THÊM TEM: \"DIỆN MẠO ", 8.166],
	"CPCMC0000CPCM11.00": ["BÁNH XẾP TÔM THỊT 250G/TÚI (VGN 025.0C)", 8.166],
	"CPCMC0000CPCM11.0A": ["BÁNH XẾP TÔM THỊT 250G/TÚI (VGN 025.0C)", 8.166],
	"VGN00002500.0D": ["BÁNH XẾP TÔM THỊT 38 G (250 G/GÓI)", 8.166],
	"VGN00002500.0E": ["BÁNH XẾP TÔM THỊT 38 G (250 G/GÓI) (CHUYỂN SANG NHÃN CUỘN)", 8.166],
	"VGN00002600.0B": ["Bánh xếp tôm thịt 50g (500g/gói)", 5.94],
	"VGN00002600.0C": ["BÁNH XẾP TÔM THỊT 50 G (500 G)", 6],
	"VGN00002700.0B": ["Há cảo hoa hồng 23g (300g/ gói)", 8.19],
	"VGN00002700.0C": ["HÁ CẢO HOA HỒNG 23 G (300 G/GÓI)", 8.262],
	"VGN00002700.0D": ["HÁ CẢO HOA HỒNG 23 G (300 G/GÓI) (ĐỔI THÙNG)", 8.302],
	"CPCMH0000CPCM05.00": ["HÁ CẢO HOA HỒNG 300G/TÚI", 8.262],
	"CPCMH0000CPCM05.0A": ["HÁ CẢO HOA HỒNG 300G/TÚI", 8.262],
	"VGN00002800.0A": ["Há cảo tôm hẹ 23 g (250 g/ gói)", 8.156],
	"VGN00002800.0C": ["Há cảo tôm hẹ 23 g (250 g/ gói)", 8.156],
	"VGN00002800.0D": ["HÁ CẢO TÔM HẸ 23 G (250 G/GÓI) (DÁN THÊM TEM: \"DIỆN MẠO MỚI\"", 8.156],
	"VGN00002800.0E": ["HÁ CẢO TÔM HẸ 23 G (250 G/GÓI) (ĐỔI THÙNG)", 8.166],
	"CPCMC0000CPCM10.00": ["HÁ CẢO TÔM HẸ 250G/TÚI (VGN 028.0D)", 8.156],
	"CPCMC0000CPCM10.0A": ["HÁ CẢO TÔM HẸ 250G/TÚI (VGN 028.0D)", 8.156],
	"VGN00002900.0B": ["Há cảo sò điệp 23g (300g)", 9.594],
	"VGN00002900.0C": ["HÁ CẢO SÒ ĐIỆP 23 G (300 G/GÓI)", 9.622],
	"VGN00002900.0D": ["HÁ CẢO SÒ ĐIỆP 23 G (300 G/GÓI) (ĐỔI THÙNG)", 9.622],
	"CPCMH0000CPCM03.00": ["HÁ CẢO SÒ ĐIỆP 300G/TÚI", 9.622],
	"CPCMH0000CPCM03.0A": ["HÁ CẢO SÒ ĐIỆP 300G/TÚI", 9.582],
	"VGN00003000.0B": ["Xíu mại tôm 23g (300g/ gói)", 8.262],
	"VGN00003000.0C": ["XÍU MẠI TÔM 23 G (300 G/GÓI)", 8.286],
	"VGN00003000.0D": ["XÍU MẠI TÔM 23 G (300 G/GÓI) (ĐỔI THÙNG)", 8.326],
	"CPCMS0000CPCM02.00": ["XÍU MẠI TÔM 300G/TÚI", 8.286],
	"CPCMS0000CPCM02.0A": ["XÍU MẠI TÔM 300G/TÚI", 8.286],
	"VGN00003600.00": ["Hoành thánh tôm 15 g (250g/gói)", 5.334],
	"VGN00003600.0A": ["Hoành thánh tôm 15 g (250g/gói)", 5.334],
	"VGN00003700.00": ["Hoành thánh thịt 15 g (250g/gói)", 5.334],
	"VGN00003700.0B": ["HOÀNH THÁNH THỊT 15 G (250 G/GÓI)", 5.334],
	"VGN00003700.0A": ["Hoành thánh thịt 15 g (250g/gói)", 5.334],
	"VGN00003800.00": ["Hoành thánh tôm thịt 15 g (220g/gói)", 7.423],
	"VGN00003800.0A": ["Hoành thánh tôm thịt 15 g (220g/gói)", 7.438],
	"VGN00003800.0B": ["HOÀNH THÁNH TÔM THỊT 15 G (220 G/GÓI) (DÁN THÊM TEM: \"DIỆN M", 7.354],
	"VGN00003800.0C": ["HOÀNH THÁNH TÔM THỊT 15 G (220 G/GÓI) (ĐỔI THÙNG, KHÔNG ÉP H", 7.414],
	"CPCMC0000CPCM09.00": ["HOÀNH THÁNH TÔM THỊT 220G/TÚI", 7.354],
	"CPCMC0000CPCM09.0A": ["HOÀNH THÁNH TÔM THỊT 220G/TÚI (NHÃN TIẾNG MIÊN)", 7.354],
	"VGN00004400.0A": ["Nem cua bể 45g (540g/gói)", 8.62],
	"VGN00004400.0B": ["Nem cua bể 45g (540g/gói)", 8.69],
	"VGN00004400.0C": ["NEM CUA BỂ 45 G (540 G/GÓI) (ĐỔI THÙNG)", 8.67],
	"CPCMC0000CPCM20.00": ["NEM CUA BỂ 45G - NHÃN TIẾNG MIÊN", 8.63],
	"CPCMC0000CPCM21.00": ["CHẢ GIÒ RẾ TÔM THỊT 25G - NHÃN TIẾNG MIÊN", 7.646],
	"VGN00005000.0A": ["BÁNH CUỐN TÔM THỊT 50 G (300 G/GÓI)", 9.482],
	"VGN00005000.00": ["Bánh cuốn tôm thịt 50 g (300 g/gói)", 9.482],
	"VGN00005500.00": ["Nem cua bể 45g (270g/gói)", 8.587],
	"VGN00005500.0A": ["NEM CUA BỂ 45 G (270 G/GÓI)", 8.699],
	"VGN00005600.00": ["Chân gà tàu xì 270 g", 4.086],
	"VGN00005600.0A": ["Chân gà tàu xì 270 g", 4.086],
	"VGN00005600.0B": ["Chân gà tàu xì 270 g", 4.086],
	"VGN00005800.00": ["Bánh bao nguyên cám nhân gà xé sa tế 110 g (440 g/gói)", 5.098],
	"VGN00005900.00": ["Bánh bao gạo lứt nhân thịt bò phô mai 40 g (240 g/gói)", 5.206],
	"VGN00005900.0A": ["Bánh bao gạo lứt nhân thịt bò phô mai 40 g (240 g/gói)", 5.206],
	"VGN00005900.0B": ["BÁNH BAO GẠO LỨT NHÂN BÒ PHÔ MAI 40G (240G) \nCÓ PHUN CHỮ \"TH", 5.17],
	"VGN00005900.0C": ["BÁNH BAO GẠO LỨT NHÂN THỊT BÒ PHÔ MAI 40 G (240 G/GÓI) (CHUY", 5.17],
	"VGN00006000.00": ["Bánh bao nguyên cám nhân gà xé sa tế 110 g (660 g/gói)", 5.918],
	"VGN00006000.0A": ["Bánh bao nguyên cám nhân gà xé sa tế 110 g (660 g/gói)", 5.918],
	"VGN00006000.0B": ["BÁNH BAO NGUYÊN CÁM NHÂN GÀ XÉ SẢ TẾ 110G (660 G/GÓI)", 5.918],
	"VGN00006100.00": ["Cá viên nhân phô mai 22 g (264 g/gói) (ND28201.24)", 9.611],
	"VGN00006100.0A": ["Cá viên nhân phô mai 22 g (264 g/gói) (ND28201.24)", 9.611],
	"VGN00006100.0B": ["CÁ VIÊN NHÂN PHÔ MAI 22 G (264 G/GÓI)", 9.675],
	"VGN00006100.0C": ["CÁ VIÊN NHÂN PHÔ MAI 22 G (264 G/GÓI) (ĐỔI THÙNG)", 9.606],
	"CPCMC0000CPCM13.00": ["CÁ VIÊN NHÂN PHÔ MAI 22G", 9.579],
	"CPCMC0000CPCM13.0A": ["CÁ VIÊN NHÂN PHÔ MAI 22G (NHÃN TIẾNG MIÊN)", 9.579],
	"VGN00006200.00": ["Combo viên hải sản 3in1 (264 g/gói) (ND288B0.24)", 8.447],
	"VGN00006200.0A": ["Combo viên hải sản 3in1 (264 g/gói) (ND288B0.24)", 8.447],
	"VGN00006200.0B": ["COMBO VIÊN HẢI SẢN 3IN1 (264 G/GÓI) (DÁN THÊM TEM: \"DIỆN MẠO", 8.447],
	"VGN00006200.0C": ["COMBO VIÊN HẢI SẢN 3IN1 (264 G/GÓI) (ĐỔI THÙNG)", 8.474],
	"CPCMC0000CPCM12.00": ["COMBO VIÊN HẢI SẢN 3IN1 264G/SET (VGN 062.0B)", 8.531],
	"CPCMC0000CPCM12.0A": ["COMBO VIÊN HẢI SẢN 3IN1 264G/SET (VGN 062.0B, NHÃN TIẾNG MIÊ", 8.531],
	"CPCMC0000CPCM14.00": ["CÁ VIÊN 10G", 10.846],
	"CPCMC0000CPCM15.00": ["CÁ HỒI VIÊN NHÂN PHÔ MAI 22G", 10.882],
	"CPCMC0000CPCM16.00": ["CÁ VIÊN PHÔ MAI 22G", 10.882],
	"CPCMC0000CPCM17.00": ["BÁNH CÁ PHÔ MAI 45G", 12.806],
	"CPCMC0000CPCM18.00": ["VIÊN HEO NHÂN THỊT 30G", 9.702],
	"VGN00006300.00": ["Há cảo baby Bamboo 17g (1kg/gói)", 10.67],
	"VGN00006300.0A": ["HÁ CẢO BABY BAMBOO 17 G (1 KG/GÓI)", 10.76],
	"VGN00006900.A0": ["HÁ CẢO TÔM HOÀNG GIA 30 G (300 G/GÓI)", 6.91],
	"VGN00007000.A0": ["HÁ CẢO SÒ ĐIỆP HOÀNG GIA 25 G (275 G/GÓI)", 8.81],
	"VGN00007000.AA": ["HÁ CẢO SÒ ĐIỆP HOÀNG GIA 25 G (275 G/GÓI)", 8.81],
	"VGN00007100.0A": ["BÁNH BAO GẠO LỨT NHÂN THỊT TRỨNG CÚT 100 G (600 G/GÓI)", 6.198],
	"VGN00007200.00": ["BÁNH BAO NGUYÊN CÁM NHÂN GÀ XÉ SA TẾ 110 G (220 G/GÓI), CH (", 6.006],
	"VGN00007300.00": ["BÁNH BAO GẠO LỨT NHÂN CHAY THẬP CẨM 50 G (300 G/GÓI), CH (ND", 6.743],
	"VGN00007400.00": ["BÁNH BAO NGUYÊN CÁM NHÂN CHAY THẬP CẨM 110G (220 G/GÓI), CH ", 6.006],
	"VGN00007500.A0": ["HÁ CẢO MỰC HOÀNG GIA 25 G (275 G/GÓI)", 8.81],
	"VGN00007500.AA": ["HÁ CẢO MỰC HOÀNG GIA 25 G (275 G/GÓI)", 8.81],
	"VGN00007800.00": ["MÌ UDON RAU NẤM 250 G (250 G/ TÔ)", 3.798],
	"VGN00007900.00": ["MÌ UDON TÔM CHIÊN KAKIAGE 250 G (250 G/ TÔ) (VGN-S50.25)", 3.798],
	"VGN00008000.00": ["MÌ LẨU THÁI VIÊN HẢI SẢN 250 G (250 G/ TÔ) (VGN-S54A.25)", 3.798],
	"VGN00008100.00": ["MÌ HOÀNH THÁNH NHÂN HẢI SẢN 250 G (VGN-S55.25)", 3.798],
	"VGN00008500.00": ["BÁNH BAO GẠO LỨT NHÂN THỊT BÒ PHÔ MAI 110 G (220 G/GÓI), CH ", 6.006],
	"VGN00008700.00": ["BÁNH BAO NGUYÊN CÁM NHÂN XÁ XÍU PHÔ MAI 110 G (220 G/GÓI), C", 4.334],
	"VGN00008900.00": ["DIMSUM TAM HẢO ( 300 G) \n(gòm 3 code: (4 PCS VGN000001.1.0B ", 10.822],
	"VGN00008900.0A": ["DIMSUM TAM HẢO 300 G/GÓI (ĐỔI THÙNG)\n(gòm 3 code: (4 PCS VGN", 10.882],
	"VGN00009900.00": ["CHẢ GIÒ MAYONNAISE HẢI SẢN 40 G (1280 G)", 11.342],
	"VGN00010000.00": ["NEM CUA BỂ 45 G (1350 G)", 11.902],
	"VGN01000500.00": ["PIZZA 4 LOẠI PHÔ MAI 200 G (200 G/HỘP)", 5.735],
	"VGN01000600.00": ["PIZZA HẢI SẢN XỐT KIM QUẤT 150 G (150 G/HỘP)", 4.295],
	"VGN01000700.00": ["PIZZA BÒ NẤM XỐT LÁ QUẾ TÂY 150 G (150 G/HỘP)", 4.295],
	"VGN01000800.00": ["PIZZA PHÔ MAI XÚC XÍCH PEPPERONI 120 G (120G/HỘP)", 3.695],
	"VGN01000900.0A": ["PIZZA GẬP NHÂN PHÔ MAI CÀ CHUA 100 G (200 G/HỘP)", 5.415],
	"VGN01000900.00": ["PIZZA GẬP NHÂN PHÔ MAI CÀ CHUA 100 G (200 G/HỘP)", 5.415],
	"VGN01001100.00": ["BÁNH MÌ BƠ TỎI PHÔ MAI 45 G (180 G/HỘP)", 5.015],
	VGN012: ["Hoành thánh tôm 250g/hộp", 5.484],
	VGN017: ["Bánh bao sandwich Bamboo 40g", 4.17],
	VGNCT0024: ["Chả giò da xốp hải sản 250g", 9.15],
	VGNCT0026: ["Bánh xếp tôm thịt 50g (500g)", 5.9],
	"VGS00000700.00": ["Xôi lạp xưởng chà bông 150 g (600 g)", 9.86],
	"VGS00000800.0A": ["BÁNH MÌ MÈ HÀN QUỐC 45 G (270 G/GÓI)", 3.014],
	"VGS00000800.00": ["Bánh mì mè Hàn Quốc 45 g (270 g)", 3.014],
	"VGS00000900.00": ["BÁNH MÌ MÈ HÀN QUỐC VỊ DÂU 45 G (270 G/GÓI)", 3.59],
	"VGS00001000.00": ["BÁNH CHUỐI CHIÊN MÈ ĐEN BẮP 100 G (400 G/GÓI)", 8.96],
	"VGS00001200.00": ["BÁNH MÌ MÈ HÀN QUỐC VỊ ỔI HỒNG 45 G (270 G/GÓI)", 3.632],
	"VGS00001300.00": ["BÁNH MÌ MÈ KIỂU HÀN QUỐC VỊ TRÀ XANH 45 G (270 G/GÓI)", 3.59],
	"VGS00001300.A0": ["BÁNH MÌ MÈ KIỂU HÀN QUỐC VỊ TRÀ XANH 45 G (270 G/GÓI)", 3.59],
	"VGS00001500.00": ["BÁNH BAO NẤM VÀ GÀ XÉ 50 G (300 G/GÓI)", 4.234],
	"VGS00001600.00": ["BÁNH KHOAI MÔN CHIÊN 25 G (300 G/GÓI)", 3.162],
	"VHF00000600.0A": ["Cá viên 10g (500g/gói)", 12.536],
	"VHF00000600.AB": ["Cá viên 10 g (500 g)", 3.39],
	"VHF00000600.AC": ["Cá viên 10 g (500 g)", 3.39],
	"VHF00004100.0C": ["Samosa vỏ bột mì 15 g (480 g)", 3.31],
	"VHF00004100.0D": ["Samosa vỏ bột mì 15 g (480 g)", 3.31],
	"VHF00007600.00": ["Há cảo tôm 22g", 4.821],
	"VHF00007600.0A": ["Há cảo tôm 22g (880g/gói)", 15.034],
	"VHF00007600.0B": ["Há cảo tôm 22 g (440g/gói)", 5.2],
	"VHF00007600.0C": ["Há cảo tôm 22g (880g/gói)", 6.745],
	"VHF00007600.0E": ["Há cảo tôm 22 g (880 g)", 4.805],
	"VHF00007600.0L": ["Há cảo tôm 22g (880g/gói)", 4.805],
	"VHF00007600.0M": ["Há cảo tôm 22g (880g/gói)", 15.034],
	"VHF00007600.0N": ["Há cảo tôm 22 g (880 g)", 13.256],
	"VHF00007600.0O": ["Há cảo tôm 22 g (880 g)", 4.795],
	"VHF00007600.0P": ["Há cảo tôm 22 g (880 g)", 13.256],
	"VHF00007600.0Q": ["Há cảo tôm 22 g (880 g)", 15.054],
	"VHF00007600.0R": ["Há cảo tôm 22 g (880 g)", 4.795],
	"VNB00000100.00": ["Há cảo tôm 22 g (880 g)", 4.795],
	"VHF00007600.0S": ["Há cảo tôm 22 g (880 g)", 13.256],
	"VHF00007600.0T": ["Há cảo tôm 22 g (880 g)", 15.124],
	"VHF00007600.0V": ["Há cảo tôm 22 g (880 g) (Bao VHF03)", 13.326],
	"VHF00055300.0A": ["Há cảo tôm 22 g (880 g) (bao VHF03 (14 gói/thùng)) - CODE CŨ", 13.326],
	"VHF00055300.0C": ["Há cảo tôm 22 g (880 g) (bao VHF03 (14 gói/thùng))", 13.326],
	"VHF00007600.0U": ["Há cảo tôm 22 g (880 g) (Bao VHF03)", 4.795],
	"VHF00055300.00": ["Há cảo tôm 22 g (880 g) (Bao VHF03 (5 gói/thùng))", 4.795],
	"VHF00055300.0B": ["Há cảo tôm 22 g (880 g) (bao VHF03 (5 gói/thùng))", 4.795],
	"VHF00008000.A0": ["Bánh bao sandwich 48 g (672 g)", 6.187],
	"VHF00008000.AC": ["Bánh bao sandwich 48 g (672 g)", 6.187],
	"VHF00008000.AB": ["Bánh bao sandwich 48 g (672 g)", 6.187],
	"VHF00008300.0C": ["Bánh bao xíu mại trứng muối 50 g ( 300 g)", 2.82],
	"VHF00008300.0D": ["Bánh bao xíu mại trứng muối 50 g (300 g)", 2.82],
	"VHF00009500.0D": ["Bánh cuốn hải sản 40 g (800 g)", 3.979],
	"VHF00009500.0F": ["Bánh cuốn hải sản 40 g (800 g)", 3.979],
	"VHF00009500.0I": ["Bánh cuốn hải sản 40 g (800 g)", 3.598],
	"VHF00009500.0J": ["Bánh cuốn hải sản 40 g (800 g)", 3.6],
	"VHF00011300.A0": ["Xíu mại tôm thịt 22g (880g/gói))", 3.903],
	"VHF00011300.AA": ["Xíu mại tôm thịt 22 g (440g/gói)", 5.22],
	"VHF00011300.AD": ["Xíu mại tôm thịt 22 g (880 g)", 3.911],
	"VHF00011300.AF": ["Xíu mại tôm thịt 22g (880g )", 3.911],
	"VHF00011300.AG": ["Xíu mại tôm thịt 22g (880g )", 3.896],
	"VHF00011300.AH": ["Xíu mại tôm thịt 22 g (880 g)", 3.896],
	"VHF00011300.AI": ["Xíu mại tôm thịt 22 g (880 g)", 3.896],
	"VHF00011900.00": ["Bánh bao đậu đỏ", 4.24],
	"VHF00012000.00": ["Há cảo ba màu 25g (500g/gói)", 10.3],
	"VHF00012200.00": ["Nem cua bể 62.5g (500g/gói)", 5.78],
	"VHF00012200.0A": ["Nem cua bể 62.5 g (500 g)", 5.78],
	"VHF00012300.00": ["Bánh bao xá xíu 45g (540g/gói)", 6.06],
	"VHF00012300.0A": ["Bánh bao xá xíu 45g (540g/gói)", 4.946],
	"VHF00012300.0B": ["Bánh bao xá xíu 45g (540g/gói)", 4.946],
	"VHF00012500.A0": ["Bánh xếp tôm thịt 35g", 15.026],
	"VHF00012500.AB": ["Bánh xếp tôm thịt 35 g (700 g)", 15.026],
	"VHF00012600.00": ["Há cảo sò điệp 18g (0.9kg)", 15.402],
	"VHF00012600.0A": ["Há cảo sò điệp 18 g (900 g)", 15.402],
	"VHF00012700.00": ["Xíu mại tôm 22g", 16.82],
	"VHF00012700.0A": ["Xíu mại tôm 22g", 15.03],
	"VHF00012700.AB": ["Xíu mại tôm 22 g (880 g)", 15.11],
	"VHF00012800.0E": ["Bánh bao kim sa 45 g (540 g)", 5.58],
	"VHF00012800.0A": ["Bánh bao kim sa 45g", 4.97],
	"VHF00012800.0B": ["Bánh bao kim sa 45 g (540 g/gói)", 5.58],
	"VHF00012800.0D": ["Bánh bao kim sa 45 g (540 g)", 5.58],
	"VHF00013300.A0": ["Hoành thánh tôm 340g/gói", 2.56],
	"VHF00013300.AC": ["Hoành thánh tôm 340g/gói", 2.56],
	"VHF00013300.AD": ["Hoành thánh tôm 340g/gói", 2.56],
	"VHF00013300.AE": ["Hoành thánh tôm 20 g (kèm súp) (340 g)", 2.56],
	"VHF00013600.00": ["Tôm Viên Bánh Mì 20g", 10.94],
	"VHF00013600.0C": ["Tôm viên bánh mì 20 g (1 kg)", 10.94],
	"VHF00013800.00": ["Bánh Bao Sầu Riêng 45g (540g/gói)", 2.011],
	"VHF00013800.0A": ["Bánh Bao Sầu Riêng 45g (540g/gói)", 2.011],
	"VHF00013800.0B": ["Bánh bao sầu riêng 45 g (540 g)", 2.011],
	"VHF00014100.0B": ["Bánh cuốn nấm xốt dầu hào 48 g (960 g)", 4.236],
	"VHF00014100.0D": ["Bánh cuốn nấm xốt dầu hào 48 g (960 g)", 4.236],
	"VHF00014100.0F": ["Bánh cuốn nấm xốt dầu hào 48 g (960 g)", 4.236],
	"VHF00014100.0E": ["Bánh cuốn nấm xốt dầu hào 48 g (960 g)", 4.24],
	"VHF00014200.0B": ["Hoành Thánh Tôm (Thần Tài) 15 g (180 g)", 2.37],
	"VHF00014300.00": ["Bánh Xoài 20g (300g/gói)", 1.678],
	"VHF00015400.00": ["Mì Ý Luộc (100g/gói)", 3.62],
	"VHF00017000.A0": ["Tôm thẻ vụn (1kg)", 10.89],
	"VHF00017300.00": ["Phomai que 30g (900g/gói)", 9.96],
	"VHF00017700.00": ["Phômai que 20g", 11.048],
	"VHF00017700.0A": ["Phômai que 20g (1kg/gói)- Nhãn tiếng Việt", 11.048],
	"VHF00017700.0F": ["Cheese stick 20 g (1 kg)", 11.048],
	"VHF00017700.0E": ["Phô mai que 20 g (1 kg)", 11.048],
	"VHF00017700.0C": ["Phô mai que 20 g (1 kg)", 11.048],
	"VHF00017700.0D": ["Cheese stick 20 g (1 kg)", 11.048],
	"VHF00018000.00": ["Bánh xếp gà rô ti 50g (500g/gói)", 11.066],
	"VHF00018000.0B": ["Bánh xếp gà rô ti 50 g (500 g)", 6.67],
	"VHF00018000.0C": ["Bánh xếp gà roti 50 g (500 g)", 6.67],
	"VHF00018100.00": ["Bánh cuốn Hải Sản 40g (800g/gói)", 15.826],
	"VHF00018100.0A": ["Bánh cuốn Hải Sản 40g (800g/gói)", 13.736],
	"VHF00018100.0C": ["Bánh Cuốn Hải Sản 40 g (800 g)", 13.738],
	"VHF00018100.0E": ["Bánh Cuốn Hải Sản 40 g (800 g)", 13.738],
	"VHF00018100.AE": ["Bánh Cuốn Hải Sản 40 g (800 g)", 13.738],
	"VHF00018100.AF": ["Bánh Cuốn Hải Sản 40 g (800 g)", 13.738],
	"VHF00018200.00": ["Há cảo tôm 22g (880g/gói)", 15.062],
	"VHF00018200.0A": ["Há cảo tôm 22g (880g/gói)", 14.165],
	"VHF00018200.0B": ["Há cảo tôm 22g (880g/gói)", 14.165],
	"VHF00018300.A0": ["Chả giò mayo vỏ trắng 40g (1kg/gói)", 15.032],
	"VHF00018400.0D": ["Đế Pizza nướng (18 cm) 120 g", 4.55],
	"VHF00018400.0C": ["Đế Pizza nướng 18cm (120 g)", 4.55],
	"VHF00018600.0A": ["Bánh Bao Kim Sa vỏ hồng 45g (540g/gói)", 2.005],
	"VHF00018600.0C": ["Bánh bao kim sa vỏ hồng 45 g (540 g)", 2.005],
	"VHF00019000.00": ["Bánh bao caze 60g (480g/gói)", 6.68],
	"VHF00019000.0C": ["Bánh bao cade 60 g (480 g)", 6.68],
	"VHF00019000.0B": ["Bánh bao cade 60 g (480 g)", 6.68],
	"VHF00019100.00": ["Há cảo cá vàng 20g (200g/gói)", 2.88],
	"VHF00019300.AB": ["Bánh mì bơ tỏi 40 g (400 g)", 4.832],
	"VHF00019300.A0": ["Bánh mì bơ tỏi 40g (400g/gói)", 4.832],
	"VHF00019400.00": ["Lá basil xay (180/gói)", 4.11],
	"VHF00019900.0A": ["Chân gà tàu xì (1kg/gói)", 4.378],
	"VHF00019900.0B": ["Chân gà tàu xì (1kg/gói)", 4.368],
	"VHF00019900.0C": ["Chân gà tàu xì (1 kg)", 4.368],
	"VHF00020000.00": ["Hoành thánh tôm thịt 14g (336g/gói) mới", 2.135],
	"VHF00020000.0B": ["Hoành thánh tôm thịt 14g (336g/gói) (HSD: 12 THÁNG)", 2.135],
	"VHF00020000.0D": ["Hoành thánh tôm thịt 14g (336g/gói) (HSD: 18 THÁNG)", 2.115],
	"VHF00020000.0E": ["Hoành thánh tôm thịt 14g (336g/gói) (HSD: 18 THÁNG)", 2.115],
	"VHF00020200.00": ["Sủi cảo hẹ áp chảo 25g (1kg)", 4.37],
	"VHF00020200.0A": ["Sủi cảo tôm hẹ (áp chảo) 25 g (500 g)", 4.414],
	"VHF00020200.0C": ["Sủi cảo tôm hẹ (áp chảo) 25 g (500 g)", 4.414],
	"VHF00020200.0D": ["Sủi cảo tôm hẹ (áp chảo) 25 g (500 g)", 4.404],
	"VHF00020200.0E": ["Sủi cảo tôm hẹ (áp chảo) 25 g (500 g)", 4.404],
	"VHF00020300.00": ["Bánh củ cải 45g(720g/gói)", 6.22],
	"VHF00020300.0B": ["Bánh củ cải 45 g (720 g)", 6.218],
	"VHF00020300.0C": ["Bánh củ cải 45 g (720 g)", 6.218],
	"VHF00020400.00": ["Hoành thánh tôm chiên 14g (336g/gói)", 1.423],
	"VHF00020400.0C": ["Hoành thánh tôm chiên 14 g (336 g)", 1.423],
	"VHF00020500.A0": ["Xíu mại tôm thịt 22g (880g/gói) chạy máy", 3.903],
	"VHF00020500.AB": ["Xíu mại tôm thịt 22 g (880 g)", 3.888],
	"VHF00020500.AC": ["Xíu mại tôm thịt 22 g (880 g)", 3.888],
	"VHF00020500.AD": ["Xíu mại tôm thịt 22 g (880 g)", 3.888],
	"VHF00020600.00": ["Bánh tiểu long (Xiao long Pao) 30g (900g/gói)", 4.016],
	"VHF00020600.0B": ["Bánh tiểu long 30 g (900 g)", 4.016],
	"VHF00020600.0C": ["Bánh tiểu long 30 g (900 g)", 4.016],
	"VHF00020700.00": ["Xôi lá sen 60g (480g/gói)", 4.316],
	"VHF00020700.0C": ["Xôi lá sen 60 g (480 g)", 3.276],
	"VHF00020700.0D": ["Xôi lá sen 60 g (480 g)", 3.276],
	"VHF00020800.00": ["Bánh bao xá xíu 45g (540g)", 2.568],
	"VHF00020800.0B": ["Bánh bao xá xíu 45 g (540 g)", 2.576],
	"VHF00020800.0D": ["Bánh bao xá xíu 45 g (540 g)", 2.576],
	"VHF00020800.0E": ["Bánh bao xá xíu 45 g (540 g)", 2.536],
	"VHF00020800.0F": ["Bánh bao xá xíu 45 g (540 g)", 2.536],
	"VHF00020900.00": ["Bánh cuốn Hải sản 40g (800g/gói)", 3.621],
	"VHF00021000.A0": ["Bánh xếp tôm thịt 35g (0.7kg)", 3.925],
	"VHF00021000.AB": ["Bánh xếp tôm thịt 35 g (910 g)", 4.026],
	"VHF00021000.AE": ["Bánh xếp tôm thịt 35 g (910 g)", 4.026],
	"VHF00021000.AG": ["Bánh xếp tôm thịt 35 g (910 g)", 4.026],
	"VHF00021100.00": ["Chả giò hải sản mayo 40g (800g/gói)", 5.242],
	"VHF00021100.0B": ["Chả giò hải sản mayonnaise 40 g (800 g)", 5.242],
	"VHF00021100.0C": ["Chả giò hải sản mayonnaise 40 g (800 g)", 5.202],
	"VHF00021200.00": ["Bánh xếp hải sản 22g (880g)", 3.93],
	"VHF00021200.0A": ["Bánh xếp hải sản 22g (440g/gói)", 15.14],
	"VHF00021200.0C": ["Bánh xếp hải sản 22 g (880 g)", 3.89],
	"VHF00021200.0D": ["Bánh xếp hải sản 22 g (880 g)", 3.89],
	"VHF00021300.00": ["Há cảo sò điệp 18g (0.9kg)", 4.016],
	"VHF00021300.0B": ["Há cảo sò điệp 18 g (900 g)", 4.016],
	"VHF00021300.0G": ["Há cảo sò điệp 18g (900 g)", 3.97],
	"VHF00021300.0H": ["Há cảo sò điệp 18g (900 g)", 3.972],
	"VHF00021300.0I": ["Há cảo sò điệp 18g (900 g)", 3.972],
	"VHF00021400.00": ["Há cảo hoa hồng 22g (880g/gói)", 3.953],
	"VHF00021400.AA": ["Há cảo hoa hồng 22 g (880 g)", 3.953],
	"VHF00021400.AF": ["Há cảo hoa hồng 22g (880g/gói)", 3.953],
	"VHF00021400.AG": ["Há cảo hoa hồng 22g (880g/gói)", 3.953],
	"VHF00021400.AH": ["Há cảo hoa hồng 22g (880g/gói)", 3.953],
	"VHF00021500.00": ["Há cảo tôm 22g (880g/gói)", 4.8],
	"VHF00021500.0A": ["Há cảo tôm Premium 22g (880g/gói)", 4.8],
	"VHF00021500.0C": ["Há cảo tôm Premium 22 g (880 g)", 4.785],
	"VHF00021500.0D": ["Há cảo tôm (Premium) 22 g (880 g)", 4.785],
	"VHF00021500.AE": ["Há cảo tôm (Premium) 22 g (880 g)", 4.785],
	"VNB00000200.00": ["Há cảo tôm (Premium) 22 g (880 g)", 4.785],
	"VHF00021600.00": ["Há cảo tôm hẹ 22g (880g/gói)", 3.928],
	"VHF00021600.AC": ["Há cảo tôm hẹ 22 g (880 g)", 3.928],
	"VHF00021600.AE": ["Há cảo tôm hẹ 22 g (880 g)", 3.888],
	"VHF00021600.AF": ["Há cảo tôm hẹ 22 g (880 g)", 3.888],
	"VHF00021700.00": ["Xíu mại tôm 22g (880g/gói)", 3.928],
	"VHF00021700.AB": ["Xíu mại tôm 22g (880g/gói)", 3.928],
	"VHF00021700.AE": ["Xíu mại tôm 22g (880g)", 3.901],
	"VHF00021700.AG": ["Xíu mại tôm 22g (880g)", 3.901],
	"VHF00021700.AH": ["Xíu mại tôm 22g (880g)", 3.901],
	"VHF00021700.AI": ["Xíu mại tôm 22g (880g) (Bao VHF03)", 3.896],
	"VHF00021700.AJ": ["Xíu mại tôm 22g (880g) (Bao pa zipper)", 3.896],
	"VHF00021700.AK": ["Xíu mại tôm 22g (880g) (Bao pa zipper)", 3.896],
	"VHF00021700.AL": ["Xíu mại tôm 22 g (880 g) (Bao PA Zipper)", 3.896],
	"VHF00055000.00": ["Xíu mại tôm 22 g (880 g) (Bao VHF03) - CODE CŨ VHF 217.AI", 3.896],
	"VHF00055000.0A": ["Xíu mại tôm 22 g (880 g) (Bao VHF03) - CODE CŨ VHF 217.AI", 3.896],
	"VHF00021800.0A": ["Bánh bao kim sa 45g (540g/gói)", 2.02],
	"VHF00021800.0B": ["Bánh bao kim sa 45 g (540 g)", 2.026],
	"VHF00021800.0C": ["Bánh bao kim sa 45 g (540 g)", 2.041],
	"VHF00021800.0I": ["Bánh bao kim sa 45g (540g)", 2.041],
	"VHF00021800.0F": ["Bánh bao kim sa 45g (540g)", 2.041],
	"VHF00021800.0J": ["Bánh bao kim sa 45g (540g)", 2],
	"VHF00021800.0H": ["Bánh bao kim sa 45g (540g)", 1.98],
	"VHF00022000.A0": ["Nghêu xào thịt (1kg/gói)", 6.43],
	"VHF00022500.00": ["Nước tương há cảo (1kg/gói)", 8.411],
	"VHF00022500.A0": ["Nước chấm dimsum (1kg)", 8.411],
	"VHF00022500.AA": ["Nước chấm dimsum (1 kg)", 6.387],
	"VHF00022500.AC": ["Nước chấm dimsum (1 kg)", 6.387],
	"VHF00023900.00": ["Bánh xếp thịt (360g/gói)", 10.142],
	"VHF00023900.0B": ["Bánh xếp thịt (360 g)", 4.42],
	"VHF00023900.0C": ["Bánh xếp thịt (360 g)", 4.42],
	"VHF00023900.0D": ["Bánh xếp thịt (360 g)", 4.42],
	"VHF00024000.00": ["Chả giò tôm baby 8g (500g/gói)", 5.76],
	"VHF00024000.0B": ["Chả giò tôm baby 8 g (500 g)", 2.935],
	"VHF00024200.AA": ["Chạo tôm 41.67g (500g/gói)", 2.985],
	"VHF00024200.AB": ["Chạo tôm (500 g)", 2.985],
	"VHF00024200.AC": ["Chạo tôm (500 g)", 2.985],
	"VHF00024900.00": ["Nước tương há cảo (100g/gói)", 4.9086],
	"VHF00024900.0B": ["Nước chấm Dimsum 100 g", 4.935],
	"VHF00024900.0A": ["Nước chấm Dimsum 100 g", 4.935],
	"VHF00025200.00": ["Bánh cuốn hải sản (tôm sò điệp) 40g (425g/ gói)", 8.411],
	"VHF00025300.0C": ["Bánh xếp kiểu Nhật nhân hải sản và phô mai 25g (500g)", 6.646],
	"VHF00025300.0D": ["Bánh xếp kiểu Nhật nhân hải sản và phô mai 25g (500g)", 6.646],
	"VHF00025300.0E": ["Bánh xếp kiểu Nhật nhân hải sản và phô mai 25g (500g)", 6.646],
	"VHF00025300.0F": ["Bánh xếp kiểu Nhật nhân hải sản và phô mai 25 g (500 g)", 6.646],
	"VHF00025400.00": ["Bánh xếp kiểu nhật nhân thịt 25g ( Japanese style meat dumpl", 14.182],
	"VHF00025400.0B": ["Bánh xếp kiểu Nhật nhân thịt 25 g (500 g)", 5.66],
	"VHF00025400.0C": ["Bánh xếp kiểu Nhật nhân thịt 25 g (500 g)", 5.66],
	"VHF00025400.0D": ["Bánh xếp kiểu Nhật nhân thịt 25 g (500 g)", 5.66],
	"VHF00025600.00": ["BẮP CẢI CUỘN THỊT 33.3g (400g/gói)", 7.13],
	"VHF00025600.0A": ["BẮP CẢI CUỘN THỊT 33.3g (400g/gói)", 7.13],
	"VHF00025600.0B": ["Bắp cải cuộn thịt 33.3 g (400 g)", 3.636],
	"VHF00025600.0D": ["BẮP CẢI CUỘN THỊT 33.3g (400g/gói)", 3.596],
	"VHF00025600.0E": ["BẮP CẢI CUỘN THỊT 33.3g (400g/gói)", 3.596],
	"VHF00025600.0F": ["Bắp cải cuộn thịt 33.3 g (400 g)", 3.596],
	"VHF00025700.00": ["PHÔ MAI QUE 30G (480g/gói)", 8.41],
	"VHF00025700.0A": ["Phô mai que 30 g (300 g)", 4.636],
	"VHF00025800.00": ["BURGER HEO 50G (400g/gói)", 7.96],
	"VHF00026100.00": ["Bánh xếp kiểu Nhật nhân con tôm 20g (200g/gói)", 3.85],
	"VHF00026100.0A": ["Bánh xếp kiểu Nhật nhân con tôm 20 g (200 g)", 1.644],
	"VHF00026100.0B": ["Bánh xếp kiểu Nhật nhân con tôm 20 g (200 g)", 1.684],
	"VHF00026100.0C": ["Bánh xếp kiểu Nhật nhân con tôm 20 g (200 g)", 1.684],
	"VHF00026500.0B": ["Hải sản viên vị tôm nhân trứng cá 23 g (400 g)", 4.43],
	"VHF00026600.0A": ["Cá viên phô mai 22 g (400g/gói)", 4.52],
	"VHF00027000.0A": ["Bánh khọt tôm nước cốt dừa 15g (320g/gói)", 5.74],
	"VHF00027100.00": ["Chả cá bắp mỹ 40G (480g/gói)", 10.39],
	"VHF00027200.0B": ["Há cảo thịt bắp mỹ BON 25 g (400 g)", 3.796],
	"VHF00027200.0C": ["Há cảo thịt bắp mỹ BON 25 g (400 g)", 3.796],
	"VHF00027200.0D": ["Há cảo thịt bắp mỹ 25 g (400 g)", 3.756],
	"VHF00028100.00": ["Há cao tôm 25g (1kg/gói)", 14.99],
	"VHF00028100.0A": ["Há cao tôm 25g (1kg/gói)", 5.425],
	"VHF00028100.0C": ["Há cảo tôm 25 g (1 kg)", 5.425],
	"VHF00028100.0D": ["Há cảo tôm 25 g (1 kg)", 5.385],
	"VHF00029300.00": ["Há cảo rau củ 25g (1.0 kg/gói)", 8.626],
	"VHF00029300.0A": ["Há cảo rau củ 25g (1.0 kg/gói)", 8.626],
	"VHF00029300.0C": ["Há cảo nấm rau củ 25 g (1 kg)", 8.65],
	"VHF00029300.0D": ["Há cảo nấm rau củ 25 g (1 kg)", 8.65],
	"VHF00029300.0E": ["Há cảo nấm rau củ 25 g (1 kg)", 8.65],
	"VHF00029400.00": ["Hải sản viên vị tôm nhân trứng cá 23g (1kg/gói)", 10.64],
	"VHF00029400.0A": ["Tôm viên nhân trứng cá 23 g (1 kg)", 10.64],
	"VHF00029500.00": ["Hải sản viên vị cá hồi nhân phô mai 23g (1kg/gói)", 10.67],
	"VHF00029500.0A": ["Hải sản viên vị cá hồi nhân phomai 23 g (400 g/ gói)", 9.62],
	"VHF00029500.0B": ["Cá hồi viên nhân phô mai 23 g (1 kg)", 10.69],
	"VHF00029600.00": ["Bánh xếp nhân thịt bò 40g (1kg/gói)", 8.642],
	"VHF00029800.00": ["Cá viên phô mai 23g (1kg/gói)", 10.64],
	"VHF00030000.0A": ["Há cảo sò điệp vỏ hồng 25 g (500g)", 4.42],
	"VHF00030000.0B": ["Há cảo sò điệp vỏ hồng 25 g (500g)", 4.38],
	"VHF00030200.00": ["Há cảo tôm ba màu 25g (500g/gói)", 2.422],
	"VHF00030200.0B": ["Há cảo tôm ba màu 25g (500g/gói)", 2.422],
	"VHF00030200.0C": ["Há cảo tôm ba màu 25g (500g/gói)", 2.412],
	"VHF00030200.0D": ["Há cảo tôm ba màu 25g (500g/gói)", 2.412],
	"VHF00030600.0A": ["Bánh bao nấm 45g (270g/gói)", 3.44],
	"VHF00030600.0D": ["Bánh bao nấm 45 g (270 g)", 3.47],
	"VHF00030600.0C": ["Bánh bao nấm 45 g (270 g)", 3.47],
	"VHF00031900.0A": ["Bánh cuốn xá xíu 60 g (600 g)", 3.996],
	"VHF00031900.0B": ["Bánh cuốn xá xíu 60 g (600 g)", 3.996],
	"VHF00031900.0C": ["Bánh cuốn xá xíu 60 g (600 g)", 3.996],
	"VHF00032100.0A": ["Sủi cảo tôm thịt 30g (300g/gói)", 3.054],
	"VHF00032100.0B": ["Sủi cảo tôm thịt 30 g (300 g)", 3.054],
	"VHF00033300.0B": ["Há cảo túi phúc 25g (500g/gói)", 4.81],
	"VHF00033300.0C": ["Há cảo túi phúc 25g (500g/gói)", 4.81],
	"VHF00033300.0D": ["Há cảo túi phúc 25g (500g/gói)", 4.81],
	"VHF00033300.0E": ["Há cảo túi phúc 25g (500g/gói)", 4.81],
	"VHF00034000.00": ["Nước soup cô đặc 500g (500g/gói)", 5.44],
	"VHF00034000.0A": ["Nước soup cô đặc (500 g)", 5.44],
	"VHF00034000.0C": ["Nước soup cô đặc (500 g)", 5.44],
	"VHF00034200.0A": ["Hải sản viên vị tôm hùm nhân trứng cá 23 g ( 400 g/ gói)", 9.686],
	"VHF00034300.00": ["Hải sản viên vị tôm hùm nhân phô mai 23g (1kg/gói)", 10.69],
	"VHF00034300.0B": ["Tôm hùm viên nhân phô mai 23 g (1 kg)", 10.69],
	"VHF00035100.00": ["Xíu mại mực 25g (500g/gói)", 3.45],
	"VHF00035100.0A": ["Xíu mại mực 25g (500g/gói)", 3.45],
	"VHF00035100.0B": ["Xíu mại mực 25g (500g/gói)", 3.45],
	"VHF00035800.00": ["Há cảo tôm thịt 20 g (300g/gói)", 6.73],
	"VHF00035800.0A": ["Há cảo tôm thịt BO 20 g (300 g)", 6.73],
	"VHF00035800.0B": ["Há cảo tôm thịt 20 g (300 g)", 6.73],
	"VHF00035800.0C": ["Há cảo tôm thịt 20 g (300 g)", 6.73],
	"VHF00035900.00": ["Bánh xếp tôm thịt BO 20 g (300/gói)", 6.73],
	"VHF00035900.0A": ["Bánh xếp tôm thịt BO 20 g (300 g)", 6.73],
	"VHF00035900.0B": ["Bánh xếp tôm thịt 20 g (300 g)", 6.73],
	"VHF00035900.0C": ["Bánh xếp tôm thịt 20 g (300 g)", 6.73],
	"VHF00036000.00": ["Há cảo tôm hình bánh bao 20 g (300g/gói)", 6.79],
	"VHF00036000.0A": ["Há cảo tôm hình bánh bao 20 g (300g/gói)", 6.79],
	"VHF00036000.0B": ["Há cảo tôm hình bánh bao 20 g (300g/gói)", 6.79],
	"VHF00036100.00": ["Bánh hẹ tôm thịt 20 g (300g/gói)", 6.79],
	"VHF00036100.0A": ["Bánh hẹ tôm thịt 20 g (300g/gói)", 6.79],
	"VHF00036100.0B": ["Bánh hẹ tôm thịt  20 g ( 300 g)", 6.79],
	"VHF00036100.0C": ["Bánh hẹ tôm thịt  20 g ( 300 g)", 6.79],
	"VHF00036200.00": ["Xíu mại tôm thịt 20 g (300g/gói)", 6.79],
	"VHF00036200.0A": ["Xíu mại tôm thịt 20 g (300g/gói)", 6.79],
	"VHF00036300.00": ["Sủi cảo thịt 15 g (300g/gói)", 6.69],
	"VHF00036300.0A": ["Sủi cảo thịt 15 g (300g/gói)", 6.69],
	"VHF00036400.00": ["Há cảo tôm thịt hình đồng tiền BO 20 g (300g/gói)", 6.73],
	"VHF00036400.0B": ["Há cảo tôm thịt hình sò điệp 20 g (300 g)", 6.73],
	"VHF00036400.0C": ["Há cảo tôm thịt hình sò điệp 20 g (300 g)", 6.73],
	"VHF00037100.00": ["Xíu mại cuộn rong biển 25g (1kg/gói)", 8.61],
	"VHF00037500.00": ["Xốt mì ý 1 kg (1kg/gói)", 10.67],
	"VHF00037500.A0": ["Xốt mì ý 1 kg (1kg/gói)", 10.66],
	"VHF00037500.C0": ["Xốt mì ý (1 kg)", 10.66],
	"VHF00037600.0A": ["Sủi cảo tôm gừng 35 g (700 g)", 6.194],
	"VHF00037800.0A": ["Bánh cuốn tôm 60 g (600 g)", 5.594],
	"VHF00038900.0A": ["Há cảo tôm đặc biệt 30 g (900g)", 11.726],
	"VHF00038900.0G": ["Há cảo tôm đặc biệt 30 g (900g)", 11.726],
	"VHF00038900.0H": ["Há cảo tôm đặc biệt 30 g (900g)", 11.726],
	"VHF00038900.0I": ["Há cảo tôm đặc biệt 30 g (900g)", 11.726],
	"VHF00040100.00": ["Tôm lột vụn (1kg)", 4.412],
	"VHF00040300.00": ["Bánh bao mè đen 45 g (540 g)", 3.82],
	"VHF00040300.0B": ["Bánh bao mè đen 45 g (540 g)", 1.988],
	"VHF00040400.00": ["Bánh bao kim sa than tre 45 g (540 g)", 3.82],
	"VHF00040400.0E": ["Bánh bao kim sa than tre 45 g (540 g)", 4.97],
	"VHF00040400.0D": ["Bánh bao kim sa than tre 45 g (540 g)", 4.97],
	"VHF00040800.00": ["Há cảo tôm đặc biệt 25 g (1kg)", 4.408],
	"VHF00040800.0B": ["Há cảo tôm đặc biệt 25 g (1 kg)", 4.368],
	"VHF00040900.0C": ["Há cảo than tre hình thuyền 28 g (1kg)", 8.676],
	"VHF00040900.0E": ["Há cảo tôm than tre hình thuyền 28 g (336 g)", 5.404],
	"VHF00040900.0F": ["Há cảo tôm than tre hình thuyền 28 g (336 g)", 5.404],
	"VHF00040900.0G": ["Há cảo tôm than tre hình thuyền 28 g (336 g)", 5.404],
	"VHF00040900.0H": ["Há cảo tôm than tre hình thuyền 28 g (1 kg)", 8.676],
	"VHF00041100.00": ["Combo viên nhân trứng cá 3in1 (396 g)", 8.232],
	"VHF00041200.00": ["Combo viên hải sản 4in1 (552 g)", 9.59],
	"VHF00041300.00": ["Combo dimsum 3in1 (512 g)", 4.284],
	"VHF00041400.00": ["Combo dimsum 4in1 (672 g)", 4.726],
	"VHF00041400.0B": ["Combo dimsum 4in1 (840 g)", 3.746],
	"VHF00041400.0C": ["Combo dimsum 4in1 (840 g)", 3.746],
	"VHF00041400.0D": ["Combo dimsum 4in1 (840 g)", 12.74],
	"VHF00041400.0E": ["Combo dimsum 4in1 (840 g)", 3.74],
	"VHF00041400.0G": ["Combo dimsum 4in1 (840 g)", 3.74],
	"VHF00041400.0F": ["Combo dimsum 4in1 (840 g) (bao VHF03)", 3.74],
	"VHF00055200.00": ["Combo dimsum 4in1 (840 g) (Bao VHF03) - CODE CŨ VHF 414.0F", 3.74],
	"VHF00055200.0A": ["Combo dimsum 4in1 (840 g) (Bao VHF03) - CODE CŨ VHF 414.0F", 3.74],
	"VHF00041500.A0": ["Hải sản viên nhân sốt tomyum cay và trứng cá 23 g (400g)", 4.47],
	"VHF00041600.0B": ["Há cảo tôm than tre 28 g (1kg)", 8.676],
	"VHF00041600.0C": ["Há cảo tôm than tre 28 g (1kg)", 8.676],
	"VHF00041600.0D": ["Há cảo tôm than tre 28 g (1kg)", 8.676],
	"VHF00042100.00": ["Burger đen vỏ bánh mì 90g - cắt đôi (540g)", 4.586],
	"VHF00042300.AB": ["Xốt bánh mì hotdog 500 g", 10.714],
	"VHF00042300.AA": ["Xốt bánh mì hotdog 500 g", 10.674],
	"VHF00042300.A0": ["Xốt bánh mì hotdog 500g", 10.674],
	"VHF00042400.0A": ["Combo dimsum gia đình 6in1 (924 g)", 4.082],
	"VHF00042600.0A": ["Há cảo thịt trứng muối 50 g (400 g)", 3.716],
	"VHF00042600.0B": ["Há cảo thịt trứng muối 50 g (400 g)", 3.676],
	"VHF00042600.0C": ["Há cảo thịt trứng muối 50 g (400 g)", 3.676],
	"VHF00042700.00": ["Bánh Mandu truyền thống 35 g (420 g)", 5.051],
	"VHF00042700.0A": ["Bánh Mandu truyền thống 35 g (420 g)", 5.051],
	"VHF00042800.0B": ["Há cảo cá hồi 25 g (300 g)", 3.55],
	"VHF00042800.0C": ["Há cảo cá hồi 25 g (300 g)", 3.51],
	"VHF00042800.0D": ["Há cảo cá hồi 25 g (300 g)", 3.51],
	"VHF00043400.0A": ["Há cảo ba loại nấm 20 g (240 g)", 4.425],
	"VHF00043400.0C": ["Há cảo ba loại nấm 20 g (240 g)", 4.425],
	"VHF00043700.00": ["Sụn ức gà vị cay (350 g)", 2.56],
	"VHF00044300.0B": ["Há cảo tôm chiên 22 g (880 g)", 3.902],
	"VHF00045300.CA": ["Cơm nấu sẵn 160 g", 8.96],
	"VHF00045300.C0": ["Cơm nấu sẵn 160 g", 8.96],
	"VHF00045600.0A": ["Mandu kim chi thịt heo 35 g (420 g)", 5.38],
	"VHF00045800.00": ["Chả quết tôm thịt 50 g (300 g)", 5.245],
	"VHF00045900.00": ["Chả quết hải sản tôm 50 g (300 g)", 5.245],
	"VHF00046100.00": ["Chả giò tôm cà ri thái xanh 20 g ( 400 g)", 7.034],
	"VHF00046300.0A": ["Rau củ Kakiage 50 g (300 g)", 6.005],
	"VHF00046900.AA": ["Mì ý (luộc đóng vắt) 120 g (960 g)", 4.44],
	"VHF00046900.A0": ["MÌ Ý LUỘC ĐÓNG VẮT 120 G (960 G)", 4.44],
	"VHF00047000.0A": ["Xốt cà chua 1 kg", 10.67],
	"VHF00047000.00": ["Xốt cà chua 1 kg", 10.67],
	"VHF00047400.A0": ["Bánh bao gạo lứt nhân thịt bò phô mai 70 g (420 g)", 2.03],
	"VHF00047500.00": ["Bánh bao gạo lứt nhân gà phô mai 70 g (420 g)", 2.03],
	"VHF00047500.0A": ["Bánh bao gạo lứt nhân gà phô mai 70 g (420 g)", 2.03],
	"VHF00047500.0B": ["Bánh bao gạo lức nhân gà phô mai 70 g (420 g)", 2.03],
	"VHF00047600.0A": ["Bánh bao nguyên cám nhân xá xíu phô mai 110 g (440 g)", 2.591],
	"VHF00047600.0B": ["Bánh bao nguyên cám nhân xá xíu phô mai 110 g (440 g)", 2.591],
	"VHF00047800.00": ["Bánh nếp phô mai 40 g (320 g)", 5.26],
	"VHF00048100.0C": ["Mì tươi 70 g (sơi nhỏ) (1,05 kg)", 4.58],
	"VHF00049000.00": ["Combo dimsum 4in1 (819 g)", 12.396],
	"VHF00049100.00": ["COMBO DIMSUM 6 IN 1 ( 804G)", 8.67],
	"VHF00049800.00": ["Há cảo tôm đặc biệt 25 g ( 1 kg)", 8.647],
	"VHF00049800.0A": ["Há cảo tôm đặc biệt 25 g ( 1 kg)", 8.647],
	"VHF00049800.0B": ["Há cảo tôm 25 g ( 1 kg)", 8.647],
	"VHF00049800.0C": ["Há cảo tôm 25 g ( 1 kg)", 15.006],
	"VHF00050000.00": ["Bánh tart trứng 25 g (150 g)", 3.98],
	"VHF00050700.00": ["Mì tươi luộc 110 g ( 880 g)", 3.009],
	"VHF00050700.0B": ["Mì tươi luộc 110 g ( 880 g)", 3.009],
	"VHF00050700.0C": ["Mì tươi luộc 110 g ( 880 g)", 3.009],
	"VHF00050800.0B": ["Tôm mực hỗn hợp (400 g)", 3.746],
	"VHF00050800.0A": ["Tôm mực hỗn hợp (400 g)", 3.746],
	"VHF00050900.00": ["Sủi cảo 25 g (500 g)", 10.63],
	"VHF00050900.0A": ["Sủi cảo 25 g (500 g)", 10.63],
	"VHF00051000.00": ["Há cảo sò điệp trứng cá 28 g (560 g)", 6.201],
	"VHF00051100.00": ["Xíu mại tôm đuôi phụng 25g (1 kg)", 10.66],
	"VHF00051300.A0": ["Xôi bát bửu 100 g (900 g)", 7.818],
	"VHF00051300.AA": ["Xôi bát bửu 100 g (900 g)", 7.818],
	"VHF00051400.00": ["Há cảo thanh cua 25 g (600 g)", 6.65],
	"VHF00051600.00": ["Há cảo tôm 25 g ( 1 kg)", 8.704],
	"VHF00052400.0A": ["Rế mực phô mai hai màu 20 g (400 g)", 11.703],
	"VHF00052400.00": ["Rế mực phô mai hai màu 20 g (400 g)", 11.703],
	"VHF00052700.00": ["Trứng chiên 60 g (480 g)", 3.765],
	"VHF00052700.0A": ["Trứng chiên 60 g (480 g)", 3.765],
	"VHF00052700.0B": ["Trứng chiên 60 g (480 g)", 3.765],
	"VHF00052800.00": ["Samosa rau củ 25 g (1 kg) (HALAL)", 8.734],
	"VHF00052800.0A": ["Chả giò tam giác nhân rau củ (Samosa) 25 g (1 kg)  (HALAL)", 8.734],
	"VHF00052800.AA": ["Chả giò tam giác nhân rau củ (Samosa) 25 g (1 kg) \n(QA XÁC N", 8.734],
	"VHF00052800.AB": ["Chả giò tam giác nhân rau củ (Samosa) 25 g (1 kg) \n(QA XÁC N", 8.734],
	"VHF00052800.AC": ["Chả giò tam giác nhân rau củ (Samosa) 25 g (1 kg)  (HALAL)\n(", 8.734],
	"VHF00053000.00": ["Burger mì 65 g (390 g/gói) (Code mẫu: ND343F0.23)", 10.262],
	"VHF00053300.0A": ["Bánh Mì Bơ Tỏi Kiểu Hàn Quốc 66 G (528 G)", 4.434],
	"VHF00053300.00": ["Bánh Mì Bơ Tỏi Kiểu Hàn Quốc 66 G (528 G)", 4.434],
	"VHF00053400.00": ["Bánh khoai lang tím nhân phô mai 60 G (360 G)", 5.043],
	"VHF00053500.00": ["Bánh mì mè Hàn Quốc 45 G (270 G)", 3.014],
	"VHF00053600.00": ["Bánh Sô-Cô-La 60 G (480 G)", 5.67],
	"VHF00053700.00": ["Sủi Cảo Cuộn Con Tôm 40 G (320 G)", 11.3],
	"VHF00053800.00": ["Xíu Mại Tôm 15 G (900 G) (VHF-S48.25)", 15.444],
	"VHF00054000.00": ["Há Cảo Tôm Rau Muống 30 G (900 G) (VHF-S50.25)", 13.606],
	"VHF00054100.00": ["Há Cảo Tôm Trứng Cá 30 G (900 G)\n (VHF-S51.25)", 13.606],
	"VHF00054200.00": ["Gà Tẩm Bột Chiên 16-18 G (500 G) \n(đổ xá, ép hút chặt không ", 5.64],
	"VHF00054300.00": ["BẮP CẢI CUỘN TÔM 25 G (1 KG/ GÓI) (VHF-S62.25)", 10.93],
	"VHF00054400.00": ["BÁNH BAO THỊT HEO KIỂU NHẬT 120 G (720 G/ GÓI)", 6.446],
	"VHF00056400.00": ["Há Cảo Thịt Vỏ Bó Xôi 22 g (880 g)", 9.589],
	"VHF00056600.00": ["Chả Giò Chay 40 g (960 g) (Ha, Ve)", 12.345],
	"VHF00056700.00": ["Hoành Thánh Chay 25 g  (1 kg) (Ha, Ve)", 10.809],
	"VHF00056700.0A": ["Hoành Thánh Chay 25 g  (1 kg) (Ha, Ve)  (NHÃN LOGO HALAL)", 10.809],
	"VHF00056900.00": ["Mì tươi 70 g (1,05 kg)", 9.042],
	"VHF00056900.AA": ["Mì tươi 70 g (1,05 kg)", 11.248],
	"VHF00057000.0A": ["Há Cảo Thả Lẩu Nhân Thịt 22 g (880 g)", 4.79],
	"VHF00057100.0A": ["Há cảo thả lẩu hình sò điệp nhân hải sản 22 g (880 g)", 4.79],
	"VHF00057200.0A": ["Há Cảo Thả Lẩu Hình Thuyền Nhân Hải Sản 22 g (880 g)", 4.79],
	"VHF00054800.00": ["BÁNH BAO BÒ PHÔ MAI 110 G (660 G) (ND83C.25, CÓ CHẤM MÀU TRÊ", 4.558],
	"VHF00055400.00": ["Há Cảo Mực Hoàng Gia 25 g (330 g) (VHF-S151A.25)", 11.652],
	"VHF00055500.00": ["Há Cảo Tôm Hoàng Gia 30 g (300 g) (VHF-S152A.25)", 7.954],
	"VHF00055600.00": ["Há Cảo Sò Điệp Hoàng Gia 25 g (330 g) (VHF-S157A.25)", 10.288],
	"VHF00056500.00": ["Chả giò tam giác nhân rau củ (Samosa) 40 g  (800 g)", 7.01],
	"VHF00057400.00": ["Bánh tiểu long 30 g (900 g)", 3.968],
	"VHF00057500.A0": ["Chả giò tam giác nhân rau củ (Samosa) 30 g (750 g), HA", 10.81],
	"VHF00057700.00": ["Ức Gà Sợi Tẩm Bột Xù 70 g (980 g)", 4.308],
	"VHF00057800.00": ["Ức Gà Nguyên Miếng tẩm Bột Xù 300 g (1.8 kg)", 7.84],
	"VHF00057900.00": ["Má Đùi Gà Tẩm Bột Xù 140 g (1.4 kg)", 9.141],
	"VHOF0000100.00": ["Bánh cà ri 65g (585g/gói)", 5.33],
	"VHOF0000100.0A": ["Bánh cà ri 65g (585g/gói)", 5.33],
	"VHOF0000100.AB": ["Bánh cà ri 65 g (585 g)", 5.322],
	"VHOF0000100.AA": ["Bánh cà ri 65 g (585 g)", 5.322],
	"VHP00000100.00": ["VỎ PASTRY (Vuông 15, 38-40 lá/lốc 300 G)", 15.938],
	"VIM00000100.00": ["HÀNH TÂY THÁI NHỎ CHẦN 0.2cm", 10.82],
	"VIM00000200.00": ["CÀ RỐT THÁI NHỎ CHẦN 0.2-0.3CM", 10.82],
	"VIM00000200.0A": ["CÀ RỐT THÁI NHỎ CHẦN 0.2-0.3CM", 10.82],
	VJL003: ["Bánh xếp gà rô ti 50g", 10],
	VJL006: ["Mực xù panko", 4],
	"VKF00000200.00": ["Pizza Margherita 120 g", 2.582],
	"VKF00000400.00": ["Pizza phô mai đặc biệt 120 g", 2.582],
	VKL0011: ["Bánh cuốn hải sản 40g", 15.12],
	VKL0012: ["Há cảo tôm 880g", 15.138],
	VKL04: ["Bánh bao sandwich Black bun 32g", 9.6],
	VKLCT0014: ["Há Cảo 3 Màu", 2.464],
	"VLT00002600.0B": ["Há cảo tôm 500g", 11.54],
	"VLT00002600.0D": ["Há cảo tôm 25 g ( 500 g)", 11.552],
	"VLT00002600.0E": ["Há cảo tôm 25 g ( 500 g)", 11.552],
	"VLT00002700.0A": ["(CL) - Bánh bao xíu mại trứng muối 300g", 7.306],
	"VLT00002700.0B": ["(CL) - Bánh bao xíu mại trứng muối 300g", 7.24],
	"VLT00002700.0D": ["Bánh bao xíu mại trứng muối 50 g (300 g)", 7.212],
	"VLT00002700.0E": ["Bánh bao xíu mại trứng muối 50 g (300 g)", 7.212],
	"VLT00002800.0A": ["Hoành thánh tôm thịt 20g (120g/gói)", 11.202],
	"VLT00002800.0B": ["Hoành thánh tôm thịt 20g (120g/gói)", 11.136],
	"VLT00002900.0A": ["Chả giò rế tôm ghẹ 20g", 10.34],
	"VLT00002900.0B": ["Chả giò rế tôm ghẹ 20g", 10.27],
	"VLT00003000.0A": ["Xíu mại thịt ghẹ 20g", 10.426],
	"VLT00003000.0B": ["Xíu mại thịt ghẹ 20g", 10.36],
	"VLT00003100.A0": ["Chả giò hải sản 25g (500g/gói)", 11.56],
	"VLT00003100.AA": ["Chả giò hải sản 25g (500g/gói)", 11.46],
	"VLT00003100.AC": ["Chả giò hải sản 25g ( 450 g)", 13.98],
	"VLT00003100.AD": ["Chả giò hải sản 25g ( 450 g)", 13.98],
	"VLT00003200.0A": ["Bánh cuốn tôm và rau củ 45 g (300 g)", 8.462],
	"VLT00003200.0B": ["Bánh cuốn tôm và rau củ 45 g (300 g)", 8.462],
	"VLT00003300.0A": ["Bánh cuốn xá xíu 45 g (300 g)", 8.462],
	"VLT00003300.0B": ["Bánh cuốn xá xíu 45 g (300 g)", 8.462],
	"VLT00003400.0A": ["Hoành thánh tôm thịt 15 g (300 g)", 7.21],
	"VLT00003400.0B": ["Hoành thánh tôm thịt 15 g (300 g)", 7.21],
	"VLT00003500.0A": ["Xíu mại tôm thịt 25 g (500 g)", 11.38],
	"VLT00003500.0B": ["Xíu mại tôm thịt 25 g (500 g)", 11.38],
	"VLT00003600.AA": ["Há cảo tôm thịt cải bó xôi 18 g (360 g)", 8.66],
	"VLT00003600.AB": ["Há cảo tôm thịt cải bó xôi 18 g (360 g)", 8.66],
	"VLT00003700.00": ["Chả giò tôm thịt 25 g (450 g)", 14.368],
	"VLT00003700.0A": ["Chả giò tôm thịt 25 g (450 g)", 14.368],
	"VLT00003700.0B": ["Chả giò tôm thịt 25 g (450 g)", 14.368],
	"VLT00003800.00": ["Há cảo chay 25 g (500 g)", 11.607],
	"VLT00003800.0A": ["Há cảo chay 25 g (500 g)", 11.607],
	"VLT00003900.0A": ["Chả giò chay 25 g (400 g)", 12.775],
	"VLT00003900.00": ["Chả giò chay 25 g ( 400 g)", 12.775],
	"VLT00004000.0A": ["Bánh bao kim sa 40 g (240 g)", 5.798],
	"VLT00004000.00": ["Bánh bao kim sa 40 g (240 g)", 5.798],
	"VLT00004100.00": ["Chả giò hải sản mayonnaise 40 g (400 g)", 9.996],
	"VLT00004100.0A": ["Chả giò hải sản mayonnaise 40 g (400 g)", 9.996],
	"VLT00004200.00": ["Sủi cảo con tôm 25 g (220 g)", 7.453],
	"VLT00004200.0A": ["Sủi cảo con tôm 25 g (220 g)", 7.453],
	VLT30A: ["Xíu mại thịt ghẹ 300g", 10.36],
	"VMG00000100.00": ["Há cảo mini tôm thịt 17g (1kg/gói)", 10.86],
	"VMG00000100.0A": ["Há cảo mini tôm thịt 17g (1kg/gói) (THAY NHÃN CẬP NHẬT DINH ", 10.86],
	"VMG00000200.00": ["Há cảo mini tôm thịt 17g (2kg/gói)", 10.69],
	"VMG00000200.0A": ["Há cảo mini tôm thịt 17g (2kg/gói) (THAY ĐỔI NHÃN CẬP NHẬT D", 10.69],
	"VMG00000300.00": ["HÁ CẢO SÒ ĐIỆP 25G 1KG/GÓI", 10.86],
	"VMG00000300.0A": ["Há cảo sò điệp 23 g (1kg/gói) (THAY ĐỔI NHÃN CẬP NHẬT DINH D", 10.86],
	"VMG00000400.00": ["HÁ CẢO SÒ ĐIỆP 25G 2KG/GÓI", 10.69],
	"VMG00000400.0A": ["Há cảo sò điệp 23 g (2kg/gói) (THAY ĐỔI NHÃN CẬP NHẬT DINH D", 10.69],
	"VMG00000500.00": ["Há cảo tôm thịt 25 g (1kg/gói)", 10.86],
	"VMG00000500.0A": ["Há cảo tôm thịt 25 g (1kg/gói) (THAY ĐỔI NHÃN CẬP NHẬT DINH ", 10.86],
	"VMG00000600.00": ["Há cảo tôm thịt 25 g (2kg/gói)", 10.709],
	"VMG00000600.0A": ["Há cảo tôm thịt 25 g (2kg/gói) (THAY ĐỔI NHÃN CẬP NHẬT DINH ", 10.709],
	"VMG00000700.00": ["Há cảo hải sản 25 g (1kg/gói)", 10.86],
	"VMG00000700.0A": ["Há cảo hải sản 25 g (1kg/gói) (THAY ĐỔI NHÃN CẬP NHẬT DINH D", 10.86],
	"VMN00000100.00": ["BÁNH BAO HÌNH BÍ RỢ 60 G (480 G/GÓI)", 6.752],
	"VMN00000200.00": ["BÁNH BAO NHÂN THỊT BÒ PHÔ MAI 100 G (600 G/GÓI)", 7.498],
	"VMN00000300.00": ["BÁNH MÌ MÈ HÀN QUỐC VỊ CHOCO 45 G (270 G/GÓI)", 3.574],
	"VMN00000400.0A": ["BÁNH MÌ MÈ HÀN QUỐC 45 G (270 G/ GÓI)", 3.014],
	"VMN00000400.00": ["BÁNH MÌ MÈ HÀN QUỐC 45 G (270 G/ GÓI)", 3.014],
	"VMN00000600.00": ["BÁNH KHOAI LANG TÍM PHÔ MAI 60 G ( 360 G/GÓI)", 5.118],
	"VMN00000700.00": ["BÁNH TIÊU NHÂN SẦU RIÊNG 60 G (480 G/ GÓI)", 5.61],
	"VMS00000100.C0": ["Chả giò tôm thịt 25 g (400g/gói)", 5.416],
	"VMS00000200.C0": ["Chả giò tôm mực 25 g (400g/gói)", 5.416],
	"VMS00000300.00": ["HÁ CẢO TÔM 25 G (322G/GÓI)", 4.34],
	"VMS00000300.0A": ["HÁ CẢO TÔM 25 G (172G/GÓI)", 5.078],
	"VMS00000300.AA": ["Há cảo tôm 25 g (172g/gói)", 5.078],
	"VMS00000400.AA": ["HÁ CẢO NHÂN SÒ ĐIỆP 25 G (172G/GÓI)", 5.078],
	"VMS00000500.A0": ["Chả giò hải sản 25 g (400g/gói)", 5.416],
	"VMS00000600.A0": ["Chả giò thịt 25 g (400g/gói)", 5.416],
	"VNFB000000DHP41.00": ["SANDWICH BUN 50GR/PC", 6.79],
	"VNFB000000DHP42.0D": ["BÁNH BAO SANDWICH 60G", 6.712],
	"VNFB000000DHP43.0B": ["HÁ CẢO TÔM 25G GF", 11.45],
	"VNFB000000DHP44.0B": ["SANDWICH BUN DỪA 40GR/PC.CODE: 100A.17", 5.456],
	"VNFB000000DHP45.0B": ["SANDWICH BUN THAN HOẠT TÍNH 40GR/PC", 5.45],
	"VNFB000000DHP53.0A": ["BÁNH BAO BURGER 60G", 6.6],
	"VNFB000000DHP62.0C": ["BÁNH BAO SANDWICH 30GR/PC", 4.165],
	"VNFB000000DHP74.00": ["BÁNH BAO BURGER 85G, VG", 9.44],
	"VNFB000000DHP89.00": ["BÁNH BAO SANDWICH 60G, VE", 8.59],
	"VNFB000000VNF86.00": ["BÁNH BAO SANDWICH 40G, VG", 2.963],
	"VNFB000000VNF87.00": ["BÁNH BAO BURGER THAN HOẠT TÍNH 45G, CẮT SẴN, VG", 6.092],
	"VNFB000000VNF88.00": ["BÁNH BAO BURGER 45G, CẮT SẴN, VG", 6.092],
	"VNFB00000DHP16A.0D": ["BÁNH BAO SANDWICH 40G", 5.452],
	"VNFB00000DHP16B.00": ["BÁNH BAO SANDWICH 40G, VG", 5.409],
	"VNFB00000DHP16B.0A": ["BÁNH BAO SANDWICH 40G, VE", 5.409],
	"VNFB00000DHP16C.00": ["BÁNH BAO SANDWICH 40G, VG", 4.474],
	"VNFB00000DHP16D.00": ["Bánh bao sandwich 40g", 5.094],
	"VNFB00000DHP16D.0A": ["BÁNH BAO SANDWICH 40G, VE, KB", 5.094],
	"VNFB00000DHP16E.00": ["BÁNH BAO SANDWICH 40G, VG", 8.819],
	"VNFB00000DHP16E.0A": ["BÁNH BAO SANDWICH 40G, VE", 8.759],
	"VNFB00000DHP16F.00": ["BÁNH BAO SANDWICH 40G, VE", 5.475],
	"VNFB00000DHP16G.00": ["BÁNH BAO SANDWICH 40G, VE", 5.438],
	"VNFB00000DHP45A.00": ["BÁNH BAO SANDWICH THAN HOẠT TÍNH 40G, VE", 5.494],
	"VNFB00000DHP62A.00": ["BÁNH BAO SANDWICH 30G", 4.508],
	"VNFB00000DHP62A.0A": ["BÁNH BAO SANDWICH 30G", 4.508],
	"VNFB00000DHP62B.00": ["BÁNH BAO SANDWICH 30G, VE", 4.146],
	"VNFB00000DHP89A.00": ["BÁNH BAO SANDWICH 60G, VE", 6.69],
	"VNFB00000VNF108.00": ["BÁNH BAO SANDWICH 40G, VE", 4.968],
	"VNFB00000VNF109.00": ["BÁNH BAO SANDWICH 40G, VE", 5.438],
	"VNFB00000VNF113.00": ["BÁNH BAO SANDWICH THAN TRE 60G, VE", 6.72],
	"VNFC00000VNF114.00": ["CHẢ GIÒ BỘT MÌ TÁO 25G VÀ CARAMEL SAUCE 50G, VE, NG \n1. CHẢ ", 9.205],
	"VNFC000000VNF68.00": ["CHẢ GIÒ BỘT MÌ CHAY 25G, VE", 6.788],
	"VNFC000000VNF68.0A": ["CHẢ GIÒ BỘT MÌ CHAY 25G, VE", 6.788],
	"VNFC000000VNF69.00": ["CHẢ GIÒ BỘT MÌ CHAY 50G, VE", 6.76],
	"VNFC000000VNF75.00": ["CHẢ GIÒ BỘT MÌ TÁO 25G, VE, NG", 9.796],
	"VNFC00000VNF100.00": ["CHẢ GIÒ BỘT MÌ TÁO 25G VÀ CARAMEL SAUCE 25G, VE, NG", 3.328],
	"VNFC00000VNF107.00": ["CHẢ GIÒ BỘT MÌ CHUỐI HƯƠNG QUẾ 25G VÀ SỐT CHOCOLATE SỮA 50G,", 9.544],
	"VNFCG00000DHP39.0B": ["CHẢ GIÒ BỘT MỲ CHAY 50GR/PC", 11.37],
	"VNFCG0000DHP12A.0A": ["CHẢ GIÒ BỘT MỲ TÔM PTO 25GR/PC", 6.23],
	"VNFCG0000DHP27A.0B": ["CHẢ GIÒ BỘT MỲ CHAY 25GR/PC", 9.34],
	"VNFCG0000DHP27C.00": ["CHẢ GIÒ BỘT MỲ CHAY KHÔNG CHIÊN 25G, VG, KB", 9.34],
	"VNFCG0000DHP39A.0A": ["CHẢ GIÒ BỘT MỲ CHAY KHÔNG CHIÊN 50G, VG", 11.37],
	"VNFCG0000VNF103.00": ["CHẢ GIÒ BỘT MỲ CHAY CHIÊN 25G, 1KG/BAG, VG", 5.755],
	"VNFCG0000VNF103.0A": ["CHẢ GIÒ BỘT MỲ CHAY CHIÊN 25G, 1KG/BAG, VG", 5.7],
	"VNFCG0000VNF104.00": ["CHẢ GIÒ BỘT MỲ CHAY CHIÊN 50G, 1KG/BAG, VE", 5.753],
	"VNFH000000DHP03.0D": ["HÁ CẢO TÔM 25GR/PC", 13.207],
	"VNFH000000DHP47.0E": ["HÁ CẢO SÒ ĐIỆP 25GR/PC", 11.57],
	"VNFH000000DHP48.0B": ["HÁ CẢO TÔM HẸ 25G GF", 11.457],
	"VNFH000000DHP59.0B": ["SỦI CẢO TÔM GỪNG GLUTEN FREE 30G CODE: 102C.17 - NHÃN, THÙNG", 10.365],
	"VNFH000000VNF63.00": ["HÁ CẢO SÒ ĐIỆP TÔM 25G", 6.63],
	"VNFH000000VNF64.0A": ["HÁ CẢO TÔM 25G, NG, KB", 6.663],
	"VNFH000000VNF66.0A": ["HÁ CẢO CHAY HÌNH BÁNH BAO 25G, VE, NG, KB", 6.663],
	"VNFH000000VNF77.00": ["HÁ CẢO TÔM 25G, GF", 6.69],
	"VNFH000000VNF79.00": ["HÁ CẢO CHAY HÌNH BÁNH BAO 25G, VE, GF", 6.69],
	"VNFH000000VNF81.00": ["HÁ CẢO TÔM HẸ 25G, GF", 2.939],
	"VNFH000000VNF83.00": ["HÁ CẢO TÔM 25G, GF", 2.939],
	"VNFH000000VNF84.00": ["HÁ CẢO CHAY HÌNH BÁNH BAO 25G, GF", 2.939],
	"VNFH000000VNF91.00": ["HÁ CẢO CHAY HÌNH BÁNH BAO 25G, VE, GF", 5.475],
	"VNFH000000VNF93.00": ["HÁ CẢO TÔM 25G, GF", 5.475],
	"VNFH000000VNF97.00": ["HÁ CẢO CHAY HÌNH BÁNH BAO 25G, VE", 5.475],
	"VNFH000000VNF98.00": ["HÁ CẢO TÔM 25G (CODE: 540A4.15)", 5.475],
	"VNFH00000DHP18A.0D": ["HÁ CẢO CHAY 25GR/PC", 11.332],
	"VNFH00000VNF106.00": ["HÁ CẢO TÔM GỪNG VỎ BỘT MÌ 25G (CÓ PHUN DL719)", 7.246],
	"VNFHC00000DHP29.0D": ["HÁ CẢO BÁNH BAO CHAY", 6.9],
	"VNFHC00000DHP60.0E": ["HÁ CẢO BÁNH BAO CHAY 25G GF", 6.92],
	"VNFHC0000DHP46A.0E": ["HÁ CẢO NẤM HƯƠNG 25G, GF", 11.235],
	"VNFS000000DHP05.0E": ["SỦI CẢO TÔM GỪNG 30G", 10],
	"VNFS000000DHP28.0B": ["SAMOSA CURRY CHAY 30G", 8.24],
	"VNFS000000VNF65.00": ["SỦI CẢO TÔM GỪNG 25G", 6.776],
	"VNFS000000VNF67.0A": ["SỦI CẢO NẤM CHAY 25G, VE, NG, KB", 6.736],
	"VNFS000000VNF78.00": ["SỦI CẢO TÔM GỪNG 25G, GF", 6.69],
	"VNFS000000VNF82.00": ["SỦI CẢO TÔM GỪNG 30G, GF", 2.989],
	"VNFS000000VNF85.00": ["SỦI CẢO NẤM CHAY 25G, VE", 2.939],
	"VNFS000000VNF90.00": ["SỦI CẢO TÔM GỪNG 30G, GF", 5.425],
	"VNFS000000VNF92.00": ["SỦI CẢO NẤM CHAY 25G, VE, GF", 5.475],
	"VNFS000000VNF95.00": ["HÁ CẢO TÔM HẸ 25G, GF", 5.475],
	"VNFS000000VNF96.00": ["SỦI CẢO TÔM GỪNG 30G (CODE: 102H.17)", 5.402],
	"VNFS000000VNF99.00": ["SỦI CẢO NẤM CHAY 25G, VE", 5.475],
	"VNFS00000VNF101.00": ["SỦI CẢO CHAY 25G, VE (CODE: 729G5.16. VEGAN, VỎ BỘT MÌ)", 6.555],
	"VNFS00000VNF105.00": ["SAMOSA CURRY CHAY CHIÊN 30G, 1KG/BAG, VG", 5.676],
	"VNFX00000DHP38A.0D": ["TÔM XÙ DỪA 25GR/PC", 7.41],
	"VNFX00000VNF102.00": ["TÔM XÙ DỪA CHIÊN 25G, 1KG/BAG", 5.755],
	"VP700000100.0B": ["Pizza nấm shiitake 20cm (215 g/gói)", 5.47],
	"VP700000200.0B": ["Pizza nấm bacon 20cm (215 g/gói)", 5.47],
	"VP700000300.0B": ["Pizza nấm burger bò xốt mayo 20cm (215 g/gói)", 5.47],
	"VSA00000200.00": ["ĐẾ PIZZA NƯỚNG 125 G, 22CM (4 KG/GÓI)", 5.066],
	"VSA00000200.0A": ["ĐẾ PIZZA NƯỚNG 125 G, 22CM (1 KG/GÓI)", 5.022],
	"VSA00000200.AA": ["ĐẾ PIZZA NƯỚNG 125 G, 22CM (1 KG/GÓI)", 5.022],
	"VSA00000300.0A": ["BẮP NƯỚNG (4 KG/GÓI)", 4.352],
	"VSA00000500.00": ["BÁNH PHÔ MAI DÂU 70 G (420 G/GÓI)", 7.875],
	"VSA00000600.0A": ["BÁNH MÌ VIỆT NAM 80 G (320 G/GÓI)", 3.444],
	"VSF00000100.0A": ["Cá trứng 300 g (Olala)", 13.563],
	"VSF00000200.0A": ["Cá trứng 500 g (Olala)", 16.706],
	"VSF00000200.0B": ["Cá trứng 500 g (Olala)", 14.224],
	"VSF00000700.0A": ["Cá trứng (Olala) - KM", 11.583],
	"VSF00000800.00": ["KHOAI TÂY LẮC ĐÔNG LẠNH (2.046 KG/GÓI)", 12.953],
	"VSF00000900.00": ["KHOAI TÂY CHOICE L RĂNG CƯA (1 KG/GÓI)", 10.825],
	"VSF00001000.00": ["KHOAI TÂY CHOICE L 7MM (1 KG/GÓI)", 10.825],
	"VSF00001100.00": ["KHOAI TÂY CHOICE L 10MM (1 KG/GÓI)", 10.825],
	"VSF00001200.00": ["BẮP NGỌT CHOICE L (500 G/GÓI)", 10.5],
	"VSF00001300.00": ["ĐẬU HÀ LAN CHOICE L (500 G/GÓI)", 10.5],
	"VSF00001400.00": ["ĐẬU NÀNH LÔNG CHOICE L (400 G/GÓI)", 8.5],
	"VSF00001600.00": ["RAU CỦ HỖN HỢP CHOICE L (500 G/GÓI)", 10.5],
	"VZS00001700.0A": ["Thịt xá xíu (550g)", 4.814],
	"VZS00001700.BD": ["Thịt xá xíu vụn ( 300 g)", 2.506],
	"VZS00001700.BE": ["Thịt xá xíu vụn ( 300 g)", 2.506],
	"VZS00001700.BF": ["Thịt xá xíu vụn ( 300 g)", 2.506],
	"VZS00004800.0A": ["Nước sốt rau muống (300g/gói)", 6.54],
	"VZS00005500.00": ["Sốt Katsudon 450g", 14.38],
	"VZS00007000.0B": ["Nước sốt hành lá 300 g", 6.54],
	"VZS00008100.0B": ["Sốt cari 1 kg", 5.42],
	"VZS00008200.00": ["Sốt thị nướng (Yakiniku 1kg) - công thức mới", 8.43],
	"VZS00008200.0A": ["Sốt thịt nướng Yakiniku (1kg/gói)", 12.67],
	"VZS00008200.0C": ["Sốt thịt nướng Yakiniku 1 kg", 12.67],
	"VZS00009200.00": ["Sủi cảo chay 25g (1kg/gói)", 8.616],
	"VZS00009400.00": ["Thịt xá xíu ( 550 g)", 3.693],
	"VZS00009400.0A": ["Thịt xá xíu ( 550 g)", 3.693],
	"VZS00009400.0B": ["Thịt xá xíu ( 550 g)", 3.693],
	VZSCT0046: ["Sốt cho thịt gà nướng 300g", 6.62],
	"JHID000000JHI20.00": ["SAMOSA TRỨNG CÁ PHOMAI 15G", 8.85]
};
var sample_rows_default = [
	{
		"code": "VGN00000900.AG",
		"from_box": 91,
		"to_box": 115,
		"box_count": 25,
		"gross": 9.78
	},
	{
		"code": "VCO00007200.0A",
		"from_box": 18,
		"to_box": 38,
		"box_count": 21,
		"gross": 10.2
	},
	{
		"code": "VFM00007900.0A",
		"from_box": 63,
		"to_box": 74,
		"box_count": 12,
		"gross": 8.38
	},
	{
		"code": "VHF00020000.0E",
		"from_box": 40,
		"to_box": 73,
		"box_count": 34,
		"gross": 2.25
	},
	{
		"code": "VFM00007900.0A",
		"from_box": 33,
		"to_box": 62,
		"box_count": 30,
		"gross": 8.25
	},
	{
		"code": "VCO00007200.0A",
		"from_box": 1,
		"to_box": 17,
		"box_count": 17,
		"gross": 10.2
	},
	{
		"code": "ETFC00011307400.BD",
		"from_box": 61,
		"to_box": 91,
		"box_count": 31,
		"gross": 13.45
	},
	{
		"code": "VGN00000900.AG",
		"from_box": 65,
		"to_box": 90,
		"box_count": 26,
		"gross": 9.74
	},
	{
		"code": "ATMC000000ARW05.0F",
		"from_box": 494,
		"to_box": 535,
		"box_count": 42,
		"gross": 2.19
	},
	{
		"code": "VGN00000100.0C",
		"from_box": 851,
		"to_box": 876,
		"box_count": 26,
		"gross": 8.23
	},
	{
		"code": "ATMC000000ARW05.0F",
		"from_box": 432,
		"to_box": 493,
		"box_count": 62,
		"gross": 2.23
	},
	{
		"code": "EEFC0000EEF7549.0B",
		"from_box": 2081,
		"to_box": 2140,
		"box_count": 60,
		"gross": 3.55
	},
	{
		"code": "VHF00007600.0T",
		"from_box": 153,
		"to_box": 153,
		"box_count": 1,
		"gross": 15.8
	},
	{
		"code": "VHF00007600.0T",
		"from_box": 136,
		"to_box": 152,
		"box_count": 17,
		"gross": 15.79
	},
	{
		"code": "VHF00038900.0I",
		"from_box": 166,
		"to_box": 180,
		"box_count": 15,
		"gross": 12.33
	},
	{
		"code": "VHF00026100.0C",
		"from_box": 1,
		"to_box": 77,
		"box_count": 77,
		"gross": 1.76
	},
	{
		"code": "VGN00000100.0C",
		"from_box": 823,
		"to_box": 850,
		"box_count": 28,
		"gross": 8.1
	},
	{
		"code": "EEFC0000EEF7549.0B",
		"from_box": 2051,
		"to_box": 2080,
		"box_count": 30,
		"gross": 3.49
	},
	{
		"code": "ATMC000000ARW05.0F",
		"from_box": 382,
		"to_box": 431,
		"box_count": 50,
		"gross": 2.23
	},
	{
		"code": "VHF00038900.0I",
		"from_box": 151,
		"to_box": 165,
		"box_count": 15,
		"gross": 12.33
	},
	{
		"code": "ETFK00011303600.AD",
		"from_box": 50,
		"to_box": 61,
		"box_count": 12,
		"gross": 12.6
	},
	{
		"code": "EEFC0000EEF7549.0B",
		"from_box": 2021,
		"to_box": 2050,
		"box_count": 30,
		"gross": 3.52
	},
	{
		"code": "VHF00007600.0T",
		"from_box": 121,
		"to_box": 135,
		"box_count": 15,
		"gross": 15.7
	},
	{
		"code": "VHF00038900.0I",
		"from_box": 136,
		"to_box": 150,
		"box_count": 15,
		"gross": 12.3
	},
	{
		"code": "VGN00000100.0C",
		"from_box": 801,
		"to_box": 822,
		"box_count": 22,
		"gross": 8.25
	},
	{
		"code": "EEFC0000EEF7549.0B",
		"from_box": 1961,
		"to_box": 2020,
		"box_count": 60,
		"gross": 3.51
	},
	{
		"code": "VCO00002400.0C",
		"from_box": 56,
		"to_box": 68,
		"box_count": 13,
		"gross": 10.3
	},
	{
		"code": "VHF00038900.0I",
		"from_box": 121,
		"to_box": 135,
		"box_count": 15,
		"gross": 12.17
	},
	{
		"code": "VGN00008900.0A",
		"from_box": 1,
		"to_box": 1,
		"box_count": 1,
		"gross": 11.47
	},
	{
		"code": "ATMC000000ARW05.0F",
		"from_box": 370,
		"to_box": 381,
		"box_count": 12,
		"gross": 2.24
	},
	{
		"code": "EEFC0000EEF7549.0B",
		"from_box": 1901,
		"to_box": 1960,
		"box_count": 60,
		"gross": 3.53
	},
	{
		"code": "VCO00002400.0C",
		"from_box": 36,
		"to_box": 55,
		"box_count": 20,
		"gross": 10.33
	},
	{
		"code": "VGN00002900.0D",
		"from_box": 80,
		"to_box": 105,
		"box_count": 26,
		"gross": 9.92
	},
	{
		"code": "VHF00007600.0T",
		"from_box": 106,
		"to_box": 120,
		"box_count": 15,
		"gross": 15.56
	},
	{
		"code": "VGN00000900.AG",
		"from_box": 116,
		"to_box": 130,
		"box_count": 15,
		"gross": 9.2
	},
	{
		"code": "VFM00007900.0A",
		"from_box": 100,
		"to_box": 110,
		"box_count": 11,
		"gross": 10.1
	},
	{
		"code": "VCO00007200.0A",
		"from_box": 50,
		"to_box": 60,
		"box_count": 11,
		"gross": 9.6
	}
];
function parseMaster(raw) {
	const out = {};
	if (!raw || typeof raw !== "object") return out;
	for (const [code, value] of Object.entries(raw)) {
		if (!Array.isArray(value)) continue;
		const kg = typeof value[1] === "number" ? value[1] : Number.parseFloat(String(value[1]));
		if (!Number.isFinite(kg) || kg <= 0) continue;
		out[code] = [String(value[0] ?? "").slice(0, 80), Math.round(kg * 1e3) / 1e3];
	}
	return out;
}
var embedded = parseMaster(plkl_master_default);
var current = embedded;
function getMaster() {
	return current;
}
function replaceMaster(next) {
	current = next;
}
function masterSize() {
	return Object.keys(current).length;
}
function embeddedSize() {
	return Object.keys(embedded).length;
}
function sampleRows() {
	if (!Array.isArray(sample_rows_default)) return [];
	return sample_rows_default;
}
var DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1YA0j-kh_m3mJMvxtDp2oHkgNpG9BsqPBnCPk_3Q413I/edit";
var RESOLUTION_OPTIONS = [
	{
		value: "Đã cô lập đoạn thùng lỗi & cân bù đủ chuẩn",
		label: "Cô lập và cân bù đủ chuẩn"
	},
	{
		value: "Đã kiểm tra đoạn thùng lệch: Đủ gói, đạt PLKL",
		label: "Đủ gói, đạt PLKL"
	},
	{
		value: "Đã kiểm tra đoạn thùng lệch: Đúng quy cách",
		label: "Sai số bao bì, đúng quy cách"
	},
	{
		value: "Đã xả đoạn thùng lỗi đóng gói lại",
		label: "Xả đoạn lỗi và đóng lại"
	},
	{
		value: "Đã báo R&D cập nhật định mức PLKL",
		label: "Báo R&D cập nhật PLKL"
	}
];
var KEY_SESSION = "gnfoods_web_session_v1";
var KEY_QA = "gnfoods_web_qa_v1";
var KEY_CONFIG = "gnfoods_web_config_v1";
function storage() {
	if (typeof window === "undefined") return null;
	try {
		return window.localStorage;
	} catch {
		return null;
	}
}
function defaultConfig() {
	return {
		sheetUrl: DEFAULT_SHEET_URL,
		sheetName: "plkl list",
		scriptUrl: "",
		upperTolPercent: 15,
		lowerTolPercent: 5
	};
}
function readConfig() {
	const base = defaultConfig();
	const raw = storage()?.getItem(KEY_CONFIG);
	if (!raw) return base;
	try {
		const parsed = JSON.parse(raw);
		return {
			sheetUrl: parsed.sheetUrl || base.sheetUrl,
			sheetName: parsed.sheetName || base.sheetName,
			scriptUrl: parsed.scriptUrl || "",
			upperTolPercent: typeof parsed.upperTolPercent === "number" && parsed.upperTolPercent > 0 ? parsed.upperTolPercent : base.upperTolPercent,
			lowerTolPercent: typeof parsed.lowerTolPercent === "number" && parsed.lowerTolPercent > 0 ? parsed.lowerTolPercent : base.lowerTolPercent
		};
	} catch {
		return base;
	}
}
function readSession() {
	const raw = storage()?.getItem(KEY_SESSION);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		if (!parsed || !Array.isArray(parsed.products) || parsed.products.length === 0) return null;
		return {
			fileName: parsed.fileName || "Dữ liệu đã lưu",
			products: parsed.products,
			trips: Array.isArray(parsed.trips) ? parsed.trips : []
		};
	} catch {
		return null;
	}
}
function readReports() {
	const raw = storage()?.getItem(KEY_QA);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
function writeLocal(session, reports, config) {
	const box = storage();
	if (!box) return;
	try {
		box.setItem(KEY_SESSION, JSON.stringify(session));
		box.setItem(KEY_QA, JSON.stringify(reports));
		box.setItem(KEY_CONFIG, JSON.stringify(config));
	} catch {}
}
var boot = auditProducts(sampleRows(), getMaster(), 5, 15);
function configOf(state) {
	return {
		sheetUrl: state.sheetUrl,
		sheetName: state.sheetName,
		scriptUrl: state.scriptUrl,
		upperTolPercent: state.upperTolPercent,
		lowerTolPercent: state.lowerTolPercent
	};
}
function persist(state) {
	writeLocal({
		fileName: state.fileName,
		products: state.products,
		trips: state.trips
	}, state.reports, configOf(state));
	if (!state.scriptUrl) return;
	const url = state.scriptUrl;
	fetch(url, {
		method: "POST",
		mode: "no-cors",
		headers: { "Content-Type": "text/plain;charset=utf-8" },
		body: JSON.stringify({
			action: "SAVE_STATE",
			currentFileName: state.fileName,
			processedRows: state.trips,
			productList: state.products,
			qaReports: state.reports,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString()
		})
	}).catch(() => void 0);
}
function applyAudit(rows, fileName, state, keepQc) {
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
			qcTime: old.qcTime
		};
	});
	const chartCode = products.some((product) => product.code === state.chartCode) ? state.chartCode : products[0]?.code ?? "";
	return {
		products,
		trips: audited.trips,
		fileName,
		chartCode
	};
}
var useQcStore = create((set, get) => ({
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
	syncing: false,
	hydrated: false,
	chartCode: boot.products[0]?.code ?? "",
	hydrate: async () => {
		const config = readConfig();
		const session = readSession();
		const reports = readReports();
		const base = {
			...get(),
			...config,
			reports
		};
		const next = session ? {
			...base,
			fileName: session.fileName,
			products: session.products,
			trips: session.trips,
			chartCode: session.products[0]?.code ?? "",
			hydrated: true
		} : {
			...base,
			hydrated: true
		};
		set(next);
		persist(next);
		if (config.scriptUrl) try {
			const response = await fetch(`${config.scriptUrl}?action=GET_STATE&t=${Date.now()}`);
			if (response.ok) {
				const cloud = await response.json();
				if (Array.isArray(cloud.productList) && cloud.productList.length > 0) {
					const merged = {
						...get(),
						fileName: cloud.currentFileName || get().fileName,
						products: cloud.productList,
						trips: Array.isArray(cloud.processedRows) ? cloud.processedRows : get().trips,
						reports: Array.isArray(cloud.qaReports) ? cloud.qaReports : get().reports,
						chartCode: cloud.productList[0]?.code ?? get().chartCode
					};
					set(merged);
					persist(merged);
					toast.success("Đã lấy ca mới nhất từ Google Sheets.");
				}
			}
		} catch {}
		get().syncSheet(true);
	},
	setRole: (role) => set({
		role,
		tab: role === "QA" ? "qa" : "detail"
	}),
	setTab: (tab) => set({ tab }),
	setFilter: (filter) => set({ filter }),
	setSearch: (search) => set({ search }),
	setQcName: (qcName) => set({ qcName }),
	setChartCode: (chartCode) => set({ chartCode }),
	patchProduct: (code, patch) => {
		const products = get().products.map((product) => product.code === code ? {
			...product,
			...patch
		} : product);
		const next = {
			...get(),
			products
		};
		set({ products });
		persist(next);
	},
	confirmPending: () => {
		const time = (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5);
		let count = 0;
		const products = get().products.map((product) => {
			if (product.isGreen || product.qcConfirmed) return product;
			count += 1;
			return {
				...product,
				qcConfirmed: true,
				qcTime: time
			};
		});
		if (!count) {
			toast("Không còn mã nào chờ xác nhận.");
			return;
		}
		const next = {
			...get(),
			products
		};
		set({ products });
		persist(next);
		toast.success(`Đã xác nhận ${count} mã lệch.`);
	},
	loadSample: () => {
		const nextAudit = applyAudit(sampleRows(), "Packing list mẫu", get(), false);
		const next = {
			...get(),
			...nextAudit,
			filter: "all",
			tab: "detail"
		};
		set(next);
		persist(next);
		toast.success(`Đã nạp ${next.products.length} mã mẫu.`);
	},
	clearShift: () => {
		const next = {
			...get(),
			products: [],
			trips: [],
			fileName: "Chưa nạp file",
			chartCode: ""
		};
		set(next);
		persist(next);
		toast("Đã xóa ca hiện tại. Báo cáo QA vẫn giữ.");
	},
	importPacking: async (file) => {
		try {
			const rows = await parsePackingList(file);
			if (!rows.length) {
				toast.error("Không đọc được dòng nào trong file.");
				return;
			}
			await get().syncSheet(true);
			const nextAudit = applyAudit(rows, file.name, get(), false);
			const next = {
				...get(),
				...nextAudit,
				filter: "all",
				tab: "detail",
				role: "QC"
			};
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
			const nextAudit = state.trips.length > 0 ? applyAudit(state.trips, state.fileName, state, true) : {
				products: state.products,
				trips: state.trips,
				fileName: state.fileName,
				chartCode: state.chartCode
			};
			const next = {
				...state,
				...nextAudit,
				sourceLabel: `File Excel · ${count.toLocaleString("vi-VN")} mã`
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
			const response = await fetch(csvUrl, {
				cache: "no-store",
				signal: AbortSignal.timeout(12e3)
			});
			if (!response.ok) throw new Error(String(response.status));
			const master = await masterFromSheetCsv(await response.text());
			const count = Object.keys(master).length;
			if (!count) throw new Error("empty");
			replaceMaster(master);
			const state = get();
			const nextAudit = state.trips.length > 0 ? applyAudit(state.trips, state.fileName, state, true) : {
				products: state.products,
				trips: state.trips,
				fileName: state.fileName,
				chartCode: state.chartCode
			};
			const clock = (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5);
			const next = {
				...state,
				...nextAudit,
				syncing: false,
				sourceLabel: `Live Sheet · ${count.toLocaleString("vi-VN")} mã · ${clock}`
			};
			set(next);
			persist(next);
			if (!silent) toast.success(`Đã cập nhật ${count.toLocaleString("vi-VN")} mã từ Sheet.`);
			return true;
		} catch {
			set({
				syncing: false,
				sourceLabel: `Bản đang dùng · ${masterSize().toLocaleString("vi-VN")} mã`
			});
			if (!silent) toast("Chưa tải được Sheet. Hãy mở quyền xem công khai, hoặc nạp file phụ lục.");
			return false;
		}
	},
	saveConfig: (config) => {
		const state = {
			...get(),
			...config
		};
		const nextAudit = state.trips.length > 0 ? applyAudit(state.trips, state.fileName, state, true) : {
			products: state.products,
			trips: state.trips,
			fileName: state.fileName,
			chartCode: state.chartCode
		};
		const next = {
			...state,
			...nextAudit
		};
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
			set({
				filter: "non-green",
				tab: "detail",
				role: "QC"
			});
			toast.error(`Còn ${pending.length} mã chưa xác nhận.`);
			return;
		}
		const now = /* @__PURE__ */ new Date();
		const report = {
			id: `RPT-${Date.now().toString().slice(-6)}`,
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
				failedSegmentsText: product.failedSegments.map((seg) => `Thùng ${seg.from_box}-${seg.to_box} (${seg.reason})`).join("; "),
				qcResolution: product.qcResolution,
				qcNote: product.qcNote,
				qcTime: product.qcTime
			}))
		};
		const next = {
			...state,
			reports: [report, ...state.reports],
			tab: "qa",
			role: "QA"
		};
		set(next);
		persist(next);
		toast.success("Đã gửi báo cáo cho QA.");
	},
	toggleApproval: (id) => {
		const reports = get().reports.map((report) => report.id === id ? {
			...report,
			qaStatus: report.qaStatus === "QA Đã Duyệt" ? "Chờ QA duyệt" : "QA Đã Duyệt"
		} : report);
		const next = {
			...get(),
			reports
		};
		set({ reports });
		persist(next);
	},
	removeReports: () => {
		const next = {
			...get(),
			reports: []
		};
		set({ reports: [] });
		persist(next);
		toast("Đã xóa lịch sử báo cáo trên máy này.");
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
	}
}));
var primaryBtn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-40";
var quietBtn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-border bg-card px-3 text-sm font-medium text-foreground transition-[transform,background-color] duration-150 hover:bg-secondary active:scale-[0.98] disabled:opacity-40";
var tone = {
	pass: "bg-ok-soft text-ok",
	critical: "bg-bad-soft text-bad",
	"warn-low": "bg-warn-soft text-warn",
	"warn-high": "bg-over-soft text-over",
	unknown: "bg-secondary text-muted-foreground"
};
var rail = {
	pass: "border-l-ok",
	critical: "border-l-bad",
	"warn-low": "border-l-warn",
	"warn-high": "border-l-over",
	unknown: "border-l-border"
};
function StatusPill({ status, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-flex rounded-sm px-2 py-1 text-xs font-medium ${tone[status]}`,
		children: label
	});
}
function matches(product, filter, search) {
	if (filter === "non-green" && product.isGreen) return false;
	if (filter !== "all" && filter !== "non-green" && product.status !== filter) return false;
	if (!search) return true;
	const q = search.toLowerCase();
	return product.code.toLowerCase().includes(q) || product.name.toLowerCase().includes(q);
}
function QcApp() {
	const store = useQcStore();
	const fileRef = (0, import_react.useRef)(null);
	const [mounted, setMounted] = (0, import_react.useState)(false);
	const [settingsOpen, setSettingsOpen] = (0, import_react.useState)(false);
	const [guideOpen, setGuideOpen] = (0, import_react.useState)(false);
	const [armClear, setArmClear] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setMounted(true);
		useQcStore.getState().hydrate();
	}, []);
	const counts = (0, import_react.useMemo)(() => {
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
			high: products.filter((product) => product.status === "warn-high").length
		};
	}, [store.products]);
	const visible = store.products.filter((product) => matches(product, store.filter, store.search.trim()));
	const filters = [
		{
			key: "all",
			label: "Tất cả",
			count: counts.codes
		},
		{
			key: "non-green",
			label: "Cần xác nhận",
			count: counts.nonGreen
		},
		{
			key: "critical",
			label: "Thiếu cân",
			count: counts.critical
		},
		{
			key: "warn-low",
			label: "Dưới sàn",
			count: counts.low
		},
		{
			key: "warn-high",
			label: "Vượt trần",
			count: counts.high
		},
		{
			key: "pass",
			label: "Đạt",
			count: counts.pass
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, { position: "bottom-center" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-20 border-b border-border bg-card",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-sm bg-primary text-xs font-semibold tracking-wide text-primary-foreground",
							children: "GN"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium tracking-wide text-muted-foreground",
								children: "GN FOODS"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-lg font-semibold leading-tight tracking-tight",
								children: "Kiểm soát khối lượng"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: store.sourceLabel
							})
						] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "inline-flex rounded-md bg-secondary p-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: `inline-flex min-h-10 items-center gap-2 rounded-sm px-3 text-sm font-medium ${store.role === "QC" ? "bg-card text-foreground" : "text-muted-foreground"}`,
									onClick: () => store.setRole("QC"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardCheck, {
										className: "size-4",
										"aria-hidden": true
									}), "QC"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: `inline-flex min-h-10 items-center gap-2 rounded-sm px-3 text-sm font-medium ${store.role === "QA" ? "bg-card text-foreground" : "text-muted-foreground"}`,
									onClick: () => store.setRole("QA"),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
											className: "size-4",
											"aria-hidden": true
										}),
										"QA",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "rounded-sm bg-secondary px-1.5 font-mono text-xs",
											children: store.reports.length
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: quietBtn,
								onClick: () => setGuideOpen(true),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {
									className: "size-4",
									"aria-hidden": true
								}), "Quy chuẩn"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: quietBtn,
								onClick: () => setSettingsOpen(true),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, {
									className: "size-4",
									"aria-hidden": true
								}), "Cài đặt"]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground",
						children: store.role === "QC" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							"Mỗi mã hàng một dòng. Mã đạt được gộp lại. Chỉ mã thiếu cân, lệch dưới −",
							store.lowerTolPercent,
							"% hoặc vượt +",
							store.upperTolPercent,
							"% so với trung bình mới hiện đoạn thùng để QC xác nhận."
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: "QA xem báo cáo QC đã chốt. Ký duyệt hoặc tải Excel. Báo cáo giữ lại khi QC nạp ca mới." })
					}),
					store.role === "QC" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: fileRef,
									type: "file",
									accept: ".xlsx,.xls,.csv",
									className: "hidden",
									onChange: (event) => {
										const file = event.target.files?.[0];
										if (file) store.importPacking(file);
										event.target.value = "";
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: primaryBtn,
									onClick: () => fileRef.current?.click(),
									onDragOver: (event) => event.preventDefault(),
									onDrop: (event) => {
										event.preventDefault();
										const file = event.dataTransfer.files?.[0];
										if (file) store.importPacking(file);
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, {
										className: "size-4",
										"aria-hidden": true
									}), "Nạp packing list"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: quietBtn,
									onClick: () => store.loadSample(),
									children: "Dữ liệu mẫu"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: quietBtn,
									onClick: () => store.clearShift(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
										className: "size-4",
										"aria-hidden": true
									}), "Xóa ca"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-sm text-muted-foreground",
									children: ["File ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium text-foreground",
										children: store.fileName
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "sr-only",
									htmlFor: "qc-name",
									children: "Tên QC"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "qc-name",
									value: store.qcName,
									onChange: (event) => store.setQcName(event.target.value),
									className: "h-11 w-40 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary",
									placeholder: "Tên QC"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: primaryBtn,
									onClick: () => store.submitToQa(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
										className: "size-4",
										"aria-hidden": true
									}), "Gửi QA"]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "grid grid-cols-2 gap-3 lg:grid-cols-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Mã trong ca",
								value: `${counts.codes}`,
								hint: `${counts.boxes.toLocaleString("vi-VN")} thùng · ${counts.trips} chuyến`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Thiếu cân",
								value: `${counts.critical}`,
								hint: `${counts.criticalSeg} đoạn thùng`,
								tone: "bad"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Cần QC xác nhận",
								value: `${counts.nonGreen}`,
								hint: `Đã xác nhận ${counts.confirmed}/${counts.nonGreen}`,
								tone: "warn"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: "Đạt chuẩn",
								value: `${counts.pass}`,
								hint: counts.codes ? `${(counts.pass / counts.codes * 100).toFixed(1)}% mã đạt` : "Chưa có ca",
								tone: "ok"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "overflow-hidden rounded-xl border border-border bg-card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-2 border-b border-border bg-secondary px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabButton, {
											active: store.tab === "detail",
											onClick: () => store.setTab("detail"),
											icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scale, { className: "size-4" }),
											children: "Từng mã hàng"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabButton, {
											active: store.tab === "qa",
											onClick: () => store.setTab("qa"),
											icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4" }),
											children: "Báo cáo QA"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabButton, {
											active: store.tab === "chart",
											onClick: () => store.setTab("chart"),
											icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { className: "size-4" }),
											children: "Biểu đồ"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: quietBtn,
									onClick: () => void store.downloadShift(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
										className: "size-4",
										"aria-hidden": true
									}), "Xuất Excel"]
								})]
							}),
							store.tab === "detail" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-3 p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-2",
										children: filters.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => store.setFilter(item.key),
											className: `min-h-10 rounded-sm px-3 text-sm font-medium ${store.filter === item.key ? "bg-primary text-primary-foreground" : "border border-border bg-background text-foreground"}`,
											children: [
												item.label,
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono",
													children: item.count
												})
											]
										}, item.key))
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: quietBtn,
											onClick: () => store.confirmPending(),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
												className: "size-4",
												"aria-hidden": true
											}), "Xác nhận mã lệch"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
												className: "pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground",
												"aria-hidden": true
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												value: store.search,
												onChange: (event) => store.setSearch(event.target.value),
												placeholder: "Tìm mã hoặc tên",
												className: "h-11 w-full rounded-sm border border-border bg-background pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary sm:w-56"
											})]
										})]
									})]
								}), visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "px-2 py-10 text-center text-sm text-muted-foreground",
									children: "Không có mã phù hợp. Nạp packing list hoặc đổi bộ lọc."
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-col gap-3 md:hidden",
									children: visible.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, { product }, product.code))
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "hidden overflow-x-auto md:block",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
										className: "w-full min-w-[960px] border-collapse text-left text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
											className: "text-xs font-medium tracking-wide text-muted-foreground uppercase",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
												className: "border-b border-border",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-2 py-2 font-medium",
														children: "Mã"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-2 py-2 font-medium",
														children: "Tên"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-2 py-2 text-right font-medium",
														children: "Thùng"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-2 py-2 text-right font-medium",
														children: "Gross TB"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-2 py-2 text-right font-medium",
														children: "PLKL"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-2 py-2 text-right font-medium",
														children: "Min–Max"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-2 py-2 font-medium",
														children: "Kết quả"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-2 py-2 font-medium",
														children: "Đoạn lệch"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "px-2 py-2 font-medium",
														children: "QC"
													})
												]
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: visible.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: `border-b border-border border-l-4 ${rail[product.status]} align-top`,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-2 py-3 font-mono text-xs font-medium",
													children: product.code
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "max-w-56 px-2 py-3",
													children: product.name
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "px-2 py-3 text-right font-mono",
													children: [product.totalBoxes, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "block text-xs text-muted-foreground",
														children: [product.tripCount, " chuyến"]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-2 py-3 text-right font-mono",
													children: kg(product.avg)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-2 py-3 text-right font-mono",
													children: product.plkl === null ? "—" : kg(product.plkl)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "px-2 py-3 text-right font-mono text-muted-foreground",
													children: [
														kg(product.min, 2),
														"–",
														kg(product.max, 2)
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-2 py-3",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, {
														status: product.status,
														label: product.statusLabel
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-2 py-3",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segments, { product })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "min-w-64 px-2 py-3",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QcCell, { product })
												})
											]
										}, product.code)) })]
									})
								})] })]
							}),
							store.tab === "qa" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-3 p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Báo cáo lưu trên trình duyệt này. Có thể đồng bộ nếu đã dán link Apps Script."
									}), store.reports.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: quietBtn,
										onClick: () => {
											if (!armClear) {
												setArmClear(true);
												return;
											}
											store.removeReports();
											setArmClear(false);
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
											className: "size-4",
											"aria-hidden": true
										}), armClear ? "Xác nhận xóa" : "Xóa lịch sử"]
									})]
								}), store.reports.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "px-2 py-10 text-center text-sm text-muted-foreground",
									children: "Chưa có báo cáo. QC chốt ca rồi bấm Gửi QA."
								}) : store.reports.map((report) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
									className: "rounded-lg border border-border p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-mono text-sm font-medium",
												children: report.id
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm text-muted-foreground",
												children: [
													report.timestamp,
													" · ",
													report.qcInspector,
													" · ",
													report.fileName
												]
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `inline-flex min-h-10 items-center rounded-sm px-3 text-sm font-medium ${report.qaStatus === "QA Đã Duyệt" ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"}`,
														children: report.qaStatus
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														className: quietBtn,
														onClick: () => store.toggleApproval(report.id),
														children: report.qaStatus === "QA Đã Duyệt" ? "Hủy duyệt" : "Ký duyệt"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
														type: "button",
														className: quietBtn,
														onClick: () => void store.downloadReport(report.id),
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
															className: "size-4",
															"aria-hidden": true
														}), "Excel"]
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "grid grid-cols-2 gap-2 py-3 text-sm sm:grid-cols-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Mã: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: report.totalProducts })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Đạt: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
													className: "text-ok",
													children: report.passProductsCount
												})] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Lệch: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
													className: "text-warn",
													children: report.failProductsCount
												})] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Thùng: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: report.totalBoxes.toLocaleString("vi-VN") })] })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "overflow-x-auto",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
												className: "w-full min-w-[720px] text-left text-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
													className: "text-xs text-muted-foreground",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
														className: "border-b border-border",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																className: "py-2 pr-2 font-medium",
																children: "Mã"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																className: "py-2 pr-2 font-medium",
																children: "Tên"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																className: "py-2 pr-2 text-right font-medium",
																children: "Thùng"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																className: "py-2 pr-2 text-right font-medium",
																children: "TB / PLKL"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																className: "py-2 pr-2 font-medium",
																children: "Kết quả"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																className: "py-2 font-medium",
																children: "Xử lý"
															})
														]
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: report.productsSummary.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
													className: "border-b border-border align-top",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-2 pr-2 font-mono text-xs",
															children: item.code
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-2 pr-2",
															children: item.name
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-2 pr-2 text-right font-mono",
															children: item.totalBoxes
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
															className: "py-2 pr-2 text-right font-mono",
															children: [
																kg(item.avg),
																" / ",
																kg(item.plkl)
															]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-2 pr-2",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, {
																status: item.status,
																label: item.statusLabel
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
															className: "py-2 text-sm",
															children: [item.isGreen ? "Đạt chuẩn" : `${item.qcResolution}${item.qcNote ? ` (${item.qcNote})` : ""}`, !item.isGreen && item.failedSegmentsText && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "mt-1 block text-xs text-muted-foreground",
																children: item.failedSegmentsText
															})]
														})
													]
												}, item.code)) })]
											})
										})
									]
								}, report.id))]
							}),
							store.tab === "chart" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartPanel, { mounted })
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsDialog, {
				open: settingsOpen,
				onOpenChange: setSettingsOpen
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GuideDialog, {
				open: guideOpen,
				onOpenChange: setGuideOpen
			})
		]
	});
}
function Stat({ label, value, hint, tone: kind }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-xl border border-border bg-card p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium tracking-wide text-muted-foreground uppercase",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: `mt-1 font-mono text-2xl font-medium tracking-tight ${kind === "ok" ? "text-ok" : kind === "warn" ? "text-warn" : kind === "bad" ? "text-bad" : "text-foreground"}`,
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: hint
			})
		]
	});
}
function TabButton({ active, onClick, icon, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: `inline-flex min-h-10 items-center gap-2 rounded-sm px-3 text-sm font-medium ${active ? "bg-card text-foreground" : "text-muted-foreground"}`,
		children: [icon, children]
	});
}
function Segments({ product }) {
	if (product.isGreen) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "text-sm text-muted-foreground",
		children: [
			"Cả ",
			product.tripCount,
			" chuyến đều đạt."
		]
	});
	if (product.status === "unknown") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted-foreground",
		children: "Chưa có định mức trong phụ lục."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "flex flex-col gap-1",
		children: product.failedSegments.map((seg) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: `rounded-sm px-2 py-1 font-mono text-xs ${seg.type === "critical" ? "bg-bad-soft text-bad" : seg.type === "warn-high" ? "bg-over-soft text-over" : "bg-warn-soft text-warn"}`,
			children: [
				"Thùng ",
				seg.from_box,
				"–",
				seg.to_box,
				" (",
				seg.box_count,
				"): ",
				seg.reason
			]
		}, `${seg.from_box}-${seg.to_box}-${seg.gross}`))
	});
}
function QcCell({ product }) {
	const patchProduct = useQcStore((state) => state.patchProduct);
	if (product.isGreen) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm font-medium text-ok",
		children: "Đạt, không cần xác nhận"
	});
	const time = (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: product.qcConfirmed ? quietBtn : primaryBtn,
				onClick: () => patchProduct(product.code, {
					qcConfirmed: !product.qcConfirmed,
					qcTime: product.qcConfirmed ? "" : time
				}),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
					className: "size-4",
					"aria-hidden": true
				}), product.qcConfirmed ? `Đã xác nhận ${product.qcTime}` : "Xác nhận"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				value: product.qcResolution,
				onChange: (event) => patchProduct(product.code, { qcResolution: event.target.value }),
				className: "h-11 rounded-sm border border-border bg-background px-2 text-sm",
				"aria-label": `Hướng xử lý ${product.code}`,
				children: RESOLUTION_OPTIONS.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: option.value,
					children: option.label
				}, option.value))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: product.qcNote,
				onChange: (event) => patchProduct(product.code, { qcNote: event.target.value }),
				placeholder: "Ghi chú đoạn thùng",
				className: "h-11 rounded-sm border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary",
				"aria-label": `Ghi chú ${product.code}`
			})
		]
	});
}
function ProductCard({ product }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: `rounded-lg border border-border border-l-4 bg-background p-3 ${rail[product.status]}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs font-medium",
					children: product.code
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium",
					children: product.name
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusPill, {
					status: product.status,
					label: product.statusLabel
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 font-mono text-sm text-muted-foreground",
				children: [
					product.totalBoxes,
					" thùng · TB ",
					kg(product.avg),
					" · PLKL ",
					product.plkl === null ? "—" : kg(product.plkl)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segments, { product })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QcCell, { product })
			})
		]
	});
}
function ChartPanel({ mounted }) {
	const products = useQcStore((state) => state.products);
	const trips = useQcStore((state) => state.trips);
	const chartCode = useQcStore((state) => state.chartCode);
	const setChartCode = useQcStore((state) => state.setChartCode);
	const lower = useQcStore((state) => state.lowerTolPercent);
	const upper = useQcStore((state) => state.upperTolPercent);
	const product = products.find((item) => item.code === chartCode) ?? products[0];
	const points = trips.filter((trip) => trip.code === product?.code).map((trip) => ({
		name: `${trip.from_box}–${trip.to_box}`,
		gross: trip.gross,
		plkl: product?.plkl,
		low: product ? Math.round(product.avg * (1 - lower / 100) * 1e3) / 1e3 : null,
		high: product ? Math.round(product.avg * (1 + upper / 100) * 1e3) / 1e3 : null,
		fill: trip.status === "critical" ? "var(--color-bad)" : trip.status === "warn-low" ? "var(--color-warn)" : trip.status === "warn-high" ? "var(--color-over)" : "var(--color-ok)"
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3 p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center gap-2 text-sm",
					children: ["Mã hàng", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: product?.code ?? "",
						onChange: (event) => setChartCode(event.target.value),
						className: "h-11 rounded-sm border border-border bg-background px-2 text-sm",
						children: products.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: item.code,
							children: item.code
						}, item.code))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground",
					children: "Cột là gross. Đường là PLKL, sàn và trần."
				})]
			}),
			!product || !mounted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-10 text-center text-sm text-muted-foreground",
				children: "Chưa có chuyến cân để vẽ."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-80 w-full",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComposedChart, {
						data: points,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-border)",
								vertical: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "name",
								tick: {
									fill: "var(--color-muted-foreground)",
									fontSize: 12
								}
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								tick: {
									fill: "var(--color-muted-foreground)",
									fontSize: 12
								},
								domain: ["auto", "auto"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
								background: "var(--color-card)",
								border: "1px solid var(--color-border)",
								borderRadius: 8,
								color: "var(--color-foreground)"
							} }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
								dataKey: "gross",
								name: "Gross",
								radius: [
									4,
									4,
									0,
									0
								],
								children: points.map((point, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: point.fill }, `${point.name}-${index}`))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								dataKey: "plkl",
								name: "PLKL",
								stroke: "var(--color-bad)",
								strokeDasharray: "4 4",
								dot: false,
								strokeWidth: 2
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								dataKey: "low",
								name: "Sàn",
								stroke: "var(--color-warn)",
								strokeDasharray: "2 2",
								dot: false
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								dataKey: "high",
								name: "Trần",
								stroke: "var(--color-over)",
								strokeDasharray: "2 2",
								dot: false
							})
						]
					})
				})
			}),
			product && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-center font-mono text-xs text-muted-foreground",
				children: [
					product.code,
					" · ",
					product.name,
					" · PLKL ",
					kg(product.plkl),
					" kg · TB ",
					kg(product.avg),
					" kg"
				]
			})
		]
	});
}
function SettingsDialog({ open, onOpenChange }) {
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
	const [draft, setDraft] = (0, import_react.useState)({
		sheetUrl,
		sheetName,
		scriptUrl,
		upperTolPercent: upper,
		lowerTolPercent: lower
	});
	(0, import_react.useEffect)(() => {
		if (open) setDraft({
			sheetUrl,
			sheetName,
			scriptUrl,
			upperTolPercent: upper,
			lowerTolPercent: lower
		});
	}, [
		open,
		sheetUrl,
		sheetName,
		scriptUrl,
		upper,
		lower
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-40 bg-foreground/30" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "fixed inset-x-4 top-1/2 z-50 mx-auto max-h-screen max-w-lg -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "text-lg font-semibold",
					children: "Nguồn định mức và dung sai"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
					className: "text-sm text-muted-foreground",
					children: sourceLabel
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
					className: quietBtn,
					"aria-label": "Đóng",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Link Google Sheet phụ lục",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: draft.sheetUrl,
							onChange: (event) => setDraft({
								...draft,
								sheetUrl: event.target.value
							}),
							className: "h-11 w-full rounded-sm border border-border bg-background px-3 text-sm"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Link Apps Script (tuỳ chọn, đồng bộ ca giữa các máy)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: draft.scriptUrl,
							onChange: (event) => setDraft({
								...draft,
								scriptUrl: event.target.value
							}),
							placeholder: "https://script.google.com/macros/s/.../exec",
							className: "h-11 w-full rounded-sm border border-border bg-background px-3 text-sm"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Tên sheet",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: draft.sheetName,
									onChange: (event) => setDraft({
										...draft,
										sheetName: event.target.value
									}),
									className: "h-11 w-full rounded-sm border border-border bg-background px-3 text-sm"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Sàn % dưới TB",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									min: 1,
									value: draft.lowerTolPercent,
									onChange: (event) => setDraft({
										...draft,
										lowerTolPercent: Number(event.target.value)
									}),
									className: "h-11 w-full rounded-sm border border-border bg-background px-3 text-sm"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Trần % trên TB",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									min: 1,
									value: draft.upperTolPercent,
									onChange: (event) => setDraft({
										...draft,
										upperTolPercent: Number(event.target.value)
									}),
									className: "h-11 w-full rounded-sm border border-border bg-background px-3 text-sm"
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Hoặc nạp file Excel phụ lục",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: ".xlsx,.xls",
							className: "text-sm",
							onChange: (event) => {
								const file = event.target.files?.[0];
								if (file) importMaster(file);
							}
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap justify-end gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: quietBtn,
							disabled: syncing,
							onClick: () => {
								saveConfig(draft);
								syncSheet(false);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
								className: "size-4",
								"aria-hidden": true
							}), syncing ? "Đang nạp" : "Đồng bộ Sheet"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: primaryBtn,
							onClick: () => {
								saveConfig(draft);
								onOpenChange(false);
							},
							children: "Lưu"
						})]
					})
				]
			})]
		})] })
	});
}
function GuideDialog({ open, onOpenChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-40 bg-foreground/30" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "fixed inset-x-4 top-1/2 z-50 mx-auto max-w-lg -translate-y-1/2 rounded-xl border border-border bg-card p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "text-lg font-semibold",
					children: "Quy chuẩn kiểm tra"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
					className: "sr-only",
					children: "Ba bước đối chiếu khối lượng theo mã hàng."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
					className: "mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Nạp packing list. Hệ thống gộp theo mã và lấy định mức PLKL." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Thiếu so với PLKL là không đạt. Lệch dưới sàn hoặc trên trần so với trung bình ca thì QC phải xác nhận." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Khi mọi mã lệch đã xác nhận, gửi báo cáo. QA ký duyệt hoặc tải Excel." })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 flex justify-end",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
						className: primaryBtn,
						children: "Đã hiểu"
					})
				})
			]
		})] })
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex flex-col gap-1 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground",
			children: label
		}), children]
	});
}
var SplitComponent = QcApp;
//#endregion
export { SplitComponent as component };
