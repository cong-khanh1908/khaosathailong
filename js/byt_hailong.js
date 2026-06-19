// byt_hailong.js – Upload Engine Hailong-v13 tích hợp vào KSHL-MAIN v4
// Hỗ trợ 2 nguồn: File Excel (.xlsx) + Google Sheet (tab NOI_TRU / NGOAI_TRU)
// Kiến trúc: Popup window + win.eval() injection (giống byt.js gốc đang hoạt động)
// ============================================================
'use strict';

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

// ═══════════════════════════════════════════════════════════
// 2. EXCEL PROVIDER – Đọc file .xlsx (SheetJS – giống hailong ExcelService.ts)
// ═══════════════════════════════════════════════════════════

/** normalizeHeader – port 100% từ ExcelService.ts hailong */
function hlNormalizeHeader(raw) {
  const h = (raw || '').trim();
  const match = h.match(/^([A-Z]\d+(?:\.\d+)?)[.\s]/);
  if (match) return match[1];
  return h;
}

/** Đọc file Excel → ExcelRow[] dùng SheetJS */
async function hlReadExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (typeof XLSX === 'undefined') throw new Error('SheetJS chưa load. Kiểm tra kết nối mạng và tải lại trang.');
        const data     = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false, raw: false });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('File Excel không có sheet nào');
        const sheet   = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
        if (rawRows.length < 2) throw new Error('File Excel không có dữ liệu (cần ít nhất 1 dòng header + 1 dòng data)');
        const headers = rawRows[0].map(h => hlNormalizeHeader(String(h ?? '').trim()));
        const rows = rawRows.slice(1)
          .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined))
          .map(rawRow => {
            const obj = {};
            headers.forEach((h, i) => { if (h) obj[h] = rawRow[i] ?? null; });
            return obj;
          });
        resolve({ rows, headers, totalRows: rows.length });
      } catch(err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsArrayBuffer(file);
  });
}

/** Tự nhận diện loại phiếu từ headers */
function hlDetectSurveyType(headers) {
  const h = new Set(headers);
  if (h.has('TENKHOA_TRUOC_RAVIEN') || h.has('SO_NGAY_NAM_VIEN') || h.has('LAN_DIEU_TRI')) return 'noi_tru';
  if (h.has('KHOANG_CACH_DEN_BV')  || h.has('LAN_KHAM'))                                   return 'ngoai_tru';
  if (h.has('B10') && !h.has('C11'))                                                         return 'ngoai_tru';
  return 'noi_tru';
}

// ═══════════════════════════════════════════════════════════
// 3. GOOGLE SHEET PROVIDER
// ═══════════════════════════════════════════════════════════

async function hlReadGoogleSheet(surveyType) {
  if (!gsReady()) throw new Error('Chưa cấu hình Google Sheets');
  const tabName = HL_GS_TABS[surveyType];
  const raw = await gsReadRange(`${tabName}!A1:ZZ100000`);
  if (!raw || raw.length < 2) return { rows: [], rowIndices: [] };
  const headers   = raw[0].map(h => String(h ?? '').trim());
  const colIndex  = {};
  headers.forEach((h, i) => { colIndex[h] = i; });
  const rows = [], rowIndices = [];
  raw.slice(1).forEach((row, idx) => {
    const status = (row[colIndex['UploadStatus']] || '').toString().trim();
    if (status === 'Success') return;
    if (!row.some(c => c !== '' && c !== null && c !== undefined)) return;
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = row[i] ?? null; });
    obj['_rowIndex'] = idx + 2;
    rows.push(obj);
    rowIndices.push(idx + 2);
  });
  return { rows, rowIndices, headers };
}

async function hlUpdateGSRowStatus(surveyType, rowIndex, status, errorMsg) {
  if (!gsReady()) return;
  const tabName = HL_GS_TABS[surveyType];
  const now = new Date().toLocaleString('vi-VN');
  await gsWriteRange(`${tabName}!B${rowIndex}:D${rowIndex}`, [[status, status === 'Success' ? now : '', errorMsg || '']]);
}

