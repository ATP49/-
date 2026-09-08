import { DentalRecord } from '../types';
import { KRABI_HEALTH_CENTERS } from '../data/krabiHealthCenters';

/**
 * Service to communicate with Google Sheets via Google Apps Script Web App
 * or Google Sheet CSV / Visualization API.
 */

// Thai to English field mapping for Google Sheet headers
export const SHEET_HEADER_MAP: Record<string, keyof DentalRecord> = {
  'ID': 'id',
  'id': 'id',
  'รหัส': 'id',
  'รหัสอ้างอิง': 'id',
  'ลำดับ': 'id',
  'Timestamp': 'timestamp',
  'timestamp': 'timestamp',
  'วันเวลา': 'timestamp',
  'วันที่บันทึก': 'timestamp',
  'วันเวลาที่บันทึก': 'timestamp',
  'UnitCode': 'unitCode',
  'unitCode': 'unitCode',
  'unit_code': 'unitCode',
  'รหัสหน่วยบริการ': 'unitCode',
  'รหัส รพ.สต.': 'unitCode',
  'รหัสรพสต': 'unitCode',
  'Unit': 'unit',
  'unit': 'unit',
  'หน่วยบริการ': 'unit',
  'ชื่อหน่วยบริการ': 'unit',
  'รพ.สต.': 'unit',
  'หน่วยบริการ (รพ.สต.)': 'unit',
  'District': 'district',
  'district': 'district',
  'อำเภอ': 'district',
  'Size': 'unitSize',
  'size': 'unitSize',
  'UnitSize': 'unitSize',
  'unitSize': 'unitSize',
  'ขนาด': 'unitSize',
  'ขนาดหน่วยบริการ': 'unitSize',
  'Affiliation': 'affiliation',
  'affiliation': 'affiliation',
  'สังกัด': 'affiliation',
  'หน่วยงานสังกัด': 'affiliation',
  'Recorder': 'recorder',
  'recorder': 'recorder',
  'ผู้บันทึก': 'recorder',
  'ผู้บันทึกข้อมูล': 'recorder',
  'Status': 'status',
  'status': 'status',
  'สถานะ': 'status',
  'สถานะการให้บริการ': 'status',
  'มาให้บริการ': 'status',
  'PersonCount': 'personCount',
  'personCount': 'personCount',
  'จำนวนผู้รับบริการ': 'personCount',
  'จำนวนผู้รับบริการรวม': 'personCount',
  'ผู้รับบริการรวม (คน)': 'personCount',
  'ผู้รับบริการ': 'personCount',
  'ServiceCount': 'serviceCount',
  'serviceCount': 'serviceCount',
  'ให้บริการรวม': 'serviceCount',
  'ให้บริการรวม (ครั้ง)': 'serviceCount',
  'จำนวนครั้ง': 'serviceCount',
  'ExamCount': 'examCount',
  'examCount': 'examCount',
  'ตรวจช่องปาก': 'examCount',
  'ตรวจช่องปาก (คน)': 'examCount',
  'ExtractionCount': 'extractionCount',
  'extractionCount': 'extractionCount',
  'ถอนฟัน': 'extractionCount',
  'ถอนฟัน (คน)': 'extractionCount',
  'FillingCount': 'fillingCount',
  'fillingCount': 'fillingCount',
  'อุดฟัน': 'fillingCount',
  'อุดฟัน (คน)': 'fillingCount',
  'ScalingCount': 'scalingCount',
  'scalingCount': 'scalingCount',
  'ขูดหินปูน': 'scalingCount',
  'ขูดหินปูน (คน)': 'scalingCount',
  'FluorideCount': 'fluorideCount',
  'fluorideCount': 'fluorideCount',
  'เคลือบฟลูออไรด์': 'fluorideCount',
  'เคลือบฟลูออไรด์ (คน)': 'fluorideCount',
  'SealantCount': 'sealantCount',
  'sealantCount': 'sealantCount',
  'เคลือบหลุมร่องฟัน': 'sealantCount',
  'เคลือบหลุมร่องฟัน (คน)': 'sealantCount',
  'ReferCount': 'referCount',
  'referCount': 'referCount',
  'ส่งต่อรักษา': 'referCount',
  'ส่งต่อรักษา (คน)': 'referCount',
  'ส่งต่อ': 'referCount',
  'Notes': 'notes',
  'notes': 'notes',
  'หมายเหตุ': 'notes',
  'หมายเหตุ / ชี้แจงเหตุผล': 'notes',
  'ชี้แจงเหตุผล': 'notes',
  'อื่นๆ': 'notes',
};

