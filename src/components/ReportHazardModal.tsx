import React, { useState } from 'react';
import { HazardType, SeverityLevel } from '../types';
import { 
  X, 
  MapPin, 
  Camera, 
  AlertTriangle, 
  Upload, 
  Check, 
  Radio,
  Sparkles
} from 'lucide-react';

interface ReportHazardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: HazardType;
    severity: SeverityLevel;
    latitude: number;
    longitude: number;
    address: string;
    notes: string;
    imageUrl?: string;
  }) => void;
  currentLocation: { lat: number; lng: number };
}

export const ReportHazardModal: React.FC<ReportHazardModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentLocation,
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<HazardType>('pothole');
  const [severity, setSeverity] = useState<SeverityLevel>('major');
  const [address, setAddress] = useState('SAU Main Campus Road, Tandojam');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const sampleImages = [
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=600&auto=format&fit=crop&q=80',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        setImageUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      severity,
      latitude: currentLocation.lat + (Math.random() - 0.5) * 0.002,
      longitude: currentLocation.lng + (Math.random() - 0.5) * 0.002,
      address: address || 'Campus Road, Sindh Agriculture University Tandojam',
      notes: notes || 'Hazard verified and manually uploaded via mobile field app.',
      imageUrl: imagePreview || imageUrl || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div 
        id="report-hazard-modal"
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-slideUp"
      >
        <div className="pt-2 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1 rounded-full bg-slate-300"></div>
        </div>

        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Report Road Hazard</h3>
              <p className="text-xs text-slate-600">Manual / Field Verification Entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto">
          {/* Hazard Type Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Hazard Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('pothole')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'pothole'
                    ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Pothole / Road Dip</span>
              </button>

              <button
                type="button"
                onClick={() => setType('obstacle')}
                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'obstacle'
                    ? 'bg-purple-50 border-purple-400 text-purple-700 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                <span>Obstacle / Debris</span>
              </button>
            </div>
          </div>

          {/* Severity Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Severity Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['major', 'moderate', 'minor'] as SeverityLevel[]).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  className={`py-2 px-2.5 rounded-xl border text-xs capitalize font-bold transition-all ${
                    severity === sev
                      ? sev === 'major'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                        : sev === 'moderate'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Road Location / GPS */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Road Location / Area Name
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                placeholder="e.g. Near Faculty of Crop Production Gate"
              />
            </div>
            <p className="text-[10px] font-mono text-slate-600 mt-1">
              GPS Attached: {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
            </p>
          </div>

          {/* Inspection Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Description &amp; Observed Impact
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Deep pothole breaking wheel rim, water filled, high risk for bikes..."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Photo upload / Evidence */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Field Photo Evidence (Optional)
            </label>
            
            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-200 bg-slate-100">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 p-1 bg-slate-900/80 text-white rounded-full hover:bg-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50 hover:bg-teal-50/40 transition-all">
                  <Camera className="w-6 h-6 text-slate-600" />
                  <span className="text-xs font-semibold text-slate-700">Take Photo or Choose File</span>
                  <span className="text-[10px] text-slate-600">JPEG, PNG up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {/* Quick preset thumbnail images */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-600 font-semibold">Or preset:</span>
                  {sampleImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setImagePreview(img);
                        setImageUrl(img);
                      }}
                      className="w-10 h-8 rounded-lg overflow-hidden border border-slate-200 hover:scale-105 transition-transform"
                    >
                      <img src={img} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-teal-600/25 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Broadcast Hazard to Firebase</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