async function hlInitGSTabs() {
  if (!gsReady()) { toast('Chưa cấu hình Google Sheets', 'warning'); return; }
  hlAddLog('info', 'Đang tạo tab NOI_TRU và NGOAI_TRU...');
  try {
    await gsEnsureTab(HL_GS_TABS.noi_tru,   HL_NOI_TRU_HEADERS);
    await gsEnsureTab(HL_GS_TABS.ngoai_tru, HL_NGOAI_TRU_HEADERS);
    toast('✅ Đã tạo tab NOI_TRU và NGOAI_TRU', 'success');
    hlAddLog('ok', '✅ Tạo tab thành công: NOI_TRU, NGOAI_TRU');
  } catch(e) {
    toast('❌ Lỗi: ' + e.message, 'error');
    hlAddLog('err', '❌ ' + e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// 4. MAPPING ENGINE – Giữ nguyên 100% hailong
// ═══════════════════════════════════════════════════════════

/** parseExcelDate – port 100% từ PlaywrightService.ts hailong */
function hlParseExcelDate(rawVal) {
  if (rawVal === null || rawVal === undefined || rawVal === '') return null;
  const serial = parseFloat(String(rawVal));
  if (!isNaN(serial) && serial > 40000) {
    const d = new Date(new Date(1900, 0, 1).getTime() + (serial - 2) * 86400000);
    return { day: d.getDate().toString(), month: (d.getMonth()+1).toString(), year: d.getFullYear().toString() };
  }
  const s = String(rawVal).trim();
  const p1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (p1) return { day: parseInt(p1[1]).toString(), month: parseInt(p1[2]).toString(), year: p1[3] };
  const p2 = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (p2) return { day: parseInt(p2[3]).toString(), month: parseInt(p2[2]).toString(), year: p2[1] };
  return null;
}

/** Lấy giá trị field với fallback + valueMap – giống hailong fillSurvey() */
function hlGetFieldValue(row, field) {
  let val = row[field.excelColumn];
  const isEmpty = v => v === null || v === undefined || String(v).trim() === '';
  if (isEmpty(val) && field.fallbackColumn) val = row[field.fallbackColumn];
  if (isEmpty(val) && field.defaultValue !== undefined) return String(field.defaultValue);
  if (isEmpty(val)) return null;
  const strVal = String(val).trim();
  if (field.valueMap && HL_VALUE_MAPPING[field.valueMap]) {
    const mapped = HL_VALUE_MAPPING[field.valueMap][strVal];
    if (mapped !== undefined) return mapped;
  }
  return strVal;
}

// ═══════════════════════════════════════════════════════════
// 5. INJECT SCRIPT BUILDER
//    Tạo script JavaScript an toàn để eval() trong popup BYT
//    Port sát PlaywrightService.ts: điền theo từng field type
// ═══════════════════════════════════════════════════════════

function hlBuildInjectScript(row, mapping) {
  const actions = [];
  let dateInfo  = null;

  for (const field of mapping.fields) {
    const val = hlGetFieldValue(row, field);
    if (field.type === 'date_excel') {
      const raw = row[field.excelColumn] ?? (field.fallbackColumn ? row[field.fallbackColumn] : null);
      dateInfo = { selector: field.selector, parsed: hlParseExcelDate(raw) };
      continue;
    }
    if (val === null || val === undefined) continue;
    actions.push({ s: field.selector, t: field.type, v: val });
  }

  // Dùng JSON.stringify để đảm bảo an toàn với mọi ký tự đặc biệt
  const actionsJSON = JSON.stringify(actions);
  const dateJSON    = JSON.stringify(dateInfo);

  // Script này sẽ được eval() trong context của trang BYT (hailong.chatluongbenhvien.vn)
  // Không dùng template literal ở đây vì actionsJSON/dateJSON đã là string
  return '(function(){\n'
    + 'try {\n'
    + '  var buildId = (document.querySelector(\'input[name="form_build_id"]\') || {}).value || "";\n'
    + '  var actions = ' + actionsJSON + ';\n'
    + '  var dateFld = ' + dateJSON + ';\n'
    + '  var filled = 0, missing = [], reqEmpty = [];\n'

    // Helpers
    + '  function fire(el) { ["input","change"].forEach(function(e){ el.dispatchEvent(new Event(e,{bubbles:true})); }); }\n'
    + '  function sVal(sel,val) {\n'
    + '    var e=document.querySelector(sel); if(!e) return false;\n'
    + '    e.value=val; fire(e); return true;\n'
    + '  }\n'
    + '  function sRad(name,val) {\n'
    + '    var e=document.querySelector(\'input[type="radio"][name="\'+name+\'"][value="\'+val+\'"]\');\n'
    + '    if(!e) return false; e.checked=true; fire(e); return true;\n'
    + '  }\n'
    + '  function sRadFirst(name) {\n'
    + '    var e=document.querySelector(\'input[type="radio"][name="\'+name+\'"]\');\n'
    + '    if(e && !document.querySelector(\'input[type="radio"][name="\'+name+\'"]:checked\')){ e.checked=true; fire(e); return true; }\n'
    + '    return false;\n'
    + '  }\n'
    + '  function normStr(s) {\n'
    + '    return s.toLowerCase().replace(/^\\s*[\\d.]+\\s*-\\s*/,"").replace(/-/g," ").replace(/\\s+/g," ").trim();\n'
    + '  }\n'
    + '  function sSel(sel,val) {\n'
    + '    var e=document.querySelector(sel); if(!e||!val) return false;\n'
    + '    // Tầng 1: exact value\n'
    + '    if(Array.from(e.options||[]).some(function(o){return o.value===val;})){e.value=val;fire(e);return true;}\n'
    + '    // Tầng 2: exact text\n'
    + '    var o2=Array.from(e.options||[]).find(function(o){return o.text.trim()===val;});\n'
    + '    if(o2){e.value=o2.value;fire(e);return true;}\n'
    + '    // Tầng 3: fuzzy norm (bỏ mã số đứng đầu như "62310 - ")\n'
    + '    var t=normStr(val), found=false;\n'
    + '    Array.from(e.options||[]).forEach(function(o){\n'
    + '      if(found)return; var ot=normStr(o.text);\n'
    + '      if(ot.indexOf(t)>=0||t.indexOf(ot)>=0||o.value===val){e.value=o.value;found=true;}\n'
    + '    });\n'
    + '    if(found){fire(e);return true;}\n'
    + '    return false;\n'
    + '  }\n'

    // Bước 1: Điền tất cả fields theo type
    + '  actions.forEach(function(a){\n'
    + '    var t=a.t, sel=a.s, val=String(a.v), ok=false;\n'
    + '    if(t==="text"){ ok=sVal(sel,val); }\n'
    + '    else if(t==="text_name"){ ok=sVal(\'input[name="\'+sel+\'"]\',val)||sVal(\'textarea[name="\'+sel+\'"]\',val); }\n'
    + '    else if(t==="select"){ ok=sSel(sel,val); }\n'
    + '    else if(t==="radio"||t==="radio_name"){ ok=sRad(sel,val); if(!ok)sRadFirst(sel); }\n'
    + '    else if(t==="radio_score"){\n'
    + '      var n=parseInt(val,10); if(!isNaN(n)){ ok=sRad(sel,String(n)); }\n'
    + '    }\n'
    + '    else if(t==="radio_leading_digit"){\n'
    + '      var m=val.match(/^\\s*(\\d+)/); ok=sRad(sel,m?m[1]:"select_or_other");\n'
    + '    }\n'
    + '    if(ok) filled++; else missing.push(sel+"="+val);\n'
    + '  });\n'

    // Bước 2: Ngày tháng
    + '  if(dateFld&&dateFld.parsed){\n'
    + '    var dp=dateFld.parsed, bs=dateFld.selector;\n'
    + '    ["select[name=\\"submitted[ttp][bvn][ngay_dien_phieu][day]\\"]",\n'
    + '     "select[name=\\""+bs+"[day]\\"]"].forEach(function(s){sVal(s,dp.day);});\n'
    + '    ["select[name=\\"submitted[ttp][bvn][ngay_dien_phieu][month]\\"]",\n'
    + '     "select[name=\\""+bs+"[month]\\"]"].forEach(function(s){sVal(s,dp.month);});\n'
    + '    ["select[name=\\"submitted[ttp][bvn][ngay_dien_phieu][year]\\"]",\n'
    + '     "select[name=\\""+bs+"[year]\\"]"].forEach(function(s){sVal(s,dp.year);});\n'
    + '  }\n'

    // Bước 3: Required fields mặc định
    + '  var kks=document.querySelector(\'select[name="submitted[kieu_khao_sat]"]\');\n'
    + '  if(kks&&!kks.value){kks.value="1";fire(kks);}\n'
    + '  sVal(\'select[name="submitted[guibyt]"]\',"1");\n'
    + '  var npv=document.querySelector(\'select[name="submitted[ttp][mdt][nguoipv]"]\');\n'
    + '  if(npv&&!npv.value){npv.value="2";fire(npv);}\n'
    + '  var dtt=document.querySelector(\'select[name="submitted[ttp][mdt][doituong]"]\');\n'
    + '  if(dtt&&!dtt.value){dtt.value="1";fire(dtt);}\n'
    + '  ["submitted[thong_tin_nguoi_dien_phieu][5]","submitted[thong_tin_nguoi_dien_phieu][6]",\n'
    + '   "submitted[thong_tin_nguoi_dien_phieu][7]"].forEach(function(n){\n'
    + '    if(!document.querySelector(\'input[type="radio"][name="\'+n+\'"]:checked\'))sRadFirst(n);\n'
    + '  });\n'
    + '  var tf8=document.querySelector(\'input[name="submitted[thong_tin_nguoi_dien_phieu][8]"]\');\n'
    + '  if(tf8&&!tf8.value)tf8.value="Không";\n'
    + '  var kc=document.querySelector(\'input[name="submitted[thong_tin_nguoi_dien_phieu][khoangcach]"]\');\n'
    + '  if(kc&&!kc.value)kc.value="1";\n'

    // Bước 4: Kiểm tra required (giống hailong verifyBeforeSubmit)
    + '  var rg={};\n'
    + '  document.querySelectorAll("select[required],input[required][type!=\'radio\'],textarea[required]").forEach(function(el){\n'
    + '    if(!el.value||el.value==="")reqEmpty.push(el.name||"?");\n'
    + '  });\n'
    + '  document.querySelectorAll(\'input[type="radio"][required]\').forEach(function(el){\n'
    + '    rg[el.name]=rg[el.name]||[]; rg[el.name].push(el);\n'
    + '  });\n'
    + '  Object.keys(rg).forEach(function(n){\n'
    + '    if(!rg[n].some(function(e){return e.checked;}))reqEmpty.push("radio:"+n);\n'
    + '  });\n'

    // Bước 5: Submit sau 1.5s
    + '  setTimeout(function(){\n'
    + '    var sels=["input[name=\'op\'][value=\'Gửi đi\']","input[type=\'submit\'][value=\'Gửi đi\']",\n'
    + '              "input.webform-submit","input.form-submit","input[type=\'submit\'][value=\'Gửi\']",\n'
    + '              "input[type=\'submit\'][value=\'Gửi phiếu\']","input#edit-actions-submit",\n'
    + '              "input#edit-submit-1","input#edit-submit","button[type=\'submit\']","input[type=\'submit\']"];\n'
    + '    var clicked=false;\n'
    + '    for(var i=0;i<sels.length;i++){\n'
    + '      var b=document.querySelector(sels[i]);\n'
    + '      if(b&&b.offsetParent!==null&&!b.disabled){b.click();clicked=true;break;}\n'
    + '    }\n'
    + '    if(!clicked){\n'
    + '      var cands=[document.querySelector("input[type=\'submit\']"),\n'
    + '                 document.querySelector("button[type=\'submit\']"),\n'
    + '                 document.querySelector("#edit-actions-submit")].filter(Boolean);\n'
    + '      if(cands.length){cands[0].click();clicked=true;}\n'
    + '    }\n'
    + '    console.log("[KSHL-HL] Submit clicked="+clicked+" filled="+' + 'filled + " missing="+missing.length);\n'
    + '  },1500);\n'

    + '  return {ok:true,filled:filled,missing:missing.join("|").substring(0,200),\n'
    + '          reqEmpty:reqEmpty.length,reqList:reqEmpty.slice(0,5).join("|"),\n'
    + '          hasToken:!!buildId};\n'
    + '} catch(err){ return {error:err.message}; }\n'
    + '})()';
}

// ═══════════════════════════════════════════════════════════
// 6. POPUP UPLOADER
//    Cơ chế giống byt.js gốc (đang hoạt động tốt):
//    window.open → setInterval kiểm tra load → win.eval() inject
//    Khác biệt: dùng mapping của hailong thay vì answers[]
// ═══════════════════════════════════════════════════════════

const HL_LOAD_TIMEOUT_MS = 60000; // 60s vì trang BYT load chậm ~40s

function hlSubmitViaPopup(row, mapping) {
  return new Promise((resolve) => {
    const pageUrl      = mapping.url;
    const injectScript = hlBuildInjectScript(row, mapping);
    const winName      = 'hl_byt_' + Math.floor(Date.now() / 1000 % 100000);
    const win = window.open(pageUrl, winName, 'width=1100,height=820,left=50,top=30');
    if (!win) {
      resolve({ ok: false, msg: 'Popup bị chặn – cho phép popup và thử lại' });
      return;
    }

    let attempts = 0, injected = false, submitted = false;
    const maxAttempts = Math.ceil(HL_LOAD_TIMEOUT_MS / 500);

    const iv = setInterval(() => {
      attempts++;
      try {
        if (win.closed) {
          clearInterval(iv);
          if (!submitted) resolve({ ok: false, msg: 'Cửa sổ đóng trước khi hoàn tất' });
          return;
        }

        // Thử đọc URL và readyState – có thể throw khi cross-origin đang navigate
        let curUrl = '', ready = false;
        try {
          curUrl = win.location.href || '';
          ready  = win.document.readyState === 'complete';
        } catch(xe) {
          // Cross-origin SecurityError trong khi đang navigate → chờ
          if (injected && !submitted) {
            // Sau inject → cross-origin = đã submit và redirect
            clearInterval(iv); submitted = true;
            setTimeout(() => { try { win.close(); } catch(x){} }, 600);
            resolve({ ok: true, msg: '✅ Gửi thành công (redirect)' });
          }
          return;
        }

        // Bỏ qua about:blank
        if (!curUrl || curUrl === 'about:blank') return;

        // Phát hiện trang login
        let isLoginPage = false;
        try {
          isLoginPage = curUrl.includes('/user/login') || curUrl.includes('/user?destination')
            || (ready && !!(win.document.querySelector('#edit-name[name="name"]')
                        || win.document.querySelector('input[name="pass"]')));
        } catch(e) {}

        if (ready && isLoginPage && !injected) {
          clearInterval(iv); try { win.close(); } catch(x) {}
          resolve({ ok: false, msg: 'CHƯA_ĐĂNG_NHẬP' });
          return;
        }

        // Log tiến trình mỗi 5 giây
        if (!injected && attempts % 10 === 0) {
          hlAddLog('info', `⏳ Đang chờ form BYT load... ${Math.round(attempts*0.5)}s | ${curUrl.split('/').pop() || 'loading'}`);
        }

        // Kiểm tra webform sẵn sàng
        if (ready && !injected && !isLoginPage) {
          let hasForm = false;
          try {
            // Ưu tiên form_build_id – có trong MỌI Drupal webform khi đã render xong
            const buildIdEl = win.document.querySelector('input[name="form_build_id"]');
            hasForm = !!(buildIdEl && buildIdEl.value);
            if (!hasForm) {
              // Fallback: tìm form webform
              hasForm = !!(win.document.querySelector('form[id^="webform-client-form"]')
                       || win.document.querySelector('form.webform-client-form')
                       || win.document.querySelector('form[class*="webform"]'));
            }
          } catch(e) {}

          if (!hasForm) return;

          // Delay 500ms sau khi detect để Drupal AJAX hoàn tất render
          injected = true;
          hlAddLog('info', `📄 Form sẵn sàng (${Math.round(attempts*0.5)}s) – đang điền dữ liệu...`);

          setTimeout(() => {
            try {
              let result = null;

              // Thử eval() trực tiếp
              try {
                result = win.eval(injectScript);
              } catch(evalErr) {
                hlAddLog('warn', '⚠️ eval() lỗi: ' + evalErr.message + ' – thử script tag...');
                // Fallback: inject qua script tag
                try {
                  const sc = win.document.createElement('script');
                  sc.id = '__hl_inject';
                  sc.textContent = 'window.__hlResult=' + injectScript + ';';
                  win.document.body.appendChild(sc);
                  result = win.__hlResult || { ok: false, error: 'script-tag-no-result' };
                } catch(se) {
                  hlAddLog('err', '❌ Script inject thất bại: ' + se.message);
                  clearInterval(iv); try { win.close(); } catch(x){}
                  resolve({ ok: false, msg: 'INJECT_FAILED: ' + se.message });
                  return;
                }
              }

              if (!result) {
                hlAddLog('warn', '⚠️ Inject không trả về kết quả');
                clearInterval(iv); try { win.close(); } catch(x){}
                resolve({ ok: false, msg: 'INJECT_NO_RESULT' });
                return;
              }

              if (result.error === 'NO_BUILD_ID') {
                // form_build_id chưa có → form chưa render xong → retry sau 2s
                hlAddLog('warn', '⚠️ form_build_id chưa có, thử lại sau 2s...');
                injected = false; // reset để interval tiếp tục chờ
                setTimeout(() => { injected = false; }, 100);
                return;
              }

              if (result.error) {
                hlAddLog('err', '❌ Lỗi inject: ' + result.error);
                clearInterval(iv); try { win.close(); } catch(x){}
                resolve({ ok: false, msg: 'INJECT_ERROR: ' + result.error });
                return;
              }

              // Inject thành công
              const reqInfo = result.reqEmpty > 0 ? ` | ⚠️ ${result.reqEmpty} required trống: ${result.reqList}` : '';
              hlAddLog('info', `✏️ Điền ${result.filled} fields${result.missing ? ' | Thiếu: '+result.missing : ' | Đủ'}${reqInfo}`);

              // Chờ submit & xác nhận
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
                  const html   = win.document.body ? win.document.body.innerHTML : '';
                  // Giống hailong verifySuccess(): chuỗi đặc trưng trang xác nhận Drupal
                  const hasConf = html.includes('CHÚNG TÔI ĐÃ NHẬN ĐƯỢC ĐÁNH GIÁ TỪ BẠN')
                                || html.includes('chúng tôi đã nhận được đánh giá từ bạn')
                                || html.includes('CẢM ƠN BẠN! CHÚNG TÔI');
                  const isDoneUrl = /\/node\/\d+\/done(\?|$)/.test(newUrl);
                  // Submit button còn = form CHƯA submit thực sự
                  let submitStill = false;
                  try { submitStill = !!win.document.querySelector('input[name="op"][value="Gửi đi"]'); } catch(e){}
                  if ((hasConf || isDoneUrl) && !submitStill) {
                    clearInterval(waitIv); clearInterval(iv); submitted = true;
                    setTimeout(() => { try { win.close(); } catch(x){} }, 1500);
                    resolve({ ok: true, msg: '✅ Gửi thành công – BYT xác nhận' });
                  }
                } catch(ce) {
                  // Cross-origin sau submit = thành công
                  clearInterval(waitIv); clearInterval(iv); submitted = true;
                  setTimeout(() => { try { win.close(); } catch(x){} }, 600);
                  resolve({ ok: true, msg: '✅ Gửi thành công (xác nhận cross-origin)' });
                }
                if (waitAtt > 30) {
                  clearInterval(waitIv); clearInterval(iv); submitted = true;
                  setTimeout(() => { try { win.close(); } catch(x){} }, 400);
                  resolve({ ok: true, msg: 'Gửi xong (không nhận xác nhận rõ)' });
                }
              }, 1000);

            } catch(domErr) {
              clearInterval(iv); try { win.close(); } catch(x){}
              resolve({ ok: false, msg: 'DOM_ERR: ' + domErr.message });
            }
          }, 800); // delay 800ms sau detect để AJAX hoàn tất
        }

      } catch(outerErr) {
        if (injected && !submitted) {
          clearInterval(iv); submitted = true;
          setTimeout(() => { try { win.close(); } catch(x){} }, 400);
          resolve({ ok: true, msg: '✅ Gửi thành công (outer)' });
        }
      }

      if (attempts > maxAttempts && !submitted) {
        clearInterval(iv); try { win.close(); } catch(x){}
        resolve({ ok: false, msg: `Timeout ${HL_LOAD_TIMEOUT_MS/1000}s – trang BYT không phản hồi. Kiểm tra đăng nhập và thử lại.` });
      }
    }, 500);
  });
}