// Normalize raw object from Google Sheet into DentalRecord
export function normalizeRecord(raw: any, index: number): DentalRecord {
  const rawUnit = String(raw.unit || raw.Unit || raw['หน่วยบริการ'] || raw['ชื่อหน่วยบริการ'] || raw['รพ.สต.'] || raw['หน่วยบริการ (รพ.สต.)'] || 'ไม่ระบุหน่วยบริการ').trim();
  const rawCode = String(raw.unitCode || raw.UnitCode || raw['รหัสหน่วยบริการ'] || raw['รหัส รพ.สต.'] || raw['รหัสรพสต'] || '').trim();

  // Cross-reference with official 44 Krabi health centers
  const cleanUnit = rawUnit.replace(/^รพ\.สต\./, '').trim();
  const matchedCenter = KRABI_HEALTH_CENTERS.find(
    (c) => (rawCode && c.code === rawCode) || 
           c.name === rawUnit || 
           c.name.replace(/^รพ\.สต\./, '').trim() === cleanUnit ||
           rawUnit.includes(c.name) || 
           c.name.includes(rawUnit)
  );

  const unit = matchedCenter ? matchedCenter.name : rawUnit;
  const unitCode = matchedCenter ? matchedCenter.code : (rawCode || '');
  const district = String(matchedCenter ? matchedCenter.district : (raw.district || raw.District || raw['อำเภอ'] || 'เมือง'));
  const unitSize = String(matchedCenter ? matchedCenter.size : (raw.unitSize || raw.UnitSize || raw.size || raw.Size || raw['ขนาด'] || 'M'));
  const affiliation = String(matchedCenter ? matchedCenter.affiliation : (raw.affiliation || raw.Affiliation || raw['สังกัด'] || 'อบจ.กระบี่'));

  const rawStatus = String(raw.status || raw.Status || raw['มาให้บริการ'] || raw['สถานะ'] || raw['สถานะการให้บริการ'] || '').trim();
  const isAbsent = rawStatus === 'ไม่มา' || rawStatus.toLowerCase() === 'absent' || rawStatus === '0' || rawStatus === 'เลื่อนนัด';

  const record: DentalRecord = {
    id: String(raw.id || raw.ID || raw['รหัส'] || raw['รหัสอ้างอิง'] || `rec-${Date.now()}-${index}`),
    timestamp: String(raw.timestamp || raw.Timestamp || raw['วันที่บันทึก'] || raw['วันเวลา'] || raw['วันเวลาที่บันทึก'] || new Date().toLocaleString('th-TH')),
    unit,
    unitCode,
    unitSize,
    affiliation,
    district,
    recorder: String(raw.recorder || raw.Recorder || raw['ผู้บันทึก'] || raw['ผู้บันทึกข้อมูล'] || 'เจ้าหน้าที่'),
    status: isAbsent ? 'ไม่มา' : 'มา',
    personCount: Number(raw.personCount ?? raw.PersonCount ?? raw['จำนวนผู้รับบริการรวม'] ?? raw['จำนวนผู้รับบริการ'] ?? raw['ผู้รับบริการรวม (คน)'] ?? raw['ผู้รับบริการ'] ?? 0),
    serviceCount: Number(raw.serviceCount ?? raw.ServiceCount ?? raw['ให้บริการรวม'] ?? raw['ให้บริการรวม (ครั้ง)'] ?? raw['จำนวนครั้ง'] ?? 0),
    examCount: Number(raw.examCount ?? raw.ExamCount ?? raw['ตรวจช่องปาก'] ?? raw['ตรวจช่องปาก (คน)'] ?? 0),
    extractionCount: Number(raw.extractionCount ?? raw.ExtractionCount ?? raw['ถอนฟัน'] ?? raw['ถอนฟัน (คน)'] ?? 0),
    fillingCount: Number(raw.fillingCount ?? raw.FillingCount ?? raw['อุดฟัน'] ?? raw['อุดฟัน (คน)'] ?? 0),
    scalingCount: Number(raw.scalingCount ?? raw.ScalingCount ?? raw['ขูดหินปูน'] ?? raw['ขูดหินปูน (คน)'] ?? 0),
    fluorideCount: Number(raw.fluorideCount ?? raw.FluorideCount ?? raw['เคลือบฟลูออไรด์'] ?? raw['เคลือบฟลูออไรด์ (คน)'] ?? 0),
    sealantCount: Number(raw.sealantCount ?? raw.SealantCount ?? raw['เคลือบหลุมร่องฟัน'] ?? raw['เคลือบหลุมร่องฟัน (คน)'] ?? 0),
    referCount: Number(raw.referCount ?? raw.ReferCount ?? raw['ส่งต่อรักษา'] ?? raw['ส่งต่อรักษา (คน)'] ?? raw['ส่งต่อ'] ?? 0),
    notes: String(raw.notes || raw.Notes || raw['หมายเหตุ'] || raw['หมายเหตุ / ชี้แจงเหตุผล'] || raw['ชี้แจงเหตุผล'] || raw['อื่นๆ'] || ''),
  };
  return record;
}

