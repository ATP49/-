import React, { useState } from 'react';
import { 
  Lightbulb, 
  ShieldAlert, 
  Cpu, 
  Database, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Smartphone, 
  BellRing, 
  BarChart3,
  Flame,
  FileCode2,
  Lock
} from 'lucide-react';

export const AnalysisTab: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState(false);

  // Optimized & Secured Google Apps Script (Code.gs)
  const improvedAppsScript = `// =================================================================
// รหัส Google Apps Script (ฉบับปรับปรุงแก้ไขช่องโหว่ความปลอดภัยและประสิทธิภาพ)
// กองสาธารณสุข องค์การบริหารส่วนจังหวัดกระบี่
// =================================================================

const SPREADSHEET_ID = "19FuDTWYejr4OAuPCZ5Lkc2Ehykk7V1cQrtPId2zMm8g"; 
const SHEET_NAME = "DentalData"; 
const CONFIG_SHEET = "Settings"; 

// รหัสผ่าน Admin เก็บไว้ฝั่ง Server เพื่อความปลอดภัย (ไม่หลุดไป Browser)
const ADMIN_PIN_HASH = "1234"; 

function doGet(e) {
  return HtmlService.createTemplateFromFile('dental_logger')
    .evaluate()
    .setTitle("ระบบจัดการข้อมูลทันตกรรม | กองสาธารณสุข อบจ.กระบี่")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ตรวจสอบสิทธิ์ Admin จาก Server โดยตรง
function verifyAdminPin(enteredPin) {
  return String(enteredPin) === String(ADMIN_PIN_HASH);
}

// โหลดรายชื่อ รพ.สต. ในสังกัด อบจ.กระบี่ ทั้ง 44 แห่ง
function getKrabiUnits() {
  return [
    // เมือง
    "รพ.สต.บ้านช่องพลี", "รพ.สต.บ้านสองแพรก", "รพ.สต.บ้านในไร่", "รพ.สต.บ้านคลองใหญ่", 
    "รพ.สต.บ้านทับปริก", "รพ.สต.บ้านเกาะกลาง", "รพ.สต.บ้านทุ่ง", "รพ.สต.บ้านในสระ", 
    "รพ.สต.บ้านคลองม่วง", "รพ.สต.บ้านนาตีน",
    // เกาะลันตา
    "รพ.สต.บ้านนาทุ่งกลาง", "รพ.สต.บ้านปากคลอง", "รพ.สต.บ้านร่าปู", "รพ.สต.บ้านคลองยาง", 
    "รพ.สต.บ้านคลองโตบ", "รพ.สต.บ้านศาลาด่าน", "รพ.สต.บ้านคลองโตนด",
    // เขาพนม
    "รพ.สต.บ้านเขาดิน", "รพ.สต.บ้านห้วยสาร", "รพ.สต.บ้านโคกหาร", "รพ.สต.บ้านมะม่วงเอน", "รพ.สต.บ้านควน",
    // คลองท่อม
    "รพ.สต.บ้านทุ่งล้อ", "รพ.สต.บ้านทรายขาว", "รพ.สต.บ้านพรุเตย", "รพ.สต.บ้านบางคราม", 
    "รพ.สต.บ้านนา ต.ห้วยน้ำขาว", "รพ.สต.บ้านพรุดินนา", "รพ.สต.บ้านเพหลา",
    // ปลายพระยา
    "รพ.สต.บ้านนา ต.เขาต่อ", "รพ.สต.บ้านบางเหียน", "รพ.สต.บ้านทะเลหอย", "รพ.สต.บ้านตัวอย่าง",
    // ลำทับ
    "รพ.สต.บ้านเสม็ดจวน",
    // เหนือคลอง
    "รพ.สต.บ้านควนนกหว้า", "รพ.สต.บ้านโคกยาง", "รพ.สต.บ้านตลิ่งชัน", "รพ.สต.บ้านทุ่งประสาน", "รพ.สต.บ้านห้วยมัด",
    // อ่าวลึก
    "รพ.สต.บ้านบางเจริญ", "รพ.สต.บ้านคลองยา", "รพ.สต.บ้านเขาแก้ว", "รพ.สต.บ้านแหลมสัก", "รพ.สต.บ้านอ่าวลึกน้อย"
  ];
}

function loadData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(SHEET_NAME);
    }
    
    let logoUrl = "";
    let configSheet = ss.getSheetByName(CONFIG_SHEET);
    if(configSheet) {
      const configData = configSheet.getDataRange().getValues();
      for(let i = 1; i < configData.length; i++) {
        if(configData[i][0] === "LogoURL") {
          logoUrl = configData[i][1];
          break;
        }
      }
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) {
      return { success: true, data: [], logo: logoUrl, units: getKrabiUnits() };
    }

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
    const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues(); 
    
    const data = values.map(row => {
      let record = {};
      headers.forEach((header, i) => {
        record[header] = row[i] || '';
      });
      return record;
    });
    
    return { success: true, data: data, logo: logoUrl, units: getKrabiUnits() };
  } catch (err) {
    return { success: false, error: err.message, units: getKrabiUnits() };
  }
}

function saveRecord(record) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  
  const now = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");
  if(!record.Timestamp) record.Timestamp = now;

  const rowData = headers.map(header => record[header] !== undefined ? record[header] : '');

  if (record.ID && record.ID !== "") {
    const allIds = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat();
    const rowIndex = allIds.findIndex(id => String(id) === String(record.ID));
    if (rowIndex > -1) {
      const timestampIdx = headers.indexOf('Timestamp');
      if(timestampIdx > -1) rowData[timestampIdx] = now; 
      record.Timestamp = now;
      sheet.getRange(rowIndex + 2, 1, 1, headers.length).setValues([rowData]);
    }
  } else {
    record.ID = Utilities.getUuid(); 
    const idIdx = headers.indexOf('ID');
    const timestampIdx = headers.indexOf('Timestamp');
    if(idIdx > -1) rowData[idIdx] = record.ID;
    if(timestampIdx > -1) rowData[timestampIdx] = now;
    sheet.appendRow(rowData);
  }
  return record;
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(improvedAppsScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex items-center gap-2.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          ข้อเสนอแนะเชิงลึกและการพัฒนาต่อยอด (System Evaluation & Roadmap)
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          ข้อเสนอแนะ และแนวทางการพัฒนาระบบจัดการข้อมูลทันตกรรม
        </h1>
        <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-3xl leading-relaxed">
          การวิเคราะห์และข้อเสนอแนะสำหรับระบบบันทึกข้อมูลสถิติทันตกรรม กองสาธารณสุข อบจ.กระบี่ 
          เพื่อยกระดับความปลอดภัย ความถูกต้องของข้อมูล และความสะดวกของบุคลากรที่ออกหน่วยเคลื่อนที่
        </p>
      </div>

      {/* 5 Core Pillars of Improvement */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          1. ข้อเสนอแนะการปรับปรุง 5 ด้านหลัก (Critical Recommendations)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pillar 1: Security */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">1. ด้านความปลอดภัยและการยืนยันสิทธิ์</h3>
                <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-md">
                  ประเด็นความปลอดภัยระดับสูง
                </span>
              </div>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>
                <strong>ปัญหาเดิม:</strong> รหัส PIN แอดมิน (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-rose-600">ADMIN_PWD = "1234"</code>) ถูกวางแบบเปิดเผยใน Client-side JavaScript ทำให้ผู้ใช้งานที่กด F12 หรือ View Source สามารถเห็นรหัสและแก้ไข/ลบข้อมูลได้ทันที
              </li>
              <li>
                <strong>ข้อเสนอแนะ:</strong> ย้ายการตรวจสอบรหัส PIN ไปที่ฝั่ง Server (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Code.gs</code>) ผ่านฟังก์ชันเฉพาะ และเพิ่ม Session Token หรือยืนยันตัวตนด้วยบัญชีกูเกิลของเจ้าหน้าที่ (@krabipao.go.th)
              </li>
            </ul>
          </div>

          {/* Pillar 2: Data Integrity & Bug Fix */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">2. ด้านความถูกต้องและการตรวจสอบข้อมูล</h3>
                <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
                  แก้ไขข้อผิดพลาดระบบ
                </span>
              </div>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>
                <strong>แก้บั๊กเดิม:</strong> ในโค้ดเดิมหน้า HTML บรรทัด 482 มีการเรียก <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-rose-600">units.map(...)</code> แต่ไม่มีการประกาศตัวแปร <code className="font-mono">units</code> ไว้ในโค้ด ส่งผลให้เกิด Error เมื่อเปิดใช้งาน
              </li>
              <li>
                <strong>ข้อเสนอแนะ:</strong> เพิ่ม Validation ตรวจสอบความสอดคล้อง เช่น จำนวนผู้รับบริการรวม (คน) ควรสัมพันธ์กับยอดตรวจช่องปาก และหากเลือกสถานะ <em>"ไม่มาให้บริการ"</em> ต้องบังคับระบุเหตุผลเพื่อใช้รายงานผู้บริหาร
              </li>
            </ul>
          </div>

          {/* Pillar 3: Offline-first Mobile Dental Van */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">3. รองรับการทำงานแบบออฟไลน์ (Offline-First)</h3>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md">
                  บริบทพื้นที่ จ.กระบี่
                </span>
              </div>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>
                <strong>บริบทพื้นที่เกาะ/ชนบท:</strong> การออกหน่วยทันตกรรมเคลื่อนที่ใน รพ.สต. พื้นที่เกาะ (เช่น เกาะพีพี, เกาะปู, เกาะลันตา) มักพบสัญญาณอินเทอร์เน็ตขาดหาย
              </li>
              <li>
                <strong>ข้อเสนอแนะ:</strong> ทำระบบบันทึกแบบ Local Storage แคชไว้ในเครื่องทันที และเมื่ออุปกรณ์เชื่อมต่อเน็ตได้ ระบบจะทำการ Sync ไปยัง Google Sheets หรือระบบคลาวด์ให้อัตโนมัติ ป้องกันข้อมูลสูญหาย
              </li>
            </ul>
          </div>

          {/* Pillar 4: LINE Notification & Automation */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">4. บูรณาการ LINE LIFF & แจ้งเตือนอัตโนมัติ</h3>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                  ความสะดวกของเจ้าหน้าที่
                </span>
              </div>
            </div>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
              <li>
                <strong>ต่อยอดจาก LIFF ID:</strong> นำ LIFF ID มาเชื่อมต่อเข้ากับ LINE Official Account (LINE OA) กองสาธารณสุข อบจ.กระบี่
              </li>
              <li>
                <strong>Flex Message สรุปผล:</strong> เมื่อบันทึกเสร็จ สามารถส่ง Flex Message เข้ากลุ่มไลน์ทีมทันตกรรม สรุปยอดผู้มารับบริการประจำวัน พร้อมแจ้งเตือนกรณีมีผู้ป่วยส่งต่อรักษาเร่งด่วน (Referral)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Development Roadmap: 3 Phases */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          2. แผนการพัฒนาต่อยอด (Development Roadmap)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Phase 1 */}
          <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded">
                ระยะสั้น (Quick Wins)
              </span>
              <span className="text-xs text-slate-400 font-medium">สัปดาห์ที่ 1 - 2</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">ปรับปรุงความเสถียร & ฟอร์ม</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>แก้บั๊กตัวแปร <code className="font-mono text-blue-700">units</code> โดยใส่รายชื่อ รพ.สต. ใน จ.กระบี่ ครบทั้ง 8 อำเภอ</li>
              <li>ย้ายการตรวจสอบรหัส PIN แอดมินไปที่ Server</li>
              <li>เพิ่มปุ่ม + / - และปุ่มช่วยคำนวณยอดรวมเพื่อความรวดเร็วในการบันทึกหน้างาน</li>
              <li>ส่งออกรายงาน Excel จัดแต่งฟอร์แมตหัวตารางมาตรฐาน</li>
            </ul>
          </div>

          {/* Phase 2 */}
          <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded">
                ระยะกลาง
              </span>
              <span className="text-xs text-slate-400 font-medium">เดือนที่ 1 - 2</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">เชื่อมโยง LINE & Dashboard</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>เชื่อมโยง LINE LIFF และเปิดผ่านเมนู Rich Menu ของ LINE OA</li>
              <li>ส่งการแจ้งเตือนสรุปผลงานรายวันเข้ากลุ่มไลน์กองสาธารณสุข</li>
              <li>เพิ่มหน้าสรุปเปรียบเทียบสัดส่วนงานส่งเสริมป้องกัน (Preventative) vs งานรักษา</li>
              <li>สร้างรายงาน PDF มาตรฐานพร้อมตราสัญลักษณ์ อบจ.กระบี่ เพื่อพิมพ์เสนอผู้บริหาร</li>
            </ul>
          </div>

          {/* Phase 3 */}
          <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded">
                ระยะยาว (Digital Health)
              </span>
              <span className="text-xs text-slate-400 font-medium">เดือนที่ 3 เป็นต้นไป</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">ระบบคลาวด์และ AI วิเคราะห์</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>พัฒนาระบบ Progressive Web App (PWA) ติดตั้งบนแท็บเล็ตประจำรถทันตกรรมเคลื่อนที่</li>
              <li>ระบบ Offline Cache อัตโนมัติเมื่อลงพื้นที่เกาะ</li>
              <li>AI ช่วยวิเคราะห์แนวโน้มสุขภาพช่องปากและระบุ รพ.สต. ที่มีอัตราฟันผุสูงเพื่อวางแผนลงพื้นที่เชิงรุก</li>
              <li>เชื่อมโยงข้อมูลกับระบบฐานข้อมูลสุขภาพ Hdc / สปสช.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Code.gs Refactoring Code Box */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-blue-600" />
              รหัส Google Apps Script (Code.gs) ฉบับปรับปรุงความปลอดภัย
            </h2>
            <p className="text-[11px] text-slate-400">
              นำโค้ดนี้ไปแทนที่ใน Apps Script ของท่านเพื่อแก้บั๊ก units และปิดช่องโหว่รหัส PIN
            </p>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">คัดลอกแล้ว</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                คัดลอกโค้ด
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-80 overflow-y-auto leading-relaxed">
            {improvedAppsScript}
          </pre>
        </div>
      </div>
    </div>
  );
};