// ═══════════════════════════════════════════════════════════
// 7. STATE & LOGGING
// ═══════════════════════════════════════════════════════════

let hlUploadRunning = false;
let hlLog = [];

function hlAddLog(type, msg) {
  const el = document.getElementById('hl-upload-log');
  if (!el) return;
  const ts  = new Date().toLocaleTimeString('vi-VN');
  const cls = type==='ok'?'log-ok':type==='err'?'log-err':type==='warn'?'log-warn':'log-info';
  const ico = type==='ok'?'✅':type==='err'?'❌':type==='warn'?'⚠️':'ℹ️';
  el.innerHTML += `<div class="${cls}">[${ts}] ${ico} ${msg}</div>`;
  el.scrollTop = el.scrollHeight;
  hlLog.push({ ts, type, msg });
}
function hlClearLog() {
  const el = document.getElementById('hl-upload-log');
  if (el) el.innerHTML = '';
  hlLog = [];
}
function hlSetProgress(cur, total) {
  const fill = document.getElementById('hl-progress-fill');
  const count = document.getElementById('hl-progress-count');
  if (fill)  fill.style.width  = total > 0 ? `${Math.round(cur/total*100)}%` : '0%';
  if (count) count.textContent = `${cur} / ${total}`;
}
function hlSleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════
// 8. UPLOAD ENGINE CHÍNH
// ═══════════════════════════════════════════════════════════