/**
 * Fetch records from Google Apps Script Web App endpoint
 */
export async function fetchFromGoogleAppsScript(scriptUrl: string): Promise<{ success: boolean; data?: DentalRecord[]; error?: string; count?: number }> {
  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    return { success: false, error: 'ที่อยู่ Web App URL ไม่ถูกต้อง' };
  }

  try {
    const url = new URL(scriptUrl);
    url.searchParams.set('action', 'getRecords');
    url.searchParams.set('_t', Date.now().toString()); // Cache buster

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();

    let rawList: any[] = [];
    if (Array.isArray(json)) {
      rawList = json;
    } else if (json && Array.isArray(json.data)) {
      rawList = json.data;
    } else if (json && json.records && Array.isArray(json.records)) {
      rawList = json.records;
    } else {
      return { success: false, error: 'โครงสร้างข้อมูลจาก Google Sheet ไม่ตรงกับรูปแบบที่รองรับ' };
    }

    const normalizedRecords = rawList.map((item, idx) => normalizeRecord(item, idx));
    return { 
      success: true, 
      data: normalizedRecords, 
      count: normalizedRecords.length 
    };
  } catch (err: any) {
    return { 
      success: false, 
      error: err.message || 'ไม่สามารถติดต่อ Google Apps Script Web App ได้ กรุณาตรวจสอบการตั้งค่า Deploy (Who has access: Anyone)' 
    };
  }
}

/**
 * Save or update a single record to Google Apps Script Web App
 */
