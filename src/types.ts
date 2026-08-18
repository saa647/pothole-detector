export type HazardType = 'pothole' | 'obstacle';
export type SeverityLevel = 'minor' | 'moderate' | 'major';
export type HazardStatus = 'detected' | 'in-review' | 'verified' | 'repaired';

export interface HazardRecord {
  id: string;
  type: HazardType;
  severity: SeverityLevel;
  latitude: number;
  longitude: number;
  timestamp: string;
  deviceId: string;
  distanceCm: number;
  dipCm: number;
  accelSpikeG: number;
  address?: string;
  status?: HazardStatus;
  notes?: string;
  imageUrl?: string;
  votes?: number;
}

export interface SensorTelemetry {
  distanceCm: number;
  baselineCm: number;
  dipCm: number;
  accelG: number;
  accelRaw: { x: number; y: number; z: number };
  obstacleDetected: boolean;
  gpsFix: boolean;
  latitude: number;
  longitude: number;
  speedKmh: number;
  headingDeg: number;
  wifiConnected: boolean;
  firebaseSynced: boolean;
  timestamp: string;
}

export type TabType = 'map' | 'telemetry' | 'hazards' | 'analytics' | 'hardware';

export type SoftThemeId = 'soft-sage' | 'soft-warm' | 'soft-sepia' | 'soft-dusk' | 'soft-dark';

export interface ThemeConfig {
  id: SoftThemeId;
  name: string;
  subtitle: string;
  bgHex: string;
  cardHex: string;
  accentHex: string;
  textHex: string;
  tag: string;
}

export interface AppSettings {
  soundAlerts: boolean;
  vibrationAlerts: boolean;
  proximityThresholdMeters: number;
  accelThresholdG: number;
  dipThresholdCm: number;
  deviceId: string;
  autoDriveSpeed: number;
  theme: SoftThemeId;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
  };
  connectedToCloud: boolean;
}
