import React, { useState } from 'react';
import { 
  Cpu, 
  Wifi, 
  Terminal, 
  Copy, 
  Check, 
  Layers, 
  HelpCircle, 
  Radio, 
  Cable,
  ShieldCheck,
  Palette,
  Eye,
  Leaf,
  Sun,
  Coffee,
  Sparkles,
  Moon,
  Volume2,
  Sliders,
  Download,
  FileCode,
  FolderDown
} from 'lucide-react';
import { AppSettings, SoftThemeId } from '../types';
import { SOFT_THEMES } from '../data/themes';
import { exportESP32ArduinoCode, downloadFullProjectScript } from '../utils/downloadHelper';

interface HardwareViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onOpenThemeModal?: () => void;
  onOpenSourceCodeModal?: () => void;
}

export const HardwareView: React.FC<HardwareViewProps> = ({ 
  settings, 
  onUpdateSettings,
  onOpenThemeModal,
  onOpenSourceCodeModal
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getThemeIcon = (id: SoftThemeId) => {
    switch (id) {
      case 'soft-sage':
        return <Leaf className="w-4 h-4 text-emerald-600" />;
      case 'soft-warm':
        return <Sun className="w-4 h-4 text-amber-600" />;
      case 'soft-sepia':
        return <Coffee className="w-4 h-4 text-amber-800" />;
      case 'soft-dusk':
        return <Sparkles className="w-4 h-4 text-violet-600" />;
      case 'soft-dark':
        return <Moon className="w-4 h-4 text-sky-400" />;
    }
  };

  const wiringTable = [
    { module: 'HC-SR04 Ultrasonic', signal: 'TRIG', pin: 'GPIO 5', note: 'Trigger pulse (10µs)' },
    { module: 'HC-SR04 Ultrasonic', signal: 'ECHO', pin: 'GPIO 18', note: 'Via 5V→3.3V voltage divider' },
    { module: 'MPU6050 Accelerometer', signal: 'SDA', pin: 'GPIO 21', note: 'I2C Data line (0x68)' },
    { module: 'MPU6050 Accelerometer', signal: 'SCL', pin: 'GPIO 22', note: 'I2C Clock line' },
    { module: 'IR Obstacle Sensor', signal: 'OUT', pin: 'GPIO 27', note: 'Digital Input (Active LOW)' },
    { module: 'NEO-6M GPS Module', signal: 'TX → RX2', pin: 'GPIO 16', note: 'Serial2 Hardware UART' },
    { module: 'NEO-6M GPS Module', signal: 'RX ← TX2', pin: 'GPIO 17', note: 'Optional command RX' },
    { module: 'Power Supply', signal: 'VCC / GND', pin: '5V / GND', note: '12V vehicle battery regulator' },
  ];

  const sampleJsonPayload = JSON.stringify(
    {
      type: "pothole",
      severity: "major",
      latitude: 25.4312,
      longitude: 68.5358,
      timestamp: new Date().toISOString(),
      deviceId: settings.deviceId,
      distanceCm: 32.5,
      dipCm: 22.1,
      accelSpikeG: 0.82
    },
    null,
    2
  );

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 pb-28 space-y-4 overflow-y-auto">
      {/* Soft Mode Theme Switcher Card */}
      <div className="p-4 rounded-3xl glass-card border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                Soft Mode Themes
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-semibold">
                  Anti-Glare
                </span>
              </h3>
              <p className="text-xs text-slate-500">Soothing color palettes designed to minimize eye strain</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 pt-1">
          {SOFT_THEMES.map((theme) => {
            const isSelected = settings.theme === theme.id;
            return (
              <button
                key={theme.id}
                id={`theme-btn-${theme.id}`}
                onClick={() => onUpdateSettings({ theme: theme.id })}
                className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'border-emerald-600 bg-slate-50 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200/80 bg-white hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-xl border flex items-center justify-center shadow-inner relative overflow-hidden shrink-0"
                    style={{ backgroundColor: theme.bgHex, borderColor: theme.accentHex }}
                  >
                    <div 
                      className="w-3.5 h-3.5 rounded-full shadow-xs" 
                      style={{ backgroundColor: theme.accentHex }} 
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      {getThemeIcon(theme.id)}
                      <span className="font-bold text-xs text-slate-900">{theme.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200/60">
                        {theme.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{theme.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-300 group-hover:border-slate-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detection Thresholds & Alert Settings */}
      <div className="p-4 rounded-3xl glass-card border shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Alert & Detection Parameters</h3>
            <p className="text-xs text-slate-500">Fine-tune threshold sensitivity for road dips & bumps</p>
          </div>
        </div>

        <div className="space-y-3 pt-1 text-xs">
          {/* Dip Threshold */}
          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Pothole Depth Threshold (Δd):</span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                {settings.dipThresholdCm.toFixed(1)} cm
              </span>
            </div>
            <input 
              type="range" 
              min="4.0" 
              max="20.0" 
              step="0.5"
              value={settings.dipThresholdCm}
              onChange={(e) => onUpdateSettings({ dipThresholdCm: parseFloat(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Ultrasonic delta from moving baseline $\alpha = 0.02$</p>
          </div>

          {/* Accel Spike Threshold */}
          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Vibration Shock Threshold (MPU6050):</span>
              <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                {settings.accelThresholdG.toFixed(2)} g
              </span>
            </div>
            <input 
              type="range" 
              min="0.15" 
              max="1.20" 
              step="0.05"
              value={settings.accelThresholdG}
              onChange={(e) => onUpdateSettings({ accelThresholdG: parseFloat(e.target.value) })}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Z-axis bump acceleration to trigger dual-confirmation</p>
          </div>
        </div>
      </div>

      {/* Device Status Card */}
      <div className="p-4 rounded-3xl glass-card border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">ESP32 IoT Node Setup</h3>
              <p className="text-xs text-slate-500">Sindh Agriculture University Tandojam</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <Radio className="w-3 h-3 animate-pulse" />
            Online
          </span>
        </div>

        <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">Controller:</span>
            <span className="font-mono font-bold text-slate-800">ESP32-WROOM-32 (Wi-Fi + BLE)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Sampling Rate:</span>
            <span className="font-mono font-bold text-slate-800">150 ms per cycle</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Cooldown Lock:</span>
            <span className="font-mono font-bold text-slate-800">2500 ms anti-spam</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Database:</span>
            <span className="font-mono font-bold text-emerald-700">Firebase Realtime Database</span>
          </div>
        </div>
      </div>

      {/* Hardware Wiring Pinout Table */}
      <div className="p-4 rounded-3xl glass-card border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Cable className="w-4 h-4 text-emerald-600" />
            <span>Hardware Pinout Table</span>
          </h4>
          <span className="text-[10px] text-slate-500 font-mono">ESP32 GPIOs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <th className="pb-1.5">Sensor</th>
                <th className="pb-1.5">Signal</th>
                <th className="pb-1.5">ESP32 Pin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {wiringTable.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2 text-slate-700 font-sans font-medium">{row.module}</td>
                  <td className="py-2 text-emerald-700">{row.signal}</td>
                  <td className="py-2 font-bold text-slate-900 bg-slate-50 px-1.5 rounded">{row.pin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
          ⚠️ <strong>Safety Warning:</strong> HC-SR04 ECHO operates at 5V. ESP32 GPIO is 3.3V logic. Always connect a resistor divider (e.g. 1kΩ / 2kΩ) to protect GPIO 18.
        </p>
      </div>

      {/* Direct Code & Firmware Downloads */}
      <div className="p-4 rounded-3xl glass-card border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Direct Code &amp; Firmware Downloads</span>
          </h4>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
            Free Direct Download
          </span>
        </div>
        <p className="text-xs text-slate-600">
          Directly download the ready-to-flash ESP32 C++ Arduino sketch (.ino), individual source files, or the 1-click self-extracting project installer.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            id="download-esp32-ino-btn"
            onClick={exportESP32ArduinoCode}
            className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold active:scale-95 transition-all shadow-xs"
          >
            <Cpu className="w-5 h-5 text-emerald-700" />
            <span>Download .INO Sketch</span>
          </button>

          <button
            id="download-readme-btn"
            onClick={downloadFullProjectScript}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold active:scale-95 transition-all shadow-xs"
          >
            <FileCode className="w-5 h-5 text-slate-700" />
            <span>Download README.md</span>
          </button>
        </div>

        {onOpenSourceCodeModal && (
          <button
            id="open-source-browser-btn"
            onClick={onOpenSourceCodeModal}
            className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all shadow-sm"
          >
            <FolderDown className="w-4 h-4 text-emerald-400" />
            <span>Open Full Project Source Code Downloader (All Files)</span>
          </button>
        )}
      </div>

      {/* Live JSON Payload preview */}
      <div className="p-4 rounded-3xl glass-card border shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-slate-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Firebase Telemetry JSON Payload
            </h4>
          </div>
          <button
            onClick={() => copyToClipboard(sampleJsonPayload, 'json')}
            className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/60"
          >
            {copiedSection === 'json' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedSection === 'json' ? 'Copied' : 'Copy JSON'}</span>
          </button>
        </div>

        <pre className="p-3 bg-slate-900 text-emerald-400 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed">
          {sampleJsonPayload}
        </pre>
      </div>

      {/* Installation & Placement Guide */}
      <div className="p-4 rounded-3xl glass-card border shadow-sm space-y-2.5 text-xs text-slate-700">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Vehicle Placement Guidelines</span>
        </h4>
        <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px] leading-relaxed">
          <li>Mount the ultrasonic sensor facing straight down towards the road asphalt at approximately 15–25 cm height.</li>
          <li>Keep the NEO-6M ceramic patch antenna pointed upwards towards the open sky for maximum satellite fix accuracy.</li>
          <li>Secure the MPU-6050 tightly on the vehicle chassis frame to capture authentic vertical vibration shocks.</li>
        </ul>
      </div>
    </div>
  );
};