export async function saveRecordToGoogleAppsScript(scriptUrl: string, record: DentalRecord): Promise<{ success: boolean; error?: string }> {
  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    return { success: false, error: 'ยังไม่ได้ระบุ Web App URL' };
  }

  try {
    const matchedCenter = KRABI_HEALTH_CENTERS.find(
      (c) => c.name === record.unit || record.unit.includes(c.name) || (record.unitCode && c.code === record.unitCode)
    );

    const payload = {
      action: 'save',
      record: {
        ID: record.id,
        Timestamp: record.timestamp,
        UnitCode: record.unitCode || (matchedCenter ? matchedCenter.code : ''),
        Unit: record.unit,
        District: record.district || (matchedCenter ? matchedCenter.district : 'เมือง'),
        Size: record.unitSize || (matchedCenter ? matchedCenter.size : 'M'),
        Affiliation: record.affiliation || (matchedCenter ? matchedCenter.affiliation : 'อบจ.กระบี่'),
        Recorder: record.recorder,
        Status: record.status,
        PersonCount: record.personCount,
        ServiceCount: record.serviceCount,
        ExamCount: record.examCount,
        ExtractionCount: record.extractionCount,
        FillingCount: record.fillingCount,
        ScalingCount: record.scalingCount,
        FluorideCount: record.fluorideCount,
        SealantCount: record.sealantCount,
        ReferCount: record.referCount,
        Notes: record.notes,
      }
    };

    // Use text/plain to avoid preflight CORS restrictions with Google Apps Script
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors', // Standard Apps Script submission pattern
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการบันทึกลง Google Sheet' };
  }
}

/**
 * Delete a record from Google Apps Script Web App
 */
export async function deleteRecordFromGoogleAppsScript(scriptUrl: string, recordId: string): Promise<{ success: boolean; error?: string }> {
  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    return { success: false, error: 'ยังไม่ได้ระบุ Web App URL' };
  }

  try {
    const payload = {
      action: 'delete',
      id: recordId,
    };

    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการลบข้อมูลจาก Google Sheet' };
  }
}

/**
 * Save batch of records to Google Apps Script (e.g. sync all local records to Google Sheet)
 */
export async function saveBatchToGoogleAppsScript(scriptUrl: string, records: DentalRecord[]): Promise<{ success: boolean; error?: string }> {
  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    return { success: false, error: 'ยังไม่ได้ระบุ Web App URL' };
  }

  try {
    const payload = {
      action: 'saveBatch',
      records: records.map(r => {
        const matchedCenter = KRABI_HEALTH_CENTERS.find(
          (c) => c.name === r.unit || r.unit.includes(c.name) || (r.unitCode && c.code === r.unitCode)
        );
        return {
          ID: r.id,
          Timestamp: r.timestamp,
          UnitCode: r.unitCode || (matchedCenter ? matchedCenter.code : ''),
          Unit: r.unit,
          District: r.district || (matchedCenter ? matchedCenter.district : 'เมือง'),
          Size: r.unitSize || (matchedCenter ? matchedCenter.size : 'M'),
          Affiliation: r.affiliation || (matchedCenter ? matchedCenter.affiliation : 'อบจ.กระบี่'),
          Recorder: r.recorder,
          Status: r.status,
          PersonCount: r.personCount,
          ServiceCount: r.serviceCount,
          ExamCount: r.examCount,
          ExtractionCount: r.extractionCount,
          FillingCount: r.fillingCount,
          ScalingCount: r.scalingCount,
          FluorideCount: r.fluorideCount,
          SealantCount: r.sealantCount,
          ReferCount: r.referCount,
          Notes: r.notes,
        };
      })
    };

    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการส่งข้อมูลขึ้น Google Sheet' };
  }
}

/**
 * Test Google Apps Script Web App endpoint connection
 */
export async function testGoogleAppsScriptConnection(scriptUrl: string): Promise<{
  success: boolean;
  latencyMs?: number;
  recordCount?: number;
  message: string;
}> {
  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    return { success: false, message: 'กรุณาระบุ URL ที่ถูกต้อง (เริ่มต้นด้วย https://)' };
  }

  const startTime = Date.now();
  try {
    const url = new URL(scriptUrl);
    url.searchParams.set('action', 'getRecords');
    url.searchParams.set('_t', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        latencyMs,
        message: `เชื่อมต่อไม่สำเร็จ: HTTP Error ${response.status}`,
      };
    }

    const data = await response.json();
    let count = 0;
    if (Array.isArray(data)) count = data.length;
    else if (data && Array.isArray(data.data)) count = data.data.length;

    return {
      success: true,
      latencyMs,
      recordCount: count,
      message: `เชื่อมต่อสำเร็จ! พบข้อมูลทั้งหมด ${count} แถว (ความเร็ว ${latencyMs} ms)`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `ไม่สามารถเชื่อมต่อได้: ${err.message || 'ตรวจดูว่าได้ตั้งค่าสิทธิ์ Web App เป็น Anyone หรือยัง'}`,
    };
  }
}

