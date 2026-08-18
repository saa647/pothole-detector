import React from 'react';
import { Map, Cpu, AlertTriangle, BarChart3, Settings } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hazardBadgeCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  hazardBadgeCount,
}) => {
  const tabs = [
    {
      id: 'map' as TabType,
      label: 'Live Map',
      icon: Map,
    },
    {
      id: 'telemetry' as TabType,
      label: 'Sensors',
      icon: Cpu,
    },
    {
      id: 'hazards' as TabType,
      label: 'Hazards',
      icon: AlertTriangle,
      badge: hazardBadgeCount > 0 ? hazardBadgeCount : null,
    },
    {
      id: 'analytics' as TabType,
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'hardware' as TabType,
      label: 'Hardware',
      icon: Settings,
    },
  ];

  return (
    <nav
      id="android-bottom-navigation"
      className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto glass-nav backdrop-blur-2xl px-2 py-1.5 transition-all"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-700'
              } active:scale-90`}
            >
              {/* Active Soft Pill Background Indicator */}
              {isActive && (
                <div className="absolute inset-0 bg-emerald-50/80 rounded-2xl -z-10 shadow-xs border border-emerald-200/60" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-emerald-700 stroke-[2.5]' : 'text-slate-500'
                  }`}
                />

                {tab.badge !== null && tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-bold px-1 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'text-emerald-950 font-bold' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
