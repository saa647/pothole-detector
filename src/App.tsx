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
import { db } from './firebase';
import { ref, onValue, push, update, remove, serverTimestamp } from 'firebase/database';
import { AndroidStatusBar } from './components/AndroidStatusBar';
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

// Default coordinates shown only until the first real GPS fix arrives from the ESP32.
const DEFAULT_LOCATION = { lat: 25.4312, lng: 68.5358 };

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('map');

  // Hazards — synced live from Firebase Realtime Database (/hazards), populated by the ESP32 device.
  const [hazards, setHazards] = useState<HazardRecord[]>([]);
  const [hazardsLoaded, setHazardsLoaded] = useState(false);

  useEffect(() => {
    const hazardsRef = ref(db, 'hazards');
    const unsubscribe = onValue(hazardsRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        setHazards([]);
        setHazardsLoaded(true);
        return;
      }
      const list: HazardRecord[] = Object.entries(val).map(([key, value]) => ({
        id: key,
        ...(value as Omit<HazardRecord, 'id'>),
      }));
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHazards(list);
      setHazardsLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  // App Settings (device id + thresholds are still locally configurable; theme persists locally)
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
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      },
      connectedToCloud: false,
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

  // Live Sensor Telemetry — synced from Firebase (/telemetry/{deviceId}), published continuously by the ESP32.
  const [telemetry, setTelemetry] = useState<SensorTelemetry>({
    distanceCm: 0,
    baselineCm: 0,
    dipCm: 0,
    accelG: 0,
    accelRaw: { x: 0, y: 0, z: 0 },
    obstacleDetected: false,
    gpsFix: false,
    latitude: DEFAULT_LOCATION.lat,
    longitude: DEFAULT_LOCATION.lng,
    speedKmh: 0,
    headingDeg: 0,
    wifiConnected: false,
    firebaseSynced: false,
    timestamp: new Date(0).toISOString(),
  });

  // Tracks whether the device has sent a telemetry update recently, so the UI never lies about "live" status.
  const [deviceOnline, setDeviceOnline] = useState(false);
  const lastTelemetryAtRef = useRef<number>(0);

  useEffect(() => {
    const telemetryRef = ref(db, `telemetry/${settings.deviceId}`);
    const unsubscribe = onValue(telemetryRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) return;
      lastTelemetryAtRef.current = Date.now();
      setTelemetry((prev) => ({ ...prev, ...val }));
    });
    return () => unsubscribe();
  }, [settings.deviceId]);

  // Consider the device "online" if it has reported telemetry within the last 8 seconds.
  useEffect(() => {
    const interval = setInterval(() => {
      setDeviceOnline(Date.now() - lastTelemetryAtRef.current < 8000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Firebase Realtime Database connection state (real, not assumed)
  useEffect(() => {
    const connectedRef = ref(db, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      updateSettings({ connectedToCloud: snapshot.val() === true });
    });
    return () => unsubscribe();
  }, []);

  // Proximity Alert state
  const [proximityAlert, setProximityAlert] = useState<HazardRecord | null>(null);
  const lastAlertTimeRef = useRef<number>(0);

  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const dPhi = ((lat2 - lat1) * Math.PI) / 180;
    const dLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Add Hazard — writes a real record to Firebase. The live /hazards listener above
  // then reflects it back into the UI, so this works identically whether the hazard
  // came from the ESP32 device or a manual report in the app.
  const addHazard = useCallback((
    type: HazardType,
    severity: SeverityLevel,
    lat?: number,
    lng?: number,
    customAddress?: string,
    notes?: string,
    imageUrl?: string
  ) => {
    const targetLat = lat ?? telemetry.latitude;
    const targetLng = lng ?? telemetry.longitude;

    const newRecord: Omit<HazardRecord, 'id'> = {
      type,
      severity,
      latitude: targetLat,
      longitude: targetLng,
      timestamp: new Date().toISOString(),
      deviceId: settings.deviceId,
      distanceCm: telemetry.distanceCm,
      dipCm: telemetry.dipCm,
      accelSpikeG: telemetry.accelG,
      address: customAddress,
      status: 'detected',
      notes: notes || 'Manually reported from the app.',
      imageUrl,
      votes: 1,
    };

    push(ref(db, 'hazards'), newRecord);

    if (settings.soundAlerts) {
      playHazardAlertSound(type, severity);
    }
  }, [telemetry, settings.deviceId, settings.soundAlerts]);

  // Proximity Alert Check — runs whenever live position or the hazard list changes.
  useEffect(() => {
    let closestHazard: HazardRecord | null = null;
    let minDistance = Infinity;

    hazards.forEach((h) => {
      const d = calculateDistanceMeters(telemetry.latitude, telemetry.longitude, h.latitude, h.longitude);
      if (d < settings.proximityThresholdMeters && d < minDistance) {
        minDistance = d;
        closestHazard = h;
      }
    });

    if (closestHazard) {
      setProximityAlert(closestHazard);
      const now = Date.now();
      if (settings.soundAlerts && now - lastAlertTimeRef.current > 3500) {
        playProximityBeep(minDistance);
        lastAlertTimeRef.current = now;
      }
    } else {
      setProximityAlert(null);
    }
  }, [telemetry.latitude, telemetry.longitude, hazards, settings.proximityThresholdMeters, settings.soundAlerts]);

  // Hazard actions — all write through to Firebase so every connected client (and the device) stays in sync.
  const handleStatusChange = (id: string, newStatus: HazardStatus) => {
    update(ref(db, `hazards/${id}`), { status: newStatus });
    if (selectedHazard && selectedHazard.id === id) {
      setSelectedHazard((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleUpvote = (id: string) => {
    const current = hazards.find((h) => h.id === id);
    const nextVotes = (current?.votes || 0) + 1;
    update(ref(db, `hazards/${id}`), { votes: nextVotes });
    if (selectedHazard && selectedHazard.id === id) {
      setSelectedHazard((prev) => (prev ? { ...prev, votes: nextVotes } : null));
    }
  };

  const handleDelete = (id: string) => {
    remove(ref(db, `hazards/${id}`));
    if (selectedHazard && selectedHazard.id === id) {
      setSelectedHazard(null);
    }
  };

  const handleNavigateToHazard = (hazard: HazardRecord) => {
    setActiveTab('map');
  };

  const currentLocation = { lat: telemetry.latitude, lng: telemetry.longitude };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-0 sm:p-4 text-slate-800">
      {/* Android Mobile Frame with Soft Styling and Glass Header */}
      <div
        id="android-phone-frame"
        className="w-full max-w-md bg-white sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-slate-200/80 overflow-hidden relative min-h-screen sm:min-h-[844px] flex flex-col"
      >
        {/* Top Native-style Android Status Bar — reflects real device connection state, no fake values */}
        <AndroidStatusBar
          gpsConnected={telemetry.gpsFix}
          iotConnected={deviceOnline}
        />

        {/* Centered Glassmorphic Header */}
        <GlassHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hazardCount={hazards.length}
          deviceOnline={deviceOnline}
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
              isDriving={deviceOnline}
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
              deviceOnline={deviceOnline}
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
