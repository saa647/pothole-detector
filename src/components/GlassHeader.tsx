import React from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  Layers, 
  Activity, 
  MapPin, 
  Sliders, 
  Volume2, 
  VolumeX,
  Plus,
  Palette,
  Leaf,
  Sun,
  Coffee,
  Moon,
  FolderDown
} from 'lucide-react';
import { TabType, SoftThemeId } from '../types';
import { SOFT_THEMES } from '../data/themes';

interface GlassHeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hazardCount: number;
  isDriving: boolean;
  onToggleDrive: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenReportModal: () => void;
  currentTheme: SoftThemeId;
  onOpenThemeModal: () => void;
  onOpenSourceCodeModal: () => void;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
  activeTab,
  onTabChange,
  hazardCount,
  isDriving,
  onToggleDrive,
  soundEnabled,
  onToggleSound,
  onOpenReportModal,
  currentTheme,
  onOpenThemeModal,
  onOpenSourceCodeModal,
}) => {
  const activeThemeConfig = SOFT_THEMES.find(t => t.id === currentTheme) || SOFT_THEMES[0];

  const getThemeSmallIcon = (id: SoftThemeId) => {
    switch (id) {
      case 'soft-sage':
        return <Leaf className="w-3.5 h-3.5 text-emerald-600" />;
      case 'soft-warm':
        return <Sun className="w-3.5 h-3.5 text-amber-600" />;
      case 'soft-sepia':
        return <Coffee className="w-3.5 h-3.5 text-amber-800" />;
      case 'soft-dusk':
        return <Sparkles className="w-3.5 h-3.5 text-violet-600" />;
      case 'soft-dark':
        return <Moon className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <header
      id="app-glass-header"
      className="sticky top-0 z-40 w-full backdrop-blur-xl glass-header shadow-[0_4px_24px_-4px_rgba(148,163,184,0.18)] transition-all duration-300"
    >
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Left quick control: Sound toggle & Theme Switcher */}
        <div className="flex items-center gap-1.5">
          <button
            id="toggle-audio-btn"
            onClick={onToggleSound}
            title={soundEnabled ? 'Disable Audio Chimes' : 'Enable Audio Chimes'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              soundEnabled
                ? 'bg-emerald-50/90 text-emerald-700 border border-emerald-200 shadow-sm'
                : 'bg-slate-100/90 text-slate-400 border border-slate-200'
            } active:scale-95`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Quick Switcher Button */}
          <button
            id="theme-quick-switch-btn"
            onClick={onOpenThemeModal}
            title={`Current Theme: ${activeThemeConfig.name} (Click to switch Soft Mode Theme)`}
            className="h-9 px-2.5 rounded-full flex items-center gap-1.5 text-xs font-semibold bg-white/90 border border-slate-200/90 shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-slate-700"
          >
            {getThemeSmallIcon(currentTheme)}
            <span className="hidden sm:inline text-[11px]">{activeThemeConfig.name.split(' ')[0]}</span>
            <span 
              className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" 
              style={{ backgroundColor: activeThemeConfig.accentHex }}
            />
          </button>
        </div>

        {/* Centered App Identity (Glassmorphism & Soft Styling) */}
        <div className="flex flex-col items-center justify-center text-center cursor-pointer" onClick={() => onTabChange('map')}>
          <div className="flex items-center gap-1.5">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>RoadGuard</span>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60 font-mono tracking-normal">
                IoT
              </span>
            </h1>
          </div>
          <p className="text-[10px] font-medium text-slate-600 tracking-tight flex items-center gap-1 mt-0.5">
            <span>ITC SAU Tandojam</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-emerald-700 font-semibold">{hazardCount} hazards</span>
          </p>
        </div>

        {/* Right Action: Download Code & Quick Report */}
        <div className="flex items-center gap-1.5">
          <button
            id="open-source-export-btn"
            onClick={onOpenSourceCodeModal}
            className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/80 flex items-center justify-center active:scale-95 transition-all shadow-xs"
            title="Download Project Source Code & Files"
          >
            <FolderDown className="w-4 h-4 text-emerald-700" />
          </button>

          <button
            id="quick-report-hazard-btn"
            onClick={onOpenReportModal}
            className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/10 hover:bg-slate-800 active:scale-95 transition-all"
            title="Log/Report Hazard"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Secondary Soft Pill Sub-header */}
      <div className="px-4 pb-2 max-w-md mx-auto flex items-center justify-between gap-2 text-xs">
        <button
          id="drive-mode-pill-btn"
          onClick={onToggleDrive}
          className={`flex-1 py-1.5 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all border ${
            isDriving
              ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm'
              : 'bg-white/80 hover:bg-white border-slate-200/70 text-slate-700 shadow-xs'
          }`}
        >
          <Activity className={`w-3.5 h-3.5 ${isDriving ? 'text-rose-600 animate-spin' : 'text-slate-500'}`} />
          <span>{isDriving ? 'Live Trip Scanning...' : 'Start Drive Simulation'}</span>
        </button>

        <div className="flex items-center gap-1 bg-white/80 text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200/70 font-mono text-[11px] shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>ESP32:LIVE</span>
        </div>
      </div>
    </header>
  );
};