async function hlUploadFromExcel(file) {
  if (!CFG.bytuser || !CFG.bytpass) {
    toast('⚠️ Chưa cấu hình tài khoản BYT. Vào Cấu hình → Tài khoản BYT.', 'warning'); return;
  }
  if (hlUploadRunning) { toast('Đang chạy, vui lòng chờ...', 'info'); return; }
  if (typeof XLSX === 'undefined') {
    toast('❌ SheetJS chưa load. Kiểm tra kết nối mạng và tải lại trang.', 'error'); return;
  }

  document.getElementById('hl-log-card').style.display = '';
  document.getElementById('hl-progress-card').style.display = '';
  hlClearLog(); hlUploadRunning = true;

  hlAddLog('info', '═══ BẮT ĐẦU UPLOAD TỪ FILE EXCEL ═══');
  hlAddLog('info', `File: ${file.name} | ${Math.round(file.size/1024)}KB`);
  hlAddLog('info', `BYT: ${CFG.bytuser} | BV: ${CFG.hvname||CFG.mabv||'?'}`);
  hlAddLog('info', '⚠️ KHÔNG đóng cửa sổ popup BYT khi đang upload!');

  try {
    hlAddLog('info', '📖 Đang đọc file Excel...');
    const { rows, headers, totalRows } = await hlReadExcelFile(file);
    hlAddLog('info', `✅ Đọc xong: ${totalRows} phiếu | Headers: ${headers.slice(0,5).join(', ')}...`);
    if (totalRows === 0) { hlAddLog('warn', 'File không có dữ liệu'); hlUploadRunning = false; return; }

    const surveyType = hlDetectSurveyType(headers);
    const mapping    = surveyType === 'noi_tru' ? HL_NOI_TRU_MAPPING : HL_NGOAI_TRU_MAPPING;
    hlAddLog('info', `Loại phiếu: ${surveyType === 'noi_tru' ? '🏥 Nội Trú' : '🏃 Ngoại Trú'} | URL: ${mapping.url}`);

    let success = 0, fail = 0, needLogin = false;
    hlSetProgress(0, totalRows);

    for (let i = 0; i < rows.length; i++) {
      const row  = rows[i];
      const maSo = row['MA_SO _PHIEU'] || row['MASOPHIEU'] || `Dòng ${i+1}`;
      hlAddLog('info', `▶ [${i+1}/${totalRows}] ${maSo}`);

      let result;
      try { result = await hlSubmitViaPopup(row, mapping); }
      catch(e) { result = { ok: false, msg: e.message }; }

      if (result.ok) {
        success++;
        hlAddLog('ok', `✅ ${maSo} → ${result.msg}`);
      } else {
        fail++;
        hlAddLog('err', `❌ ${maSo} → ${result.msg}`);
        if (result.msg && result.msg.includes('CHƯA_ĐĂNG_NHẬP')) {
          needLogin = true;
          hlAddLog('warn', '⛔ Phiên BYT hết hạn – dừng. Nhấn "Đăng nhập BYT" rồi thử lại.');
          break;
        }
      }
      hlSetProgress(i+1, totalRows);
      if (i < rows.length-1 && !needLogin) { hlAddLog('info','⏳ Chờ 3s...'); await hlSleep(3000); }
    }

    hlAddLog('info', `═══ KẾT QUẢ: ✅ ${success} thành công | ❌ ${fail} thất bại ═══`);
    if (needLogin) {
      toast('⚠️ Phiên BYT hết hạn! Nhấn "Đăng nhập BYT" rồi thử lại.', 'warning');
    } else {
      toast(`📤 Excel: ${success}✅ / ${fail}❌`, success > 0 ? 'success' : 'error');
    }
    if (gsReady()) gsLogHistory('hl_excel', `Upload Excel: ${success}/${totalRows}`).catch(()=>{});

  } catch(err) {
    hlAddLog('err', '❌ Lỗi: ' + err.message);
    toast('❌ ' + err.message, 'error');
  }
  hlUploadRunning = false;
}

