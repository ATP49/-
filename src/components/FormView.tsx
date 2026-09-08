import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Calculator, 
  Sparkles,
  Building2,
  User,
  Check,
  Plus,
  Minus
} from 'lucide-react';
import { DentalRecord } from '../types';
import { KRABI_HEALTH_CENTERS } from '../data/krabiHealthCenters';

interface FormViewProps {
  onSaveRecord: (record: DentalRecord) => void;
  editingRecord: DentalRecord | null;
  onCancelEdit: () => void;
  showToast: (msg: string) => void;
}

export const FormView: React.FC<FormViewProps> = ({
  onSaveRecord,
  editingRecord,
  onCancelEdit,
  showToast,
}) => {
  const [unit, setUnit] = useState<string>('');
  const [recorder, setRecorder] = useState<string>('');
  const [status, setStatus] = useState<'มา' | 'ไม่มา'>('มา');
  const [personCount, setPersonCount] = useState<number | ''>('');
  const [serviceCount, setServiceCount] = useState<number | ''>('');
  
  // Procedures
  const [examCount, setExamCount] = useState<number | ''>('');
  const [extractionCount, setExtractionCount] = useState<number | ''>('');
  const [fillingCount, setFillingCount] = useState<number | ''>('');
  const [scalingCount, setScalingCount] = useState<number | ''>('');
  const [fluorideCount, setFluorideCount] = useState<number | ''>('');
  const [sealantCount, setSealantCount] = useState<number | ''>('');
  const [referCount, setReferCount] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Populate or reset form when editingRecord changes
  useEffect(() => {
    if (editingRecord) {
      setUnit(editingRecord.unit || '');
      setRecorder(editingRecord.recorder || '');
      setStatus(editingRecord.status || 'มา');
      setPersonCount(editingRecord.personCount ?? '');
      setServiceCount(editingRecord.serviceCount ?? '');
      setExamCount(editingRecord.examCount ?? '');
      setExtractionCount(editingRecord.extractionCount ?? '');
      setFillingCount(editingRecord.fillingCount ?? '');
      setScalingCount(editingRecord.scalingCount ?? '');
      setFluorideCount(editingRecord.fluorideCount ?? '');
      setSealantCount(editingRecord.sealantCount ?? '');
      setReferCount(editingRecord.referCount ?? '');
      setNotes(editingRecord.notes || '');
    } else {
      // Load saved recorder from previous session if available
      const savedRecorder = localStorage.getItem('krabi_dental_recorder');
      if (savedRecorder && !recorder) {
        setRecorder(savedRecorder);
      }
    }
  }, [editingRecord]);

  // Handle status toggle
  const handleStatusChange = (newStatus: 'มา' | 'ไม่มา') => {
    setStatus(newStatus);
    if (newStatus === 'ไม่มา') {
      // Zero out numbers
      setPersonCount(0);
      setServiceCount(0);
      setExamCount(0);
      setExtractionCount(0);
      setFillingCount(0);
      setScalingCount(0);
      setFluorideCount(0);
      setSealantCount(0);
      setReferCount(0);
    } else {
      if (personCount === 0) setPersonCount('');
      if (serviceCount === 0) setServiceCount('');
    }
  };

  // Helper step modifier for count inputs
  const adjustValue = (
    setter: React.Dispatch<React.SetStateAction<number | ''>>,
    current: number | '',
    delta: number
  ) => {
    if (status === 'ไม่มา') return;
    const val = typeof current === 'number' ? current : 0;
    const nextVal = Math.max(0, val + delta);
    setter(nextVal === 0 ? '' : nextVal);
  };

  // Smart Auto-Calculation helper
  const handleAutoCalculate = () => {
    const totalExam = typeof examCount === 'number' ? examCount : 0;
    const totalServices =
      (typeof examCount === 'number' ? examCount : 0) +
      (typeof extractionCount === 'number' ? extractionCount : 0) +
      (typeof fillingCount === 'number' ? fillingCount : 0) +
      (typeof scalingCount === 'number' ? scalingCount : 0) +
      (typeof fluorideCount === 'number' ? fluorideCount : 0) +
      (typeof sealantCount === 'number' ? sealantCount : 0) +
      (typeof referCount === 'number' ? referCount : 0);

    if (totalExam > 0 && (personCount === '' || personCount === 0)) {
      setPersonCount(totalExam);
    }
    if (totalServices > 0 && (serviceCount === '' || serviceCount === 0)) {
      setServiceCount(totalServices);
    }
    showToast('คำนวณและปรับยอดผู้รับบริการ/ครั้งให้สอดคล้องกับรายการหัตถการเรียบร้อย');
  };

  // Preset reason options for when unit does not open
  const absentPresets = [
    'สภาพอากาศคลื่นลมแรง/มรสุมในทะเลอันดามัน ไม่สามารถเดินทางข้ามเกาะได้',
    'ตรงกับวันหยุดราชการ/วันหยุดนักขัตฤกษ์',
    'รพ.สต. มีกิจกรรมฉีดวัคซีน/ตรวจสุขภาพประจำปีกลุ่มใหญ่',
    'ยูนิตทำฟันเคลื่อนที่หรือเครื่องอัดลมขัดข้อง อยู่ระหว่างซ่อมบำรุง',
    'ทันตบุคลากรติดภารกิจประชุมราชการ อบจ.กระบี่',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!unit.trim()) errors.unit = 'กรุณาเลือกหรือระบุหน่วยบริการ (รพ.สต.)';
    if (!recorder.trim()) errors.recorder = 'กรุณาระบุชื่อผู้บันทึกข้อมูล';

    if (status === 'ไม่มา' && !notes.trim()) {
      errors.notes = 'กรณีไม่มาให้บริการ กรุณาระบุเหตุผลหรือชี้แจงความจำเป็น';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    // Save recorder name to localStorage for fast re-entry
    localStorage.setItem('krabi_dental_recorder', recorder.trim());

    // Find health center matching the unit
    const matchedCenter = KRABI_HEALTH_CENTERS.find(
      (c) => c.name === unit.trim() || unit.trim().includes(c.name) || c.code === unit.trim()
    );
    const resolvedUnit = matchedCenter ? matchedCenter.name : unit.trim();
    const resolvedCode = matchedCenter ? matchedCenter.code : (editingRecord?.unitCode || '');
    const resolvedSize = matchedCenter ? matchedCenter.size : (editingRecord?.unitSize || 'M');
    const resolvedAffiliation = matchedCenter ? matchedCenter.affiliation : (editingRecord?.affiliation || 'อบจ.กระบี่');
    const district = matchedCenter ? matchedCenter.district : (editingRecord?.district || 'เมือง');

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const defaultTimestamp = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newRecord: DentalRecord = {
      id: editingRecord?.id || `rec-${Date.now()}`,
      timestamp: editingRecord?.timestamp || defaultTimestamp,
      unit: resolvedUnit,
      unitCode: resolvedCode,
      unitSize: resolvedSize,
      affiliation: resolvedAffiliation,
      district,
      recorder: recorder.trim(),
      status,
      personCount: Number(personCount) || 0,
      serviceCount: Number(serviceCount) || 0,
      examCount: Number(examCount) || 0,
      extractionCount: Number(extractionCount) || 0,
      fillingCount: Number(fillingCount) || 0,
      scalingCount: Number(scalingCount) || 0,
      fluorideCount: Number(fluorideCount) || 0,
      sealantCount: Number(sealantCount) || 0,
      referCount: Number(referCount) || 0,
      notes: notes.trim(),
    };

    onSaveRecord(newRecord);
    showToast(editingRecord ? 'ปรับปรุงข้อมูลสำเร็จ' : 'บันทึกข้อมูลการออกหน่วยสำเร็จ');
    resetForm();
  };

  const resetForm = () => {
    if (editingRecord) {
      onCancelEdit();
    }
    setUnit('');
    setStatus('มา');
    setPersonCount('');
    setServiceCount('');
    setExamCount('');
    setExtractionCount('');
    setFillingCount('');
    setScalingCount('');
    setFluorideCount('');
    setSealantCount('');
    setReferCount('');
    setNotes('');
    setFormErrors({});
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Form Title Banner */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              แบบฟอร์มบันทึกผลการปฏิบัติงาน
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-2">
              {editingRecord ? '✏️ แก้ไขข้อมูลผลการปฏิบัติงาน' : '📋 บันทึกข้อมูลสถิติทันตกรรมหมุนเวียน'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              กองสาธารณสุข องค์การบริหารส่วนจังหวัดกระบี่
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoCalculate}
              disabled={status === 'ไม่มา'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              title="คำนวณและดึงผลรวมจากรายการหัตถการให้อัตโนมัติ"
            >
              <Calculator className="w-3.5 h-3.5" />
              ช่วยคำนวณผลรวม
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Section 1: General Info */}
          <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Service Unit (รพ.สต.) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    1. หน่วยบริการ (รพ.สต.) <span className="text-rose-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  list="krabi-units-list"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="เลือกหรือค้นหา รพ.สต."
                  className={`w-full text-xs font-medium p-2.5 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    formErrors.unit ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                  required
                />
                <datalist id="krabi-units-list">
                  {KRABI_HEALTH_CENTERS.map((c) => (
                    <option key={c.id} value={c.name}>
                      รหัส {c.code} | {c.name} (อ.{c.district}, ขนาด {c.size})
                    </option>
                  ))}
                </datalist>
                {formErrors.unit && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.unit}</p>
                )}
              </div>

              {/* Recorder Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    2. ผู้บันทึกข้อมูล <span className="text-rose-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={recorder}
                  onChange={(e) => setRecorder(e.target.value)}
                  placeholder="ระบุชื่อ-สกุล / ตำแหน่ง"
                  className={`w-full text-xs font-medium p-2.5 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    formErrors.recorder ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                  required
                />
                {formErrors.recorder && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{formErrors.recorder}</p>
                )}
              </div>

              {/* Attendance Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  3. สถานะการเข้าให้บริการ <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange('มา')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      status === 'มา'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/30'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    มาให้บริการ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('ไม่มา')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      status === 'ไม่มา'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-500/30'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    ไม่มาให้บริการ
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Patient and Visit Overview */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              สรุปยอดผู้รับบริการและจำนวนครั้ง
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    จำนวนผู้รับบริการรวม (คน)
                  </label>
                  <span className="text-[10px] text-slate-400">นับรายบุคคล</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    disabled={status === 'ไม่มา'}
                    value={personCount}
                    onChange={(e) => setPersonCount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="flex-1 p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-blue-600 outline-none disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => adjustValue(setPersonCount, personCount, -1)}
                    disabled={status === 'ไม่มา'}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustValue(setPersonCount, personCount, 1)}
                    disabled={status === 'ไม่มา'}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-800">
                    จำนวนการให้บริการรวม (ครั้ง)
                  </label>
                  <span className="text-[10px] text-slate-400">นับจำนวน visit/ครั้ง</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    disabled={status === 'ไม่มา'}
                    value={serviceCount}
                    onChange={(e) => setServiceCount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="flex-1 p-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-indigo-600 outline-none disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => adjustValue(setServiceCount, serviceCount, -1)}
                    disabled={status === 'ไม่มา'}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustValue(setServiceCount, serviceCount, 1)}
                    disabled={status === 'ไม่มา'}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Detailed Dental Procedures (7 Categories) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ผลงานบริการจำแนกรายประเภทหัตถการ (คน)
              </h2>
              <span className="text-[11px] text-slate-400">
                {status === 'ไม่มา' ? '⚠️ ปิดการกรอกตัวเลขเนื่องจากงดออกหน่วย' : 'กรอกจำนวนผู้รับบริการแต่ละรายการ'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* 1. Exam */}
              <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/40">
                <label className="block text-xs font-semibold text-sky-900 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" /> 1. งานตรวจช่องปาก (คน)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    disabled={status === 'ไม่มา'}
                    value={examCount}
                    onChange={(e) => setExamCount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-bold p-2 bg-white border border-sky-300 rounded-lg outline-none disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => adjustValue(setExamCount, examCount, 1)}
                    disabled={status === 'ไม่มา'}
                    className="w-7 h-7 bg-white border border-sky-300 rounded-lg flex items-center justify-center text-sky-700 hover:bg-sky-100 shrink-0 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 2. Extraction */}
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40">
                <label className="block text-xs font-semibold text-rose-900 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> 2. งานถอนฟัน (คน)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    disabled={status === 'ไม่มา'}
                    value={extractionCount}
                    onChange={(e) => setExtractionCount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-bold p-2 bg-white border border-rose-300 rounded-lg outline-none disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => adjustValue(setExtractionCount, extractionCount, 1)}
                    disabled={status === 'ไม่มา'}
                    className="w-7 h-7 bg-white border border-rose-300 rounded-lg flex items-center justify-center text-rose-700 hover:bg-rose-100 shrink-0 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 3. Filling */}
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40">
                <label className="block text-xs font-semibold text-amber-900 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> 3. งานอุดฟัน (คน)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    disabled={status === 'ไม่มา'}
                    value={fillingCount}
                    onChange={(e) => setFillingCount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-bold p-2 bg-white border border-amber-300 rounded-lg outline-none disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => adjustValue(setFillingCount, fillingCount, 1)}
                    disabled={status === 'ไม่มา'}
                    className="w-7 h-7 bg-white border border-amber-300 rounded-lg flex items-center justify-center text-amber-700 hover:bg-amber-100 shrink-0 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 4. Scaling */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <label className="block text-xs font-semibold text-emerald-900 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> 4. งานขูดหินปูน (คน)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    disabled={status === 'ไม่มา'}
                    value={scalingCount}
                    onChange={(e) => setScalingCount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-bold p-2 bg-white border border-emerald-300 rounded-lg outline-none disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => adjustValue(setScalingCount, scalingCount, 1)}
                    disabled={status === 'ไม่มา'}
                    className="w-7 h-7 bg-white border border-emerald-300 rounded-lg flex items-center justify-center text-emerald-700 hover:bg-emerald-100 shrink-0 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 5. Fluoride */}
              <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40">
                <label className="block text-xs font-semibold text-purple-900 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> 5. งานเคลือบฟลูออไรด์ (คน)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    disabled={status === 'ไม่มา'}
                    value={fluorideCount}
                    onChange={(e) => setFluorideCount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-bold p-2 bg-white border border-purple-300 rounded-lg outline-none disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => adjustValue(setFluorideCount, fluorideCount, 1)}
                    disabled={status === 'ไม่มา'}
                    className="w-7 h-7 bg-white border border-purple-300 rounded-lg flex items-center justify-center text-purple-700 hover:bg-purple-100 shrink-0 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 6. Sealant */}
              <div className="p-3.5 rounded-xl border border-cyan-200 bg-cyan-50/40">
                <label className="block text-xs font-semibold text-cyan-900 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" /> 6. งานเคลือบหลุมร่องฟัน (คน)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    disabled={status === 'ไม่มา'}
                    value={sealantCount}
                    onChange={(e) => setSealantCount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-bold p-2 bg-white border border-cyan-300 rounded-lg outline-none disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => adjustValue(setSealantCount, sealantCount, 1)}
                    disabled={status === 'ไม่มา'}
                    className="w-7 h-7 bg-white border border-cyan-300 rounded-lg flex items-center justify-center text-cyan-700 hover:bg-cyan-100 shrink-0 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 7. Refer */}
              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40">
                <label className="block text-xs font-semibold text-indigo-900 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> 7. งานส่งต่อผู้ป่วยรักษาต่อ (คน)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    disabled={status === 'ไม่มา'}
                    value={referCount}
                    onChange={(e) => setReferCount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-bold p-2 bg-white border border-indigo-300 rounded-lg outline-none disabled:bg-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => adjustValue(setReferCount, referCount, 1)}
                    disabled={status === 'ไม่มา'}
                    className="w-7 h-7 bg-white border border-indigo-300 rounded-lg flex items-center justify-center text-indigo-700 hover:bg-indigo-100 shrink-0 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Notes and Reasons */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>
                หมายเหตุ / ชี้แจงเหตุผลประกอบรายละเอียด{' '}
                {status === 'ไม่มา' && <span className="text-rose-500 font-bold">* (จำเป็นเมื่อไม่มา)</span>}
              </span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ระบุรายละเอียดเพิ่มเติม หรือเหตุผลความจำเป็นในกรณีงดหรือไม่ได้เข้าปฏิบัติงานในจุดบริการ"
              className={`w-full text-xs p-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                formErrors.notes ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
              }`}
            />
            {formErrors.notes && (
              <p className="text-[11px] text-rose-500 font-medium">{formErrors.notes}</p>
            )}

            {/* Presets when status is 'ไม่มา' */}
            {status === 'ไม่มา' && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                  💡 คลิกเพื่อเลือกเหตุผลทั่วไป:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {absentPresets.map((reason, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNotes(reason)}
                      className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors text-left"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {editingRecord ? 'ยกเลิกการแก้ไข' : 'ล้างฟอร์ม'}
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              {editingRecord ? 'บันทึกการแก้ไขข้อมูล' : 'บันทึกชุดข้อมูล'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