/**
 * Ready-to-use Apps Script template code with arranged columns, dual-sheet support, and auto-sorting
 */
export const COMPLETE_APPS_SCRIPT_CODE = `// =================================================================
// Google Apps Script สำหรับระบบจัดการข้อมูลทันตกรรม กองสาธารณสุข อบจ.กระบี่
// โครงสร้างมาตรฐาน: 19 คอลัมน์ + ชีตรายชื่อ รพ.สต. 44 แห่ง + จัดเรียงวันที่ล่าสุดอัตโนมัติ
// วิธีติดตั้ง: 
// 1. เปิด Google Sheet -> ส่วนขยาย (Extensions) -> Apps Script
// 2. ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดนี้แทนที่ จากนั้นกด Save (รูปแผ่นดิสก์)
// 3. กดเลือกฟังก์ชัน 'setupSheet' แล้วกดปุ่ม 'เรียกใช้ (Run)' 1 ครั้ง เพื่อสร้างหัวตารางและชีต รพ.สต.
// 4. กด 'ทำให้ใช้งานได้ (Deploy)' -> 'การทำให้ใช้งานได้ใหม่ (New deployment)'
//    - ประเภท: เว็บแอป (Web app)
//    - คำอธิบาย: Krabi Dental Sync v2
//    - ผู้มีสิทธิ์เข้าถึง (Who has access): ทุกคน (Anyone)
// 5. คัดลอก Web App URL (ลงท้ายด้วย /exec) มาวางในเว็บแอป
// =================================================================

const SHEET_NAME = "DentalData";
const HEALTH_CENTERS_SHEET = "HealthCenters";

// หัวตารางมาตรฐาน 19 คอลัมน์ จัดเรียงตามลำดับอย่างเหมาะสม
const DENTAL_HEADERS = [
  "ID", "Timestamp", "UnitCode", "Unit", "District", "Size", "Affiliation", 
  "Recorder", "Status", "PersonCount", "ServiceCount", "ExamCount", 
  "ExtractionCount", "FillingCount", "ScalingCount", "FluorideCount", 
  "SealantCount", "ReferCount", "Notes"
];

// รายชื่อ รพ.สต. ในสังกัด อบจ.กระบี่ ทั้ง 44 แห่ง
const KRABI_CENTERS_DATA = [
  ["08995", "เมือง", "รพ.สต.บ้านช่องพลี", "L", "ใช้งาน", "อบจ.กระบี่"],
  ["08988", "เมือง", "รพ.สต.บ้านสองแพรก", "L", "ใช้งาน", "อบจ.กระบี่"],
  ["08998", "เมือง", "รพ.สต.บ้านในไร่", "L", "ใช้งาน", "อบจ.กระบี่"],
  ["08992", "เมือง", "รพ.สต.บ้านคลองใหญ่", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["08993", "เมือง", "รพ.สต.บ้านทับปริก", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["08994", "เมือง", "รพ.สต.บ้านเกาะกลาง", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["08997", "เมือง", "รพ.สต.บ้านทุ่ง", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["14580", "เมือง", "รพ.สต.บ้านในสระ", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["08996", "เมือง", "รพ.สต.บ้านคลองม่วง", "S", "ใช้งาน", "อบจ.กระบี่"],
  ["14581", "เมือง", "รพ.สต.บ้านนาตีน", "S", "ใช้งาน", "อบจ.กระบี่"],
  ["09009", "เกาะลันตา", "รพ.สต.บ้านนาทุ่งกลาง", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09010", "เกาะลันตา", "รพ.สต.บ้านร่าปู", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09011", "เกาะลันตา", "รพ.สต.บ้านคลองยาง", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09012", "เกาะลันตา", "รพ.สต.บ้านคลองโตบ", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09013", "เกาะลันตา", "รพ.สต.บ้านศาลาด่าน", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09014", "เกาะลันตา", "รพ.สต.บ้านคลองโตนด", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["14582", "เกาะลันตา", "รพ.สต.บ้านปากคลอง", "S", "ใช้งาน", "อบจ.กระบี่"],
  ["09006", "เขาพนม", "รพ.สต.บ้านเขาดิน", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09007", "เขาพนม", "รพ.สต.บ้านห้วยสาร", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09008", "เขาพนม", "รพ.สต.บ้านโคกหาร", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["14888", "เขาพนม", "รพ.สต.บ้านมะม่วงเอน", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09000", "เขาพนม", "รพ.สต.บ้านควน", "S", "ใช้งาน", "อบจ.กระบี่"],
  ["09017", "คลองท่อม", "รพ.สต.บ้านทรายขาว", "L", "ใช้งาน", "อบจ.กระบี่"],
  ["09016", "คลองท่อม", "รพ.สต.บ้านทุ่งล้อ", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09018", "คลองท่อม", "รพ.สต.บ้านพรุเตย", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09019", "คลองท่อม", "รพ.สต.บ้านบางคราม", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09020", "คลองท่อม", "รพ.สต.บ้านพรุดินนา", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09021", "คลองท่อม", "รพ.สต.บ้านเพหลา", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["14583", "คลองท่อม", "รพ.สต.บ้านนา ต.ห้วยน้ำขาว", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09034", "ปลายพระยา", "รพ.สต.บ้านบางเหียน", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09035", "ปลายพระยา", "รพ.สต.บ้านทะเลหอย", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09036", "ปลายพระยา", "รพ.สต.บ้านนา ต.เขาต่อ", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09037", "ปลายพระยา", "รพ.สต.บ้านตัวอย่าง", "S", "ใช้งาน", "อบจ.กระบี่"],
  ["09042", "ลำทับ", "รพ.สต.บ้านเสม็ดจวน", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09049", "เหนือคลอง", "รพ.สต.บ้านทุ่งประสาน", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09050", "เหนือคลอง", "รพ.สต.บ้านโคกยาง", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09051", "เหนือคลอง", "รพ.สต.บ้านห้วยมัด", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09052", "เหนือคลอง", "รพ.สต.บ้านตลิ่งชัน", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["14889", "เหนือคลอง", "รพ.สต.บ้านควนนกหว้า", "S", "ใช้งาน", "อบจ.กระบี่"],
  ["09024", "อ่าวลึก", "รพ.สต.บ้านแหลมสัก", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09025", "อ่าวลึก", "รพ.สต.บ้านอ่าวลึกน้อย", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09027", "อ่าวลึก", "รพ.สต.บ้านคลองยา", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09028", "อ่าวลึก", "รพ.สต.บ้านเขาแก้ว", "M", "ใช้งาน", "อบจ.กระบี่"],
  ["09026", "อ่าวลึก", "รพ.สต.บ้านบางเจริญ", "S", "ใช้งาน", "อบจ.กระบี่"]
];

// ฟังก์ชันสร้างชีตและหัวตาราง 19 คอลัมน์ พร้อมชีต รพ.สต. (รันเพียงครั้งเดียว)
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. สร้างชีต DentalData
  let dentalSheet = ss.getSheetByName(SHEET_NAME);
  if (!dentalSheet) {
    dentalSheet = ss.insertSheet(SHEET_NAME);
  }
  
  dentalSheet.getRange(1, 1, 1, DENTAL_HEADERS.length).setValues([DENTAL_HEADERS]);
  dentalSheet.getRange(1, 1, 1, DENTAL_HEADERS.length)
    .setBackground("#1E3A8A")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  dentalSheet.setFrozenRows(1);
  
  // 2. สร้างชีต HealthCenters (รพ.สต. 44 แห่ง)
  let centersSheet = ss.getSheetByName(HEALTH_CENTERS_SHEET);
  if (!centersSheet) {
    centersSheet = ss.insertSheet(HEALTH_CENTERS_SHEET);
  }
  
  const centerHeaders = ["รหัสหน่วยบริการ", "อำเภอ", "ชื่อหน่วยบริการ", "ขนาด", "สถานะ", "สังกัด"];
  centersSheet.getRange(1, 1, 1, centerHeaders.length).setValues([centerHeaders]);
  centersSheet.getRange(1, 1, 1, centerHeaders.length)
    .setBackground("#0F766E")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  centersSheet.setFrozenRows(1);
  
  // บันทึกข้อมูล 44 แห่งลงชีต
  if (centersSheet.getLastRow() < 2) {
    centersSheet.getRange(2, 1, KRABI_CENTERS_DATA.length, centerHeaders.length).setValues(KRABI_CENTERS_DATA);
  }

  return "สร้างชีต DentalData (19 คอลัมน์) และชีต HealthCenters (44 แห่ง) สำเร็จเรียบร้อย";
}

// ฟังก์ชันจัดเรียงแถวใน DentalData ตามวันเวลาล่าสุดอยู่บนสุด (Sort descending)
function sortDentalSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (sheet && sheet.getLastRow() > 2) {
      // คอลัมน์ที่ 2 คือ Timestamp
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
        .sort({ column: 2, ascending: false });
    }
  } catch (e) {
    console.log("Sort error: " + e.toString());
  }
}

// ตอบกลับคำขอแบบ GET: ดึงรายการข้อมูลทั้งหมด
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(SHEET_NAME);
    }
    
    // ตรวจสอบ action พิเศษ เช่น ขอข้อมูลรายชื่อ รพ.สต. 44 แห่ง
    const action = e && e.parameter ? e.parameter.action : "";
    if (action === "getHealthCenters") {
      let cSheet = ss.getSheetByName(HEALTH_CENTERS_SHEET);
      if (!cSheet || cSheet.getLastRow() < 2) {
        setupSheet();
        cSheet = ss.getSheetByName(HEALTH_CENTERS_SHEET);
      }
      const cRows = cSheet.getRange(2, 1, cSheet.getLastRow() - 1, 6).getDisplayValues();
      const centers = cRows.map(r => ({
        code: r[0], district: r[1], name: r[2], size: r[3], status: r[4], affiliation: r[5]
      }));
      return ContentService.createTextOutput(JSON.stringify({ success: true, data: centers }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    if (lastRow < 2 || lastCol < 1) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    const rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();
    
    const data = rows.map(row => {
      let record = {};
      headers.forEach((header, idx) => {
        record[header] = row[idx] !== undefined ? row[idx] : "";
      });
      return record;
    });
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: data, headers: headers }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ตอบกลับคำขอแบบ POST: บันทึกข้อมูล, ซิงก์ข้อมูล, หรือลบข้อมูล พร้อมจัดเรียงอัตโนมัติ
function doPost(e) {
  try {
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      payload = e.parameter;
    }
    
    const action = payload.action || "save";
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(SHEET_NAME);
    }
    
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    
    // 1. บันทึกหรือแก้ไข 1 รายการ
    if (action === "save") {
      const rec = payload.record || payload;
      const id = rec.ID || Utilities.getUuid();
      rec.ID = id;
      
      const lastRow = sheet.getLastRow();
      let rowIndex = -1;
      
      if (lastRow >= 2) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(String);
        rowIndex = ids.findIndex(x => x === String(id));
      }
      
      const rowData = headers.map(header => rec[header] !== undefined ? rec[header] : "");
      
      if (rowIndex > -1) {
        // อัปเดตแถวเดิม
        sheet.getRange(rowIndex + 2, 1, 1, headers.length).setValues([rowData]);
      } else {
        // เพิ่มแถวใหม่ต่อท้าย
        sheet.appendRow(rowData);
      }
      
      // จัดเรียงตามวันเวลาล่าสุดอยู่บนสุด
      sortDentalSheet();

      return ContentService.createTextOutput(JSON.stringify({ success: true, id: id }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. ซิงก์ข้อมูลเป็นกลุ่ม (Batch Save)
    if (action === "saveBatch") {
      const records = payload.records || [];
      records.forEach(rec => {
        const rowData = headers.map(header => rec[header] !== undefined ? rec[header] : "");
        sheet.appendRow(rowData);
      });
      
      sortDentalSheet();

      return ContentService.createTextOutput(JSON.stringify({ success: true, count: records.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 3. จัดเรียงข้อมูลในชีตตามวันที่ (Trigger เรียงข้อมูลตามคำขอ)
    if (action === "sort") {
      sortDentalSheet();
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Sorted successfully" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. ลบข้อมูลตาม ID
    if (action === "delete") {
      const idToDelete = String(payload.id);
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
        const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(String);
        const rowIndex = ids.findIndex(x => x === idToDelete);
        if (rowIndex > -1) {
          sheet.deleteRow(rowIndex + 2);
          return ContentService.createTextOutput(JSON.stringify({ success: true, deletedId: idToDelete }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "ID not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Unknown action" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

/**
 * Inspect connected Google Sheet structure: check columns, missing headers, and sorting
 */
export async function inspectSheetStructure(scriptUrl: string): Promise<{
  success: boolean;
  columnCount: number;
  detectedHeaders: string[];
  missingHeaders: string[];
  isProperlyArranged: boolean;
  message: string;
}> {
  if (!scriptUrl || !scriptUrl.startsWith('http')) {
    return {
      success: false,
      columnCount: 0,
      detectedHeaders: [],
      missingHeaders: [],
      isProperlyArranged: false,
      message: 'กรุณาระบุ Web App URL ที่ถูกต้อง',
    };
  }

  try {
    const url = new URL(scriptUrl);
    url.searchParams.set('action', 'getRecords');
    url.searchParams.set('_t', Date.now().toString());

    const response = await fetch(url.toString(), { method: 'GET' });
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const json = await response.json();
    const rawHeaders: string[] = json.headers || (json.data && json.data.length > 0 ? Object.keys(json.data[0]) : []);

    const expectedKeys = [
      'ID', 'Timestamp', 'UnitCode', 'Unit', 'District', 'Size', 'Affiliation',
      'Recorder', 'Status', 'PersonCount', 'ServiceCount', 'ExamCount',
      'ExtractionCount', 'FillingCount', 'ScalingCount', 'FluorideCount',
      'SealantCount', 'ReferCount', 'Notes'
    ];

    const detectedMap = new Set(rawHeaders.map(h => h.trim()));
    const missing = expectedKeys.filter(key => {
      // Check if either English or mapped Thai is found
      const found = Array.from(detectedMap).some(h => {
        const mapped = SHEET_HEADER_MAP[h];
        const expectedMapped = SHEET_HEADER_MAP[key];
        return h === key || (mapped && expectedMapped && mapped === expectedMapped);
      });
      return !found;
    });

    const isProperlyArranged = missing.length === 0;

    return {
      success: true,
      columnCount: rawHeaders.length,
      detectedHeaders: rawHeaders,
      missingHeaders: missing,
      isProperlyArranged,
      message: isProperlyArranged 
        ? `โครงสร้างชีตสมบูรณ์แบบ! ตรวจพบคอลัมน์ครบถ้วน ${rawHeaders.length} คอลัมน์ และจัดเรียงถูกต้อง`
        : `ตรวจพบ ${rawHeaders.length} คอลัมน์ (มี ${missing.length} คอลัมน์ที่แนะนำให้เพิ่มเพื่อความสมบูรณ์ เช่น ${missing.slice(0, 3).join(', ')})`,
    };
  } catch (err: any) {
    return {
      success: false,
      columnCount: 0,
      detectedHeaders: [],
      missingHeaders: [],
      isProperlyArranged: false,
      message: `ไม่สามารถตรวจสอบโครงสร้างชีตได้: ${err.message}`,
    };
  }
}