async function hlUploadFromGoogleSheet(surveyType) {
  if (!CFG.bytuser || !CFG.bytpass) {
    toast('⚠️ Chưa cấu hình tài khoản BYT.', 'warning'); return;
  }
  if (!gsReady()) { toast('⚠️ Chưa cấu hình Google Sheets.', 'warning'); return; }
  if (hlUploadRunning) { toast('Đang chạy, vui lòng chờ...', 'info'); return; }

  document.getElementById('hl-log-card').style.display = '';
  document.getElementById('hl-progress-card').style.display = '';
  hlClearLog(); hlUploadRunning = true;

  const tabName = HL_GS_TABS[surveyType];
  const mapping = surveyType === 'noi_tru' ? HL_NOI_TRU_MAPPING : HL_NGOAI_TRU_MAPPING;
  const label   = surveyType === 'noi_tru' ? '🏥 Nội Trú' : '🏃 Ngoại Trú';

  hlAddLog('info', `═══ UPLOAD TỪ SHEET: ${tabName} ═══`);
  hlAddLog('info', `BYT: ${CFG.bytuser} | BV: ${CFG.hvname||CFG.mabv||'?'}`);

  try {
    hlAddLog('info', `📊 Đang đọc tab ${tabName}...`);
    const { rows, rowIndices } = await hlReadGoogleSheet(surveyType);

    if (rows.length === 0) {
      hlAddLog('info', `✅ Tab ${tabName}: không có phiếu chờ upload (tất cả đã Success hoặc rỗng)`);
      toast('✅ Không có phiếu nào cần upload', 'info');
      hlUploadRunning = false; return;
    }
    hlAddLog('info', `Tìm thấy ${rows.length} phiếu ${label} chờ upload`);

    let success = 0, fail = 0, needLogin = false;
    hlSetProgress(0, rows.length);

    for (let i = 0; i < rows.length; i++) {
      const row    = rows[i];
      const rowIdx = rowIndices[i];
      const maSo   = row['MA_SO _PHIEU'] || `Row ${rowIdx}`;
      hlAddLog('info', `▶ [${i+1}/${rows.length}] ${maSo} (Sheet row ${rowIdx})`);
      await hlUpdateGSRowStatus(surveyType, rowIdx, 'Uploading', '').catch(()=>{});

      let result;
      try { result = await hlSubmitViaPopup(row, mapping); }
      catch(e) { result = { ok: false, msg: e.message }; }

      if (result.ok) {
        success++;
        hlAddLog('ok', `✅ ${maSo} → ${result.msg}`);
        await hlUpdateGSRowStatus(surveyType, rowIdx, 'Success', '').catch(()=>{});
      } else {
        fail++;
        hlAddLog('err', `❌ ${maSo} → ${result.msg}`);
        await hlUpdateGSRowStatus(surveyType, rowIdx, 'Failed', result.msg).catch(()=>{});
        if (result.msg && result.msg.includes('CHƯA_ĐĂNG_NHẬP')) {
          needLogin = true;
          hlAddLog('warn', '⛔ Phiên BYT hết hạn – dừng. Đăng nhập lại rồi thử lại.');
          break;
        }
      }
      hlSetProgress(i+1, rows.length);
      if (i < rows.length-1 && !needLogin) { hlAddLog('info','⏳ Chờ 3s...'); await hlSleep(3000); }
    }

    hlAddLog('info', `═══ KẾT QUẢ: ✅ ${success} thành công | ❌ ${fail} thất bại ═══`);
    if (needLogin) {
      toast('⚠️ Phiên BYT hết hạn! Nhấn "Đăng nhập BYT".', 'warning');
    } else {
      toast(`📤 Sheet ${label}: ${success}✅/${fail}❌`, success > 0 ? 'success' : 'error');
    }
    if (gsReady()) gsLogHistory('hl_sheet', `Upload Sheet ${tabName}: ${success}/${rows.length}`).catch(()=>{});

  } catch(err) {
    hlAddLog('err', '❌ Lỗi Sheet: ' + err.message);
    toast('❌ ' + err.message, 'error');
  }
  hlUploadRunning = false;
}

