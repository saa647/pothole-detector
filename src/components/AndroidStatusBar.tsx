import React, { useState, useEffect } from 'react';
import { Radio, RadioTower } from 'lucide-react';

interface AndroidStatusBarProps {
  gpsConnected?: boolean;
  iotConnected?: boolean;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = ({
  gpsConnected = false,
  iotConnected = false,
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
        <span className="font-semibold text-slate-800 tracking-tight">{timeStr}</span>
        <span
          className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-mono ${
            iotConnected
              ? 'text-teal-600 bg-teal-50 border-teal-200/60'
              : 'text-slate-400 bg-slate-50 border-slate-200/60'
          }`}
        >
          <Radio className={`w-2.5 h-2.5 ${iotConnected ? 'animate-pulse' : ''}`} />
          {iotConnected ? 'ESP32 Connected' : 'ESP32 Offline'}
        </span>
      </div>

      <div className="flex items-center gap-2 text-slate-700">
        <span
          className={`text-[10px] font-mono flex items-center gap-0.5 ${
            gpsConnected ? 'text-sky-600' : 'text-slate-400'
          }`}
        >
          <RadioTower className="w-3 h-3" />
          {gpsConnected ? 'GPS:FIX' : 'GPS:--'}
        </span>
      </div>
    </div>
  );
};
