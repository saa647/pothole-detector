import React from 'react';
import { HazardRecord } from '../types';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  FileSpreadsheet, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Activity,
  MapPin
} from 'lucide-react';

interface AnalyticsViewProps {
  hazards: HazardRecord[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ hazards }) => {
  const total = hazards.length;
  const potholes = hazards.filter((h) => h.type === 'pothole').length;
  const obstacles = hazards.filter((h) => h.type === 'obstacle').length;

  const majorCount = hazards.filter((h) => h.severity === 'major').length;
  const moderateCount = hazards.filter((h) => h.severity === 'moderate').length;
  const minorCount = hazards.filter((h) => h.severity === 'minor').length;

  const repairedCount = hazards.filter((h) => h.status === 'repaired').length;
  const avgDip = total > 0 
    ? (hazards.reduce((acc, curr) => acc + (curr.dipCm || 0), 0) / total).toFixed(1)
    : '0.0';

  const exportCSV = () => {
    const headers = ['ID', 'Type', 'Severity', 'Latitude', 'Longitude', 'Timestamp', 'DeviceID', 'DipCm', 'AccelG', 'Status', 'Address'];
    const rows = hazards.map((h) => [
      h.id,
      h.type,
      h.severity,
      h.latitude,
      h.longitude,
      h.timestamp,
      h.deviceId,
      h.dipCm || 0,
      h.accelSpikeG || 0,
      h.status || 'detected',
      `"${(h.address || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `road_hazards_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportGeoJSON = () => {
    const geoJson = {
      type: 'FeatureCollection',
      features: hazards.map((h) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [h.longitude, h.latitude],
        },
        properties: {
          id: h.id,
          type: h.type,
          severity: h.severity,
          timestamp: h.timestamp,
          deviceId: h.deviceId,
          dipCm: h.dipCm,
          accelSpikeG: h.accelSpikeG,
          address: h.address,
        },
      })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoJson, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `road_hazards_gis_${new Date().toISOString().slice(0, 10)}.geojson`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 pb-24 space-y-4 overflow-y-auto">
      {/* Overview Stats */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Road Quality Intelligence</h3>
            <p className="text-xs text-slate-600">Crowdsourced IoT Pothole Analytics</p>
          </div>
          <span className="text-xs font-mono font-bold bg-teal-50 text-teal-700 px-2 py-1 rounded-xl border border-teal-200">
            SAU Tandojam
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-600 block">Total Detected</span>
            <span className="text-2xl font-black text-slate-900 leading-tight mt-0.5">{total}</span>
            <div className="flex items-center gap-1 text-[10px] text-slate-600 mt-1">
              <span>{potholes} potholes</span>
              <span>•</span>
              <span>{obstacles} obstacles</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-600 block">Avg Crater Depth</span>
            <span className="text-2xl font-black text-rose-600 leading-tight mt-0.5 font-mono">
              {avgDip} <span className="text-xs text-slate-600 font-sans">cm</span>
            </span>
            <span className="text-[10px] text-slate-600 block mt-1">HC-SR04 baseline delta</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-600 block">High Risk (Major)</span>
            <span className="text-2xl font-black text-rose-600 leading-tight mt-0.5">{majorCount}</span>
            <span className="text-[10px] text-rose-700 block mt-1 font-semibold">
              {total > 0 ? ((majorCount / total) * 100).toFixed(0) : 0}% critical hazards
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-600 block">Repaired / Patched</span>
            <span className="text-2xl font-black text-emerald-600 leading-tight mt-0.5">{repairedCount}</span>
            <span className="text-[10px] text-emerald-700 block mt-1 font-semibold">
              {total > 0 ? ((repairedCount / total) * 100).toFixed(0) : 0}% fixed
            </span>
          </div>
        </div>
      </div>

      {/* Severity Breakdown Progress Bars */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Severity Distribution
        </h4>

        <div className="space-y-2.5 text-xs">
          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span>Major Risk (Deep crater / High shock)</span>
              </span>
              <span className="font-mono font-bold text-slate-900">{majorCount}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full"
                style={{ width: `${total > 0 ? (majorCount / total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Moderate Potholes</span>
              </span>
              <span className="font-mono font-bold text-slate-900">{moderateCount}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${total > 0 ? (moderateCount / total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold text-slate-700 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Minor Surface Dips</span>
              </span>
              <span className="font-mono font-bold text-slate-900">{minorCount}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${total > 0 ? (minorCount / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Export to Municipal Authorities / SAU Department & Direct Download */}
      <div className="p-4 rounded-3xl glass-card border shadow-sm space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Data Export &amp; Direct Downloads
        </h4>
        <p className="text-xs text-slate-600">
          Download real-time road hazard records, GIS coordinates, and full project configuration files directly to your device.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            id="download-csv-btn"
            onClick={exportCSV}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold text-slate-800 active:scale-95 transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Export CSV Table</span>
          </button>

          <button
            id="download-geojson-btn"
            onClick={exportGeoJSON}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs font-bold text-slate-800 active:scale-95 transition-all shadow-xs"
          >
            <Download className="w-5 h-5 text-teal-600" />
            <span>Export GeoJSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
