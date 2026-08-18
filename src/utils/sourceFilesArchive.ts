import { downloadFile } from './downloadHelper';

export interface SourceFileItem {
  path: string;
  name: string;
  category: 'Components' | 'Core' | 'Config' | 'Firmware' | 'Data & Utils';
  content: string;
}

export function getAllProjectFiles(): SourceFileItem[] {
  return [
    {
      path: 'package.json',
      name: 'package.json',
      category: 'Config',
      content: `{
  "name": "roadguard-iot-detector",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/leaflet": "^1.9.12",
    "leaflet": "^1.9.4",
    "lucide-react": "^0.344.0",
    "motion": "^12.4.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.12.7",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.2"
  }
}`
    },
    {
      path: 'vite.config.ts',
      name: 'vite.config.ts',
      category: 'Config',
      content: `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});`
    },
    {
      path: 'index.html',
      name: 'index.html',
      category: 'Core',
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>RoadGuard IoT - Pothole & Road Hazard Detection</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  </head>
  <body class="bg-slate-100 text-slate-900 antialiased min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
    },
    {
      path: 'firmware/ESP32_RoadHazard_Detection.ino',
      name: 'ESP32_RoadHazard_Detection.ino',
      category: 'Firmware',
      content: `/*
 * IoT-Based Road Hazard & Pothole Detection System
 * Sindh Agriculture University (SAU), Tandojam
 * Microcontroller: ESP32-WROOM-32
 * Sensors: HC-SR04 (Ultrasonic), MPU-6050 (I2C 6-DOF), IR Beam, NEO-6M GPS
 */

#include <WiFi.h>
#include <Wire.h>
#include <TinyGPS++.h>
#include <FirebaseESP32.h>

#define WIFI_SSID "SAU_IoT_Lab"
#define WIFI_PASSWORD "sau12345"

#define FIREBASE_HOST "sau-iot-road-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "AIzaSyA8_EXAMPLE_SAU_KEY"

#define TRIG_PIN 5
#define ECHO_PIN 18
#define IR_PIN 19
#define GPS_RX_PIN 16
#define GPS_TX_PIN 17
#define MPU_ADDR 0x68

#define DIP_THRESHOLD_CM 8.0
#define ACCEL_THRESHOLD_G 0.35

TinyGPSPlus gps;
HardwareSerial gpsSerial(2);
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

float movingBaseline = 12.0;
const float alpha = 0.02;

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(IR_PIN, INPUT);

  Wire.begin(21, 22);
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0);
  Wire.endTransmission(true);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected!");

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

float readUltrasonicCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return movingBaseline;
  return (duration * 0.0343) / 2.0;
}

float readAccelZ() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3F);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 2, true);

  if (Wire.available() >= 2) {
    int16_t rawZ = (Wire.read() << 8) | Wire.read();
    return (float)rawZ / 16384.0;
  }
  return 1.0;
}

void loop() {
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  float currentDist = readUltrasonicCm();
  float accelZ = readAccelZ();
  float zSpike = abs(accelZ - 1.0);
  bool irTriggered = (digitalRead(IR_PIN) == LOW);

  float dip = currentDist - movingBaseline;
  if (dip < 0) dip = 0;

  if (dip < 4.0) {
    movingBaseline = (alpha * currentDist) + ((1.0 - alpha) * movingBaseline);
  }

  bool isPothole = (dip >= DIP_THRESHOLD_CM) || (dip >= 5.0 && zSpike >= ACCEL_THRESHOLD_G);
  bool isObstacle = irTriggered && (currentDist < 25.0);

  if (isPothole || isObstacle) {
    double lat = gps.location.isValid() ? gps.location.lat() : 25.4312;
    double lng = gps.location.isValid() ? gps.location.lng() : 68.5358;
    float speed = gps.speed.isValid() ? gps.speed.kmph() : 38.0;

    String hazardType = isPothole ? "pothole" : "obstacle";
    String severity = dip > 18.0 || zSpike > 0.7 ? "major" : (dip > 10.0 ? "moderate" : "minor");

    FirebaseJson json;
    json.set("type", hazardType);
    json.set("severity", severity);
    json.set("latitude", lat);
    json.set("longitude", lng);
    json.set("dipCm", dip);
    json.set("accelG", zSpike);
    json.set("speedKmph", speed);
    json.set("timestamp", String(millis()));
    json.set("deviceId", "ROAD_UNIT_01");

    Firebase.pushJSON(fbdo, "/hazards", json);
    Serial.println("Hazard logged to Firebase successfully!");
    delay(1500);
  }

  delay(100);
}`
    },
    {
      path: 'src/types.ts',
      name: 'types.ts',
      category: 'Data & Utils',
      content: `export type HazardType = 'pothole' | 'bump' | 'obstacle' | 'road_damage';
export type HazardSeverity = 'low' | 'medium' | 'high' | 'critical';
export type HazardStatus = 'active' | 'under_repair' | 'repaired' | 'verified';

export interface HazardRecord {
  id: string;
  type: HazardType;
  severity: HazardSeverity;
  status: HazardStatus;
  latitude: number;
  longitude: number;
  depthCm: number;
  vibrationG: number;
  detectedAt: string;
  roadName: string;
  landmark: string;
  confidence: number;
  source: 'iot_automatic' | 'manual_report';
  sensorSummary: {
    ultrasonicDeltaCm: number;
    accelMagnitudeG: number;
    irBeamTriggered: boolean;
    speedKmph: number;
  };
  upvotes: number;
  notes?: string;
}

export interface SensorTelemetry {
  timestamp: number;
  ultrasonicDistanceCm: number;
  ultrasonicBaselineCm: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  vibrationMagnitudeG: number;
  irObstacleDetected: boolean;
  latitude: number;
  longitude: number;
  speedKmph: number;
  satellites: number;
  wifiRssi: number;
  batteryPercent: number;
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
}`
    },
    {
      path: 'src/data/themes.ts',
      name: 'themes.ts',
      category: 'Data & Utils',
      content: `import { SoftThemeId, ThemeConfig } from '../types';

export const SOFT_THEMES: ThemeConfig[] = [
  {
    id: 'soft-sage',
    name: 'Sage Comfort',
    subtitle: 'Muted Forest & Mint • Eye Strain Relief',
    bgHex: '#f1f5f2',
    cardHex: '#ffffff',
    accentHex: '#059669',
    textHex: '#143828',
    tag: 'Recommended for Day',
  },
  {
    id: 'soft-warm',
    name: 'Warm Oat Milk',
    subtitle: 'Gentle Daylight Cream • Anti-Glare',
    bgHex: '#f6f4ed',
    cardHex: '#ffffff',
    accentHex: '#d97706',
    textHex: '#292524',
    tag: 'Soft Sunlight',
  },
  {
    id: 'soft-sepia',
    name: 'Paper Sepia',
    subtitle: 'Warm Sand Paper • Blue-Light Blocker',
    bgHex: '#f4ede4',
    cardHex: '#fdfbf7',
    accentHex: '#b45309',
    textHex: '#382e28',
    tag: 'Reading Mode',
  },
  {
    id: 'soft-dusk',
    name: 'Twilight Dusk',
    subtitle: 'Lavender Mist • Low Light Emission',
    bgHex: '#f3f1f8',
    cardHex: '#ffffff',
    accentHex: '#7c3aed',
    textHex: '#231e3d',
    tag: 'Evening Drive',
  },
  {
    id: 'soft-dark',
    name: 'Velvet Midnight',
    subtitle: 'Deep OLED Charcoal • Zero Harsh Glare',
    bgHex: '#0f172a',
    cardHex: '#1e293b',
    accentHex: '#38bdf8',
    textHex: '#f8fafc',
    tag: 'Night Drive',
  },
];`
    },
    {
      path: 'src/utils/audioAlert.ts',
      name: 'audioAlert.ts',
      category: 'Data & Utils',
      content: `let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playHazardAlertSound(severity: 'low' | 'medium' | 'high' | 'critical') {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = severity === 'critical' ? 'sawtooth' : 'sine';
    const baseFreq = severity === 'critical' ? 880 : severity === 'high' ? 659.25 : 523.25;

    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

export function playProximityBeep(distanceMeters: number) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const pitch = Math.max(400, Math.min(1200, 1200 - distanceMeters * 18));
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {}
}`
    }
  ];
}

export function downloadSelfExtractingInstaller() {
  const files = getAllProjectFiles();
  
  const setupScript = `// Auto-generated setup script for RoadGuard IoT Hazard Detection App
// Run in an empty folder using: node setup-roadguard.js

const fs = require('fs');
const path = require('path');

const files = ${JSON.stringify(files, null, 2)};

console.log('🚀 Extracting RoadGuard IoT Project files...');

files.forEach((file) => {
  const filePath = path.join(process.cwd(), file.path);
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, file.content, 'utf8');
  console.log('✅ Created: ' + file.path);
});

console.log('\\n🎉 All files generated successfully!');
console.log('Next steps:');
console.log('1. npm install');
console.log('2. npm run dev');
`;

  downloadFile('setup-roadguard.js', setupScript, 'application/javascript');
}
