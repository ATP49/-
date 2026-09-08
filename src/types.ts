export interface DentalRecord {
  id: string;
  timestamp: string;
  unit: string;               // หน่วยบริการ (รพ.สต.)
  unitCode?: string;          // รหัสหน่วยบริการ (เช่น 08995)
  unitSize?: 'S' | 'M' | 'L' | string; // ขนาดหน่วยบริการ (S, M, L)
  affiliation?: string;       // สังกัด (เช่น อบจ.กระบี่)
  district?: string;          // อำเภอ
  recorder: string;           // ผู้บันทึกข้อมูล
  status: 'มา' | 'ไม่มา';     // มาให้บริการ (ไม่มา / มา)
  personCount: number;        // จำนวนผู้รับบริการรวม (คน)
  serviceCount: number;       // ให้บริการรวม (ครั้ง)
  examCount: number;          // ตรวจช่องปาก (คน)
  extractionCount: number;    // ถอนฟัน (คน)
  fillingCount: number;       // อุดฟัน (คน)
  scalingCount: number;       // ขูดหินปูน (คน)
  fluorideCount: number;      // เคลือบฟลูออไรด์ (คน)
  sealantCount: number;       // เคลือบหลุมร่องฟัน (คน)
  referCount: number;         // ส่งต่อรักษา (คน)
  notes: string;              // อื่นๆ / หมายเหตุชี้แจงเหตุผล
}

export interface HealthCenter {
  id: string;
  code: string;               // รหัสหน่วยบริการ (เช่น 08995)
  name: string;               // ชื่อหน่วยบริการ (เช่น รพ.สต.บ้านช่องพลี)
  district: string;           // อำเภอ (เช่น เมือง, เกาะลันตา)
  size: 'S' | 'M' | 'L';      // ขนาดหน่วยบริการ
  status: string;             // สถานะ (เช่น ใช้งาน)
  affiliation: string;        // สังกัด (เช่น อบจ.กระบี่)
  zone?: string;
}

export interface AppSettings {
  logoUrl: string;
  orgName: string;
  deptName: string;
  adminPin: string;
  appsScriptUrl?: string;
  googleSheetUrl?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export type ActiveTab = 'dashboard' | 'form' | 'table' | 'analysis' | 'settings';
