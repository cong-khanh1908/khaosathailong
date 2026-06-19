// byt_hailong.js – Upload Engine Hailong-v13 tích hợp vào KSHL-MAIN
// Hỗ trợ 2 nguồn dữ liệu: File Excel (.xlsx) + Google Sheet trực tiếp
// Logic Playwright → Popup Browser (giữ nguyên 100% hailong-v13)
// ============================================================
// KIẾN TRÚC:
//   ExcelProvider      → đọc file .xlsx (SheetJS) → ExcelRow[]
//   GoogleSheetProvider→ đọc tab NOI_TRU / NGOAI_TRU → ExcelRow[]
//   MappingEngine      → NoiTruMapping / NgoaiTruMapping / ValueMapping
//   PlaywrightUploader → submit qua popup window (giữ nguyên hailong)
// ============================================================

'use strict';

// ═══════════════════════════════════════════════════════════
// 1. MAPPING DATA – Giữ nguyên 100% từ hailong-v13
// ═══════════════════════════════════════════════════════════

const HL_NOI_TRU_MAPPING = {
  surveyType: 'noi_tru',
  url: 'https://hailong.chatluongbenhvien.vn/nguoi-benh-noi-tru-v2',
  fields: [
    { excelColumn:'KIEU_KHAO_SAT',      selector:"select[name='submitted[kieu_khao_sat]']",                                    type:'select',     valueMap:'KIEU_KHAO_SAT', defaultValue:'1' },
    { excelColumn:'MA_SO _PHIEU',        selector:"input[name='submitted[ttp][masophieu]']",                                    type:'text' },
    { excelColumn:'TEN_BENH_VIEN',       selector:"select[name='submitted[ttp][bvn][1_ten_benh_vien]']",                       type:'select' },
    { excelColumn:'NGAY_DIEN_PHIEU',     selector:'submitted[ttp][bvn][ngay_dien_phieu]',                                      type:'date_excel' },
    { excelColumn:'NGUOI_PHONG_VAN',     selector:"select[name='submitted[ttp][mdt][nguoipv]']",                               type:'select',     valueMap:'NGUOI_PHONG_VAN' },
    { excelColumn:'NGUOI_TRA_LOI',       selector:"select[name='submitted[ttp][mdt][doituong]']",                              type:'select',     valueMap:'NGUOI_TRA_LOI' },
    { excelColumn:'TENKHOA_TRUOC_RAVIEN',selector:"select[name='submitted[ttp][kmk][khoa_phong]']",                            type:'select' },
    { excelColumn:'MA_KHOA',             selector:"input[name='submitted[ttp][kmk][ma_khoa]']",                                type:'text' },
    { excelColumn:'GIOI_TINH',           selector:'submitted[thong_tin_nguoi_dien_phieu][gioi_tuoi][gioi_tinh]',               type:'radio',      valueMap:'GIOI_TINH' },
    { excelColumn:'TUOI',                selector:"input[name='submitted[thong_tin_nguoi_dien_phieu][gioi_tuoi][tuoi]']",      type:'text',       fallbackColumn:'NAM_SINH' },
    { excelColumn:'SO_DIEN_THOAI',       selector:"input[name='submitted[thong_tin_nguoi_dien_phieu][dien_thoai___ngay__nam_vien][hca3]']", type:'text' },
    { excelColumn:'SO_NGAY_NAM_VIEN',    selector:"input[name='submitted[thong_tin_nguoi_dien_phieu][dien_thoai___ngay__nam_vien][thoigian]']", type:'text' },
    { excelColumn:'SU_DUNG_BHYT',        selector:'submitted[thong_tin_nguoi_dien_phieu][5]',                                  type:'radio',      valueMap:'SU_DUNG_BHYT' },
    { excelColumn:'NOI_SONG',            selector:'submitted[thong_tin_nguoi_dien_phieu][6]',                                  type:'radio',      valueMap:'NOI_SONG' },
    { excelColumn:'MUC_SONG',            selector:'submitted[thong_tin_nguoi_dien_phieu][7]',                                  type:'radio',      valueMap:'MUC_SONG' },
    { excelColumn:'LAN_DIEU_TRI',        selector:'submitted[thong_tin_nguoi_dien_phieu][8]',                                  type:'text_name',  selectorName:'submitted[thong_tin_nguoi_dien_phieu][8]' },
    { excelColumn:'A1',  selector:'submitted[danh_gia][a][a1]',  type:'radio_score' },
    { excelColumn:'A2',  selector:'submitted[danh_gia][a][a2]',  type:'radio_score' },
    { excelColumn:'A3',  selector:'submitted[danh_gia][a][a3]',  type:'radio_score' },
    { excelColumn:'A4',  selector:'submitted[danh_gia][a][a4]',  type:'radio_score' },
    { excelColumn:'A5',  selector:'submitted[danh_gia][a][a5]',  type:'radio_score' },
    { excelColumn:'B1',  selector:'submitted[danh_gia][b][b1]',  type:'radio_score' },
    { excelColumn:'B2',  selector:'submitted[danh_gia][b][b2]',  type:'radio_score' },
    { excelColumn:'B3',  selector:'submitted[danh_gia][b][b3]',  type:'radio_score' },
    { excelColumn:'B4',  selector:'submitted[danh_gia][b][b4]',  type:'radio_score' },
    { excelColumn:'B5',  selector:'submitted[danh_gia][b][b5]',  type:'radio_score' },
    { excelColumn:'B6',  selector:'submitted[danh_gia][b][b6]',  type:'radio_score' },
    { excelColumn:'B7',  selector:'submitted[danh_gia][b][b7]',  type:'radio_score' },
    { excelColumn:'C1',  selector:'submitted[danh_gia][c][c1]',  type:'radio_score' },
    { excelColumn:'C2',  selector:'submitted[danh_gia][c][c2]',  type:'radio_score' },
    { excelColumn:'C3',  selector:'submitted[danh_gia][c][c3]',  type:'radio_score' },
    { excelColumn:'C4',  selector:'submitted[danh_gia][c][c4]',  type:'radio_score' },
    { excelColumn:'C5',  selector:'submitted[danh_gia][c][c5]',  type:'radio_score' },
    { excelColumn:'C6',  selector:'submitted[danh_gia][c][c6]',  type:'radio_score' },
    { excelColumn:'C7',  selector:'submitted[danh_gia][c][c7]',  type:'radio_score' },
    { excelColumn:'C8',  selector:'submitted[danh_gia][c][c8]',  type:'radio_score' },
    { excelColumn:'C9',  selector:'submitted[danh_gia][c][c9]',  type:'radio_score' },
    { excelColumn:'C10', selector:'submitted[danh_gia][c][c10]', type:'radio_score' },
    { excelColumn:'C11', selector:'submitted[danh_gia][c][c11]', type:'radio_score' },
    { excelColumn:'D1',  selector:'submitted[danh_gia][d][d1]',  type:'radio_score' },
    { excelColumn:'D2',  selector:'submitted[danh_gia][d][d2]',  type:'radio_score' },
    { excelColumn:'D3',  selector:'submitted[danh_gia][d][d3]',  type:'radio_score' },
    { excelColumn:'D4',  selector:'submitted[danh_gia][d][d4]',  type:'radio_score' },
    { excelColumn:'D5',  selector:'submitted[danh_gia][d][d5]',  type:'radio_score' },
    { excelColumn:'D6',  selector:'submitted[danh_gia][d][d6]',  type:'radio_score' },
    { excelColumn:'D7',  selector:'submitted[danh_gia][d][d7]',  type:'radio_score' },
    { excelColumn:'E1',  selector:'submitted[danh_gia][e][e1]',  type:'radio_score' },
    { excelColumn:'E2',  selector:'submitted[danh_gia][e][e2]',  type:'radio_score' },
    { excelColumn:'E3',  selector:'submitted[danh_gia][e][e3]',  type:'radio_score' },
    { excelColumn:'E4',  selector:'submitted[danh_gia][e][e4]',  type:'radio_score' },
    { excelColumn:'E5',  selector:'submitted[danh_gia][e][e5]',  type:'radio_score' },
    { excelColumn:'E6',  selector:'submitted[danh_gia][e][e6]',  type:'radio_score' },
    { excelColumn:'E7',  selector:"submitted[danh_gia][e][z0][select]",               type:'radio_leading_digit' },
    { excelColumn:'E7.1',selector:"input[name='submitted[danh_gia][e][z0][other]']",  type:'text' },
    { excelColumn:'G1',  selector:"input[name='submitted[danh_gia][z1]']",            type:'text' },
    { excelColumn:'G2',  selector:'submitted[danh_gia][z2][select]',                  type:'radio_leading_digit' },
    { excelColumn:'G2.1',selector:"input[name='submitted[danh_gia][z2][other]']",     type:'text' },
    { excelColumn:'G3',  selector:"textarea[name='submitted[danh_gia][z3]']",         type:'text' },
    { excelColumn:'G4',  selector:"textarea[name='submitted[danh_gia][z4]']",         type:'text' },
  ]
};

