import React, { useState } from 'react';
import { 
  Settings, 
  Image as ImageIcon, 
  KeyRound, 
  Globe2, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  AlertCircle,
  Building2,
  Lock,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { AppSettings, DentalRecord } from '../types';
import { testGoogleAppsScriptConnection } from '../services/googleSheetService';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  records: DentalRecord[];
  onImportRecords: (records: DentalRecord[]) => void;
  onResetDefaultData: () => void;
  showToast: (msg: string) => void;
  onOpenGoogleSheetModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  records,
  onImportRecords,
  onResetDefaultData,
  showToast,
  onOpenGoogleSheetModal,
}) => {
  const [logoUrl, setLogoUrl] = useState<string>(settings.logoUrl || '');
  const [orgName, setOrgName] = useState<string>(settings.orgName || 'กองสาธารณสุข องค์การบริหารส่วนจังหวัดกระบี่');
  const [deptName, setDeptName] = useState<string>(settings.deptName || 'งานทันตสาธารณสุข');
  const [adminPin, setAdminPin] = useState<string>(settings.adminPin || '1234');
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(settings.appsScriptUrl || '');
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>(settings.googleSheetUrl || '');
  const [autoSync, setAutoSync] = useState<boolean>(settings.autoSync ?? true);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPin || adminPin.length < 4) {
      showToast('รหัส PIN ต้องมีความยาวอย่างน้อย 4 หลัก');
      return;
    }

    onUpdateSettings({
      ...settings,
      logoUrl: logoUrl.trim(),
      orgName: orgName.trim(),
      deptName: deptName.trim(),
      adminPin: adminPin.trim(),
      appsScriptUrl: appsScriptUrl.trim(),
      googleSheetUrl: googleSheetUrl.trim(),
      autoSync: autoSync,
    });
    showToast('บันทึกการตั้งค่าระบบเรียบร้อย');
  };

  const handleTestQuick = async () => {
    if (!appsScriptUrl.trim()) {
      showToast('กรุณากรอก Web App URL ก่อน');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    const res = await testGoogleAppsScriptConnection(appsScriptUrl.trim());
    setIsTesting(false);
    setTestResult(res);
    showToast(res.message);
  };

  // Export JSON backup
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dental_data_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('ดาวน์โหลดไฟล์สำรองข้อมูล JSON สำเร็จ');
  };

  // Import JSON backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          onImportRecords(imported);
          showToast(`นำเข้าข้อมูลสำเร็จ ${imported.length} รายการ`);
        } else {
          showToast('รูปแบบไฟล์ JSON ไม่ถูกต้อง');
        }
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">ตั้งค่าระบบและการเชื่อมต่อ</h1>
            <p className="text-xs text-slate-500">
              กำหนดค่าแบรนดิ้ง รหัสผ่านผู้ดูแลระบบ และสำรองข้อมูล
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          {/* Logo & Branding */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              1. โลโก้และข้อมูลหน่วยงาน
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ที่อยู่ลิงก์ภาพโลโก้ (Logo Image URL)
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://domain.com/krabi_pao_logo.png"
                  className="flex-1 w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="w-full h-full object-contain p-1"
                      onError={() => showToast('ไม่สามารถโหลดตัวอย่างภาพโลโก้ได้')}
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อหน่วยงานหลัก
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อฝ่าย / กลุ่มงาน
                </label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Admin Security PIN */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-rose-600" />
              2. ความปลอดภัยและรหัส PIN ผู้ดูแลระบบ
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รหัส PIN สำหรับแก้ไขหรือลบข้อมูล (4-6 หลัก)
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ''))}
                placeholder="1234"
                className="w-48 text-center text-base tracking-widest font-mono font-bold p-2 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                รหัสเริ่มต้นคือ <code className="font-mono text-slate-600">1234</code> สามารถเปลี่ยนเป็นรหัสเฉพาะของท่านได้
              </p>
            </div>
          </div>

          {/* Google Sheets / Apps Script Database */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                3. ฐานข้อมูล Google Sheets (Database & Two-way Sync)
              </h2>
              {onOpenGoogleSheetModal && (
                <button
                  type="button"
                  onClick={onOpenGoogleSheetModal}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  เปิดคู่มือติดตั้ง & คัดลอกโค้ดสคริปต์ 4 ขั้นตอน
                </button>
              )}
            </div>

            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Apps Script Web App URL (ลงท้ายด้วย /exec)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={appsScriptUrl}
                    onChange={(e) => setAppsScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 text-xs p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestQuick}
                    disabled={isTesting || !appsScriptUrl.trim()}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบ'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  เชื่อมต่อ Google Sheet เข้ากับระบบเพื่อบันทึกและอ่านข้อมูลแบบเรียลไทม์
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ลิงก์เปิดดู Google Sheet (Spreadsheet URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    className="flex-1 text-xs p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {googleSheetUrl && (
                    <a
                      href={googleSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      เปิดชีต
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-700">ซิงก์อัตโนมัติ (Auto-Sync)</span>
                  <p className="text-[11px] text-slate-500">
                    ส่งข้อมูลขึ้น Google Sheet ทันทีเมื่อมีการบันทึกฟอร์ม
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {testResult.success ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              บันทึกการตั้งค่า
            </button>
          </div>
        </form>
      </div>

      {/* Data Backup & Restore */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">การสำรองและกู้คืนฐานข้อมูล</h2>
        <p className="text-xs text-slate-500">
          ดาวน์โหลดไฟล์สำรองข้อมูล JSON หรือนำเข้าข้อมูลเดิมกลับคืนสู่ระบบ
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            ส่งออกไฟล์สำรอง (Export JSON)
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5" />
            นำเข้าไฟล์สำรอง (Import JSON)
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (window.confirm('คุณต้องการรีเซ็ตข้อมูลเป็นข้อมูลตัวอย่างเริ่มต้นของ รพ.สต. ใน จ.กระบี่ หรือไม่?')) {
                onResetDefaultData();
                showToast('รีเซ็ตข้อมูลตัวอย่างเริ่มต้นเรียบร้อย');
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-all ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            รีเซ็ตข้อมูลตัวอย่าง
          </button>
        </div>
      </div>
    </div>
  );
};
