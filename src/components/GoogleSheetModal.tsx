import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Check, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileSpreadsheet, 
  Layers, 
  Download, 
  Upload, 
  Sparkles,
  Play,
  HelpCircle
} from 'lucide-react';
import { AppSettings, DentalRecord } from '../types';
import { 
  testGoogleAppsScriptConnection, 
  fetchFromGoogleAppsScript, 
  saveBatchToGoogleAppsScript,
  COMPLETE_APPS_SCRIPT_CODE 
} from '../services/googleSheetService';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings?: (newSettings: AppSettings) => void;
  onSaveSettings?: (newSettings: AppSettings) => void;
  records: DentalRecord[];
  onImportRecords: (records: DentalRecord[]) => void;
  showToast: (msg: string) => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onSaveSettings,
  records,
  onImportRecords,
  showToast,
}) => {
  const updateSettings = onUpdateSettings || onSaveSettings || (() => {});
  const [activeTab, setActiveTab] = useState<'connect' | 'guide' | 'schema'>('connect');
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(settings.appsScriptUrl || '');
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>(settings.googleSheetUrl || '');
  const [autoSync, setAutoSync] = useState<boolean>(settings.autoSync ?? true);
  
  // Connection Test State
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    latencyMs?: number;
    recordCount?: number;
  } | null>(null);

  // Syncing state
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    updateSettings({
      ...settings,
      appsScriptUrl: appsScriptUrl.trim(),
      googleSheetUrl: googleSheetUrl.trim(),
      autoSync: autoSync,
    });
    showToast('บันทึกการตั้งค่าการเชื่อมต่อ Google Sheets แล้ว');
  };

  const handleTestConnection = async () => {
    if (!appsScriptUrl.trim()) {
      setTestResult({
        tested: true,
        success: false,
        message: 'กรุณากรอก Web App URL ก่อนทำการทดสอบ',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await testGoogleAppsScriptConnection(appsScriptUrl.trim());
    setIsTesting(false);
    setTestResult({
      tested: true,
      success: result.success,
      message: result.message,
      latencyMs: result.latencyMs,
      recordCount: result.recordCount,
    });

    if (result.success) {
      showToast('ทดสอบการเชื่อมต่อสำเร็จ! Google Sheet พร้อมใช้งาน');
      // Also update settings automatically on successful test
      updateSettings({
        ...settings,
        appsScriptUrl: appsScriptUrl.trim(),
        googleSheetUrl: googleSheetUrl.trim(),
        autoSync: autoSync,
        lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      });
    }
  };

  // Pull data from Google Sheet
  const handlePullFromSheet = async () => {
    if (!appsScriptUrl.trim()) {
      showToast('กรุณากรอกและบันทึก Web App URL ก่อน');
      return;
    }

    setIsPulling(true);
    const result = await fetchFromGoogleAppsScript(appsScriptUrl.trim());
    setIsPulling(false);

    if (result.success && result.data) {
      if (result.data.length === 0) {
        showToast('เชื่อมต่อสำเร็จ แต่ยังไม่มีแถวข้อมูลใน Google Sheet');
      } else {
        onImportRecords(result.data);
        showToast(`ดึงข้อมูลจาก Google Sheet สำเร็จแล้ว ${result.data.length} รายการ`);
        updateSettings({
          ...settings,
          lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    } else {
      showToast(result.error || 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Google Sheet');
    }
  };

  // Push all local data to Google Sheet
  const handlePushToSheet = async () => {
    if (!appsScriptUrl.trim()) {
      showToast('กรุณากรอกและบันทึก Web App URL ก่อน');
      return;
    }

    if (records.length === 0) {
      showToast('ไม่มีข้อมูลในระบบที่จะส่งขึ้น Google Sheet');
      return;
    }

    if (!window.confirm(`คุณต้องการส่งข้อมูลทั้งหมด ${records.length} รายการ ขึ้นสู่ Google Sheet หรือไม่?`)) {
      return;
    }

    setIsPushing(true);
    const result = await saveBatchToGoogleAppsScript(appsScriptUrl.trim(), records);
    setIsPushing(false);

    if (result.success) {
      showToast(`ส่งข้อมูล ${records.length} รายการ ขึ้น Google Sheet เรียบร้อยแล้ว`);
      updateSettings({
        ...settings,
        lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      });
    } else {
      showToast(result.error || 'เกิดข้อผิดพลาดในการส่งข้อมูลขึ้น Google Sheet');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(COMPLETE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                เชื่อมต่อฐานข้อมูล Google Sheets
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Real-time Database
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                ซิงก์ข้อมูลสองทางระหว่างระบบทันตกรรมและสเปรดชีตของท่านโดยตรง
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('connect')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'connect'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            1. ตั้งค่าการเชื่อมต่อ & ซิงก์
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            2. โค้ด Apps Script & วิธีติดตั้ง (4 ขั้นตอน)
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'schema'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            3. โครงสร้าง 16 คอลัมน์ในชีต
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tab 1: Connect & Sync */}
          {activeTab === 'connect' && (
            <div className="space-y-5">
              {/* Status banner */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                appsScriptUrl.trim()
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/60 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    appsScriptUrl.trim() ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {appsScriptUrl.trim() ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold">
                      {appsScriptUrl.trim() ? 'พร้อมใช้งานฐานข้อมูล Google Sheets' : 'ยังไม่ได้ระบุ Web App URL'}
                    </h3>
                    <p className="text-[11px] opacity-80">
                      {appsScriptUrl.trim() 
                        ? `เชื่อมต่อกับ Google Apps Script แล้ว (ข้อมูลในแอพ: ${records.length} แถว)`
                        : 'นำ URL ที่ได้จากการ Deploy Web App มาวางด้านล่างเพื่อเริ่มการซิงก์'}
                    </p>
                  </div>
                </div>

                {settings.lastSyncedAt && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium shrink-0 bg-white/80 px-2.5 py-1 rounded-md border border-slate-200">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>ซิงก์ล่าสุด: {settings.lastSyncedAt} น.</span>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <div className="space-y-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Google Apps Script Web App URL (สำคัญที่สุด) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={appsScriptUrl}
                      onChange={(e) => {
                        setAppsScriptUrl(e.target.value);
                        setTestResult(null);
                      }}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 text-xs p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting || !appsScriptUrl.trim()}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      {isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ต้องเป็น URL ที่ลงท้ายด้วย <code className="font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded">/exec</code> และเปิดสิทธิ์ Anyone
                  </p>
                </div>

                {/* Optional Google Sheet Link */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ลิงก์ Google Sheet ของท่าน (เพื่อความสะดวกในการเปิดดูชีตจริง)
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
                        เปิด Google Sheet
                      </a>
                    )}
                  </div>
                </div>

                {/* Auto Sync Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-800">ซิงก์อัตโนมัติ (Auto-Sync on Save)</span>
                    <p className="text-[11px] text-slate-500">
                      เมื่อมีการกดบันทึกหรือแก้ไขข้อมูลในฟอร์ม จะส่งเข้า Google Sheet ทันที
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
              </div>

              {/* Test Result Box */}
              {testResult && (
                <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold">{testResult.message}</p>
                    {testResult.success && testResult.recordCount !== undefined && (
                      <p className="text-[11px] mt-0.5 opacity-90">
                        พร้อมใช้งาน สามารถกดปุ่ม <strong>"ดึงข้อมูลจาก Google Sheet"</strong> ด้านล่างเพื่อโหลดข้อมูลจริงเข้าสู่ระบบได้ทันที
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Data Operations */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  การจัดการและถ่ายโอนข้อมูล (Data Transfer)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pull Button */}
                  <button
                    type="button"
                    onClick={handlePullFromSheet}
                    disabled={isPulling || !appsScriptUrl.trim()}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all hover:border-blue-400 group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Download className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-800">
                        {isPulling ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลจาก Google Sheet (Pull)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      ดาวน์โหลดข้อมูลล่าสุดจากสเปรดชีตมาแสดงในหน้าตารางและแดชบอร์ด
                    </p>
                  </button>

                  {/* Push Button */}
                  <button
                    type="button"
                    onClick={handlePushToSheet}
                    disabled={isPushing || !appsScriptUrl.trim() || records.length === 0}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-all hover:border-emerald-400 group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Upload className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-800">
                        {isPushing ? 'กำลังส่งข้อมูล...' : `ส่งข้อมูลในแอพขึ้น Sheet (${records.length} แถว)`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      ส่งข้อมูลตัวอย่าง/ข้อมูลที่มีอยู่ทั้งหมดในระบบไปบันทึกสำรองในชีต
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Apps Script Setup Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              {/* Step by Step */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  วิธีนำ Google Sheet มาเป็นฐานข้อมูล (ทำเพียงครั้งเดียว ภายใน 3 นาที)
                </h3>

                <div className="space-y-3 text-xs text-slate-600">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">เปิด Google Sheet และเข้าสู่ Apps Script</h4>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        เปิดไฟล์ Google Sheet ของท่านที่ต้องการใช้เก็บข้อมูลทันตกรรม แล้วคลิกเมนูด้านบน: 
                        <span className="font-semibold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-300 mx-1">
                          ส่วนขยาย (Extensions)
                        </span> 
                        ➔ 
                        <span className="font-semibold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-300 mx-1">
                          Apps Script
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">คัดลอกโค้ดสคริปต์ไปวาง และกดบันทึก</h4>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        ลบโค้ดเดิมในไฟล์ <code className="font-mono text-blue-600">Code.gs</code> ออกทั้งหมด แล้วกดปุ่ม <strong>"คัดลอกโค้ด"</strong> ด้านล่างนำไปวาง จากนั้นกดปุ่มเซฟ (รูปแผ่นดิสก์)
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">สร้างหัวตารางอัตโนมัติ (รันฟังก์ชัน setupSheet)</h4>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        ในแถบเครื่องมือด้านบน เลือกฟังก์ชัน <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300">setupSheet</code> แล้วกดปุ่ม <strong>เรียกใช้ (Run)</strong> เพื่อให้ระบบสร้างแท็บ <em>DentalData</em> และหัวตาราง 16 คอลัมน์พร้อมตกแต่งสีสันให้ทันที
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      4
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900">ทำให้ใช้งานได้เป็น Web App (สำคัญมาก)</h4>
                      <p className="mt-0.5 text-[11px] text-emerald-800">
                        กดปุ่มสีฟ้ามุมขวาบน <strong>ทำให้ใช้งานได้ (Deploy)</strong> ➔ <strong>การทำให้ใช้งานได้ใหม่ (New deployment)</strong>
                        <br />• เลือกประเภท: <strong>เว็บแอป (Web app)</strong>
                        <br />• ผู้มีสิทธิ์เข้าถึง (Who has access): เลือกเป็น <strong>ทุกคน (Anyone)</strong>
                        <br />• คัดลอก <strong>Web App URL</strong> ที่ได้ (ลงท้ายด้วย <code className="font-mono">/exec</code>) นำมาใส่ในแท็บที่ 1 ของแอพนี้
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    โค้ด Google Apps Script (Code.gs) ที่พร้อมใช้งานทันที:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>คัดลอกสำเร็จแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอกโค้ดทั้งหมด (Click to Copy)</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72 overflow-y-auto leading-relaxed border border-slate-800">
                  {COMPLETE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            </div>
          )}

          {/* Tab 3: Schema Reference */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-950">
                    โครงสร้างชีตมาตรฐาน 19 คอลัมน์ (Sheet 1: DentalData) และชีตหน่วยบริการ (Sheet 2: HealthCenters)
                  </p>
                  <p className="mt-0.5 text-blue-800">
                    ระบบรองรับทั้งภาษาไทยและอังกฤษ มีฟังก์ชันจัดเรียงตามวันเวลาอัตโนมัติ (<code className="bg-blue-100/80 px-1 rounded font-mono">sortDentalSheet()</code>) และเชื่อมโยงรหัส 44 รพ.สต. ในสังกัด อบจ.กระบี่
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 border-b border-slate-200 flex items-center justify-between">
                  <span>ชีต 1: DentalData (ตารางบันทึกการออกหน่วยทันตกรรม 19 คอลัมน์)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    จัดเรียงล่าสุดก่อน (Auto Sorted)
                  </span>
                </div>
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2.5">คอลัมน์</th>
                        <th className="p-2.5">ภาษาอังกฤษ (Field)</th>
                        <th className="p-2.5">ภาษาไทย</th>
                        <th className="p-2.5">ประเภท</th>
                        <th className="p-2.5">ตัวอย่างข้อมูล</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-600">
                      <tr>
                        <td className="p-2.5 font-bold text-slate-800 font-mono">A</td>
                        <td className="p-2.5 font-mono text-blue-600">ID</td>
                        <td className="p-2.5">รหัสอ้างอิง</td>
                        <td className="p-2.5">ข้อความ (Key)</td>
                        <td className="p-2.5 text-slate-400 font-mono">rec-1741500001</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800 font-mono">B</td>
                        <td className="p-2.5 font-mono text-blue-600">Timestamp</td>
                        <td className="p-2.5">วันที่บันทึก / วันเวลา</td>
                        <td className="p-2.5">วันที่และเวลา</td>
                        <td className="p-2.5 text-slate-400">07/09/2026 10:30:00</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-800 font-mono">C</td>
                        <td className="p-2.5 font-mono text-blue-600">UnitCode</td>
                        <td className="p-2.5 font-semibold text-slate-900">รหัสหน่วยบริการ</td>
                        <td className="p-2.5">รหัส 5 หลัก</td>
                        <td className="p-2.5 text-slate-400 font-mono">08995</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800 font-mono">D</td>
                        <td className="p-2.5 font-mono text-blue-600">Unit</td>
                        <td className="p-2.5 font-semibold text-slate-900">หน่วยบริการ (รพ.สต.)</td>
                        <td className="p-2.5">ข้อความ</td>
                        <td className="p-2.5 text-slate-400">รพ.สต.บ้านช่องพลี</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-800 font-mono">E</td>
                        <td className="p-2.5 font-mono text-blue-600">District</td>
                        <td className="p-2.5">อำเภอ</td>
                        <td className="p-2.5">ข้อความ</td>
                        <td className="p-2.5 text-slate-400">เมือง</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800 font-mono">F</td>
                        <td className="p-2.5 font-mono text-blue-600">UnitSize</td>
                        <td className="p-2.5">ขนาด</td>
                        <td className="p-2.5">L / M / S</td>
                        <td className="p-2.5 text-slate-400">L</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-800 font-mono">G</td>
                        <td className="p-2.5 font-mono text-blue-600">Affiliation</td>
                        <td className="p-2.5">สังกัด</td>
                        <td className="p-2.5">ข้อความ</td>
                        <td className="p-2.5 text-slate-400">อบจ.กระบี่</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800 font-mono">H</td>
                        <td className="p-2.5 font-mono text-blue-600">Recorder</td>
                        <td className="p-2.5">ผู้บันทึกข้อมูล</td>
                        <td className="p-2.5">ข้อความ</td>
                        <td className="p-2.5 text-slate-400">ทพญ.ศิริพร บุญยืน</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-800 font-mono">I</td>
                        <td className="p-2.5 font-mono text-blue-600">Status</td>
                        <td className="p-2.5 font-semibold text-emerald-700">สถานะการให้บริการ</td>
                        <td className="p-2.5">มา / ไม่มา</td>
                        <td className="p-2.5 text-slate-400">มา</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800 font-mono">J</td>
                        <td className="p-2.5 font-mono text-blue-600">PersonCount</td>
                        <td className="p-2.5">ผู้รับบริการรวม (คน)</td>
                        <td className="p-2.5">ตัวเลข</td>
                        <td className="p-2.5 text-slate-400 font-mono">28</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-800 font-mono">K</td>
                        <td className="p-2.5 font-mono text-blue-600">ServiceCount</td>
                        <td className="p-2.5">ให้บริการรวม (ครั้ง)</td>
                        <td className="p-2.5">ตัวเลข</td>
                        <td className="p-2.5 text-slate-400 font-mono">34</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800 font-mono">L - R</td>
                        <td className="p-2.5 font-mono text-blue-600">ExamCount ... ReferCount</td>
                        <td className="p-2.5">ตรวจ, ถอน, อุด, ขูด, เคลือบ, ซีลแลนต์, ส่งต่อ</td>
                        <td className="p-2.5">ตัวเลข 7 รายการ</td>
                        <td className="p-2.5 text-slate-400 font-mono">15, 6, 8, 5, 0, 0, 0</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-slate-800 font-mono">S</td>
                        <td className="p-2.5 font-mono text-blue-600">Notes</td>
                        <td className="p-2.5">หมายเหตุ / ชี้แจงเหตุผล</td>
                        <td className="p-2.5">ข้อความ</td>
                        <td className="p-2.5 text-slate-400">ตรวจกลุ่มเด็กนักเรียน</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sheet 2 Info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>ชีต 2: HealthCenters (บัญชีรายชื่อ รพ.สต. 44 แห่ง อบจ.กระบี่)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  มีคอลัมน์: <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[11px]">รหัสหน่วยบริการ | อำเภอ | ชื่อหน่วยบริการ | ขนาด | สถานะ | สังกัด</code>
                  <br />ถูกสร้างและเติมข้อมูลโดยอัตโนมัติเมื่อสั่งรันฟังก์ชัน <code className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded font-mono font-semibold">setupSheet()</code> ใน Google Apps Script
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            ปิดหน้าต่าง
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