const HL_NGOAI_TRU_MAPPING = {
  surveyType: 'ngoai_tru',
  url: 'https://hailong.chatluongbenhvien.vn/nguoi-benh-ngoai-tru-v2',
  fields: [
    { excelColumn:'KIEU_KHAO_SAT',      selector:"select[name='submitted[kieu_khao_sat]']",                               type:'select',    valueMap:'KIEU_KHAO_SAT', defaultValue:'1' },
    { excelColumn:'MA_SO _PHIEU',        selector:"input[name='submitted[ttp][masophieu]']",                               type:'text' },
    { excelColumn:'TEN_BENH_VIEN',       selector:"select[name='submitted[ttp][bvn][1_ten_benh_vien]']",                  type:'select' },
    { excelColumn:'NGAY_DIEN_PHIEU',     selector:'submitted[ttp][bvn][ngay_dien_phieu]',                                 type:'date_excel' },
    { excelColumn:'NGUOI_PHONG_VAN',     selector:"select[name='submitted[ttp][mdt][nguoipv]']",                          type:'select',    valueMap:'NGUOI_PHONG_VAN' },
    { excelColumn:'NGUOI_TRA_LOI',       selector:"select[name='submitted[ttp][mdt][doituong]']",                         type:'select',    valueMap:'NGUOI_TRA_LOI' },
    { excelColumn:'GIOI_TINH',           selector:'submitted[thong_tin_nguoi_dien_phieu][gioi_tuoi][gioi_tinh]',          type:'radio',     valueMap:'GIOI_TINH' },
    { excelColumn:'TUOI',                selector:"input[name='submitted[thong_tin_nguoi_dien_phieu][gioi_tuoi][tuoi]']", type:'text',      fallbackColumn:'NAM_SINH' },
    { excelColumn:'SO_DIEN_THOAI',       selector:"input[name='submitted[thong_tin_nguoi_dien_phieu][hca3]']",           type:'text' },
    { excelColumn:'KHOANG_CACH_DEN_BV',  selector:"input[name='submitted[thong_tin_nguoi_dien_phieu][khoangcach]']",     type:'text' },
    { excelColumn:'SU_DUNG_BHYT',        selector:'submitted[thong_tin_nguoi_dien_phieu][baohiem]',                       type:'radio_name',valueMap:'SU_DUNG_BHYT' },
    { excelColumn:'NOI_SONG',            selector:'submitted[thong_tin_nguoi_dien_phieu][6]',                             type:'radio',     valueMap:'NOI_SONG' },
    { excelColumn:'MUC_SONG',            selector:'submitted[thong_tin_nguoi_dien_phieu][7]',                             type:'radio',     valueMap:'MUC_SONG' },
    { excelColumn:'LAN_KHAM',            selector:"input[name='submitted[thong_tin_nguoi_dien_phieu][8]']",               type:'text' },
    { excelColumn:'A1',  selector:'submitted[danh_gia][a][a1]',  type:'radio_score' },
    { excelColumn:'A2',  selector:'submitted[danh_gia][a][a2]',  type:'radio_score' },
    { excelColumn:'A3',  selector:'submitted[danh_gia][a][a3]',  type:'radio_score' },
    { excelColumn:'A4',  selector:'submitted[danh_gia][a][a4]',  type:'radio_score' },
    { excelColumn:'A5',  selector:'submitted[danh_gia][a][a5]',  type:'radio_score' },
    { excelColumn:'B1',  selector:'submitted[danh_gia][b][b1]',  type:'radio_score' },
    { excelColumn:'B2',  selector:'submitted[danh_gia][b][b2]',  type:'radio_score' },
    { excelColumn:'B3',  selector:'submitted[danh_gia][b][b3]',  type:'radio_score' },
    { excelColumn:'B4',  selector:'submitted[danh_gia][b][b4]',  type:'radio_score' },
    { excelColumn:'B5',  selector:'submitted[danh_gia][b][b5]',  type:'radio_score' },
    { excelColumn:'B6',  selector:'submitted[danh_gia][b][b6]',  type:'radio_score' },
    { excelColumn:'B7',  selector:'submitted[danh_gia][b][b7]',  type:'radio_score' },
    { excelColumn:'B8',  selector:'submitted[danh_gia][b][b8]',  type:'radio_score' },
    { excelColumn:'B9',  selector:'submitted[danh_gia][b][b9]',  type:'radio_score' },
    { excelColumn:'B10', selector:'submitted[danh_gia][b][b10]', type:'radio_score' },
    { excelColumn:'C1',  selector:'submitted[danh_gia][c][c1]',  type:'radio_score' },
    { excelColumn:'C2',  selector:'submitted[danh_gia][c][c2]',  type:'radio_score' },
    { excelColumn:'C3',  selector:'submitted[danh_gia][c][c3]',  type:'radio_score' },
    { excelColumn:'C4',  selector:'submitted[danh_gia][c][c4]',  type:'radio_score' },
    { excelColumn:'C5',  selector:'submitted[danh_gia][c][c5]',  type:'radio_score' },
    { excelColumn:'C6',  selector:'submitted[danh_gia][c][c6]',  type:'radio_score' },
    { excelColumn:'C7',  selector:'submitted[danh_gia][c][c7]',  type:'radio_score' },
    { excelColumn:'C8',  selector:'submitted[danh_gia][c][c8]',  type:'radio_score' },
    { excelColumn:'D1',  selector:'submitted[danh_gia][d][d1]',  type:'radio_score' },
    { excelColumn:'D2',  selector:'submitted[danh_gia][d][d2]',  type:'radio_score' },
    { excelColumn:'D3',  selector:'submitted[danh_gia][d][d3]',  type:'radio_score' },
    { excelColumn:'D4',  selector:'submitted[danh_gia][d][d4]',  type:'radio_score' },
    { excelColumn:'E1',  selector:'submitted[danh_gia][e][e1]',  type:'radio_score' },
    { excelColumn:'E2',  selector:'submitted[danh_gia][e][e2]',  type:'radio_score' },
    { excelColumn:'E3',  selector:'submitted[danh_gia][e][e3]',  type:'radio_score' },
    { excelColumn:'E4',  selector:'submitted[danh_gia][e][e4]',  type:'radio_score' },
    { excelColumn:'E5',  selector:'submitted[danh_gia][e][z0][select]',              type:'radio_leading_digit' },
    { excelColumn:'E5.1',selector:"input[name='submitted[danh_gia][e][z0][other]']", type:'text' },
    { excelColumn:'G1',  selector:"input[name='submitted[danh_gia][z1]']",           type:'text' },
    { excelColumn:'G2',  selector:'submitted[danh_gia][z2][select]',                 type:'radio_leading_digit' },
    { excelColumn:'G2.1',selector:"input[name='submitted[danh_gia][z2][other]']",    type:'text' },
    { excelColumn:'G3',  selector:"textarea[name='submitted[danh_gia][z3]']",        type:'text' },
    { excelColumn:'G4',  selector:"textarea[name='submitted[danh_gia][z4]']",        type:'text' },
  ]
};

