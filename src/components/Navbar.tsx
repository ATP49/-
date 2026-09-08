import React from 'react';
import { 
  Activity, 
  FileEdit, 
  Table2, 
  Lightbulb, 
  Settings, 
  Lock, 
  Unlock, 
  Menu, 
  X,
  Building2,
  CheckCircle2,
  Smartphone,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { ActiveTab, AppSettings } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  settings: AppSettings;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  recordCount: number;
  onOpenGoogleSheetModal: () => void;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isAdmin,
  onToggleAdmin,
  settings,
  mobileMenuOpen,
  setMobileMenuOpen,
  recordCount,
  onOpenGoogleSheetModal,
  isSyncing = false,
}) => {
  interface NavItem {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    adminOnly?: boolean;
    highlight?: boolean;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'แดชบอร์ดสรุปผล', icon: Activity },
    { id: 'form', label: 'บันทึกการปฏิบัติงาน', icon: FileEdit },
    { id: 'table', label: 'รายการข้อมูลทั้งหมด', icon: Table2, badge: recordCount },
    { id: 'analysis', label: 'ข้อเสนอแนะ & แผนพัฒนา', icon: Lightbulb, adminOnly: true },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings, adminOnly: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-slate-100 shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 text-left focus:outline-none group"
            >
              {settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt="Logo" 
                  className="w-10 h-10 object-contain rounded-xl bg-white p-1 shadow-sm transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white group-hover:text-blue-400 transition-colors">
                    DENTAL DATA
                  </span>
                  <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-300 rounded border border-blue-400/20">
                    อบจ.กระบี่
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                  กองสาธารณสุข องค์การบริหารส่วนจังหวัดกระบี่
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : item.highlight
                      ? 'text-amber-300 hover:text-amber-200 hover:bg-slate-800'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Google Sheet & Admin Status */}
          <div className="flex items-center gap-2">
            {/* Google Sheet Sync Button */}
            <button
              onClick={onOpenGoogleSheetModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                settings.appsScriptUrl
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={settings.appsScriptUrl ? `เชื่อมต่อ Google Sheet แล้ว${settings.lastSyncedAt ? ` (ซิงก์: ${settings.lastSyncedAt})` : ''}` : 'ตั้งค่าเชื่อมต่อ Google Sheet Database'}
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              ) : (
                <FileSpreadsheet className={`w-3.5 h-3.5 ${settings.appsScriptUrl ? 'text-emerald-400' : 'text-slate-400'}`} />
              )}
              <span className="hidden sm:inline">
                {settings.appsScriptUrl ? 'Google Sheet' : 'เชื่อมต่อ Sheet'}
              </span>
              {settings.appsScriptUrl && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>

            <button
              onClick={onToggleAdmin}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isAdmin
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={isAdmin ? 'ออกจากโหมดผู้ดูแลระบบ' : 'เข้าสู่ระบบผู้ดูแลระบบ (Admin PIN)'}
            >
              {isAdmin ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Admin Mode</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">สิทธิ์ Admin</span>
                </>
              )}
            </button>

            {/* Mobile menu hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as ActiveTab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : item.highlight
                    ? 'text-amber-300 hover:bg-slate-800'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Mobile Google Sheet button */}
          <button
            onClick={() => {
              onOpenGoogleSheetModal();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>จัดการฐานข้อมูล Google Sheets</span>
            </div>
            {settings.appsScriptUrl ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                เชื่อมต่อแล้ว
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                ยังไม่ได้เชื่อมต่อ
              </span>
            )}
          </button>
        </div>
      )}
    </header>
  );
};
