import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { HazardRecord, HazardType, SeverityLevel } from '../types';
import { 
  Navigation, 
  Layers, 
  Filter, 
  AlertTriangle, 
  Eye, 
  PlusCircle, 
  Flame, 
  Crosshair,
  MapPin,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface MapViewProps {
  hazards: HazardRecord[];
  currentLocation: { lat: number; lng: number };
  isDriving: boolean;
  onSelectHazard: (hazard: HazardRecord) => void;
  onAddManualHazard: (type: HazardType, severity: SeverityLevel) => void;
  proximityAlert: HazardRecord | null;
}

export const MapView: React.FC<MapViewProps> = ({
  hazards,
  currentLocation,
  isDriving,
  onSelectHazard,
  onAddManualHazard,
  proximityAlert
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);

  const [filterType, setFilterType] = useState<'all' | 'pothole' | 'obstacle'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'major' | 'moderate' | 'minor'>('all');
  const [mapLayer, setMapLayer] = useState<'osm' | 'voyager' | 'satellite'>('voyager');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialMap = L.map(mapContainerRef.current, {
        center: [currentLocation.lat, currentLocation.lng],
        zoom: 15,
        zoomControl: false,
      });

      // Zoom control in bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(initialMap);

      // Base tile layer
      const voyagerTiles = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>, SAU ITC',
          maxZoom: 19,
        }
      );
      voyagerTiles.addTo(initialMap);

      const markersGroup = L.layerGroup().addTo(initialMap);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = initialMap;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer if changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    let url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    if (mapLayer === 'osm') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else if (mapLayer === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    L.tileLayer(url, {
      maxZoom: 19,
      attribution: 'Smart Road IoT • SAU Tandojam',
    }).addTo(map);
  }, [mapLayer]);

  // Update Hazard Pins on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const filtered = hazards.filter((h) => {
      const matchType = filterType === 'all' || h.type === filterType;
      const matchSev = filterSeverity === 'all' || h.severity === filterSeverity;
      return matchType && matchSev;
    });

    filtered.forEach((h) => {
      // Create custom soft HTML icon based on hazard and severity
      const isPothole = h.type === 'pothole';
      let colorClass = 'bg-rose-500 text-white';
      let ringClass = 'ring-rose-200';
      let label = 'POTHOLE';

      if (h.severity === 'major') {
        colorClass = 'bg-rose-600 text-white shadow-rose-300';
        ringClass = 'ring-rose-200 ring-4 animate-pulse';
      } else if (h.severity === 'moderate') {
        colorClass = 'bg-amber-500 text-white shadow-amber-200';
        ringClass = 'ring-amber-100 ring-2';
      } else {
        colorClass = 'bg-emerald-600 text-white shadow-emerald-200';
        ringClass = 'ring-emerald-100';
      }

      if (!isPothole) {
        colorClass = 'bg-purple-600 text-white shadow-purple-200';
        ringClass = 'ring-purple-100 ring-2';
        label = 'OBSTACLE';
      }

      const iconHtml = `
        <div class="relative group cursor-pointer">
          <div class="w-8 h-8 rounded-full ${colorClass} ${ringClass} flex items-center justify-center shadow-lg border-2 border-white transform transition-transform duration-200 hover:scale-125">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              ${
                isPothole
                  ? '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />'
                  : '<path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />'
              }
            </svg>
          </div>
          <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            ${h.severity.toUpperCase()}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-hazard-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([h.latitude, h.longitude], { icon: customIcon });

      marker.on('click', () => {
        onSelectHazard(h);
      });

      marker.addTo(markersGroup);
    });
  }, [hazards, filterType, filterSeverity, onSelectHazard]);

  // Vehicle location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!vehicleMarkerRef.current) {
      const vehicleHtml = `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-teal-400 opacity-60"></span>
          <div class="w-6 h-6 rounded-full bg-teal-600 border-2 border-white shadow-md flex items-center justify-center text-white">
            <svg class="w-3.5 h-3.5 transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
        </div>
      `;

      const vehicleIcon = L.divIcon({
        html: vehicleHtml,
        className: 'vehicle-tracker-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      vehicleMarkerRef.current = L.marker([currentLocation.lat, currentLocation.lng], {
        icon: vehicleIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      vehicleMarkerRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);
    }

    if (isDriving) {
      map.panTo([currentLocation.lat, currentLocation.lng], { animate: true, duration: 0.5 });
    }
  }, [currentLocation, isDriving]);

  const recenterOnVehicle = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentLocation.lat, currentLocation.lng], 16, { animate: true });
    }
  };

  const potholeCount = hazards.filter((h) => h.type === 'pothole').length;
  const obstacleCount = hazards.filter((h) => h.type === 'obstacle').length;

  return (
    <div className="relative w-full h-[calc(100vh-140px)] max-w-md mx-auto overflow-hidden bg-slate-50 flex flex-col">
      {/* Top Floating Glass Bar for Quick Stats & Map Filter */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-col gap-2 pointer-events-none">
        {/* Proximity Urgent Warning Alert Banner */}
        {proximityAlert && (
          <div className="pointer-events-auto bg-gradient-to-r from-rose-500 to-red-600 text-white p-3 rounded-2xl shadow-xl shadow-rose-500/20 border border-rose-400 flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">
                  ⚠️ {proximityAlert.severity} {proximityAlert.type} Ahead!
                </p>
                <p className="text-[11px] text-rose-100 line-clamp-1">
                  {proximityAlert.address || 'Road depression detected 15m ahead'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectHazard(proximityAlert)}
              className="px-2.5 py-1 bg-white text-rose-700 font-bold text-xs rounded-xl shadow-sm hover:bg-rose-50"
            >
              Details
            </button>
          </div>
        )}

        {/* Soft Glass KPI Overview Card */}
        <div className="pointer-events-auto backdrop-blur-xl bg-white/90 p-2.5 rounded-2xl border border-slate-200/80 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col pl-1">
              <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Total Hazards</span>
              <span className="text-lg font-extrabold text-slate-900 leading-none mt-0.5">{hazards.length}</span>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2 text-xs">
              <button 
                onClick={() => setFilterType(filterType === 'pothole' ? 'all' : 'pothole')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                  filterType === 'pothole' ? 'bg-rose-100 text-rose-800 font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>{potholeCount} Potholes</span>
              </button>

              <button 
                onClick={() => setFilterType(filterType === 'obstacle' ? 'all' : 'obstacle')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                  filterType === 'obstacle' ? 'bg-purple-100 text-purple-800 font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>{obstacleCount} Obstacles</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`p-2 rounded-xl border transition-all ${
              showFilterDrawer || filterSeverity !== 'all'
                ? 'bg-teal-50 border-teal-200 text-teal-700'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Dropdown Tray */}
        {showFilterDrawer && (
          <div className="pointer-events-auto backdrop-blur-xl bg-white/95 p-3 rounded-2xl border border-slate-200 shadow-xl flex flex-col gap-2.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Severity Filter</span>
              <span className="text-[10px] text-slate-600">Showing {filterSeverity.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(['all', 'major', 'moderate', 'minor'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`py-1.5 text-xs rounded-xl capitalize font-medium transition-all ${
                    filterSeverity === sev
                      ? 'bg-slate-900 text-white font-bold shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">Map Style</span>
              <div className="flex gap-1">
                {(['voyager', 'osm', 'satellite'] as const).map((layer) => (
                  <button
                    key={layer}
                    onClick={() => setMapLayer(layer)}
                    className={`px-2 py-1 text-[11px] rounded-lg uppercase tracking-wider font-semibold ${
                      mapLayer === layer ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Canvas Container */}
      <div id="road-leaflet-map" ref={mapContainerRef} className="w-full h-full" />

      {/* Right Floating Controls: Recenter GPS, Simulate Hazard */}
      <div className="absolute bottom-6 right-3 z-[400] flex flex-col gap-2">
        <button
          id="recenter-map-gps-btn"
          onClick={recenterOnVehicle}
          className="w-11 h-11 rounded-2xl bg-white/95 backdrop-blur-md text-slate-700 shadow-lg border border-slate-200/80 flex items-center justify-center active:scale-90 hover:bg-slate-50 transition-all"
          title="Recenter Map on Vehicle"
        >
          <Crosshair className="w-5 h-5 text-teal-600" />
        </button>

        {/* Quick Test Hazard Trigger Button */}
        <div className="relative group">
          <button
            id="trigger-test-hazard-btn"
            onClick={() => onAddManualHazard('pothole', 'major')}
            className="w-11 h-11 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/25 flex items-center justify-center active:scale-90 hover:bg-rose-600 transition-all"
            title="Simulate Instant Road Shock (Pothole)"
          >
            <AlertTriangle className="w-5 h-5" />
          </button>
          <span className="absolute right-12 top-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-md">
            Test Shock Sensor
          </span>
        </div>
      </div>

      {/* Legend Badge Bottom Left */}
      <div className="absolute bottom-6 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md text-[10px] text-slate-600 flex items-center gap-2">
        <span className="flex items-center gap-1 font-medium">
          <span className="w-2 h-2 rounded-full bg-rose-600"></span> Major
        </span>
        <span className="flex items-center gap-1 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Moderate
        </span>
        <span className="flex items-center gap-1 font-medium">
          <span className="w-2 h-2 rounded-full bg-purple-600"></span> Obstacle
        </span>
      </div>
    </div>
  );
};
