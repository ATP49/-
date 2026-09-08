import React, { useState, useMemo } from 'react';
import { 
  Users, 
  CalendarCheck2, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  Filter, 
  TrendingUp, 
  CheckCircle2, 
  XCircle,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  Lock,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { DentalRecord } from '../types';
import { KRABI_HEALTH_CENTERS } from '../data/krabiHealthCenters';

interface DashboardViewProps {
  records: DentalRecord[];
  onNavigateToForm: () => void;
  onNavigateToTable: () => void;
  isAdmin?: boolean;
  onRequestAdmin?: () => void;
  onNavigateToAnalysis?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  onNavigateToForm,
  onNavigateToTable,
  isAdmin = false,
  onRequestAdmin,
  onNavigateToAnalysis,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  // Available months extracted from records
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      const datePart = r.timestamp?.split(' ')[0];
      if (datePart && datePart.includes('/')) {
        const parts = datePart.split('/');
        if (parts.length >= 3) {
          const m = parseInt(parts[1], 10);
          const y = parts[2];
          const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
          if (m >= 1 && m <= 12) {
            set.add(`${monthNames[m - 1]} ${y}`);
          }
        }
      }
    });
    return Array.from(set);
  }, [records]);

  // Extract districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    KRABI_HEALTH_CENTERS.forEach(c => set.add(c.district));
    records.forEach(r => {
      if (r.district) set.add(r.district);
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedDistrict !== 'all' && r.district !== selectedDistrict) return false;
      if (selectedMonth !== 'all') {
        const datePart = r.timestamp?.split(' ')[0];
        if (datePart && datePart.includes('/')) {
          const parts = datePart.split('/');
          if (parts.length >= 3) {
            const m = parseInt(parts[1], 10);
            const y = parts[2];
            const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
            const key = `${monthNames[m - 1]} ${y}`;
            if (key !== selectedMonth) return false;
          }
        }
      }
      return true;
    });
  }, [records, selectedMonth, selectedDistrict]);

  // Compute aggregated KPIs
  const kpis = useMemo(() => {
    return filteredRecords.reduce(
      (acc, r) => {
        acc.personCount += Number(r.personCount || 0);
        acc.serviceCount += Number(r.serviceCount || 0);
        acc.examCount += Number(r.examCount || 0);
        acc.extractionCount += Number(r.extractionCount || 0);
        acc.fillingCount += Number(r.fillingCount || 0);
        acc.scalingCount += Number(r.scalingCount || 0);
        acc.fluorideCount += Number(r.fluorideCount || 0);
        acc.sealantCount += Number(r.sealantCount || 0);
        acc.referCount += Number(r.referCount || 0);

        if (r.status === 'มา') acc.attendedCount++;
        else acc.absentCount++;

        return acc;
      },
      {
        personCount: 0,
        serviceCount: 0,
        examCount: 0,
        extractionCount: 0,
        fillingCount: 0,
        scalingCount: 0,
        fluorideCount: 0,
        sealantCount: 0,
        referCount: 0,
        attendedCount: 0,
        absentCount: 0,
      }
    );
  }, [filteredRecords]);

  // Group by service for procedures bar chart
  const serviceStats = [
    { label: 'ตรวจช่องปาก', count: kpis.examCount, color: 'bg-sky-500', barHex: '#0ea5e9' },
    { label: 'ถอนฟัน', count: kpis.extractionCount, color: 'bg-rose-500', barHex: '#f43f5e' },
    { label: 'อุดฟัน', count: kpis.fillingCount, color: 'bg-amber-500', barHex: '#f59e0b' },
    { label: 'ขูดหินปูน', count: kpis.scalingCount, color: 'bg-emerald-500', barHex: '#10b981' },
    { label: 'เคลือบฟลูออไรด์', count: kpis.fluorideCount, color: 'bg-purple-500', barHex: '#a855f7' },
    { label: 'ซีลแลนท์', count: kpis.sealantCount, color: 'bg-cyan-500', barHex: '#06b6d4' },
    { label: 'ส่งต่อรักษา', count: kpis.referCount, color: 'bg-indigo-500', barHex: '#6366f1' },
  ];

  const maxServiceCount = Math.max(...serviceStats.map((s) => s.count), 1);

  // Preventative vs Curative calculation
  // Preventative = Fluoride + Sealant + Scaling (or Exam)
  // Curative = Extraction + Filling
  const totalPreventative = kpis.fluorideCount + kpis.sealantCount + kpis.scalingCount;
  const totalCurative = kpis.extractionCount + kpis.fillingCount;
  const totalTreatments = totalPreventative + totalCurative;
  const prevPercentage = totalTreatments > 0 ? Math.round((totalPreventative / totalTreatments) * 100) : 0;

  // Breakdown by Health Center
  const unitStats = useMemo(() => {
    const map = new Map<string, { name: string; district: string; visits: number; persons: number; services: number; status: string }>();
    filteredRecords.forEach((r) => {
      const existing = map.get(r.unit) || {
        name: r.unit,
        district: r.district || 'จ.กระบี่',
        visits: 0,
        persons: 0,
        services: 0,
        status: r.status,
      };
      existing.visits += 1;
      existing.persons += Number(r.personCount || 0);
      existing.services += Number(r.serviceCount || 0);
      map.set(r.unit, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.persons - a.persons);
  }, [filteredRecords]);

  // Attendance rate
  const totalOutreachEvents = kpis.attendedCount + kpis.absentCount;
  const attendanceRate = totalOutreachEvents > 0 ? Math.round((kpis.attendedCount / totalOutreachEvents) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            ภาพรวมผลการดำเนินงานทันตกรรม อบจ.กระบี่
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            สถิติการออกหน่วยทันตกรรมเคลื่อนที่และบริการเชิงรุกในโรงพยาบาลส่งเสริมสุขภาพตำบล (รพ.สต.)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-slate-800"
            >
              <option value="all">ทุกช่วงเดือน</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* District filter */}
          {districts.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent outline-none cursor-pointer text-slate-800"
              >
                <option value="all">ทุกอำเภอ</option>
                {districts.map((d) => (
                  <option key={d} value={d}>อ.{d}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onNavigateToForm}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            + บันทึกเพิ่ม
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (9 metric cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-blue-300 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ผู้รับบริการรวม</span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-blue-600 tracking-tight font-mono">
              {kpis.personCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">คน</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-indigo-300 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ครั้งที่ออกหน่วย</span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-indigo-600 tracking-tight font-mono">
              {kpis.serviceCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">ครั้ง</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-sky-300 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ตรวจช่องปาก</span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-sky-600 tracking-tight font-mono">
              {kpis.examCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">คน</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-rose-300 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ถอนฟัน</span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-rose-600 tracking-tight font-mono">
              {kpis.extractionCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">คน</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-amber-300 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">อุดฟัน</span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-amber-500 tracking-tight font-mono">
              {kpis.fillingCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">คน</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-emerald-300 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ขูดหินปูน</span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-emerald-600 tracking-tight font-mono">
              {kpis.scalingCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">คน</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-purple-300 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ฟลูออไรด์</span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-purple-600 tracking-tight font-mono">
              {kpis.fluorideCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">คน</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-cyan-300 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ซีลแลนท์</span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-cyan-600 tracking-tight font-mono">
              {kpis.sealantCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">คน</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 flex flex-col justify-between hover:border-red-300 transition-colors">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ส่งต่อรักษา</span>
          <div className="mt-2">
            <span className="text-2xl font-extrabold text-red-500 tracking-tight font-mono">
              {kpis.referCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 ml-1">คน</span>
          </div>
        </div>
      </div>

      {/* Main Analytical Section: Procedures Bar Chart & Attendance / Preventive Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Procedures Volume Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                ปริมาณงานทันตกรรมจำแนกตามประเภทหัตถการ
              </h2>
              <p className="text-[11px] text-slate-400">เปรียบเทียบสถิติหัตถการในพื้นที่ อบจ.กระบี่</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              รวม {serviceStats.reduce((sum, s) => sum + s.count, 0).toLocaleString()} รายการ
            </span>
          </div>

          {/* Clean Horizontal Bar Representation */}
          <div className="space-y-3.5 py-2">
            {serviceStats.map((item) => {
              const pct = Math.round((item.count / maxServiceCount) * 100);
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      {item.label}
                    </span>
                    <span className="font-mono text-slate-900 font-bold">
                      {item.count.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">คน</span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              หัตถการที่ให้บริการสูงสุด:{' '}
              <strong className="text-slate-800">
                {[...serviceStats].sort((a, b) => b.count - a.count)[0]?.label}
              </strong>
            </span>
            <button 
              onClick={onNavigateToTable} 
              className="text-blue-600 hover:text-blue-800 font-semibold text-[11px]"
            >
              ดูตารางรายละเอียด &rarr;
            </button>
          </div>
        </div>

        {/* Right 1 Col: Preventive Ratio & Service Attendance */}
        <div className="space-y-6">
          {/* Preventative vs Curative Ratio Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              สัดส่วนงานส่งเสริมป้องกัน (Preventative Care)
            </h2>
            <p className="text-[11px] text-slate-500 mb-4">
              เทียบระหว่างงานป้องกัน (ฟลูออไรด์/ซีลแลนท์/ขูดหินปูน) กับงานรักษา (ถอน/อุด)
            </p>

            <div className="flex items-center justify-center my-2">
              <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-8 border-slate-100">
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-emerald-600 font-mono">
                    {prevPercentage}%
                  </span>
                  <p className="text-[10px] font-semibold text-slate-400">เชิงป้องกัน</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-center">
              <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                <span className="text-emerald-700 font-bold block">{totalPreventative.toLocaleString()} คน</span>
                <span className="text-[10px] text-emerald-600">งานส่งเสริมป้องกัน</span>
              </div>
              <div className="bg-rose-50/60 p-2 rounded-lg border border-rose-100">
                <span className="text-rose-700 font-bold block">{totalCurative.toLocaleString()} คน</span>
                <span className="text-[10px] text-rose-600">งานทันตกรรมรักษา</span>
              </div>
            </div>
          </div>

          {/* Attendance Status Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-blue-600" />
              ความพร้อมการออกหน่วยบริการ
            </h2>
            <div className="flex items-center justify-between mt-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-700">ออกให้บริการจริง</span>
              </div>
              <span className="font-bold text-emerald-600">{kpis.attendedCount} ครั้ง</span>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500" />
                <span className="text-slate-700">งดออกหน่วย (สภาพอากาศ/เหตุจำเป็น)</span>
              </div>
              <span className="font-bold text-rose-600">{kpis.absentCount} ครั้ง</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: `${attendanceRate}%` }} />
              <div className="bg-rose-400 h-full" style={{ width: `${100 - attendanceRate}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-right">
              ความสำเร็จตามแผนออกหน่วย: <strong>{attendanceRate}%</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown by Health Promoting Hospital (รพ.สต.) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">สรุปสถิติจำแนกราย รพ.สต. ใน จ.กระบี่</h2>
            <p className="text-[11px] text-slate-400">
              ติดตามปริมาณผู้รับบริการและการเข้าให้บริการตามจุดพื้นที่
            </p>
          </div>
          <span className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
            แสดง {unitStats.length} จุดบริการ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">อันดับ</th>
                <th className="px-4 py-3">ชื่อ รพ.สต.</th>
                <th className="px-4 py-3">อำเภอ</th>
                <th className="px-4 py-3 text-center">สถานะล่าสุด</th>
                <th className="px-4 py-3 text-right">จำนวนครั้งที่ลงพื้นที่</th>
                <th className="px-4 py-3 text-right">ผู้รับบริการรวม (คน)</th>
                <th className="px-4 py-3 text-right">หัตถการรวม (ครั้ง)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {unitStats.map((u, idx) => (
                <tr key={u.name} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono">#{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.district}</td>
                  <td className="px-4 py-3 text-center">
                    {u.status === 'มา' ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-bold text-[10px] border border-emerald-200/50">
                        พร้อมบริการ
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 font-bold text-[10px] border border-rose-200/50">
                        เลื่อนนัด
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 font-mono">{u.visits}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600 font-mono">{u.persons.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-slate-600 font-mono">{u.services.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ข้อเสนอแนะ และแนวทางการพัฒนาระบบจัดการข้อมูลทันตกรรม (จำกัดสิทธิ์เฉพาะ Admin) */}
      {isAdmin ? (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  ข้อเสนอแนะ และแนวทางการพัฒนาระบบจัดการข้อมูลทันตกรรม
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold">
                  เฉพาะ Admin
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                บทวิเคราะห์เชิงลึก 5 ด้านหลัก โค้ด Apps Script แก้ไขช่องโหว่ความปลอดภัย และแนวทางพัฒนายกระดับระบบบริการทันตกรรม อบจ.กระบี่
              </p>
            </div>
          </div>
          {onNavigateToAnalysis && (
            <button
              onClick={onNavigateToAnalysis}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>เปิดดูข้อเสนอแนะ & แผนพัฒนา</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                ข้อเสนอแนะ และแนวทางการพัฒนาระบบจัดการข้อมูลทันตกรรม
                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                  จำกัดสิทธิ์ Admin
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">
                รายงานการวิเคราะห์และข้อเสนอแนะเชิงลึก สงวนสิทธิ์สำหรับผู้ดูแลระบบ (Admin)
              </p>
            </div>
          </div>
          {onRequestAdmin && (
            <button
              onClick={onRequestAdmin}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer hover:bg-slate-100"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>เข้าสู่ระบบ Admin เพื่อเปิดดู</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