// ═══════════════════════════════════════════════════════════
// 9. LOGIN BYT (IDs riêng, tránh conflict với byt.js)
// ═══════════════════════════════════════════════════════════

function hlSetLoginUI(type, msg) {
  const bar = document.getElementById('hl-login-bar');
  const dot = document.getElementById('hl-login-dot');
  const txt = document.getElementById('hl-login-msg');
  const btn = document.getElementById('btn-hl-login');
  if (bar) bar.className = 'byt-status-bar ' + type;
  if (dot) dot.className = 'byt-status-dot ' + (type==='logged-in'?'green':type==='checking'?'spin':type==='error'?'red':'orange');
  if (txt) txt.textContent = msg;
  if (btn) btn.style.display = (type==='logged-in') ? 'none' : '';
}

async function hlCheckBYTLogin() {
  hlSetLoginUI('checking', '🔄 Đang kiểm tra kết nối BYT...');
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 8000);
    await fetch('https://hailong.chatluongbenhvien.vn/user/login', {
      method: 'HEAD', mode: 'no-cors', cache: 'no-store', signal: ctrl.signal
    });
    hlSetLoginUI('unknown', '⚠️ CORS không cho phép xác minh tự động. Nhấn "Đăng nhập BYT" → đăng nhập trong popup → quay lại upload.');
  } catch(e) {
    hlSetLoginUI(e.name==='AbortError'?'error':'error',
      e.name==='AbortError' ? '❌ Timeout – kiểm tra kết nối mạng.' : '❌ Không kết nối được: ' + e.message);
  }
}

