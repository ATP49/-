import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Lock, 
  Unlock, 
  X, 
  Sparkles, 
  Building2, 
  AlertCircle,
  FileSpreadsheet,
  RefreshCw 
} from 'lucide-react';
import { DentalRecord, AppSettings, ActiveTab } from './types';
import { INITIAL_DENTAL_RECORDS } from './data/krabiHealthCenters';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { FormView } from './components/FormView';
import { TableView } from './components/TableView';
import { AnalysisTab } from './components/AnalysisTab';
import { SettingsView } from './components/SettingsView';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { 
  fetchFromGoogleAppsScript, 
  saveRecordToGoogleAppsScript, 
  deleteRecordFromGoogleAppsScript,
  normalizeRecord
} from './services/googleSheetService';

const STORAGE_KEY_RECORDS = 'krabi_dental_records_v1';
const STORAGE_KEY_SETTINGS = 'krabi_dental_settings_v1';

export default function App() {
  // Application State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [records, setRecords] = useState<DentalRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize every record so it aligns with all 19 columns
          return parsed.map((r, i) => normalizeRecord(r, i));
        }
      }
    } catch (e) {
      console.error('Error loading records from localStorage:', e);
    }
    return INITIAL_DENTAL_RECORDS.map((r, i) => normalizeRecord(r, i));
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading settings from localStorage:', e);
    }
    return {
      logoUrl: '',
      orgName: 'กองสาธารณสุข องค์การบริหารส่วนจังหวัดกระบี่',
      deptName: 'งานทันตสาธารณสุข',
      adminPin: '1234',
      appsScriptUrl: '',
      googleSheetUrl: '',
      autoSync: true,
    };
  });

  // Admin and modal state
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [googleSheetModalOpen, setGoogleSheetModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  // Edit record state
  const [editingRecord, setEditingRecord] = useState<DentalRecord | null>(null);

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save records to localStorage:', e);
    }
  }, [records]);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Toggle Admin status
  const handleToggleAdmin = () => {
    if (isAdmin) {
      setIsAdmin(false);
      showToast('ออกจากโหมดผู้ดูแลระบบแล้ว');
    } else {
      setEnteredPin('');
      setPinError(false);
      setAdminModalOpen(true);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === settings.adminPin) {
      setIsAdmin(true);
      setAdminModalOpen(false);
      showToast('เข้าสู่โหมดผู้ดูแลระบบเรียบร้อย');
    } else {
      setPinError(true);
    }
  };

  // Sync data with Google Sheets
  const handleSyncGoogleSheet = async (notify: boolean = true) => {
    if (!settings.appsScriptUrl) {
      setGoogleSheetModalOpen(true);
      return;
    }
    setIsSyncing(true);
    const result = await fetchFromGoogleAppsScript(settings.appsScriptUrl);
    setIsSyncing(false);
    if (result.success && result.data) {
      setRecords(result.data);
      const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      setSettings((prev) => ({
        ...prev,
        lastSyncedAt: timeStr,
      }));
      if (notify) {
        showToast(`ซิงก์ข้อมูลจาก Google Sheet สำเร็จ (${result.data.length} รายการ)`);
      }
    } else if (notify) {
      showToast(result.error || 'ไม่สามารถซิงก์ข้อมูลจาก Google Sheet ได้');
    }
  };

  // Save new or edited record
  const handleSaveRecord = async (record: DentalRecord) => {
    // 1. Update local state immediately
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = record;
        return next;
      }
      return [record, ...prev];
    });
    setEditingRecord(null);
    setActiveTab('table');

    // 2. Sync to Google Sheet if configured
    if (settings.appsScriptUrl && settings.autoSync) {
      showToast('กำลังบันทึกลง Google Sheet...');
      const res = await saveRecordToGoogleAppsScript(settings.appsScriptUrl, record);
      if (res.success) {
        const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
        setSettings((prev) => ({ ...prev, lastSyncedAt: timeStr }));
        showToast('บันทึกและซิงก์ลง Google Sheet สำเร็จแล้ว');
      } else {
        showToast('บันทึกลงเครื่องแล้ว (การซิงก์ Google Sheet ขัดข้อง)');
      }
    } else {
      showToast('บันทึกข้อมูลในระบบเรียบร้อย');
    }
  };

  // Delete record
  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (settings.appsScriptUrl && settings.autoSync) {
      deleteRecordFromGoogleAppsScript(settings.appsScriptUrl, id);
      showToast('ลบข้อมูลในระบบและ Google Sheet เรียบร้อย');
    } else {
      showToast('ลบรายการข้อมูลเรียบร้อย');
    }
  };

  // Edit trigger
  const handleEditRecord = (record: DentalRecord) => {
    setEditingRecord(record);
    setActiveTab('form');
  };

  // Normalize all records to designated 19 columns
  const handleNormalizeRecords = () => {
    const normalized = records.map((r, i) => normalizeRecord(r, i));
    setRecords(normalized);
    showToast(`จัดระเบียบข้อมูลทั้งหมด ${normalized.length} รายการ ให้ตรงตาม 19 คอลัมน์มาตรฐานเรียบร้อยแล้ว`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-800 antialiased font-['Kanit',sans-serif]">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={isAdmin}
        onToggleAdmin={handleToggleAdmin}
        settings={settings}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        recordCount={records.length}
        onOpenGoogleSheetModal={() => setGoogleSheetModalOpen(true)}
        isSyncing={isSyncing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            records={records}
            onNavigateToForm={() => setActiveTab('form')}
            onNavigateToTable={() => setActiveTab('table')}
            isAdmin={isAdmin}
            onRequestAdmin={() => {
              setEnteredPin('');
              setPinError(false);
              setAdminModalOpen(true);
            }}
            onNavigateToAnalysis={() => setActiveTab('analysis')}
          />
        )}

        {activeTab === 'form' && (
          <FormView
            onSaveRecord={handleSaveRecord}
            editingRecord={editingRecord}
            onCancelEdit={() => setEditingRecord(null)}
            showToast={showToast}
          />
        )}

        {activeTab === 'table' && (
          <TableView
            records={records}
            isAdmin={isAdmin}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            onRequestAdmin={() => {
              setEnteredPin('');
              setPinError(false);
              setAdminModalOpen(true);
            }}
            showToast={showToast}
            settings={settings}
            onOpenGoogleSheetModal={() => setGoogleSheetModalOpen(true)}
            onSyncGoogleSheet={() => handleSyncGoogleSheet(true)}
            isSyncing={isSyncing}
            onNormalizeRecords={handleNormalizeRecords}
          />
        )}

        {activeTab === 'analysis' && (
          isAdmin ? (
            <AnalysisTab />
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-lg mx-auto my-12 space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900">
                  เฉพาะผู้ดูแลระบบ (Admin)
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  หน้า &quot;ข้อเสนอแนะ และแนวทางการพัฒนาระบบจัดการข้อมูลทันตกรรม&quot; ได้รับการกำหนดสิทธิ์ให้เข้าถึงได้เฉพาะผู้ดูแลระบบที่มีรหัสผ่าน Admin เท่านั้น
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  กลับหน้าแดชบอร์ด
                </button>
                <button
                  onClick={() => {
                    setEnteredPin('');
                    setPinError(false);
                    setAdminModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  ยืนยันรหัส PIN Admin
                </button>
              </div>
            </div>
          )
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            records={records}
            onImportRecords={(imported) => {
              setRecords(imported);
              setActiveTab('table');
            }}
            onResetDefaultData={() => setRecords(INITIAL_DENTAL_RECORDS)}
            showToast={showToast}
            onOpenGoogleSheetModal={() => setGoogleSheetModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-5 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium">
            พัฒนาโดย นายอรรถพล คงมาก กองสาธารณสุข องค์การบริหารส่วนจังหวัดกระบี่
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>ระบบบันทึกและสารสนเทศทันตกรรม</span>
            <span>•</span>
            <button
              onClick={() => setActiveTab('analysis')}
              className="text-blue-600 hover:underline font-medium"
            >
              ข้อเสนอแนะ & แผนพัฒนาต่อ
            </button>
          </div>
        </div>
      </footer>

      {/* Admin Authentication Modal */}
      {adminModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xs w-full p-6 text-center relative border border-slate-100">
            <button
              onClick={() => setAdminModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900">ยืนยันสิทธิ์ผู้ดูแลระบบ</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              ระบุรหัส PIN 4 หลักเพื่อเข้าสู่โหมดจัดการแก้ไขและลบข้อมูล
            </p>

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value.replace(/\D/g, ''));
                  setPinError(false);
                }}
                autoFocus
                placeholder="••••"
                className="w-full text-center text-xl font-mono tracking-widest font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />

              {pinError && (
                <p className="text-[11px] text-rose-500 font-semibold flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  รหัส PIN ไม่ถูกต้อง (ค่าเริ่มต้น: 1234)
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  ยืนยัน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Sheet Integration Modal */}
      <GoogleSheetModal
        isOpen={googleSheetModalOpen}
        onClose={() => setGoogleSheetModalOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onSaveSettings={setSettings}
        records={records}
        onImportRecords={(imported) => {
          setRecords(imported);
          setActiveTab('table');
        }}
        showToast={showToast}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
