import React, { useState } from 'react';
import { SensorTelemetry, AppSettings } from '../types';
import { 
  Cpu, 
  Activity, 
  Wifi, 
  Radio, 
  Gauge, 
  Sliders, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Compass, 
  Zap,
  TrendingDown,
  Waves
} from 'lucide-react';

interface TelemetryViewProps {
  telemetry: SensorTelemetry;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onTriggerSimulatedBump: (intensity: 'light' | 'medium' | 'severe') => void;
  onTriggerObstacleToggle: () => void;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({
  telemetry,
  settings,
  onUpdateSettings,
  onTriggerSimulatedBump,
  onTriggerObstacleToggle,
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'diagram' | 'tuning'>('live');

  // Check if current sensor values meet threshold criteria
  const accelCrossed = telemetry.accelG >= settings.accelThresholdG;
  const dipCrossed = telemetry.dipCm >= settings.dipThresholdCm;
  const edgeFusionTriggered = accelCrossed && dipCrossed;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 pb-24 space-y-4 overflow-y-auto">
      {/* Sub-nav switcher */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'live' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Live Telemetry
        </button>
        <button
          onClick={() => setActiveTab('diagram')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'diagram' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Fusion Logic
        </button>
        <button
          onClick={() => setActiveTab('tuning')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'tuning' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          Edge Calibration
        </button>
      </div>

      {activeTab === 'live' && (
        <>
          {/* Main Fusion Status Indicator Card */}
          <div
            className={`p-4 rounded-3xl border transition-all duration-300 ${
              edgeFusionTriggered
                ? 'bg-rose-50 border-rose-300 shadow-lg shadow-rose-500/10'
                : telemetry.obstacleDetected
                ? 'bg-purple-50 border-purple-300 shadow-md shadow-purple-500/10'
                : 'bg-white/90 backdrop-blur-md border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    edgeFusionTriggered
                      ? 'bg-rose-600 animate-ping'
                      : telemetry.obstacleDetected
                      ? 'bg-purple-600 animate-pulse'
                      : 'bg-emerald-500'
                  }`}
                />
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  ESP32 Edge Fusion Status
                </span>
              </div>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                150ms Sample
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {edgeFusionTriggered
                    ? '💥 POTHOLE CONFIRMED'
                    : telemetry.obstacleDetected
                    ? '🚧 OBSTACLE DETECTED'
                    : '🛣️ ROAD SURFACE NORMAL'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {edgeFusionTriggered
                    ? 'Dual-sensor trigger: Accel shock + Ultrasonic road dip'
                    : telemetry.obstacleDetected
                    ? 'IR obstacle proximity sensor beam interrupted'
                    : 'Continuous baseline scanning active'}
                </p>
              </div>
            </div>

            {/* Quick simulated shock triggers */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-600">Simulate:</span>
              <div className="flex items-center gap-1.5 flex-1 justify-end">
                <button
                  onClick={() => onTriggerSimulatedBump('light')}
                  className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100 active:scale-95 transition-all"
                >
                  Minor Dip
                </button>
                <button
                  onClick={() => onTriggerSimulatedBump('severe')}
                  className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 active:scale-95 transition-all shadow-sm"
                >
                  Major Pothole
                </button>
                <button
                  onClick={onTriggerObstacleToggle}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                    telemetry.obstacleDetected
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {telemetry.obstacleDetected ? 'Clear Obstacle' : 'Add Obstacle'}
                </button>
              </div>
            </div>
          </div>

          {/* Sensor 1: HC-SR04 Ultrasonic Road Distance */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">HC-SR04 Ultrasonic Sensor</h4>
                  <p className="text-[10px] text-slate-600 font-mono">GPIO 5 (TRIG) / GPIO 18 (ECHO)</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${dipCrossed ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                Dip: {telemetry.dipCm.toFixed(1)} cm
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-600">Current Distance</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {telemetry.distanceCm.toFixed(1)} <span className="text-xs font-semibold text-slate-600">cm</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-200 ${dipCrossed ? 'bg-rose-500' : 'bg-teal-500'}`}
                    style={{ width: `${Math.min(100, (telemetry.distanceCm / 50) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-600">Moving Baseline</span>
                <div className="text-2xl font-black text-slate-700 mt-1">
                  {telemetry.baselineCm.toFixed(1)} <span className="text-xs font-semibold text-slate-600">cm</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-2 font-mono">
                  α = 0.02 filter applied
                </p>
              </div>
            </div>
          </div>

          {/* Sensor 2: MPU-6050 Accelerometer / IMU */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">MPU6050 Accelerometer (I2C)</h4>
                  <p className="text-[10px] text-slate-600 font-mono">Addr: 0x68 (SDA:21, SCL:22)</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${accelCrossed ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                Shock: {telemetry.accelG.toFixed(2)} g
              </span>
            </div>

            {/* 3-Axis readout */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-600">X-Axis</span>
                <div className="text-base font-extrabold text-slate-800 font-mono mt-0.5">
                  {telemetry.accelRaw.x.toFixed(2)}g
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-600">Y-Axis</span>
                <div className="text-base font-extrabold text-slate-800 font-mono mt-0.5">
                  {telemetry.accelRaw.y.toFixed(2)}g
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-600">Z-Axis</span>
                <div className="text-base font-extrabold text-slate-800 font-mono mt-0.5">
                  {telemetry.accelRaw.z.toFixed(2)}g
                </div>
              </div>
            </div>

            {/* Vibration meter bar */}
            <div>
              <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                <span>Vibration Proxy (|Magnitude - 1.0g|)</span>
                <span className="font-mono font-bold text-slate-800">{telemetry.accelG.toFixed(3)} G</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative">
                {/* Threshold marker line */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                  style={{ left: `${(settings.accelThresholdG / 1.5) * 100}%` }}
                />
                <div 
                  className={`h-full rounded-full transition-all duration-150 ${accelCrossed ? 'bg-rose-500' : 'bg-indigo-500'}`}
                  style={{ width: `${Math.min(100, (telemetry.accelG / 1.5) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-600 mt-1 font-mono">
                <span>0.0g</span>
                <span className="text-rose-600">Trigger: {settings.accelThresholdG}g</span>
                <span>1.5g+</span>
              </div>
            </div>
          </div>

          {/* Sensor 3: NEO-6M GPS & Cloud Realtime Sync */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900">NEO-6M GPS</span>
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Lat:</span>
                  <span className="font-bold text-slate-800">{telemetry.latitude.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Lng:</span>
                  <span className="font-bold text-slate-800">{telemetry.longitude.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Speed:</span>
                  <span className="font-bold text-teal-600">{telemetry.speedKmh.toFixed(0)} km/h</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900">Firebase RTDB</span>
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <span className="font-bold text-emerald-600">SYNCD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Path:</span>
                  <span className="font-bold text-slate-800">/hazards/</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Unit:</span>
                  <span className="font-bold text-slate-700">{settings.deviceId}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'diagram' && (
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-900 text-sm">System Architecture & Detection Logic</h3>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Sindh Agriculture University Tandojam (ITC Dept)
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px]">1</span>
                <span>Field Layer (Sensors)</span>
              </h4>
              <p className="text-slate-600 mt-1">
                Ultrasonic (HC-SR04) measures road distance; MPU-6050 accelerometer reads 3-axis vibration; IR detects obstacles; NEO-6M records precise GPS coordinates.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px]">2</span>
                <span>Edge Processing (ESP32 Fusion)</span>
              </h4>
              <p className="text-slate-600 mt-1 font-mono text-[11px] bg-white p-2 rounded-xl border border-slate-200">
                Pothole Confirmed = (accelG &gt;= 0.35g) &amp;&amp; (dipCm &gt;= 8.0cm)
              </p>
              <p className="text-slate-600 mt-1 text-[11px]">
                Combining both sensors eliminates false positives from regular speed breakers or slight chassis tremors.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px]">3</span>
                <span>Connectivity &amp; Cloud (Firebase)</span>
              </h4>
              <p className="text-slate-600 mt-1">
                Confirmed events package a JSON payload (<code className="font-mono text-teal-700">{`{type, severity, lat, lng, timestamp, distanceCm, dipCm, accelG}`}</code>) and push to Firebase Realtime Database over Wi-Fi without manual entry.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px]">4</span>
                <span>Web / Mobile Dashboard (Leaflet + Alerts)</span>
              </h4>
              <p className="text-slate-600 mt-1">
                Real-time listener automatically plots color-coded pins, provides audio chimes, and informs motorists of upcoming road dangers.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tuning' && (
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Edge Threshold Calibration</h3>
            <p className="text-slate-600 text-xs mt-0.5">
              Tune detection parameters matching your vehicle mount height and suspension stiffness.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Accelerometer Spike Threshold:</span>
                <span className="font-mono text-teal-700">{settings.accelThresholdG} G</span>
              </div>
              <input
                type="range"
                min="0.15"
                max="1.00"
                step="0.05"
                value={settings.accelThresholdG}
                onChange={(e) => onUpdateSettings({ accelThresholdG: parseFloat(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>0.15g (Sensitive)</span>
                <span>0.35g (Firmware Default)</span>
                <span>1.0g (Heavy)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Ultrasonic Dip Threshold:</span>
                <span className="font-mono text-teal-700">{settings.dipThresholdCm} cm</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="25.0"
                step="0.5"
                value={settings.dipThresholdCm}
                onChange={(e) => onUpdateSettings({ dipThresholdCm: parseFloat(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>3.0 cm (Shallow)</span>
                <span>8.0 cm (Firmware Default)</span>
                <span>25.0 cm (Deep Crater)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Proximity Warning Distance:</span>
                <span className="font-mono text-teal-700">{settings.proximityThresholdMeters} meters</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={settings.proximityThresholdMeters}
                onChange={(e) => onUpdateSettings({ proximityThresholdMeters: parseInt(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Vehicle Device ID:</span>
              <input
                type="text"
                value={settings.deviceId}
                onChange={(e) => onUpdateSettings({ deviceId: e.target.value })}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg font-mono text-slate-800 uppercase"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