function hlLoginBYT() {
  if (!CFG.bytuser || !CFG.bytpass) {
    toast('⚠️ Chưa cấu hình tài khoản BYT. Vào Cấu hình.', 'warning'); showPage('settings'); return;
  }
  const user = CFG.bytuser, pass = CFG.bytpass;
  const win = window.open('https://hailong.chatluongbenhvien.vn/user/login', 'hl_byt_login', 'width=1050,height=720,left=80,top=60');
  if (!win) { toast('❌ Popup bị chặn. Cho phép popup.', 'error'); return; }
  hlSetLoginUI('checking', '🔄 Đang mở trang BYT...');
  hlAddLog('info', 'Mở cửa sổ đăng nhập BYT...');
  let attempts = 0, injected = false, done = false;
  const iv = setInterval(() => {
    attempts++;
    try {
      if (win.closed) { clearInterval(iv); if (!done) hlSetLoginUI('unknown', '⚠️ Cửa sổ đóng.'); return; }
      const url = win.location.href || '', ready = win.document.readyState === 'complete';
      if (!injected && ready && url.includes('/user')) {
        injected = true;
        try {
          win.eval(`(function(){
            var u=document.querySelector('#edit-name,input[name="name"]');
            var p=document.querySelector('#edit-pass,input[name="pass"]');
            var b=document.querySelector('#edit-submit,input[type="submit"],button[type="submit"]');
            if(u&&p){u.value=${JSON.stringify(user)};p.value=${JSON.stringify(pass)};
            u.dispatchEvent(new Event('input',{bubbles:true}));p.dispatchEvent(new Event('input',{bubbles:true}));
            if(b)setTimeout(function(){b.click();},300);}
          })()`);
          hlAddLog('info', 'Đã điền thông tin đăng nhập BYT');
        } catch(fe) { hlAddLog('warn', 'Auto-fill lỗi: ' + fe.message); }
      }
      if (injected && ready && !url.includes('/user/login') && url.startsWith('http')) {
        done = true; clearInterval(iv);
        hlSetLoginUI('logged-in', '✅ Đăng nhập BYT thành công! Có thể bắt đầu upload phiếu.');
        hlAddLog('ok', 'Đăng nhập thành công: ' + url);
        setTimeout(() => { try { win.close(); } catch(x){} }, 2000);
      }
    } catch(e) {
      if (injected && !done) {
        done = true; clearInterval(iv);
        hlSetLoginUI('logged-in', '✅ Đăng nhập BYT thành công!');
        setTimeout(() => { try { win.close(); } catch(x){} }, 2000);
      }
    }
    if (attempts > 40) { clearInterval(iv); if (!done) hlSetLoginUI('unknown', '⚠️ Hết thời gian.'); }
  }, 500);
}

// ═══════════════════════════════════════════════════════════
// 10. RENDER UI
// ═══════════════════════════════════════════════════════════

let hlSelectedFile = null;

function hlOnExcelSelected(input) {
  const file = input.files[0];
  if (!file) return;
  hlSelectedFile = file;
  const info = document.getElementById('hl-excel-info');
  if (info) info.innerHTML = `📄 <b>${file.name}</b> | ${Math.round(file.size/1024)} KB <span style="color:var(--success)">✅</span>`;
  const btn = document.getElementById('btn-hl-upload-excel');
  if (btn) { btn.disabled = false; btn.textContent = '📤 Bắt đầu Upload từ Excel'; }
  hlClearLog();
  const lc = document.getElementById('hl-log-card');
  if (lc) lc.style.display = 'none';
  const pc = document.getElementById('hl-progress-card');
  if (pc) pc.style.display = 'none';
  toast(`✅ ${file.name} (${Math.round(file.size/1024)}KB)`, 'success');
}

function hlStartExcelUpload() {
  if (!hlSelectedFile) { toast('Chưa chọn file Excel', 'warning'); return; }
  if (!CFG.bytuser || !CFG.bytpass) {
    toast('⚠️ Chưa cấu hình tài khoản BYT. Vào Cấu hình.', 'warning'); return;
  }
  hlUploadFromExcel(hlSelectedFile);
}

function hlStartSheetUpload(type) {
  if (!CFG.bytuser || !CFG.bytpass) {
    toast('⚠️ Chưa cấu hình tài khoản BYT. Vào Cấu hình.', 'warning'); return;
  }
  hlUploadFromGoogleSheet(type);
}

async function hlCheckGSTabStatus() {
  if (!gsReady()) { toast('Chưa cấu hình Google Sheets', 'warning'); return; }
  try {
    const tabs = await gsGetSheetsList();
    const nt = tabs.includes(HL_GS_TABS.noi_tru), ng = tabs.includes(HL_GS_TABS.ngoai_tru);
    toast(`NOI_TRU: ${nt?'✅':'❌'} | NGOAI_TRU: ${ng?'✅':'❌'}`, nt&&ng?'success':'warning');
    if (!nt||!ng) toast('Nhấn "Tạo tab" để khởi tạo','info');
  } catch(e) { toast('❌ ' + e.message, 'error'); }
}

