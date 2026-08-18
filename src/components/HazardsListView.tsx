import React, { useState } from 'react';
import { HazardRecord, HazardType, SeverityLevel } from '../types';
import { 
  AlertTriangle, 
  MapPin, 
  Clock, 
  Activity, 
  ChevronRight, 
  Search, 
  Filter, 
  ThumbsUp, 
  CheckCircle2, 
  Share2, 
  ExternalLink,
  Trash2,
  Navigation
} from 'lucide-react';

interface HazardsListViewProps {
  hazards: HazardRecord[];
  onSelectHazard: (hazard: HazardRecord) => void;
  onDeleteHazard: (id: string) => void;
  onUpvoteHazard: (id: string) => void;
  onNavigateToHazard: (hazard: HazardRecord) => void;
}

export const HazardsListView: React.FC<HazardsListViewProps> = ({
  hazards,
  onSelectHazard,
  onDeleteHazard,
  onUpvoteHazard,
  onNavigateToHazard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'pothole' | 'obstacle'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'major' | 'moderate' | 'minor'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'severity' | 'votes'>('newest');

  const filteredHazards = hazards
    .filter((h) => {
      const matchType = selectedType === 'all' || h.type === selectedType;
      const matchSev = selectedSeverity === 'all' || h.severity === selectedSeverity;
      const matchQuery =
        !searchQuery ||
        (h.address && h.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (h.notes && h.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        h.deviceId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSev && matchQuery;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === 'severity') {
        const score = { major: 3, moderate: 2, minor: 1 };
        return score[b.severity] - score[a.severity];
      }
      if (sortBy === 'votes') {
        return (b.votes || 0) - (a.votes || 0);
      }
      return 0;
    });

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'major':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'moderate':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'minor':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 pb-24 space-y-3.5 overflow-y-auto">
      {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search road, campus area, device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-800 placeholder-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1 text-xs">
          <div className="flex items-center gap-1">
            {(['all', 'pothole', 'obstacle'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-xl capitalize font-semibold transition-all ${
                  selectedType === type
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'severity' | 'votes')}
            className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-[11px] font-medium text-slate-700 focus:outline-none"
          >
            <option value="newest">Recent First</option>
            <option value="severity">Highest Severity</option>
            <option value="votes">Most Upvoted</option>
          </select>
        </div>
      </div>

      {/* Hazard Count header */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
        <span>Logged Hazards ({filteredHazards.length})</span>
        <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md font-mono">
          Firebase Live Stream
        </span>
      </div>

      {/* Hazard Cards List */}
      {filteredHazards.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Road Hazards Found</h4>
          <p className="text-xs text-slate-600 mt-1">
            All scanned road sectors are in clear condition according to threshold limits.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHazards.map((hazard) => {
            const isPothole = hazard.type === 'pothole';
            const dateStr = new Date(hazard.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={hazard.id}
                id={`hazard-card-${hazard.id}`}
                className="p-3.5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-2.5"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm ${
                        isPothole
                          ? hazard.severity === 'major'
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-500 text-white'
                          : 'bg-purple-600 text-white'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm capitalize text-slate-900">
                          {hazard.type}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${getSeverityBadge(
                            hazard.severity
                          )}`}
                        >
                          {hazard.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span>{dateStr}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="font-mono">{hazard.deviceId}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateToHazard(hazard)}
                    title="View on Map"
                    className="p-2 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-all"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>
                </div>

                {/* Location text */}
                <div className="text-xs text-slate-700 flex items-start gap-1.5 bg-slate-50 p-2 rounded-xl">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-relaxed">
                    {hazard.address || `GPS: ${hazard.latitude.toFixed(4)}, ${hazard.longitude.toFixed(4)}`}
                  </span>
                </div>

                {/* Telemetry measurement chips */}
                <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                  <div className="bg-slate-100/70 p-1.5 rounded-lg text-center">
                    <span className="text-[9px] uppercase block text-slate-600">Road Dip</span>
                    <span className="font-bold text-slate-800">{hazard.dipCm?.toFixed(1) || 0} cm</span>
                  </div>
                  <div className="bg-slate-100/70 p-1.5 rounded-lg text-center">
                    <span className="text-[9px] uppercase block text-slate-600">Shock G</span>
                    <span className="font-bold text-slate-800">{hazard.accelSpikeG?.toFixed(2) || 0} g</span>
                  </div>
                  <div className="bg-slate-100/70 p-1.5 rounded-lg text-center">
                    <span className="text-[9px] uppercase block text-slate-600">Depth</span>
                    <span className="font-bold text-slate-800">{hazard.distanceCm?.toFixed(1) || 0} cm</span>
                  </div>
                </div>

                {/* Footer Controls: Upvotes & Details */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpvoteHazard(hazard.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-all active:scale-95"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-teal-600" />
                      <span>{hazard.votes || 0}</span>
                    </button>
                    <span className="text-[10px] text-slate-600 font-mono">
                      LAT: {hazard.latitude.toFixed(4)}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectHazard(hazard)}
                    className="font-bold text-teal-700 hover:text-teal-900 flex items-center gap-0.5 text-xs"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
