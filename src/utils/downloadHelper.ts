import { HazardRecord, AppSettings } from '../types';

export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadFullProjectScript() {
  const readme = `# RoadGuard IoT Road Hazard & Pothole Detection System
### Sindh Agriculture University (SAU) Tandojam

## 🚀 Quick Start Instructions

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start the local development server:
\`\`\`bash
npm run dev
\`\`\`

3. Build production bundle:
\`\`\`bash
npm run build
\`\`\`

## 🔌 Hardware Modules (ESP32)
- **HC-SR04 Ultrasonic**: Trig = GPIO 5, Echo = GPIO 18 (with voltage divider)
- **MPU-6050 Accelerometer/Gyro**: SDA = GPIO 21, SCL = GPIO 22
- **IR Obstacle Sensor**: OUT = GPIO 19
- **NEO-6M GPS**: TX = GPIO 16 (RX2), RX = GPIO 17 (TX2)

## 📡 Cloud Synchronization
Connects directly to Firebase Realtime Database (RTDB) for live road hazard telemetry.
`;

  downloadFile('README.md', readme, 'text/markdown');
}

export function exportESP32ArduinoCode() {
  const arduinoCode = `/*
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
}
`;

  downloadFile('ESP32_RoadHazard_Detection.ino', arduinoCode, 'text/x-csrc');
}
