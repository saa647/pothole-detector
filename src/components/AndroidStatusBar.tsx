import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal, Radio } from 'lucide-react';

interface AndroidStatusBarProps {
  gpsConnected?: boolean;
  iotConnected?: boolean;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({
  gpsConnected = true,
  iotConnected = true,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      id="android-status-bar"
      className="w-full bg-slate-900/5 px-4 py-1.5 flex items-center justify-between text-xs font-medium text-slate-600 select-none border-b border-slate-200/40"
    >
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-slate-800 tracking-tight">{timeStr || '12:30 PM'}</span>
        {iotConnected && (
          <span className="flex items-center gap-1 text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-200/60 font-mono">
            <Radio className="w-2.5 h-2.5 animate-pulse" />
            ESP32
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-slate-700">
        {gpsConnected && (
          <span className="text-[10px] text-sky-600 font-mono flex items-center gap-0.5">
            GPS:FIX
          </span>
        )}
        <Signal className="w-3.5 h-3.5 text-slate-600" />
        <Wifi className="w-3.5 h-3.5 text-slate-700" />
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] text-slate-700 font-semibold">92%</span>
          <BatteryMedium className="w-4 h-4 text-emerald-600" />
        </div>
      </div>
    </div>
  );
};