function renderHailongPage() {
  const container = document.getElementById('page-hailong');
  if (!container) return;
  container.innerHTML = `
  <!-- Đăng nhập BYT -->
  <div class="card mb-14">
    <div class="card-header">
      <div class="card-title">🔐 Đăng nhập trang BYT</div>
      <div class="flex-gap">
        <button class="btn btn-outline btn-sm" onclick="hlCheckBYTLogin()">🔄 Kiểm tra</button>
        <button class="btn btn-accent btn-sm" id="btn-hl-login" onclick="hlLoginBYT()">🔑 Đăng nhập BYT</button>
      </div>
    </div>
    <div class="card-body">
      <div class="byt-status-bar unknown" id="hl-login-bar">
        <span class="byt-status-dot orange" id="hl-login-dot"></span>
        <span id="hl-login-msg">Nhấn "Kiểm tra" để xác minh, hoặc nhấn "Đăng nhập BYT" để mở cửa sổ đăng nhập.</span>
      </div>
      <div class="warn-box" style="font-size:12px;margin-top:10px;">
        ⚠️ <b>Phải đăng nhập BYT trước</b> khi upload. Tài khoản BYT cấu hình tại
        <a href="#" onclick="showPage('settings');return false" style="color:var(--primary)">Cấu hình → Tài khoản BYT</a>.
        <br>💡 Sau khi đăng nhập xong trong popup, popup sẽ tự đóng và bạn quay lại đây để upload.
      </div>
    </div>
  </div>

  <!-- Cách 1: Excel -->
  <div class="card mb-14">
    <div class="card-header">
      <div class="card-title">📂 Cách 1 – Upload từ file Excel (.xlsx)</div>
      <span style="font-size:11px;color:var(--text3)">Giống hailong-v13 gốc</span>
    </div>
    <div class="card-body">
      <div class="info-box mb-14" style="font-size:12px;">
        ℹ️ Chọn file Excel xuất từ Google Sheets (tab NOI_TRU hoặc NGOAI_TRU).<br>
        Hệ thống <b>tự nhận diện</b> Nội Trú / Ngoại Trú từ header file.<br>
        File cần có cột: <code>MA_SO _PHIEU, TEN_BENH_VIEN, NGAY_DIEN_PHIEU, GIOI_TINH, TUOI, A1–G4...</code>
      </div>
      <div class="form-group mb-14">
        <label class="form-label">Chọn file Excel</label>
        <input type="file" id="hl-excel-file" accept=".xlsx,.xls" class="form-input" style="padding:8px;"
          onchange="hlOnExcelSelected(this)"/>
        <div id="hl-excel-info" style="font-size:11px;color:var(--text3);margin-top:4px;"></div>
      </div>
      <button class="btn btn-primary" id="btn-hl-upload-excel" onclick="hlStartExcelUpload()" disabled>
        📤 Bắt đầu Upload từ Excel
      </button>
    </div>
  </div>

  <!-- Cách 2: Google Sheet -->
  <div class="card mb-14">
    <div class="card-header">
      <div class="card-title">📊 Cách 2 – Upload từ Google Sheet trực tiếp</div>
      <span style="font-size:11px;color:var(--text3)">Không cần xuất Excel</span>
    </div>
    <div class="card-body">
      <div class="info-box mb-14" style="font-size:12px;">
        ℹ️ Đọc tab <b>NOI_TRU</b> / <b>NGOAI_TRU</b> trên Google Sheets.<br>
        Chỉ upload dòng có <b>UploadStatus ≠ Success</b>. Tự động cập nhật trạng thái sau upload.
      </div>
      <div class="flex-gap mb-14" style="gap:10px;">
        <button class="btn btn-success" style="flex:1" onclick="hlStartSheetUpload('noi_tru')">
          🏥 Upload Nội Trú (tab NOI_TRU)
        </button>
        <button class="btn btn-accent" style="flex:1" onclick="hlStartSheetUpload('ngoai_tru')">
          🏃 Upload Ngoại Trú (tab NGOAI_TRU)
        </button>
      </div>
      <div class="flex-gap" style="gap:8px;flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" onclick="hlInitGSTabs()">🏗️ Tạo tab NOI_TRU + NGOAI_TRU</button>
        <button class="btn btn-outline btn-sm" onclick="hlCheckGSTabStatus()">🔍 Kiểm tra tab</button>
      </div>
    </div>
  </div>

  <!-- Progress -->
  <div class="card mb-14" id="hl-progress-card" style="display:none">
    <div class="card-header">
      <div class="card-title">⏳ Tiến trình upload</div>
      <span id="hl-progress-count" style="font-size:12px;color:var(--text3)">0 / 0</span>
    </div>
    <div class="card-body">
      <div class="progress-bar" style="margin-bottom:8px;">
        <div class="progress-fill" id="hl-progress-fill" style="width:0%;transition:width .4s"></div>
      </div>
      <div style="font-size:11px;color:var(--text3)">
        ⚠️ KHÔNG đóng cửa sổ popup BYT khi đang upload!<br>
        Mỗi phiếu cần ~40-60 giây để trang BYT load và submit.
      </div>
    </div>
  </div>

  <!-- Log -->
  <div class="card" id="hl-log-card" style="display:none">
    <div class="card-header">
      <div class="card-title">📜 Nhật ký upload</div>
      <button class="btn btn-outline btn-sm" onclick="hlClearLog();document.getElementById('hl-log-card').style.display='none'">🗑️ Xóa</button>
    </div>
    <div class="card-body">
      <div id="hl-upload-log"
        style="min-height:120px;max-height:450px;overflow-y:auto;font-size:11.5px;
               font-family:monospace;background:#0d1117;color:#e6edf3;
               padding:10px 12px;border-radius:6px;line-height:1.7;"></div>
    </div>
  </div>`;
}

function initHailongModule() {
  const c = document.getElementById('page-hailong');
  if (c && !c.innerHTML.trim()) renderHailongPage();
}
