import React from 'react';
import { HazardRecord, HazardStatus } from '../types';
import { 
  X, 
  MapPin, 
  Clock, 
  Cpu, 
  Activity, 
  AlertTriangle, 
  Share2, 
  ExternalLink, 
  CheckCircle2, 
  ThumbsUp,
  Shield,
  Trash2
} from 'lucide-react';

interface HazardDetailModalProps {
  hazard: HazardRecord | null;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: HazardStatus) => void;
  onUpvote: (id: string) => void;
  onDelete: (id: string) => void;
}

export const HazardDetailModal: React.FC<HazardDetailModalProps> = ({
  hazard,
  onClose,
  onStatusChange,
  onUpvote,
  onDelete,
}) => {
  if (!hazard) return null;

  const isPothole = hazard.type === 'pothole';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Road Hazard Alert: ${hazard.type.toUpperCase()}`,
        text: `Watch out! ${hazard.severity} ${hazard.type} detected at ${hazard.address || 'location'}.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `Hazard: ${hazard.type} (${hazard.severity}) at https://maps.google.com/?q=${hazard.latitude},${hazard.longitude}`
      );
      alert('Location link copied to clipboard!');
    }
  };

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${hazard.latitude},${hazard.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div 
        id="hazard-detail-sheet"
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-slideUp"
      >
        {/* Top Header bar with Drag notch */}
        <div className="pt-2 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1 rounded-full bg-slate-300"></div>
        </div>

        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white ${
                isPothole ? 'bg-rose-500' : 'bg-purple-600'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base capitalize flex items-center gap-1.5">
                <span>{hazard.type} Inspection</span>
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                  {hazard.severity}
                </span>
              </h3>
              <p className="text-xs text-slate-600 font-mono">ID: {hazard.id} • {hazard.deviceId}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Photo if available */}
          {hazard.imageUrl && (
            <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-200 shadow-inner bg-slate-100">
              <img
                src={hazard.imageUrl}
                alt="Road Condition Evidence"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                Field Evidence Photo
              </div>
            </div>
          )}

          {/* Location details */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {hazard.address || 'Sindh Agriculture University Campus Corridor'}
                </p>
                <p className="text-[11px] font-mono text-slate-600 mt-0.5">
                  Lat: {hazard.latitude.toFixed(6)} • Lng: {hazard.longitude.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
              <Clock className="w-3.5 h-3.5" />
              <span>Detected: {new Date(hazard.timestamp).toLocaleString()}</span>
            </div>
          </div>

          {/* IoT Sensor Fusion Telemetry Metrics */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-teal-600" />
              <span>Sensor Fusion Telemetry</span>
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-600 uppercase font-semibold block">Calculated Dip</span>
                <span className="text-lg font-black text-rose-600 font-mono">
                  {hazard.dipCm?.toFixed(1) || 0}
                  <span className="text-xs text-slate-600">cm</span>
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-600 uppercase font-semibold block">Vertical G-Spike</span>
                <span className="text-lg font-black text-indigo-600 font-mono">
                  {hazard.accelSpikeG?.toFixed(2) || 0}
                  <span className="text-xs text-slate-600">g</span>
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-600 uppercase font-semibold block">Sensor Dist</span>
                <span className="text-lg font-black text-slate-800 font-mono">
                  {hazard.distanceCm?.toFixed(1) || 0}
                  <span className="text-xs text-slate-600">cm</span>
                </span>
              </div>
            </div>
          </div>

          {/* Notes description */}
          {hazard.notes && (
            <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100 text-xs text-teal-900">
              <span className="font-bold block mb-0.5">Field Inspection Notes:</span>
              <p className="leading-relaxed text-teal-800">{hazard.notes}</p>
            </div>
          )}

          {/* Maintenance & Verification Status Pill Selector */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Road Maintenance Status
            </h4>
            <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
              {(['detected', 'in-review', 'verified', 'repaired'] as HazardStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onStatusChange(hazard.id, st)}
                  className={`py-2 rounded-xl capitalize transition-all ${
                    (hazard.status || 'detected') === st
                      ? 'bg-slate-900 text-white font-bold shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2">
          <button
            onClick={() => onUpvote(hazard.id)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 active:scale-95 transition-all"
          >
            <ThumbsUp className="w-4 h-4 text-teal-600" />
            <span>Confirm ({hazard.votes || 0})</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-700 transition-all"
              title="Share Hazard"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={openGoogleMaps}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
