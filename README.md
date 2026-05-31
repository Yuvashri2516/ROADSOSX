# RoadSoS X
**"Predict. Prevent. Protect."**

RoadSoS X is an AI-powered vehicle-integrated safety ecosystem that predicts accidents before impact, warns drivers in real time, automatically activates emergency SOS during collisions, and intelligently coordinates rescue operations using computer vision, IoT, embedded systems, and cloud technologies.

## 🚀 Project Overview

Unlike traditional emergency applications that only provide nearby hospital or ambulance information *after* an accident occurs, RoadSoS X continuously monitors vehicle surroundings using cameras, sensors, GPS, and AI models to **prevent accidents** and reduce emergency response time.

### Team Structure (6 Members)
- **Member 1 (AI & Computer Vision)**: Built the YOLOv8 and MediaPipe pipeline in `/ai-vision`.
- **Member 2 (Embedded & TFT)**: Built the ESP32 TFT dashboard firmware in `/embedded-firmware`.
- **Member 3 (Mobile App)**: Built the Flutter companion app in `/mobile-app`.
- **Member 4 (Backend & Cloud)**: Built the FastAPI WebSocket + REST server in `/backend`.
- **Member 5 (Emergency Intel)**: Built the OSRM/OpenStreetMap routing in `/emergency-intelligence`.
- **Member 6 (Dashboard & DevOps)**: Built the Next.js React Dashboard and Docker orchestration.

---

## 📂 Repository Structure

```text
/road safety dashboard
├── /ai-vision                 # Python + OpenCV + YOLOv8 + MediaPipe
│   ├── main.py                # Pipeline orchestrator
│   └── requirements.txt
├── /backend                   # Python FastAPI + SQLite
│   ├── main.py                # REST API & WebSocket Hub
│   └── database.py
├── /dashboard                 # Next.js React Web Dashboard
│   ├── src/app/page.tsx
│   └── src/hooks/useSocket.ts
├── /emergency-intelligence    # Python + httpx (OSRM & Overpass API)
│   ├── emergency_engine.py    # Hospital finder & router
│   └── requirements.txt
├── /embedded-firmware         # C++ / Arduino (ESP32)
│   └── roadsos_tft/roadsos_tft.ino
├── /mobile-app                # Flutter Application
│   └── lib/main.dart
└── docker-compose.yml         # One-click deployment
```

---

## 🛠️ How to Run

### 1. Run the Full Stack via Docker (Recommended)
You can launch the **Backend API** and the **Web Dashboard** simultaneously using Docker Compose:
```bash
docker-compose up --build
```
- Dashboard: `http://localhost:3000`
- Backend API: `http://localhost:8000/docs`

### 2. Run the AI Vision Engine (Locally)
The AI engine requires your laptop webcam and heavy ML dependencies, so it runs directly on your machine.
```bash
cd ai-vision
python -m venv venv
# Windows: .\venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt

# Run using laptop webcam (Ensure backend is running first!)
python main.py
```

### 3. Run the Mobile App
Ensure you have the Flutter SDK installed.
```bash
cd mobile-app
flutter pub get
flutter run
```

### 4. Flash the Bike TFT Dashboard
1. Open Arduino IDE.
2. Install `TFT_eSPI`, `WebSockets`, `ArduinoJson`, `TinyGPSPlus`, and `MPU6050` libraries.
3. Open `embedded-firmware/roadsos_tft/roadsos_tft.ino`.
4. Update `WIFI_SSID`, `WIFI_PASSWORD`, and `WS_HOST` with your credentials/IP.
5. Flash to an ESP32 board.

---

## 📡 System Architecture & Data Flow

1. **AI Vision** processes webcam frames (calculating risk, lane deviation, and eye aspect ratio).
2. **AI Vision** streams a JSON payload via WebSockets to `ws://localhost:8000/ws/telemetry`.
3. **Backend** acts as a central hub, receiving the stream and broadcasting it.
4. **React Dashboard**, **Flutter App**, and **ESP32 TFT** listen to this WebSocket and render the UI live.
5. If an emergency occurs (via AI crash detection or manual SOS button), the **Emergency Engine** pings OpenStreetMap for the nearest hospitals, routes it via OSRM, and the Backend triggers an overriding `EMERGENCY_SOS` broadcast.
