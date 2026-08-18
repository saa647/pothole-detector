/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  HazardRecord, 
  HazardType, 
  SeverityLevel, 
  HazardStatus, 
  SensorTelemetry, 
  TabType, 
  AppSettings 
} from './types';
import { INITIAL_HAZARDS } from './data/initialHazards';
import { GlassHeader } from './components/GlassHeader';
import { BottomNav } from './components/BottomNav';
import { MapView } from './components/MapView';
import { TelemetryView } from './components/TelemetryView';
import { HazardsListView } from './components/HazardsListView';
import { AnalyticsView } from './components/AnalyticsView';
import { HardwareView } from './components/HardwareView';
import { HazardDetailModal } from './components/HazardDetailModal';
import { ReportHazardModal } from './components/ReportHazardModal';
import { ThemeSwitcherModal } from './components/ThemeSwitcherModal';
import { SourceCodeExportModal } from './components/SourceCodeExportModal';
import { playHazardAlertSound, playProximityBeep } from './utils/audioAlert';
import { SoftThemeId } from './types';

// SAU Tandojam Simulation Waypoints
const DRIVE_ROUTE = [
  { lat: 25.4312, lng: 68.5358, address: 'Main Gate Road, SAU Tandojam' },
  { lat: 25.4300, lng: 68.5370, address: 'Administration Block Boulevard' },
  { lat: 25.4285, lng: 68.5392, address: 'Faculty of Agri Engineering Link' },
  { lat: 25.4270, lng: 68.5360, address: 'Central Library Avenue' },
  { lat: 25.4241, lng: 68.5315, address: 'Mirpurkhas Highway (N-120)' },
  { lat: 25.4210, lng: 68.5280, address: 'Tandojam Bypass Crossing' },
  { lat: 25.4260, lng: 68.5270, address: 'Agricultural Research Sub-station' },
  { lat: 25.4330, lng: 68.5285, address: 'ITC Academic Complex West' },
  { lat: 25.4355, lng: 68.5298, address: 'ITC Academic Complex North' },
  { lat: 25.4380, lng: 68.5420, address: 'Student Hostel Avenue 4' },
];

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('map');

  // Hazards state with local persistence
  const [hazards, setHazards] = useState<HazardRecord[]>(() => {
    try {
      const saved = localStorage.getItem('road_guard_hazards');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_HAZARDS;
  });

  useEffect(() => {
    localStorage.setItem('road_guard_hazards', JSON.stringify(hazards));
  }, [hazards]);

  // App Settings with persisted Soft Theme Mode
  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedTheme = (localStorage.getItem('road_guard_theme') as SoftThemeId) || 'soft-sage';
    return {
      soundAlerts: true,
      vibrationAlerts: true,
      proximityThresholdMeters: 40,
      accelThresholdG: 0.35,
      dipThresholdCm: 8.0,
      deviceId: 'ROAD_UNIT_01',
      autoDriveSpeed: 38,
      theme: savedTheme,
      firebaseConfig: {
        apiKey: 'AIzaSyA8_EXAMPLE_SAU_KEY',
        authDomain: 'sau-iot-road.firebaseapp.com',
        databaseURL: 'https://sau-iot-road-default-rtdb.firebaseio.com',
        projectId: 'sau-iot-road',
      },
      connectedToCloud: true,
    };
  });

  // Apply data-theme to HTML body & root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    localStorage.setItem('road_guard_theme', settings.theme);
  }, [settings.theme]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Modals
  const [selectedHazard, setSelectedHazard] = useState<HazardRecord | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  // Drive Simulation State
  const [isDriving, setIsDriving] = useState(false);
  const [routeIndex, setRouteIndex] = useState(0);
  const [currentLocation, setCurrentLocation] = useState({
    lat: DRIVE_ROUTE[0].lat,
    lng: DRIVE_ROUTE[0].lng,
  });

  // Sensor Telemetry State
  const [telemetry, setTelemetry] = useState<SensorTelemetry>({
    distanceCm: 14.5,
    baselineCm: 14.2,
    dipCm: 0.3,
    accelG: 0.04,
    accelRaw: { x: 0.02, y: -0.03, z: 0.99 },
    obstacleDetected: false,
    gpsFix: true,
    latitude: DRIVE_ROUTE[0].lat,
    longitude: DRIVE_ROUTE[0].lng,
    speedKmh: 0,
    headingDeg: 85,
    wifiConnected: true,
    firebaseSynced: true,
    timestamp: new Date().toISOString(),
  });

  // Proximity Alert state
  const [proximityAlert, setProximityAlert] = useState<HazardRecord | null>(null);
  const lastAlertTimeRef = useRef<number>(0);

  // Proximity calculation helper
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Add Hazard Handler (Matches ESP32 publishHazard payload logic from PDF)
  const addHazard = useCallback((
    type: HazardType,
    severity: SeverityLevel,
    lat?: number,
    lng?: number,
    customAddress?: string,
    notes?: string,
    imageUrl?: string
  ) => {
    const targetLat = lat ?? currentLocation.lat + (Math.random() - 0.5) * 0.0004;
    const targetLng = lng ?? currentLocation.lng + (Math.random() - 0.5) * 0.0004;
    const calcDip = severity === 'major' ? 22.5 : severity === 'moderate' ? 12.0 : 8.5;
    const calcAccel = severity === 'major' ? 0.85 : severity === 'moderate' ? 0.52 : 0.38;

    const newRecord: HazardRecord = {
      id: `hz-${Date.now().toString().slice(-4)}`,
      type,
      severity,
      latitude: targetLat,
      longitude: targetLng,
      timestamp: new Date().toISOString(),
      deviceId: settings.deviceId,
      distanceCm: 14.5 + calcDip,
      dipCm: calcDip,
      accelSpikeG: calcAccel,
      address: customAddress || DRIVE_ROUTE[routeIndex % DRIVE_ROUTE.length].address,
      status: 'detected',
      notes: notes || `Auto-detected by ESP32 Edge Sensor Fusion at ${new Date().toLocaleTimeString()}`,
      imageUrl,
      votes: 1,
    };

    setHazards((prev) => [newRecord, ...prev]);

    if (settings.soundAlerts) {
      playHazardAlertSound(type, severity);
    }
  }, [currentLocation, routeIndex, settings.deviceId, settings.soundAlerts]);

  // Simulated Manual Bump trigger
  const handleTriggerSimulatedBump = (intensity: 'light' | 'medium' | 'severe') => {
    const spikeG = intensity === 'severe' ? 0.88 : intensity === 'medium' ? 0.55 : 0.38;
    const dip = intensity === 'severe' ? 24.2 : intensity === 'medium' ? 14.0 : 8.5;
    const sev: SeverityLevel = intensity === 'severe' ? 'major' : intensity === 'medium' ? 'moderate' : 'minor';

    setTelemetry((prev) => ({
      ...prev,
      accelG: spikeG,
      dipCm: dip,
      distanceCm: prev.baselineCm + dip,
      accelRaw: {
        x: (Math.random() - 0.5) * 0.4,
        y: (Math.random() - 0.5) * 0.4,
        z: 1.0 + spikeG,
      },
    }));

    // Check if edge logic confirms hazard
    if (spikeG >= settings.accelThresholdG && dip >= settings.dipThresholdCm) {
      addHazard('pothole', sev);
    }
  };

  // Toggle Obstacle Sensor
  const handleToggleObstacle = () => {
    const nextState = !telemetry.obstacleDetected;
    setTelemetry((prev) => ({
      ...prev,
      obstacleDetected: nextState,
      distanceCm: nextState ? 10.0 : prev.baselineCm,
    }));

    if (nextState) {
      addHazard('obstacle', 'moderate');
    }
  };

  // Continuous Telemetry & Drive Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      // Normal road background vibrations
      const baseJitter = (Math.random() - 0.5) * 0.04;
      const distJitter = (Math.random() - 0.5) * 0.4;
      const rawDistance = 14.2 + distJitter;

      setTelemetry((prev) => {
        // Moving baseline formula from ESP32 code: (1 - 0.02) * baseline + 0.02 * distance
        const alpha = 0.02;
        const newBaseline = (1.0 - alpha) * prev.baselineCm + alpha * rawDistance;
        const dip = Math.max(0, rawDistance - newBaseline);

        return {
          ...prev,
          distanceCm: rawDistance,
          baselineCm: newBaseline,
          dipCm: prev.dipCm > 1.0 ? prev.dipCm * 0.75 : dip, // decay spike
          accelG: prev.accelG > 0.1 ? prev.accelG * 0.75 : Math.abs(baseJitter),
          accelRaw: {
            x: (Math.random() - 0.5) * 0.05,
            y: (Math.random() - 0.5) * 0.05,
            z: 1.0 + baseJitter,
          },
          timestamp: new Date().toISOString(),
        };
      });

      // If simulated drive is active, move vehicle along route waypoints
      if (isDriving) {
        setRouteIndex((prevIdx) => {
          const currentWaypoint = DRIVE_ROUTE[prevIdx];
          const nextWaypoint = DRIVE_ROUTE[(prevIdx + 1) % DRIVE_ROUTE.length];

          // Smooth step interpolation
          const stepRatio = 0.12;
          const newLat = currentLocation.lat + (nextWaypoint.lat - currentLocation.lat) * stepRatio;
          const newLng = currentLocation.lng + (nextWaypoint.lng - currentLocation.lng) * stepRatio;

          setCurrentLocation({ lat: newLat, lng: newLng });

          setTelemetry((prev) => ({
            ...prev,
            latitude: newLat,
            longitude: newLng,
            speedKmh: settings.autoDriveSpeed + (Math.random() - 0.5) * 4,
          }));

          // Check if reached close to target waypoint
          const distToNext = calculateDistanceMeters(newLat, newLng, nextWaypoint.lat, nextWaypoint.lng);
          if (distToNext < 15) {
            return (prevIdx + 1) % DRIVE_ROUTE.length;
          }
          return prevIdx;
        });
      } else {
        setTelemetry((prev) => ({
          ...prev,
          speedKmh: 0,
        }));
      }

      // Proximity Alert Check against logged hazards
      let closestHazard: HazardRecord | null = null;
      let minDistance = Infinity;

      hazards.forEach((h) => {
        const d = calculateDistanceMeters(currentLocation.lat, currentLocation.lng, h.latitude, h.longitude);
        if (d < settings.proximityThresholdMeters && d < minDistance) {
          minDistance = d;
          closestHazard = h;
        }
      });

      if (closestHazard) {
        setProximityAlert(closestHazard);
        if (settings.soundAlerts && now - lastAlertTimeRef.current > 3500) {
          playProximityBeep(minDistance);
          lastAlertTimeRef.current = now;
        }
      } else {
        setProximityAlert(null);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isDriving, currentLocation, routeIndex, hazards, settings]);

  // Hazard actions
  const handleStatusChange = (id: string, newStatus: HazardStatus) => {
    setHazards((prev) =>
      prev.map((h) => (h.id === id ? { ...h, status: newStatus } : h))
    );
    if (selectedHazard && selectedHazard.id === id) {
      setSelectedHazard((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleUpvote = (id: string) => {
    setHazards((prev) =>
      prev.map((h) => (h.id === id ? { ...h, votes: (h.votes || 0) + 1 } : h))
    );
    if (selectedHazard && selectedHazard.id === id) {
      setSelectedHazard((prev) => (prev ? { ...prev, votes: (prev.votes || 0) + 1 } : null));
    }
  };

  const handleDelete = (id: string) => {
    setHazards((prev) => prev.filter((h) => h.id !== id));
    if (selectedHazard && selectedHazard.id === id) {
      setSelectedHazard(null);
    }
  };

  const handleNavigateToHazard = (hazard: HazardRecord) => {
    setCurrentLocation({ lat: hazard.latitude, lng: hazard.longitude });
    setActiveTab('map');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-0 sm:p-4 text-slate-800">
      {/* Android Mobile Frame with Soft Styling and Glass Header */}
      <div 
        id="android-phone-frame"
        className="w-full max-w-md bg-white sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-slate-200/80 overflow-hidden relative min-h-screen sm:min-h-[844px] flex flex-col"
      >
        
        {/* Centered Glassmorphic Header */}
        <GlassHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hazardCount={hazards.length}
          isDriving={isDriving}
          onToggleDrive={() => setIsDriving(!isDriving)}
          soundEnabled={settings.soundAlerts}
          onToggleSound={() => updateSettings({ soundAlerts: !settings.soundAlerts })}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          currentTheme={settings.theme}
          onOpenThemeModal={() => setIsThemeModalOpen(true)}
          onOpenSourceCodeModal={() => setIsSourceModalOpen(true)}
        />

        {/* Dynamic App Tab Screens */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-transparent">
          {activeTab === 'map' && (
            <MapView
              hazards={hazards}
              currentLocation={currentLocation}
              isDriving={isDriving}
              onSelectHazard={setSelectedHazard}
              onAddManualHazard={(type, severity) => addHazard(type, severity)}
              proximityAlert={proximityAlert}
            />
          )}

          {activeTab === 'telemetry' && (
            <TelemetryView
              telemetry={telemetry}
              settings={settings}
              onUpdateSettings={updateSettings}
              onTriggerSimulatedBump={handleTriggerSimulatedBump}
              onTriggerObstacleToggle={handleToggleObstacle}
            />
          )}

          {activeTab === 'hazards' && (
            <HazardsListView
              hazards={hazards}
              onSelectHazard={setSelectedHazard}
              onDeleteHazard={handleDelete}
              onUpvoteHazard={handleUpvote}
              onNavigateToHazard={handleNavigateToHazard}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView hazards={hazards} />
          )}

          {activeTab === 'hardware' && (
            <HardwareView
              settings={settings}
              onUpdateSettings={updateSettings}
              onOpenThemeModal={() => setIsThemeModalOpen(true)}
              onOpenSourceCodeModal={() => setIsSourceModalOpen(true)}
            />
          )}
        </main>

        {/* Android Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hazardBadgeCount={hazards.filter((h) => h.status === 'detected' && h.severity === 'major').length}
        />

        {/* Modals */}
        <SourceCodeExportModal
          isOpen={isSourceModalOpen}
          onClose={() => setIsSourceModalOpen(false)}
        />

        <ThemeSwitcherModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          currentTheme={settings.theme}
          onSelectTheme={(newTheme) => updateSettings({ theme: newTheme })}
        />

        <HazardDetailModal
          hazard={selectedHazard}
          onClose={() => setSelectedHazard(null)}
          onStatusChange={handleStatusChange}
          onUpvote={handleUpvote}
          onDelete={handleDelete}
        />

        <ReportHazardModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          currentLocation={currentLocation}
          onSubmit={(data) => {
            addHazard(
              data.type,
              data.severity,
              data.latitude,
              data.longitude,
              data.address,
              data.notes,
              data.imageUrl
            );
          }}
        />
      </div>
    </div>
  );
}
