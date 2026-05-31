/*
 * RoadSoS X — ESP32 TFT Dashboard Firmware
 * Member 2: Embedded Systems & TFT Integration Lead
 *
 * Hardware:
 *   - ESP32 (WiFi + BLE)
 *   - TFT_eSPI display (240x320 or 320x480)
 *   - NEO-6M GPS Module (UART2)
 *   - MPU-6050 Accelerometer/Gyroscope (I2C)
 *
 * Features:
 *   - Connects to WiFi and receives live AI alerts via WebSocket
 *   - Displays collision risk, lane status, driver status on TFT
 *   - Shows GPS coordinates, speed
 *   - Plays buzzer alert for HIGH/CRITICAL risk
 *   - Renders SOS status screen on emergency
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <TFT_eSPI.h>
#include <TinyGPSPlus.h>
#include <Wire.h>
#include <MPU6050.h>

// ── WiFi Credentials ──────────────────────────────────────
#define WIFI_SSID     "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// ── Backend WebSocket Server ───────────────────────────────
#define WS_HOST       "192.168.1.100"   // IP of your backend server
#define WS_PORT       8000
#define WS_PATH       "/ws/telemetry"

// ── Pin Definitions ────────────────────────────────────────
#define BUZZER_PIN    27
#define SOS_BTN_PIN   35   // Physical SOS button
#define LED_RED_PIN   26
#define LED_GREEN_PIN 25

// ── GPS ────────────────────────────────────────────────────
#define GPS_RX_PIN    16
#define GPS_TX_PIN    17
#define GPS_BAUD      9600

// ── Display Settings ───────────────────────────────────────
#define TFT_WIDTH     240
#define TFT_HEIGHT    320

// ── Objects ────────────────────────────────────────────────
TFT_eSPI    tft;
TFT_eSprite sprite = TFT_eSprite(&tft);
WebSocketsClient ws;
TinyGPSPlus gps;
MPU6050     mpu;
HardwareSerial gpsSerial(2);

// ── State ──────────────────────────────────────────────────
String  collisionRisk  = "LOW";
String  laneStatus     = "LANE STABLE";
String  driverStatus   = "ALERT";
bool    alertRequired  = false;
bool    sosActive      = false;
float   riskScore      = 0.0;
float   gpsLat         = 0.0;
float   gpsLng         = 0.0;
float   gpsSpeed       = 0.0;
int16_t ax, ay, az;
int16_t gx, gy, gz;
unsigned long lastAlertBuzz = 0;
bool wsConnected = false;

// ── Color Palette ──────────────────────────────────────────
#define COLOR_BG       0x0841  // Dark blue-grey
#define COLOR_SAFE     0x07E0  // Green
#define COLOR_WARN     0xFD20  // Orange
#define COLOR_DANGER   0xF800  // Red
#define COLOR_CRITICAL 0xF81F  // Magenta
#define COLOR_WHITE    0xFFFF
#define COLOR_GRAY     0x8410
#define COLOR_ACCENT   0x055F  // Teal

// ────────────────────────────────────────────────────────────
//  DISPLAY FUNCTIONS
// ────────────────────────────────────────────────────────────

uint16_t getRiskColor(String risk) {
  if (risk == "CRITICAL") return COLOR_CRITICAL;
  if (risk == "HIGH")     return COLOR_DANGER;
  if (risk == "MEDIUM")   return COLOR_WARN;
  return COLOR_SAFE;
}

void drawHeader() {
  tft.fillRect(0, 0, TFT_WIDTH, 36, COLOR_ACCENT);
  tft.setTextColor(COLOR_WHITE, COLOR_ACCENT);
  tft.setTextSize(2);
  tft.setCursor(8, 10);
  tft.print("RoadSoS X");

  // Connection status dot
  uint16_t dot = wsConnected ? COLOR_SAFE : COLOR_DANGER;
  tft.fillCircle(TFT_WIDTH - 14, 18, 7, dot);
}

void drawRiskPanel() {
  uint16_t riskColor = getRiskColor(collisionRisk);
  int panelY = 42;

  // Risk banner
  tft.fillRoundRect(4, panelY, TFT_WIDTH - 8, 52, 6, riskColor);
  tft.setTextColor(COLOR_WHITE, riskColor);
  tft.setTextSize(1);
  tft.setCursor(10, panelY + 6);
  tft.print("COLLISION RISK");

  tft.setTextSize(3);
  tft.setCursor(10, panelY + 20);
  tft.print(collisionRisk);
}

void drawLaneStatus() {
  int panelY = 102;
  uint16_t laneColor = (laneStatus == "LANE STABLE") ? COLOR_SAFE : COLOR_WARN;

  tft.fillRect(0, panelY, TFT_WIDTH, 1, COLOR_GRAY);
  tft.fillRoundRect(4, panelY + 4, TFT_WIDTH - 8, 40, 5, COLOR_BG);
  tft.drawRoundRect(4, panelY + 4, TFT_WIDTH - 8, 40, 5, laneColor);

  tft.setTextColor(COLOR_GRAY, COLOR_BG);
  tft.setTextSize(1);
  tft.setCursor(10, panelY + 10);
  tft.print("LANE STATUS");

  tft.setTextColor(laneColor, COLOR_BG);
  tft.setTextSize(1);
  tft.setCursor(10, panelY + 24);
  tft.print(laneStatus);
}

void drawDriverStatus() {
  int panelY = 152;
  uint16_t dColor = (driverStatus == "ALERT") ? COLOR_SAFE : COLOR_DANGER;

  tft.fillRoundRect(4, panelY, TFT_WIDTH / 2 - 6, 42, 5, COLOR_BG);
  tft.drawRoundRect(4, panelY, TFT_WIDTH / 2 - 6, 42, 5, dColor);
  tft.setTextColor(COLOR_GRAY, COLOR_BG);
  tft.setTextSize(1);
  tft.setCursor(8, panelY + 6);
  tft.print("DRIVER");
  tft.setTextColor(dColor, COLOR_BG);
  tft.setCursor(8, panelY + 22);
  tft.print(driverStatus.substring(0, 7));

  // Speed panel
  int sp = TFT_WIDTH / 2 + 2;
  tft.fillRoundRect(sp, panelY, TFT_WIDTH / 2 - 6, 42, 5, COLOR_BG);
  tft.drawRoundRect(sp, panelY, TFT_WIDTH / 2 - 6, 42, 5, COLOR_ACCENT);
  tft.setTextColor(COLOR_GRAY, COLOR_BG);
  tft.setCursor(sp + 4, panelY + 6);
  tft.print("SPEED");
  tft.setTextColor(COLOR_WHITE, COLOR_BG);
  tft.setTextSize(2);
  tft.setCursor(sp + 4, panelY + 20);
  tft.printf("%.0f", gpsSpeed);
  tft.setTextSize(1);
  tft.print(" km/h");
}

void drawGPS() {
  int panelY = 204;
  tft.fillRect(0, panelY, TFT_WIDTH, 1, COLOR_GRAY);
  tft.fillRect(0, panelY + 2, TFT_WIDTH, 36, COLOR_BG);
  tft.setTextColor(COLOR_GRAY, COLOR_BG);
  tft.setTextSize(1);
  tft.setCursor(6, panelY + 6);
  tft.print("GPS");
  tft.setTextColor(COLOR_WHITE, COLOR_BG);
  tft.setCursor(6, panelY + 20);
  tft.printf("%.5f, %.5f", gpsLat, gpsLng);
}

void drawSOSScreen() {
  tft.fillScreen(COLOR_DANGER);
  tft.setTextColor(COLOR_WHITE, COLOR_DANGER);

  tft.setTextSize(3);
  tft.setCursor(50, 40);
  tft.print("SOS");

  tft.setTextSize(2);
  tft.setCursor(12, 90);
  tft.print("EMERGENCY ACTIVE");

  tft.setTextSize(1);
  tft.setCursor(20, 130);
  tft.print("Ambulance Dispatched");
  tft.setCursor(20, 150);
  tft.print("Location Shared");
  tft.setCursor(20, 170);
  tft.printf("LAT: %.5f", gpsLat);
  tft.setCursor(20, 188);
  tft.printf("LNG: %.5f", gpsLng);

  // Pulsing SOS icon - just a red rectangle
  tft.drawRoundRect(30, 220, TFT_WIDTH - 60, 60, 8, COLOR_WHITE);
  tft.setCursor(70, 243);
  tft.setTextSize(2);
  tft.print("RoadSoS X");
}

void drawMainScreen() {
  tft.fillScreen(COLOR_BG);
  drawHeader();
  drawRiskPanel();
  drawLaneStatus();
  drawDriverStatus();
  drawGPS();
}

// ────────────────────────────────────────────────────────────
//  ALERT SYSTEM
// ────────────────────────────────────────────────────────────

void triggerBuzzer(int pattern) {
  unsigned long now = millis();
  if (now - lastAlertBuzz < 2000) return; // Debounce
  lastAlertBuzz = now;

  if (pattern == 1) { // Single beep (MEDIUM)
    tone(BUZZER_PIN, 1000, 300);
  } else if (pattern == 2) { // Double beep (HIGH)
    tone(BUZZER_PIN, 1500, 200); delay(250);
    tone(BUZZER_PIN, 1500, 200);
  } else if (pattern == 3) { // Continuous alarm (CRITICAL/SOS)
    for (int i = 0; i < 5; i++) {
      tone(BUZZER_PIN, 2000, 150); delay(200);
    }
  }
}

// ────────────────────────────────────────────────────────────
//  WEBSOCKET HANDLER
// ────────────────────────────────────────────────────────────

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      wsConnected = true;
      Serial.println("[WS] Connected to backend");
      break;

    case WStype_DISCONNECTED:
      wsConnected = false;
      Serial.println("[WS] Disconnected from backend");
      break;

    case WStype_TEXT: {
      String msg = String((char*)payload);

      // Parse JSON payload
      JsonDocument doc;
      DeserializationError err = deserializeJson(doc, msg);
      if (err) return;

      // Extract AI fields
      collisionRisk = doc["collision_risk"] | "LOW";
      laneStatus    = doc["lane_status"]    | "LANE STABLE";
      driverStatus  = doc["driver_status"]  | "ALERT";
      alertRequired = doc["alert_required"] | false;
      riskScore     = doc["risk_score"]     | 0.0;

      // Check for emergency SOS broadcast
      String msgType = doc["type"] | "";
      if (msgType == "EMERGENCY_SOS") {
        sosActive = true;
      }

      // Trigger alerts
      if (collisionRisk == "CRITICAL") triggerBuzzer(3);
      else if (collisionRisk == "HIGH") triggerBuzzer(2);
      else if (collisionRisk == "MEDIUM") triggerBuzzer(1);

      Serial.printf("[AI] Risk: %s | Lane: %s | Driver: %s\n",
        collisionRisk.c_str(), laneStatus.c_str(), driverStatus.c_str());
      break;
    }

    default:
      break;
  }
}

// ────────────────────────────────────────────────────────────
//  SETUP
// ────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(GPS_BAUD, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(SOS_BTN_PIN, INPUT_PULLUP);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);

  // ── TFT Init ──
  tft.init();
  tft.setRotation(0);
  tft.fillScreen(COLOR_BG);
  tft.setTextColor(COLOR_WHITE, COLOR_BG);
  tft.setTextSize(2);
  tft.setCursor(30, 120);
  tft.print("RoadSoS X");
  tft.setTextSize(1);
  tft.setCursor(40, 150);
  tft.print("Booting...");

  // ── MPU6050 Init ──
  Wire.begin();
  mpu.initialize();
  if (!mpu.testConnection()) {
    Serial.println("[MPU] MPU-6050 not found!");
  } else {
    Serial.println("[MPU] MPU-6050 ready.");
  }

  // ── WiFi Connect ──
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WiFi] Connecting...");
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    delay(500); Serial.print(".");
    timeout++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected: " + WiFi.localIP().toString());
    digitalWrite(LED_GREEN_PIN, HIGH);
  } else {
    Serial.println("\n[WiFi] Failed. Running offline.");
    digitalWrite(LED_RED_PIN, HIGH);
  }

  // ── WebSocket Connect ──
  ws.begin(WS_HOST, WS_PORT, WS_PATH);
  ws.onEvent(webSocketEvent);
  ws.setReconnectInterval(3000);

  drawMainScreen();
  Serial.println("[System] RoadSoS X TFT Dashboard ready.");
}

// ────────────────────────────────────────────────────────────
//  LOOP
// ────────────────────────────────────────────────────────────

void loop() {
  ws.loop();

  // ── GPS Parsing ──
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }
  if (gps.location.isValid()) {
    gpsLat   = gps.location.lat();
    gpsLng   = gps.location.lng();
    gpsSpeed = gps.speed.kmph();
  }

  // ── IMU Reading ──
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  // ── SOS Button (Manual) ──
  if (digitalRead(SOS_BTN_PIN) == LOW) {
    sosActive = true;
    // Send SOS to backend via WebSocket
    JsonDocument doc;
    doc["type"]     = "SOS_MANUAL";
    doc["lat"]      = gpsLat;
    doc["lng"]      = gpsLng;
    String body;
    serializeJson(doc, body);
    ws.sendTXT(body);
    triggerBuzzer(3);
  }

  // ── Crash Detection via IMU (>3g shock) ──
  float accel_magnitude = sqrt(ax*ax + ay*ay + az*az) / 16384.0;
  if (accel_magnitude > 3.0) {
    sosActive = true;
    JsonDocument doc;
    doc["type"]            = "SOS_CRASH_DETECTED";
    doc["lat"]             = gpsLat;
    doc["lng"]             = gpsLng;
    doc["accel_magnitude"] = accel_magnitude;
    String body;
    serializeJson(doc, body);
    ws.sendTXT(body);
    triggerBuzzer(3);
  }

  // ── Display ──
  static unsigned long lastDraw = 0;
  if (millis() - lastDraw > 300) { // Refresh at ~3Hz to avoid flicker
    lastDraw = millis();
    if (sosActive) {
      drawSOSScreen();
    } else {
      drawMainScreen();
    }
  }

  // ── LED Indicators ──
  digitalWrite(LED_RED_PIN,   (collisionRisk == "HIGH" || collisionRisk == "CRITICAL") ? HIGH : LOW);
  digitalWrite(LED_GREEN_PIN, (collisionRisk == "LOW") ? HIGH : LOW);
}
