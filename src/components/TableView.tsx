import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Download, 
  Printer, 
  Trash2, 
  Edit3, 
  Filter, 
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  RefreshCw,
  ExternalLink,
  Database,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Columns,
  Layers
} from 'lucide-react';
import { DentalRecord, AppSettings } from '../types';
import { KRABI_HEALTH_CENTERS } from '../data/krabiHealthCenters';

interface TableViewProps {
  records: DentalRecord[];
  isAdmin: boolean;
  onEditRecord: (record: DentalRecord) => void;
  onDeleteRecord: (id: string) => void;
  onRequestAdmin: () => void;
  showToast: (msg: string) => void;
  settings: AppSettings;
  onOpenGoogleSheetModal: () => void;
  onSyncGoogleSheet: () => void;
  isSyncing?: boolean;
  onNormalizeRecords?: () => void;
}

type SortField = 
  | 'id'
  | 'timestamp' 
  | 'unitCode'
  | 'unit' 
  | 'district' 
  | 'unitSize'
  | 'affiliation'
  | 'recorder' 
  | 'status' 
  | 'personCount' 
  | 'serviceCount' 
  | 'examCount' 
  | 'extractionCount' 
  | 'fillingCount' 
  | 'scalingCount' 
  | 'fluorideCount' 
  | 'sealantCount' 
  | 'referCount';