const HL_VALUE_MAPPING = {
  NGUOI_PHONG_VAN: {
    'a. Người bệnh tự điền (hoặc người nhà)':'1', 'a. Người bệnh tự điền':'1',
    'b. Nhân viên của bệnh viện':'2', 'c. Bộ Y tế hoặc Sở Y tế':'3',
    'd. Tổ chức độc lập':'4', 'e. Khác':'5'
  },
  NGUOI_TRA_LOI: {
    'a. Người bệnh':'1', 'b. Người nhà':'2', 'c. Khác':'3'
  },
  GIOI_TINH: {
    '1. Nam':'1','2. Nữ':'2','3. Khác':'3','Nam':'1','Nữ':'2','Khác':'3'
  },
  SU_DUNG_BHYT: {
    '1. Có':'1','2. Không':'2','Có':'1','Không':'2'
  },
  NOI_SONG: {
    '1. Thành thị':'1','2. Nông thôn':'2','3. Vùng sâu, xa khó khăn':'3',
    'Thành thị':'1','Nông thôn':'2','Vùng sâu, xa khó khăn':'3'
  },
  MUC_SONG: {
    '1. Khá/giàu':'1','2. Cận nghèo':'2','3. Khác':'3',
    'Khá/giàu':'1','Cận nghèo':'2','Khác':'3'
  },
  KIEU_KHAO_SAT: {
    '1. Bệnh viện tự đánh giá hàng tháng/quý':'1',
    'Bệnh viện tự đánh giá hàng tháng/quý':'1',
    '6. Hình thức khác':'6','Hình thức khác':'6'
  }
};

// Google Sheet tab names cho NOI_TRU / NGOAI_TRU
const HL_GS_TABS = {
  noi_tru:   'NOI_TRU',
  ngoai_tru: 'NGOAI_TRU'
};

// Header chuẩn của Google Sheet NOI_TRU
const HL_NOI_TRU_HEADERS = [
  'Timestamp','UploadStatus','UploadTime','UploadError',
  'MA_SO _PHIEU','TEN_BENH_VIEN','NGAY_DIEN_PHIEU','NGUOI_PHONG_VAN','NGUOI_TRA_LOI',
  'TENKHOA_TRUOC_RAVIEN','MA_KHOA','GIOI_TINH','TUOI','NAM_SINH','SO_DIEN_THOAI',
  'SO_NGAY_NAM_VIEN','SU_DUNG_BHYT','NOI_SONG','MUC_SONG','LAN_DIEU_TRI',
  'A1','A2','A3','A4','A5',
  'B1','B2','B3','B4','B5','B6','B7',
  'C1','C2','C3','C4','C5','C6','C7','C8','C9','C10','C11',
  'D1','D2','D3','D4','D5','D6','D7',
  'E1','E2','E3','E4','E5','E6','E7','E7.1',
  'G1','G2','G2.1','G3','G4'
];

// Header chuẩn của Google Sheet NGOAI_TRU
const HL_NGOAI_TRU_HEADERS = [
  'Timestamp','UploadStatus','UploadTime','UploadError',
  'MA_SO _PHIEU','TEN_BENH_VIEN','NGAY_DIEN_PHIEU','NGUOI_PHONG_VAN','NGUOI_TRA_LOI',
  'GIOI_TINH','TUOI','NAM_SINH','SO_DIEN_THOAI','KHOANG_CACH_DEN_BV',
  'SU_DUNG_BHYT','NOI_SONG','MUC_SONG','LAN_KHAM',
  'A1','A2','A3','A4','A5',
  'B1','B2','B3','B4','B5','B6','B7','B8','B9','B10',
  'C1','C2','C3','C4','C5','C6','C7','C8',
  'D1','D2','D3','D4',
  'E1','E2','E3','E4','E5','E5.1',
  'G1','G2','G2.1','G3','G4'
];

// ═══════════════════════════════════════════════════════════
// 2. EXCEL PROVIDER – Đọc file .xlsx (SheetJS giống hailong)
// ═══════════════════════════════════════════════════════════

/**
 * normalizeHeader – giống ExcelService.ts của hailong
 * "A1. Nội dung..." → "A1"
 * "E7.1 Khác" → "E7.1"
 */
function hlNormalizeHeader(raw) {
  const h = (raw || '').trim();
  const match = h.match(/^([A-Z]\d+(?:\.\d+)?)[.\s]/);
  if (match) return match[1];
  return h;
}

/**
 * Đọc file Excel (.xlsx) → ExcelRow[]
 * Dùng SheetJS (XLSX) – phải có <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js">
 */
async function hlReadExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false, raw: false });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('File Excel không có sheet nào');
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
        if (rawRows.length < 2) throw new Error('File Excel không có dữ liệu');

        // Normalize headers (giống ExcelService.ts hailong)
        const rawHeaders = rawRows[0].map(h => String(h ?? '').trim());
        const headers    = rawHeaders.map(hlNormalizeHeader);

        const rows = rawRows.slice(1)
          .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined))
          .map(rawRow => {
            const obj = {};
            headers.forEach((header, i) => {
              if (header) obj[header] = rawRow[i] ?? null;
            });
            return obj;
          });
        resolve({ rows, headers, totalRows: rows.length });
      } catch(err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Tự động nhận diện loại phiếu từ ExcelRow[]
 * Dựa vào header đặc trưng
 */
function hlDetectSurveyTypeFromHeaders(headers) {
  const hSet = new Set(headers);
  // Nội trú có TENKHOA_TRUOC_RAVIEN và SO_NGAY_NAM_VIEN
  if (hSet.has('TENKHOA_TRUOC_RAVIEN') || hSet.has('SO_NGAY_NAM_VIEN')) return 'noi_tru';
  // Ngoại trú có KHOANG_CACH_DEN_BV và LAN_KHAM
  if (hSet.has('KHOANG_CACH_DEN_BV')  || hSet.has('LAN_KHAM'))          return 'ngoai_tru';
  // Fallback: nếu có B10 → ngoại trú (nội trú chỉ đến B7)
  if (hSet.has('B10') && !hSet.has('C11')) return 'ngoai_tru';
  return 'noi_tru'; // default
}

// ═══════════════════════════════════════════════════════════
// 3. GOOGLE SHEET PROVIDER – Đọc tab NOI_TRU / NGOAI_TRU
// ═══════════════════════════════════════════════════════════

/**
 * Đọc dữ liệu từ một tab Google Sheet và chuyển về ExcelRow[]
 * Chỉ lấy các dòng có UploadStatus != 'Success' (hoặc rỗng)
 */
async function hlReadGoogleSheet(surveyType) {
  if (!gsReady()) throw new Error('Chưa cấu hình Google Sheets');
  const tabName = HL_GS_TABS[surveyType];
  if (!tabName) throw new Error('Loại phiếu không hợp lệ: ' + surveyType);

  // Đọc tất cả dữ liệu từ tab
  const raw = await gsReadRange(`${tabName}!A1:ZZ100000`);
  if (!raw || raw.length < 2) return { rows: [], rowIndices: [] };

  const headers   = raw[0].map(h => String(h ?? '').trim());
  const dataRows  = raw.slice(1);

  // Index các cột
  const colIndex  = {};
  headers.forEach((h, i) => { colIndex[h] = i; });

  const rows       = [];
  const rowIndices = []; // sheet row index (1-based, row 1 = header, row 2 = first data)

  dataRows.forEach((row, idx) => {
    const uploadStatus = (row[colIndex['UploadStatus']] || '').toString().trim();
    // Bỏ qua dòng đã upload thành công
    if (uploadStatus === 'Success') return;
    // Bỏ qua dòng trống hoàn toàn
    if (!row.some(cell => cell !== '' && cell !== null && cell !== undefined)) return;

    const obj = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = row[i] ?? null;
    });
    // Thêm index để cập nhật status sau
    obj['_rowIndex'] = idx + 2; // +2 vì header ở row 1, data từ row 2
    rows.push(obj);
    rowIndices.push(idx + 2);
  });

  return { rows, rowIndices, headers };
}