export const TableView: React.FC<TableViewProps> = ({
  records,
  isAdmin,
  onEditRecord,
  onDeleteRecord,
  onRequestAdmin,
  showToast,
  settings,
  onOpenGoogleSheetModal,
  onSyncGoogleSheet,
  isSyncing = false,
  onNormalizeRecords,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'มา' | 'ไม่มา'>('all');
  const [viewMode, setViewMode] = useState<'standard19' | 'compact'>('standard19');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'timestamp' || field === 'personCount' || field === 'serviceCount' ? 'desc' : 'asc');
    }
  };

  // Helper date parse function
  const parseDateValue = (str: string): number => {
    if (!str) return 0;
    const match = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      let year = parseInt(match[3], 10);
      if (year > 2500) year -= 543; // Handle Buddhist Era
      const hour = match[4] ? parseInt(match[4], 10) : 0;
      const min = match[5] ? parseInt(match[5], 10) : 0;
      const sec = match[6] ? parseInt(match[6], 10) : 0;
      return new Date(year, month, day, hour, min, sec).getTime();
    }
    const parsed = Date.parse(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    const filtered = records.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.unit.toLowerCase().includes(q) ||
        (r.unitCode && r.unitCode.toLowerCase().includes(q)) ||
        (r.unitSize && r.unitSize.toLowerCase().includes(q)) ||
        (r.affiliation && r.affiliation.toLowerCase().includes(q)) ||
        r.recorder.toLowerCase().includes(q) ||
        (r.district && r.district.toLowerCase().includes(q)) ||
        r.notes.toLowerCase().includes(q) ||
        r.timestamp.toLowerCase().includes(q)
      );
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'timestamp') {
        const timeA = parseDateValue(a.timestamp);
        const timeB = parseDateValue(b.timestamp);
        comparison = timeA - timeB;
      } else if (
        sortField === 'personCount' || 
        sortField === 'serviceCount' || 
        sortField === 'examCount' || 
        sortField === 'extractionCount' || 
        sortField === 'fillingCount' || 
        sortField === 'scalingCount' || 
        sortField === 'fluorideCount' || 
        sortField === 'sealantCount' || 
        sortField === 'referCount'
      ) {
        comparison = (a[sortField] || 0) - (b[sortField] || 0);
      } else {
        const valA = String(a[sortField] || '');
        const valB = String(b[sortField] || '');
        comparison = valA.localeCompare(valB, 'th');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [records, searchTerm, statusFilter, sortField, sortOrder]);

  // Export to Excel with XLSX library (Dual Sheet: Dental Records + 44 Health Centers)
  const handleExportExcel = () => {
    if (records.length === 0) {
      showToast('ไม่มีข้อมูลสำหรับส่งออก Excel');
      return;
    }

    // Sheet 1: Dental Records (19 arranged columns)
    const dentalHeaders = [
      'ลำดับ',
      'รหัสอ้างอิง (ID)',
      'วันเวลาที่บันทึก (Timestamp)',
      'รหัสหน่วยบริการ (UnitCode)',
      'หน่วยบริการ (รพ.สต.)',
      'อำเภอ (District)',
      'ขนาด (Size)',
      'สังกัด (Affiliation)',
      'ผู้บันทึกข้อมูล (Recorder)',
      'สถานะการให้บริการ (Status)',
      'ผู้รับบริการรวม (คน)',
      'ให้บริการรวม (ครั้ง)',
      'ตรวจช่องปาก (คน)',
      'ถอนฟัน (คน)',
      'อุดฟัน (คน)',
      'ขูดหินปูน (คน)',
      'เคลือบฟลูออไรด์ (คน)',
      'เคลือบหลุมร่องฟัน (คน)',
      'ส่งต่อรักษา (คน)',
      'หมายเหตุ / ชี้แจงเหตุผล (Notes)',
    ];

    const dentalRows = filteredRecords.map((r, idx) => {
      const center = KRABI_HEALTH_CENTERS.find(c => c.name === r.unit || (r.unitCode && c.code === r.unitCode));
      return [
        idx + 1,
        r.id,
        r.timestamp,
        r.unitCode || (center ? center.code : ''),
        r.unit,
        r.district || (center ? center.district : 'เมือง'),
        r.unitSize || (center ? center.size : 'M'),
        r.affiliation || (center ? center.affiliation : 'อบจ.กระบี่'),
        r.recorder,
        r.status,
        r.personCount,
        r.serviceCount,
        r.examCount,
        r.extractionCount,
        r.fillingCount,
        r.scalingCount,
        r.fluorideCount,
        r.sealantCount,
        r.referCount,
        r.notes,
      ];
    });

    const ws1 = XLSX.utils.aoa_to_sheet([dentalHeaders, ...dentalRows]);
    ws1['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 20 },
      { wch: 14 },
      { wch: 24 },
      { wch: 12 },
      { wch: 8 },
      { wch: 12 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 30 },
    ];

    // Sheet 2: Official 44 Krabi Health Centers master list
    const centerHeaders = ['รหัสหน่วยบริการ', 'อำเภอ', 'ชื่อหน่วยบริการ', 'ขนาด', 'สถานะ', 'สังกัด'];
    const centerRows = KRABI_HEALTH_CENTERS.map(c => [
      c.code,
      c.district,
      c.name,
      c.size,
      c.status,
      c.affiliation,
    ]);

    const ws2 = XLSX.utils.aoa_to_sheet([centerHeaders, ...centerRows]);
    ws2['!cols'] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 26 },
      { wch: 8 },
      { wch: 10 },
      { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'DentalData');
    XLSX.utils.book_append_sheet(wb, ws2, 'HealthCenters_44');
    XLSX.writeFile(wb, `รายงานทันตกรรม_อบจ_กระบี่_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('ดาวน์โหลดไฟล์ Excel (จัดเรียง 19 คอลัมน์ + ชีต รพ.สต. 44 แห่ง) สำเร็จ');
  };

  // Helper for rendering sort arrows in thead
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 inline ml-1 transition-colors" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-blue-600 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-blue-600 inline ml-1" />
    );
  };

  // Print friendly view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Google Sheet Database Integration Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 rounded-2xl shadow-sm border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                ฐานข้อมูล Google Sheets
              </span>
              {settings.appsScriptUrl ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  เชื่อมต่อแล้ว
                </span>
              ) : (
                <span className="text-[10px] font-medium bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                  โหมดบันทึกในเครื่อง (Local Storage)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {settings.appsScriptUrl
                ? `ซิงก์ข้อมูล 2 ทางอัตโนมัติ${settings.lastSyncedAt ? ` • ซิงก์ล่าสุด: ${settings.lastSyncedAt} น.` : ''}`
                : 'เชื่อมต่อ Google Sheet เพื่อซิงก์ข้อมูลสองทางกับ อบจ.กระบี่ และเข้าถึงได้จากทุกอุปกรณ์'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {settings.appsScriptUrl && (
            <button
              onClick={onSyncGoogleSheet}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              title="ดึงข้อมูลล่าสุดจาก Google Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังซิงก์...' : 'ซิงก์ข้อมูลทันที'}</span>
            </button>
          )}

          {settings.googleSheetUrl && (
            <a
              href={settings.googleSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-xl border border-slate-600 transition-all"
              title="เปิดดูไฟล์ Google Sheet จริง"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">เปิดชีต</span>
            </a>
          )}

          <button
            onClick={onOpenGoogleSheetModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl border border-white/10 transition-all"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{settings.appsScriptUrl ? 'ตั้งค่าชีต' : 'เชื่อมต่อ Google Sheet'}</span>
          </button>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-auto flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาตาม รพ.สต., รหัส, ผู้บันทึก, อำเภอ, หมายเหตุ..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Normalize to 19 columns button */}
          {onNormalizeRecords && (
            <button
              onClick={onNormalizeRecords}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 shadow-xs transition-all"
              title="ตรวจสอบและจัดระเบียบข้อมูลทุกแถวให้ตรงตาม 19 คอลัมน์มาตรฐาน (A-S)"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>จัดข้อมูลลง 19 คอลัมน์</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-xl text-xs">
            <button
              onClick={() => setViewMode('standard19')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'standard19'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="แสดงครบทั้ง 19 คอลัมน์มาตรฐาน (A-S) แยกรายฟิลด์ชัดเจน"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>19 คอลัมน์มาตรฐาน</span>
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'compact'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="แสดงแบบรวมกลุ่มหน่วยบริการเพื่อความกะทัดรัด"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>มุมมองกะทัดรัด</span>
            </button>
          </div>

          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split('-');
                setSortField(f as SortField);
                setSortOrder(o as 'asc' | 'desc');
              }}
              className="bg-transparent outline-none cursor-pointer text-xs"
            >
              <option value="timestamp-desc">จัดเรียง: วันเวลาล่าสุด (ใหม่ → เก่า)</option>
              <option value="timestamp-asc">จัดเรียง: วันเวลาเริ่มต้น (เก่า → ใหม่)</option>
              <option value="id-asc">จัดเรียง: รหัส (ID)</option>
              <option value="unitCode-asc">จัดเรียง: รหัสหน่วยบริการ</option>
              <option value="unit-asc">จัดเรียง: รพ.สต. (ก → ฮ)</option>
              <option value="district-asc">จัดเรียง: อำเภอ</option>
              <option value="personCount-desc">จัดเรียง: ผู้รับบริการ (มาก → น้อย)</option>
              <option value="serviceCount-desc">จัดเรียง: หัตถการรวม (มาก → น้อย)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent outline-none cursor-pointer"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="มา">มาให้บริการ</option>
              <option value="ไม่มา">ไม่มาให้บริการ</option>
            </select>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            ส่งออก Excel (2 ชีต)
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            พิมพ์
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table info banner */}
        <div className="px-5 py-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">
              พบทั้งหมด <strong>{filteredRecords.length}</strong> รายการ
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-100">
              {viewMode === 'standard19' ? 'โหมด 19 คอลัมน์มาตรฐาน (A-S)' : 'โหมดกะทัดรัด (Compact)'}
            </span>
            <span className="text-[11px] text-slate-400 hidden lg:inline">
              (จัดระเบียบข้อมูลสอดคล้องกับ Google Sheet และ Excel ทุกฟิลด์)
            </span>
          </div>
          {!isAdmin && (
            <button
              onClick={onRequestAdmin}
              className="text-blue-600 hover:underline font-semibold text-[11px]"
            >
              เข้าสู่โหมด Admin เพื่อแก้ไข/ลบข้อมูล
            </button>
          )}
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/95 sticky top-0 z-10 text-slate-600 font-bold border-b border-slate-200 shadow-xs">
              {viewMode === 'standard19' ? (
                /* Standard 19 Columns Header */
                <tr>
                  <th onClick={() => handleSort('id')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">A</span>
                      <span>ID</span>
                      {renderSortIcon('id')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('timestamp')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">B</span>
                      <span>วันเวลา</span>
                      {renderSortIcon('timestamp')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('unitCode')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">C</span>
                      <span>รหัส รพ.สต.</span>
                      {renderSortIcon('unitCode')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('unit')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">D</span>
                      <span>หน่วยบริการ</span>
                      {renderSortIcon('unit')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('district')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">E</span>
                      <span>อำเภอ</span>
                      {renderSortIcon('district')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('unitSize')} className="px-3 py-3 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">F</span>
                      <span>ขนาด</span>
                      {renderSortIcon('unitSize')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('affiliation')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">G</span>
                      <span>สังกัด</span>
                      {renderSortIcon('affiliation')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('recorder')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">H</span>
                      <span>ผู้บันทึก</span>
                      {renderSortIcon('recorder')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('status')} className="px-3 py-3 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">I</span>
                      <span>สถานะ</span>
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('personCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">J</span>
                      <span>คน</span>
                      {renderSortIcon('personCount')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('serviceCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">K</span>
                      <span>ครั้ง</span>
                      {renderSortIcon('serviceCount')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('examCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">L</span>
                      <span>ตรวจ</span>
                      {renderSortIcon('examCount')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('extractionCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">M</span>
                      <span>ถอน</span>
                      {renderSortIcon('extractionCount')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('fillingCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">N</span>
                      <span>อุด</span>
                      {renderSortIcon('fillingCount')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('scalingCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">O</span>
                      <span>ขูด</span>
                      {renderSortIcon('scalingCount')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('fluorideCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">P</span>
                      <span>ฟลูออไรด์</span>
                      {renderSortIcon('fluorideCount')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('sealantCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">Q</span>
                      <span>ซีลแลนต์</span>
                      {renderSortIcon('sealantCount')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('referCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">R</span>
                      <span>ส่งต่อ</span>
                      {renderSortIcon('referCount')}
                    </div>
                  </th>
                  <th className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-800 flex items-center justify-center">S</span>
                      <span>หมายเหตุ</span>
                    </div>
                  </th>
                  {isAdmin && <th className="px-3 py-3 text-center">จัดการ</th>}
                </tr>
              ) : (
                /* Compact Mode Header */
                <tr>
                  <th onClick={() => handleSort('timestamp')} className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    วันเวลา {renderSortIcon('timestamp')}
                  </th>
                  <th onClick={() => handleSort('unit')} className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    รพ.สต. (หน่วยบริการ) {renderSortIcon('unit')}
                  </th>
                  <th onClick={() => handleSort('district')} className="px-3 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    อำเภอ {renderSortIcon('district')}
                  </th>
                  <th onClick={() => handleSort('recorder')} className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    ผู้บันทึก {renderSortIcon('recorder')}
                  </th>
                  <th onClick={() => handleSort('status')} className="px-4 py-3 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    สถานะ {renderSortIcon('status')}
                  </th>
                  <th onClick={() => handleSort('personCount')} className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    คน {renderSortIcon('personCount')}
                  </th>
                  <th onClick={() => handleSort('serviceCount')} className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    ครั้ง {renderSortIcon('serviceCount')}
                  </th>
                  <th onClick={() => handleSort('examCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    ตรวจ {renderSortIcon('examCount')}
                  </th>
                  <th onClick={() => handleSort('extractionCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    ถอน {renderSortIcon('extractionCount')}
                  </th>
                  <th onClick={() => handleSort('fillingCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    อุด {renderSortIcon('fillingCount')}
                  </th>
                  <th onClick={() => handleSort('scalingCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    ขูด {renderSortIcon('scalingCount')}
                  </th>
                  <th onClick={() => handleSort('fluorideCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    ฟลูออไรด์ {renderSortIcon('fluorideCount')}
                  </th>
                  <th onClick={() => handleSort('sealantCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    ซีลแลนต์ {renderSortIcon('sealantCount')}
                  </th>
                  <th onClick={() => handleSort('referCount')} className="px-3 py-3 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none">
                    ส่งต่อ {renderSortIcon('referCount')}
                  </th>
                  <th className="px-4 py-3">เหตุผล / หมายเหตุ</th>
                  {isAdmin && <th className="px-4 py-3 text-center">จัดการ</th>}
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 20 : 19} className="text-center py-12 text-slate-400">
                    ไม่พบรายการข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const center = KRABI_HEALTH_CENTERS.find(c => c.name === r.unit || (r.unitCode && c.code === r.unitCode));
                  const displayCode = r.unitCode || center?.code || '-';
                  const displaySize = r.unitSize || center?.size || 'M';
                  const displayAffiliation = r.affiliation || center?.affiliation || 'อบจ.กระบี่';
                  const displayDistrict = r.district || center?.district || 'เมือง';

                  if (viewMode === 'standard19') {
                    return (
                      <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                        {/* Col A: ID */}
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">
                          {r.id}
                        </td>
                        {/* Col B: Timestamp */}
                        <td className="px-3 py-2.5 text-slate-600 font-mono text-[11px]">
                          {r.timestamp}
                        </td>
                        {/* Col C: UnitCode */}
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-800 font-semibold">
                          {displayCode}
                        </td>
                        {/* Col D: Unit */}
                        <td className="px-3 py-2.5 font-semibold text-slate-900">
                          {r.unit}
                        </td>
                        {/* Col E: District */}
                        <td className="px-3 py-2.5 text-slate-600">
                          {displayDistrict}
                        </td>
                        {/* Col F: Size */}
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            displaySize === 'L' ? 'bg-purple-100 text-purple-700' :
                            displaySize === 'M' ? 'bg-blue-100 text-blue-700' :
                            'bg-teal-100 text-teal-700'
                          }`}>
                            {displaySize}
                          </span>
                        </td>
                        {/* Col G: Affiliation */}
                        <td className="px-3 py-2.5 text-slate-600 text-[11px]">
                          {displayAffiliation}
                        </td>
                        {/* Col H: Recorder */}
                        <td className="px-3 py-2.5 text-slate-700">
                          {r.recorder}
                        </td>
                        {/* Col I: Status */}
                        <td className="px-3 py-2.5 text-center">
                          {r.status === 'มา' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              มา
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              ไม่มา
                            </span>
                          )}
                        </td>
                        {/* Col J: PersonCount */}
                        <td className="px-3 py-2.5 text-right font-bold text-slate-900 font-mono">
                          {r.personCount > 0 ? r.personCount.toLocaleString() : '-'}
                        </td>
                        {/* Col K: ServiceCount */}
                        <td className="px-3 py-2.5 text-right font-bold text-blue-600 font-mono">
                          {r.serviceCount > 0 ? r.serviceCount.toLocaleString() : '-'}
                        </td>
                        {/* Col L: Exam */}
                        <td className="px-3 py-2.5 text-right text-slate-600 font-mono">
                          {r.examCount > 0 ? r.examCount : '-'}
                        </td>
                        {/* Col M: Extraction */}
                        <td className="px-3 py-2.5 text-right text-slate-600 font-mono">
                          {r.extractionCount > 0 ? r.extractionCount : '-'}
                        </td>
                        {/* Col N: Filling */}
                        <td className="px-3 py-2.5 text-right text-slate-600 font-mono">
                          {r.fillingCount > 0 ? r.fillingCount : '-'}
                        </td>
                        {/* Col O: Scaling */}
                        <td className="px-3 py-2.5 text-right text-slate-600 font-mono">
                          {r.scalingCount > 0 ? r.scalingCount : '-'}
                        </td>
                        {/* Col P: Fluoride */}
                        <td className="px-3 py-2.5 text-right text-slate-600 font-mono">
                          {r.fluorideCount > 0 ? r.fluorideCount : '-'}
                        </td>
                        {/* Col Q: Sealant */}
                        <td className="px-3 py-2.5 text-right text-slate-600 font-mono">
                          {r.sealantCount > 0 ? r.sealantCount : '-'}
                        </td>
                        {/* Col R: Refer */}
                        <td className="px-3 py-2.5 text-right text-slate-600 font-mono">
                          {r.referCount > 0 ? r.referCount : '-'}
                        </td>
                        {/* Col S: Notes */}
                        <td className="px-3 py-2.5 max-w-xs truncate text-slate-500" title={r.notes}>
                          {r.notes || '-'}
                        </td>
                        {/* Admin Action */}
                        {isAdmin && (
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onEditRecord(r)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                title="แก้ไขรายการ"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(r.id)}
                                className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                                title="ลบรายการ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  }

                  // Compact View Row
                  return (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {r.timestamp}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {displayCode && displayCode !== '-' && (
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              {displayCode}
                            </span>
                          )}
                          <span className="font-semibold text-slate-900">{r.unit}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            displaySize === 'L' ? 'bg-purple-100 text-purple-700' :
                            displaySize === 'M' ? 'bg-blue-100 text-blue-700' :
                            'bg-teal-100 text-teal-700'
                          }`}>
                            {displaySize}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600 text-xs">
                        {displayDistrict}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.recorder}</td>
                      <td className="px-4 py-3 text-center">
                        {r.status === 'มา' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            มา
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            ไม่มา
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                        {r.personCount > 0 ? r.personCount.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600 font-mono">
                        {r.serviceCount > 0 ? r.serviceCount.toLocaleString() : '-'}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600 font-mono">
                        {r.examCount > 0 ? r.examCount : '-'}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600 font-mono">
                        {r.extractionCount > 0 ? r.extractionCount : '-'}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600 font-mono">
                        {r.fillingCount > 0 ? r.fillingCount : '-'}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600 font-mono">
                        {r.scalingCount > 0 ? r.scalingCount : '-'}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600 font-mono">
                        {r.fluorideCount > 0 ? r.fluorideCount : '-'}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600 font-mono">
                        {r.sealantCount > 0 ? r.sealantCount : '-'}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600 font-mono">
                        {r.referCount > 0 ? r.referCount : '-'}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-slate-500" title={r.notes}>
                        {r.notes || '-'}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onEditRecord(r)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="แก้ไขรายการ"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(r.id)}
                              className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                              title="ลบรายการ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">ยืนยันการลบรายการ?</h3>
              <p className="text-xs text-slate-500 mt-1">
                เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลสถิตินี้ได้ คุณแน่ใจหรือไม่?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDeleteRecord(deleteConfirmId);
                  setDeleteConfirmId(null);
                  showToast('ลบรายการเรียบร้อย');
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