/**
 * Cập nhật UploadStatus của một dòng trong Google Sheet
 */
async function hlUpdateGSRowStatus(surveyType, rowIndex, status, errorMsg = '') {
  if (!gsReady()) return;
  const tabName = HL_GS_TABS[surveyType];
  // UploadStatus ở cột B (index 1), UploadTime ở C, UploadError ở D
  const now = new Date().toLocaleString('vi-VN');
  await gsWriteRange(`${tabName}!B${rowIndex}:D${rowIndex}`, [[status, status === 'Success' ? now : '', errorMsg]]);
}

/**
 * Tạo tab NOI_TRU / NGOAI_TRU trong Google Sheet nếu chưa có
 */
async function hlInitGSTabs() {
  if (!gsReady()) { toast('Chưa cấu hình Google Sheets', 'warning'); return; }
  hlAddLog('info', 'Đang tạo tab NOI_TRU và NGOAI_TRU...');
  try {
    await gsEnsureTab(HL_GS_TABS.noi_tru,   HL_NOI_TRU_HEADERS);
    await gsEnsureTab(HL_GS_TABS.ngoai_tru, HL_NGOAI_TRU_HEADERS);
    toast('✅ Đã tạo tab NOI_TRU và NGOAI_TRU', 'success');
    hlAddLog('ok', '✅ Tạo tab thành công: NOI_TRU, NGOAI_TRU');
  } catch(e) {
    toast('❌ Lỗi tạo tab: ' + e.message, 'error');
    hlAddLog('err', '❌ ' + e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// 4. MAPPING ENGINE – Giữ nguyên logic hailong-v13
// ═══════════════════════════════════════════════════════════

/**
 * Lấy value từ ExcelRow, áp dụng fallback và valueMap
 * Giữ nguyên logic của PlaywrightService.ts hailong
 */
function hlGetFieldValue(row, field) {
  let rawVal = row[field.excelColumn];

  // Fallback column (ví dụ TUOI → NAM_SINH)
  if ((rawVal === null || rawVal === undefined || rawVal === '') && field.fallbackColumn) {
    rawVal = row[field.fallbackColumn];
  }

  // Default value nếu không có cột
  if ((rawVal === null || rawVal === undefined || rawVal === '') && field.defaultValue !== undefined) {
    return String(field.defaultValue);
  }

  if (rawVal === null || rawVal === undefined || rawVal === '') return null;

  // ValueMap
  if (field.valueMap && HL_VALUE_MAPPING[field.valueMap]) {
    const map = HL_VALUE_MAPPING[field.valueMap];
    const strVal = String(rawVal).trim();
    if (map[strVal] !== undefined) return map[strVal];
  }

  return String(rawVal).trim();
}

/**
 * Chuyển serial date Excel thành { day, month, year }
 * Giống logic date_excel của hailong
 */
function hlParseExcelDate(rawVal) {
  let date = null;
  if (typeof rawVal === 'number') {
    // Serial date Excel (days since 1900-01-01)
    const d = new Date((rawVal - 25569) * 86400 * 1000);
    date = d;
  } else if (typeof rawVal === 'string' || rawVal instanceof Date) {
    date = new Date(rawVal);
  }
  if (!date || isNaN(date.getTime())) return null;
  return {
    day:   date.getDate().toString(),
    month: (date.getMonth() + 1).toString(),
    year:  date.getFullYear().toString()
  };
}

/**
 * Lấy leading digit từ text (ví dụ "3. Tương xứng..." → "3")
 */
function hlLeadingDigit(val) {
  if (!val) return '';
  const m = String(val).match(/^(\d+)/);
  return m ? m[1] : String(val);
}

// ═══════════════════════════════════════════════════════════
// 5. INJECT SCRIPT BUILDER – Giữ nguyên 100% logic hailong
// ═══════════════════════════════════════════════════════════

/**
 * Build inject script từ ExcelRow + Mapping
 * Script được eval() trong popup window của trang BYT
 */
function hlBuildInjectScript(row, mapping) {
  // Xây dựng danh sách fields đã được xử lý
  const fieldActions = [];
  let dateField = null;

  for (const field of mapping.fields) {
    const val = hlGetFieldValue(row, field);

    if (field.type === 'date_excel') {
      const parsed = hlParseExcelDate(val !== null ? (row[field.excelColumn] || row[field.fallbackColumn]) : null);
      dateField = { selector: field.selector, parsed };
      continue;
    }

    if (val === null || val === undefined) continue;

    fieldActions.push({ selector: field.selector, type: field.type, value: val });
  }

  // Serialize để nhúng vào script string
  const fieldsStr  = JSON.stringify(fieldActions);
  const dateStr    = JSON.stringify(dateField);

  return `(function(){
try {
  var buildId = (document.querySelector('input[name="form_build_id"]') || {}).value || '';
  if (!buildId) return { error: 'NO_BUILD_ID' };

  var fields  = ${fieldsStr};
  var dateFld = ${dateStr};
  var filled  = 0, missing = [], requiredEmpty = [];

  // ── HELPER FUNCTIONS ──
  function sVal(sel, val) {
    var e = document.querySelector(sel);
    if (e) { e.value = val; e.dispatchEvent(new Event('change', {bubbles:true})); return true; }
    return false;
  }
  function sRad(name, val) {
    var e = document.querySelector('input[type="radio"][name="' + name + '"][value="' + val + '"]');
    if (e) { e.checked = true; e.dispatchEvent(new Event('change', {bubbles:true})); return true; }
    return false;
  }
  function sRadFirst(name) {
    var e = document.querySelector('input[type="radio"][name="' + name + '"]');
    if (e && !document.querySelector('input[type="radio"][name="' + name + '"]:checked')) {
      e.checked = true; e.dispatchEvent(new Event('change', {bubbles:true})); return true;
    }
    return false;
  }
  function selectByText(sel, txt) {
    var e = document.querySelector(sel);
    if (!e) return false;
    var found = false;
    Array.from(e.options || []).forEach(function(opt) {
      if (!found && opt.text && opt.text.replace(/\\s+/g,' ').trim().indexOf(txt.replace(/\\s+/g,' ').trim()) >= 0) {
        e.value = opt.value; found = true;
      }
    });
    if (found) e.dispatchEvent(new Event('change', {bubbles:true}));
    return found;
  }

  // ════════════════════════════════════════
  // BƯỚC 1: ĐIỀN TẤT CẢ FIELDS TỪ MAPPING
  // ════════════════════════════════════════
  fields.forEach(function(f) {
    var t = f.type, sel = f.selector, val = String(f.value);
    var ok = false;

    if (t === 'text') {
      ok = sVal(sel, val);
      if (!ok) missing.push(sel + '=' + val);
      else filled++;

    } else if (t === 'text_name') {
      // text_name: input[name="selector"]
      ok = sVal('input[name="' + sel + '"]', val);
      if (!ok) ok = sVal('textarea[name="' + sel + '"]', val);
      if (!ok) missing.push(sel + '=' + val); else filled++;

    } else if (t === 'select') {
      var e = document.querySelector(sel);
      if (e && val) {
        // Thử exact match trước
        if (Array.from(e.options||[]).some(function(o){ return o.value===val; })) {
          e.value = val; e.dispatchEvent(new Event('change',{bubbles:true})); ok=true;
        }
        // Thử fuzzy text match (quan trọng cho tên bệnh viện)
        if (!ok) ok = selectByText(sel, val);
        if (ok) filled++; else missing.push(sel + '=' + val);
      }

    } else if (t === 'radio') {
      ok = sRad(sel, val);
      if (!ok) sRadFirst(sel);
      if (ok) filled++; else missing.push(sel + '=' + val);

    } else if (t === 'radio_name') {
      // radio với name= selector
      ok = sRad(sel, val);
      if (!ok) { sRadFirst(sel); }
      if (ok) filled++; else missing.push(sel + '=' + val);

    } else if (t === 'radio_score') {
      // score 0-5, selector là name của radio group
      ok = sRad(sel, val);
      if (ok) filled++; else missing.push(sel + '=' + val);

    } else if (t === 'radio_leading_digit') {
      // Lấy digit đầu của value
      var digit = val.match(/^(\\d+)/) ? val.match(/^(\\d+)/)[1] : val;
      ok = sRad(sel, digit);
      if (ok) filled++; else missing.push(sel + '=' + digit);
    }
  });

  // ════════════════════════════════════════
  // BƯỚC 2: ĐIỀN NGÀY THÁNG (date_excel)
  // ════════════════════════════════════════
  if (dateFld && dateFld.parsed) {
    var dp = dateFld.parsed, baseSel = dateFld.selector;
    // Thử selector dạng submitted[ttp][bvn][ngay_dien_phieu]
    var daySelectors = [
      'select[name="' + baseSel + '[day]"]',
      'select[name="submitted[ttp][bvn][ngay_dien_phieu][day]"]'
    ];
    var monthSelectors = [
      'select[name="' + baseSel + '[month]"]',
      'select[name="submitted[ttp][bvn][ngay_dien_phieu][month]"]'
    ];
    var yearSelectors = [
      'select[name="' + baseSel + '[year]"]',
      'select[name="submitted[ttp][bvn][ngay_dien_phieu][year]"]'
    ];
    daySelectors.forEach(function(s){ sVal(s, dp.day); });
    monthSelectors.forEach(function(s){ sVal(s, dp.month); });
    yearSelectors.forEach(function(s){ sVal(s, dp.year); });
  }

  // ════════════════════════════════════════
  // BƯỚC 3: CÁC FIELD REQUIRED MẶC ĐỊNH
  // (giữ nguyên logic hailong)
  // ════════════════════════════════════════

  // Đảm bảo kieu_khao_sat có giá trị
  var kks = document.querySelector('select[name="submitted[kieu_khao_sat]"]');
  if (kks && (!kks.value || kks.value === '')) {
    kks.value = '1'; kks.dispatchEvent(new Event('change', {bubbles:true}));
  }

  // guibyt
  sVal('select[name="submitted[guibyt]"]', '1');

  // M1/M2: nguoipv - nếu chưa điền thì chọn mặc định
  var npv = document.querySelector('select[name="submitted[ttp][mdt][nguoipv]"]');
  if (npv && !npv.value) { npv.value = '2'; npv.dispatchEvent(new Event('change',{bubbles:true})); }

  // M1/M2: doituong
  var dt = document.querySelector('select[name="submitted[ttp][mdt][doituong]"]');
  if (dt && !dt.value) { dt.value = '1'; dt.dispatchEvent(new Event('change',{bubbles:true})); }

  // M1: thong_tin[5],[6],[7] required
  ['submitted[thong_tin_nguoi_dien_phieu][5]',
   'submitted[thong_tin_nguoi_dien_phieu][6]',
   'submitted[thong_tin_nguoi_dien_phieu][7]'].forEach(function(name){
    if (!document.querySelector('input[type="radio"][name="' + name + '"]:checked')) sRadFirst(name);
  });

  // M1: text [8]
  var tf8 = document.querySelector('input[name="submitted[thong_tin_nguoi_dien_phieu][8]"]');
  if (tf8 && !tf8.value) tf8.value = 'Không';

  // M2: khoangcach
  var kc = document.querySelector('input[name="submitted[thong_tin_nguoi_dien_phieu][khoangcach]"]');
  if (kc && !kc.value) kc.value = '1';

  // ════════════════════════════════════════
  // BƯỚC 4: KIỂM TRA REQUIRED TRƯỚC KHI GỬI
  // ════════════════════════════════════════
  var radioGroups = {};
  document.querySelectorAll('select[required],input[required][type!="radio"],textarea[required]').forEach(function(el){
    if (!el.value || el.value === '') requiredEmpty.push(el.name || el.id || '?');
  });
  document.querySelectorAll('input[type="radio"][required]').forEach(function(el){
    radioGroups[el.name] = radioGroups[el.name] || [];
    radioGroups[el.name].push(el);
  });
  Object.keys(radioGroups).forEach(function(n){
    if (!radioGroups[n].some(function(el){ return el.checked; })) requiredEmpty.push('radio:' + n);
  });

  // ════════════════════════════════════════
  // BƯỚC 5: SUBMIT
  // ════════════════════════════════════════
  setTimeout(function(){
    var btn = document.querySelector(
      'input[name="op"][value="Gửi đi"],input[name="op"][value="Submit"],'+
      'input[type="submit"].webform-submit,input[type="submit"].btn-primary,'+
      'button[type="submit"]'
    );
    if (btn) btn.click();
    else console.warn('[KSHL-HL] Không tìm thấy nút Submit');
  }, 1200);

  return {
    ok: true,
    filled: filled,
    missing: missing.join(', '),
    requiredEmpty: requiredEmpty.length,
    requiredList: requiredEmpty.slice(0, 8).join(' | '),
    buildId: buildId.substring(0, 12)
  };
} catch(err) {
  return { error: err.message };
}
})()`;
}

// ═══════════════════════════════════════════════════════════
// 6. POPUP UPLOADER – Giữ nguyên 100% logic hailong Playwright
// ═══════════════════════════════════════════════════════════

const HL_BYT_BASE = 'https://hailong.chatluongbenhvien.vn';
const HL_LOAD_TIMEOUT_MS = 25000;

/**
 * Submit một ExcelRow lên trang BYT qua popup window
 * Giống submitBYTViaPopup trong hailong
 */
function hlSubmitViaPopup(row, mapping) {
  return new Promise((resolve) => {
    const pageUrl = mapping.url;
    const win = window.open(pageUrl, 'hl_submit_' + Date.now(), 'width=1100,height=800,left=50,top=40');
    if (!win) {
      resolve({ ok: false, msg: 'Popup bị chặn – hãy cho phép popup trong trình duyệt' });
      return;
    }

    const injectScript = hlBuildInjectScript(row, mapping);
    let attempts = 0, injected = false, submitted = false;
    const maxAttempts = Math.ceil(HL_LOAD_TIMEOUT_MS / 500);

    const iv = setInterval(() => {
      attempts++;
      try {
        if (win.closed) {
          clearInterval(iv);
          if (!submitted) resolve({ ok: false, msg: 'Cửa sổ bị đóng trước khi hoàn tất' });
          return;
        }

        let curUrl = '', ready = false;
        try { curUrl = win.location.href || ''; ready = win.document.readyState === 'complete'; }
        catch(xe) {
          // Cross-origin = đã submit và redirect thành công
          if (injected && !submitted) {
            clearInterval(iv); submitted = true;
            setTimeout(() => { try { win.close(); } catch(x){} }, 600);
            resolve({ ok: true, msg: '✅ Gửi thành công (cross-origin redirect)' });
          }
          return;
        }

        // Phát hiện trang login
        let isLoginPage = false;
        try {
          isLoginPage = curUrl.includes('/user/login') || curUrl.includes('/user?destination')
            || (ready && !!(win.document.querySelector('#edit-name[name="name"]')
                        || win.document.querySelector('input[name="pass"]')));
        } catch(le) {}

        if (ready && isLoginPage && !injected) {
          clearInterval(iv);
          try { win.close(); } catch(x) {}
          resolve({ ok: false, msg: 'CHƯA_ĐĂNG_NHẬP' });
          return;
        }

        // Kiểm tra webform đã load
        if (ready && !injected && !isLoginPage) {
          let hasWebform = false;
          try {
            hasWebform = !!(win.document.querySelector('form[id^="webform-client-form"]')
                        || win.document.querySelector('form.webform-client-form'));
          } catch(we) {}

          if (!hasWebform) return; // chờ thêm

          injected = true;
          hlAddLog('info', `📄 Webform sẵn sàng – bắt đầu điền...`);

          try {
            const result = win.eval(injectScript);

            if (result && result.error === 'NO_BUILD_ID') {
              clearInterval(iv); try { win.close(); } catch(x) {}
              resolve({ ok: false, msg: 'CHƯA_ĐĂNG_NHẬP – không lấy được form token' });
              return;
            }
            if (result && result.error) {
              hlAddLog('warn', '⚠️ Lỗi inject: ' + result.error);
            } else if (result && result.ok) {
              const reqInfo = result.requiredEmpty > 0
                ? ` | ⚠️ ${result.requiredEmpty} trường required còn trống: ${result.requiredList}` : '';
              hlAddLog('info',
                `✏️ Đã điền ${result.filled} fields` +
                (result.missing ? ` | Thiếu: ${result.missing}` : ' | Đủ tất cả') + reqInfo
              );
            }

            // Chờ submit và xác nhận
            let waitAtt = 0;
            const waitIv = setInterval(() => {
              waitAtt++;
              try {
                if (win.closed) {
                  clearInterval(waitIv); clearInterval(iv); submitted = true;
                  resolve({ ok: true, msg: '✅ Gửi thành công' });
                  return;
                }
                const newUrl = win.location.href || '';
                const body   = (win.document.body?.innerText || '').toLowerCase();
                const isOk =
                  body.includes('cảm ơn') || body.includes('cam on') ||
                  body.includes('thành công') || body.includes('thank') ||
                  newUrl.includes('confirmation') || newUrl.includes('complete') ||
                  (newUrl !== pageUrl && newUrl.length > 10 && win.document.readyState === 'complete');
                if (isOk) {
                  clearInterval(waitIv); clearInterval(iv); submitted = true;
                  setTimeout(() => { try { win.close(); } catch(x){} }, 1200);
                  resolve({ ok: true, msg: '✅ Gửi thành công – BYT xác nhận' });
                }
              } catch(ce) {
                clearInterval(waitIv); clearInterval(iv); submitted = true;
                setTimeout(() => { try { win.close(); } catch(x){} }, 600);
                resolve({ ok: true, msg: '✅ Gửi thành công (cross-origin confirm)' });
              }
              if (waitAtt > 30) {
                clearInterval(waitIv); clearInterval(iv); submitted = true;
                setTimeout(() => { try { win.close(); } catch(x){} }, 400);
                resolve({ ok: true, msg: 'Gửi xong – không nhận được xác nhận rõ ràng' });
              }
            }, 1000);

          } catch(domErr) {
            clearInterval(iv);
            try { win.close(); } catch(x) {}
            resolve({ ok: false, msg: 'CHƯA_ĐĂNG_NHẬP – không đọc được DOM: ' + domErr.message });
          }
        }

      } catch(outerErr) {
        if (injected && !submitted) {
          clearInterval(iv); submitted = true;
          setTimeout(() => { try { win.close(); } catch(x){} }, 400);
          resolve({ ok: true, msg: '✅ Gửi thành công (cross-origin outer)' });
        }
      }

      if (attempts > maxAttempts) {
        clearInterval(iv);
        if (!submitted) {
          try { win.close(); } catch(x) {}
          resolve({ ok: false, msg: `Timeout ${HL_LOAD_TIMEOUT_MS / 1000}s – trang BYT không phản hồi. Kiểm tra đăng nhập.` });
        }
      }
    }, 500);
  });
}

// ═══════════════════════════════════════════════════════════
// 7. STATE & LOG
// ═══════════════════════════════════════════════════════════

let hlUploadRunning = false;
let hlLog           = [];

function hlAddLog(type, msg) {
  const el = document.getElementById('hl-upload-log');
  if (!el) return;
  const ts  = new Date().toLocaleTimeString('vi-VN');
  const cls = type === 'ok' ? 'log-ok' : type === 'err' ? 'log-err' : type === 'warn' ? 'log-warn' : 'log-info';
  const pre = type === 'ok' ? '✅' : type === 'err' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
  el.innerHTML += `<div class="${cls}">[${ts}] ${pre} ${msg}</div>`;
  el.scrollTop = el.scrollHeight;
  hlLog.push({ ts, type, msg });
}

function hlClearLog() {
  const el = document.getElementById('hl-upload-log');
  if (el) el.innerHTML = '';
  hlLog = [];
}

function hlSetProgress(cur, total) {
  const el = document.getElementById('hl-progress-fill');
  if (el) el.style.width = total > 0 ? `${Math.round(cur / total * 100)}%` : '0%';
  const ct = document.getElementById('hl-progress-count');
  if (ct) ct.textContent = `${cur} / ${total}`;
}

// ═══════════════════════════════════════════════════════════
// 8. UPLOAD ENGINE CHÍNH – 2 NGUỒN DỮ LIỆU
// ═══════════════════════════════════════════════════════════

/**
 * Upload từ File Excel (.xlsx)
 */
async function hlUploadFromExcel(file) {
  if (!CFG.bytuser || !CFG.bytpass) {
    toast('⚠️ Chưa cấu hình tài khoản BYT. Vào Cấu hình → Tài khoản BYT.', 'warning');
    return;
  }
  if (hlUploadRunning) { toast('Đang chạy, vui lòng chờ...', 'info'); return; }

  const logCard = document.getElementById('hl-log-card');
  if (logCard) logCard.style.display = '';
  hlClearLog();
  hlUploadRunning = true;

  hlAddLog('info', '═══ BẮT ĐẦU UPLOAD TỪ FILE EXCEL ═══');
  hlAddLog('info', 'File: ' + file.name + ' | ' + Math.round(file.size / 1024) + 'KB');

  try {
    // Đọc file Excel
    hlAddLog('info', '📖 Đang đọc file Excel...');
    const { rows, headers, totalRows } = await hlReadExcelFile(file);
    hlAddLog('info', `Tổng: ${totalRows} dòng | Headers: ${headers.slice(0,8).join(', ')}...`);

    if (totalRows === 0) { hlAddLog('warn', 'File không có dữ liệu'); hlUploadRunning = false; return; }

    // Nhận diện loại phiếu
    const surveyType = hlDetectSurveyTypeFromHeaders(headers);
    const mapping    = surveyType === 'noi_tru' ? HL_NOI_TRU_MAPPING : HL_NGOAI_TRU_MAPPING;
    hlAddLog('info', `Loại phiếu: ${surveyType === 'noi_tru' ? '🏥 Nội Trú' : '🏃 Ngoại Trú'} (${totalRows} phiếu)`);

    let success = 0, fail = 0, needLogin = false;
    hlSetProgress(0, totalRows);

    for (let i = 0; i < rows.length; i++) {
      const row    = rows[i];
      const maSo   = row['MA_SO _PHIEU'] || row['MASOPHIEU'] || `Dòng ${i + 1}`;
      hlAddLog('info', `▶ [${i + 1}/${totalRows}] Phiếu: ${maSo}`);

      let result;
      try {
        result = await hlSubmitViaPopup(row, mapping);
      } catch(e) {
        result = { ok: false, msg: e.message };
      }

      if (result.ok) {
        success++;
        hlAddLog('ok', `✅ ${maSo} → ${result.msg}`);
      } else {
        fail++;
        hlAddLog('err', `❌ ${maSo} → ${result.msg}`);
        if (result.msg && result.msg.includes('CHƯA_ĐĂNG_NHẬP')) {
          needLogin = true;
          hlAddLog('warn', '⛔ Phiên BYT hết hạn – dừng hàng đợi. Nhấn "Đăng nhập BYT" rồi thử lại.');
          break;
        }
      }

      hlSetProgress(i + 1, totalRows);

      // Chờ giữa các phiếu (giống hailong)
      if (i < rows.length - 1 && !needLogin) {
        hlAddLog('info', '⏳ Chờ 3 giây...');
        await hlSleep(3000);
      }
    }

    hlAddLog('info', `═══ KẾT QUẢ: ✅ ${success} thành công | ❌ ${fail} thất bại ═══`);
    toast(`📤 Upload Excel: ${success} ✅ / ${fail} ❌`, success > 0 ? 'success' : 'error');

    if (gsReady()) {
      gsLogHistory('hl_upload_excel', `Upload từ Excel: ${success}/${totalRows} thành công`).catch(() => {});
    }

  } catch(err) {
    hlAddLog('err', '❌ Lỗi đọc file: ' + err.message);
    toast('❌ Lỗi: ' + err.message, 'error');
  }

  hlUploadRunning = false;
}

/**
 * Upload từ Google Sheet (tab NOI_TRU hoặc NGOAI_TRU)
 */
async function hlUploadFromGoogleSheet(surveyType) {
  if (!CFG.bytuser || !CFG.bytpass) {
    toast('⚠️ Chưa cấu hình tài khoản BYT. Vào Cấu hình → Tài khoản BYT.', 'warning');
    return;
  }
  if (!gsReady()) {
    toast('⚠️ Chưa cấu hình Google Sheets. Vào Cấu hình để thiết lập.', 'warning');
    return;
  }
  if (hlUploadRunning) { toast('Đang chạy, vui lòng chờ...', 'info'); return; }

  const logCard = document.getElementById('hl-log-card');
  if (logCard) logCard.style.display = '';
  hlClearLog();
  hlUploadRunning = true;

  const tabName = HL_GS_TABS[surveyType];
  const mapping = surveyType === 'noi_tru' ? HL_NOI_TRU_MAPPING : HL_NGOAI_TRU_MAPPING;
  const label   = surveyType === 'noi_tru' ? '🏥 Nội Trú' : '🏃 Ngoại Trú';

  hlAddLog('info', `═══ BẮT ĐẦU UPLOAD TỪ GOOGLE SHEET: ${tabName} ═══`);
  hlAddLog('info', `Thời gian: ${new Date().toLocaleString('vi-VN')}`);

  try {
    hlAddLog('info', `📊 Đang đọc dữ liệu từ sheet: ${tabName}...`);
    const { rows, rowIndices } = await hlReadGoogleSheet(surveyType);

    if (rows.length === 0) {
      hlAddLog('info', '✅ Không có phiếu nào cần upload (tất cả đã Success hoặc sheet rỗng)');
      toast('✅ Không có phiếu nào cần upload', 'info');
      hlUploadRunning = false;
      return;
    }

    hlAddLog('info', `Tìm thấy ${rows.length} phiếu ${label} chờ upload`);

    let success = 0, fail = 0, needLogin = false;
    hlSetProgress(0, rows.length);

    for (let i = 0; i < rows.length; i++) {
      const row    = rows[i];
      const rowIdx = rowIndices[i];
      const maSo   = row['MA_SO _PHIEU'] || `Dòng ${rowIdx}`;

      hlAddLog('info', `▶ [${i + 1}/${rows.length}] Phiếu: ${maSo} (Sheet row ${rowIdx})`);

      // Đánh dấu đang upload trong Sheet
      await hlUpdateGSRowStatus(surveyType, rowIdx, 'Uploading', '').catch(() => {});

      let result;
      try {
        result = await hlSubmitViaPopup(row, mapping);
      } catch(e) {
        result = { ok: false, msg: e.message };
      }

      if (result.ok) {
        success++;
        hlAddLog('ok', `✅ ${maSo} → ${result.msg}`);
        // Cập nhật trạng thái thành công lên Sheet
        await hlUpdateGSRowStatus(surveyType, rowIdx, 'Success', '').catch(() => {});
      } else {
        fail++;
        hlAddLog('err', `❌ ${maSo} → ${result.msg}`);
        await hlUpdateGSRowStatus(surveyType, rowIdx, 'Failed', result.msg).catch(() => {});

        if (result.msg && result.msg.includes('CHƯA_ĐĂNG_NHẬP')) {
          needLogin = true;
          hlAddLog('warn', '⛔ Phiên BYT hết hạn – dừng. Nhấn "Đăng nhập BYT" rồi thử lại.');
          break;
        }
      }

      hlSetProgress(i + 1, rows.length);

      if (i < rows.length - 1 && !needLogin) {
        hlAddLog('info', '⏳ Chờ 3 giây...');
        await hlSleep(3000);
      }
    }

    hlAddLog('info', `═══ KẾT QUẢ: ✅ ${success} thành công | ❌ ${fail} thất bại ═══`);

    if (needLogin) {
      toast('⚠️ Phiên BYT hết hạn! Nhấn "Đăng nhập BYT" rồi gửi lại.', 'warning');
      const lb = document.getElementById('btn-byt-login-now');
      if (lb) lb.style.display = '';
    } else {
      toast(`📤 Upload Sheet ${label}: ${success} ✅ / ${fail} ❌`, success > 0 ? 'success' : 'error');
    }

    if (gsReady()) {
      gsLogHistory('hl_upload_sheet', `Upload từ Sheet ${tabName}: ${success}/${rows.length} thành công`).catch(() => {});
    }

  } catch(err) {
    hlAddLog('err', '❌ Lỗi đọc Sheet: ' + err.message);
    toast('❌ Lỗi: ' + err.message, 'error');
  }

  hlUploadRunning = false;
}

function hlSleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════
// 9. ĐĂNG NHẬP BYT (tái sử dụng từ byt.js)
// ═══════════════════════════════════════════════════════════
// Dùng loginBYTNow() từ byt.js (đã có sẵn)

// ═══════════════════════════════════════════════════════════
// 10. RENDER UI – TRANG "GỬI PHIẾU HAILONG"
// ═══════════════════════════════════════════════════════════

function renderHailongPage() {
  const container = document.getElementById('page-hailong');
  if (!container) return;

  container.innerHTML = `
  <!-- Đăng nhập BYT -->
  <div class="card mb-14">
    <div class="card-header">
      <div class="card-title">🔐 Đăng nhập trang BYT (Hailong)</div>
      <div class="flex-gap">
        <button class="btn btn-outline btn-sm" onclick="checkBYTLoginStatus()">🔄 Kiểm tra</button>
        <button class="btn btn-accent btn-sm" id="btn-byt-login-now" onclick="loginBYTNow()">🔑 Đăng nhập BYT</button>
      </div>
    </div>
    <div class="card-body">
      <div class="byt-status-bar checking" id="byt-login-statusbar">
        <span class="byt-status-dot orange" id="byt-dot"></span>
        <span id="byt-login-msg">Nhấn "Kiểm tra" để xác minh trạng thái đăng nhập...</span>
      </div>
      <div class="warn-box" style="font-size:12px;margin-top:10px;">
        ⚠️ <b>Bắt buộc đăng nhập BYT trước</b> khi gửi phiếu. Tài khoản BYT cấu hình tại
        <a href="#" onclick="showPage('settings');return false" style="color:var(--primary)">Cấu hình → Tài khoản BYT</a>.
      </div>
    </div>
  </div>

  <!-- Cách 1: Upload từ file Excel -->
  <div class="card mb-14">
    <div class="card-header">
      <div class="card-title">📂 Cách 1 – Upload từ file Excel (.xlsx)</div>
      <span style="font-size:11px;color:var(--text3);font-weight:400;">Giống hailong-v13 gốc</span>
    </div>
    <div class="card-body">
      <div class="info-box mb-14" style="font-size:12px;">
        ℹ️ Chọn file Excel xuất từ Google Sheets (tab NOI_TRU hoặc NGOAI_TRU). Hệ thống tự nhận diện loại phiếu từ header.<br>
        File phải có các cột: <b>MA_SO _PHIEU, TEN_BENH_VIEN, NGAY_DIEN_PHIEU, GIOI_TINH, TUOI, A1–G4...</b>
      </div>
      <div class="form-group mb-14">
        <label class="form-label">Chọn file Excel</label>
        <input type="file" id="hl-excel-file" accept=".xlsx,.xls"
          class="form-input" style="padding:8px;"
          onchange="hlOnExcelSelected(this)"/>
        <div id="hl-excel-info" style="font-size:11px;color:var(--text3);margin-top:4px;"></div>
      </div>
      <button class="btn btn-primary" id="btn-hl-upload-excel" onclick="hlStartExcelUpload()" disabled>
        📤 Bắt đầu Upload từ Excel
      </button>
    </div>
  </div>

  <!-- Cách 2: Upload từ Google Sheet -->
  <div class="card mb-14">
    <div class="card-header">
      <div class="card-title">📊 Cách 2 – Upload từ Google Sheet trực tiếp</div>
      <span style="font-size:11px;color:var(--text3);font-weight:400;">Không cần xuất Excel</span>
    </div>
    <div class="card-body">
      <div class="info-box mb-14" style="font-size:12px;">
        ℹ️ Đọc trực tiếp từ tab <b>NOI_TRU</b> / <b>NGOAI_TRU</b> trên Google Sheets đã cấu hình.<br>
        Chỉ upload các dòng có <b>UploadStatus ≠ Success</b>. Sau khi upload, tự động cập nhật trạng thái.
      </div>
      <div class="form-group mb-14">
        <label class="form-label">Chọn loại phiếu cần upload</label>
        <div class="flex-gap" style="gap:10px;">
          <button class="btn btn-success" style="flex:1;" onclick="hlStartSheetUpload('noi_tru')">
            🏥 Upload Nội Trú (sheet NOI_TRU)
          </button>
          <button class="btn btn-accent" style="flex:1;" onclick="hlStartSheetUpload('ngoai_tru')">
            🏃 Upload Ngoại Trú (sheet NGOAI_TRU)
          </button>
        </div>
      </div>
      <div class="flex-gap" style="gap:8px;flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" onclick="hlInitGSTabs()">🏗️ Tạo tab NOI_TRU + NGOAI_TRU</button>
        <button class="btn btn-outline btn-sm" onclick="hlCheckGSTabStatus()">🔍 Kiểm tra tab Sheet</button>
      </div>
    </div>
  </div>

  <!-- Progress -->
  <div class="card mb-14" id="hl-progress-card" style="display:none">
    <div class="card-header">
      <div class="card-title">⏳ Tiến trình upload</div>
      <span id="hl-progress-count" style="font-size:12px;color:var(--text3);">0 / 0</span>
    </div>
    <div class="card-body">
      <div class="progress-bar" style="margin-bottom:8px;">
        <div class="progress-fill" id="hl-progress-fill" style="width:0%;transition:width .3s;"></div>
      </div>
      <div style="font-size:11px;color:var(--text3);">⚠️ KHÔNG đóng cửa sổ popup BYT khi đang upload!</div>
    </div>
  </div>

  <!-- Log -->
  <div class="card" id="hl-log-card" style="display:none">
    <div class="card-header">
      <div class="card-title">📜 Nhật ký upload</div>
      <button class="btn btn-outline btn-sm" onclick="hlClearLog();document.getElementById('hl-log-card').style.display='none'">🗑️ Xóa</button>
    </div>
    <div class="card-body">
      <div class="upload-log-box" id="hl-upload-log" style="min-height:150px;max-height:400px;overflow-y:auto;font-size:11.5px;font-family:monospace;background:#0d1117;color:#e6edf3;padding:10px;border-radius:6px;"></div>
    </div>
  </div>
  `;
}

// ── Event handlers UI ──

let hlSelectedFile = null;

function hlOnExcelSelected(input) {
  const file = input.files[0];
  if (!file) return;
  hlSelectedFile = file;
  const info = document.getElementById('hl-excel-info');
  if (info) info.textContent = `📄 ${file.name} | ${Math.round(file.size / 1024)} KB`;
  const btn = document.getElementById('btn-hl-upload-excel');
  if (btn) btn.disabled = false;
  toast(`✅ Đã chọn: ${file.name}`, 'success');
}

function hlStartExcelUpload() {
  if (!hlSelectedFile) { toast('Chưa chọn file Excel', 'warning'); return; }
  const card = document.getElementById('hl-progress-card');
  if (card) card.style.display = '';
  hlUploadFromExcel(hlSelectedFile);
}

function hlStartSheetUpload(surveyType) {
  const card = document.getElementById('hl-progress-card');
  if (card) card.style.display = '';
  hlUploadFromGoogleSheet(surveyType);
}

async function hlCheckGSTabStatus() {
  if (!gsReady()) { toast('Chưa cấu hình Google Sheets', 'warning'); return; }
  try {
    const tabs = await gsGetSheetsList();
    const hasNT  = tabs.includes(HL_GS_TABS.noi_tru);
    const hasNGT = tabs.includes(HL_GS_TABS.ngoai_tru);
    const msg = `Tab NOI_TRU: ${hasNT ? '✅' : '❌'} | Tab NGOAI_TRU: ${hasNGT ? '✅' : '❌'}`;
    toast(msg, (hasNT && hasNGT) ? 'success' : 'warning');
    if (!hasNT || !hasNGT) {
      toast('Nhấn "Tạo tab NOI_TRU + NGOAI_TRU" để khởi tạo', 'info');
    }
  } catch(e) {
    toast('❌ Lỗi kiểm tra: ' + e.message, 'error');
  }
}

// Init khi page load
function initHailongModule() {
  // Render page nếu chưa có content
  const container = document.getElementById('page-hailong');
  if (container && !container.innerHTML.trim()) renderHailongPage();
}
