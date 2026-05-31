// ============================================================
// RoadSoS X — Mock Data Generator Engine
// Generates realistic vehicle telemetry, AI alerts, SOS events
// ============================================================

const VEHICLE_IDS = [
  'TN09AB1234',
  'TN10CD5678',
  'TN07EF9012',
  'TN11GH3456',
  'TN04IJ7890',
];

const VEHICLE_MODELS = [
  'Tata Nexon EV',
  'Mahindra XUV700',
  'Hyundai Creta',
  'Kia Seltos',
  'MG Hector',
];

// Chennai area GPS waypoints for realistic route simulation
const CHENNAI_ROUTES = [
  // Route 1: Marina Beach → T. Nagar
  [
    { lat: 13.0500, lng: 80.2824 },
    { lat: 13.0550, lng: 80.2790 },
    { lat: 13.0580, lng: 80.2750 },
    { lat: 13.0610, lng: 80.2700 },
    { lat: 13.0640, lng: 80.2650 },
    { lat: 13.0600, lng: 80.2550 },
    { lat: 13.0550, lng: 80.2450 },
    { lat: 13.0500, lng: 80.2350 },
    { lat: 13.0480, lng: 80.2300 },
    { lat: 13.0440, lng: 80.2340 },
  ],
  // Route 2: Adyar → Guindy
  [
    { lat: 13.0063, lng: 80.2574 },
    { lat: 13.0100, lng: 80.2530 },
    { lat: 13.0140, lng: 80.2490 },
    { lat: 13.0170, lng: 80.2440 },
    { lat: 13.0200, lng: 80.2400 },
    { lat: 13.0150, lng: 80.2350 },
    { lat: 13.0110, lng: 80.2300 },
    { lat: 13.0080, lng: 80.2250 },
    { lat: 13.0060, lng: 80.2190 },
    { lat: 13.0040, lng: 80.2130 },
  ],
  // Route 3: Egmore → Anna Nagar
  [
    { lat: 13.0732, lng: 80.2609 },
    { lat: 13.0760, lng: 80.2560 },
    { lat: 13.0790, lng: 80.2510 },
    { lat: 13.0830, lng: 80.2470 },
    { lat: 13.0870, lng: 80.2430 },
    { lat: 13.0910, lng: 80.2400 },
    { lat: 13.0950, lng: 80.2380 },
    { lat: 13.0990, lng: 80.2350 },
    { lat: 13.1020, lng: 80.2310 },
    { lat: 13.1050, lng: 80.2270 },
  ],
  // Route 4: Tambaram → Chromepet
  [
    { lat: 12.9249, lng: 80.1270 },
    { lat: 12.9280, lng: 80.1310 },
    { lat: 12.9310, lng: 80.1350 },
    { lat: 12.9350, lng: 80.1390 },
    { lat: 12.9390, lng: 80.1420 },
    { lat: 12.9430, lng: 80.1460 },
    { lat: 12.9470, lng: 80.1500 },
    { lat: 12.9510, lng: 80.1530 },
    { lat: 12.9550, lng: 80.1570 },
    { lat: 12.9580, lng: 80.1600 },
  ],
  // Route 5: Porur → Vadapalani
  [
    { lat: 13.0382, lng: 80.1567 },
    { lat: 13.0410, lng: 80.1620 },
    { lat: 13.0440, lng: 80.1680 },
    { lat: 13.0470, lng: 80.1740 },
    { lat: 13.0500, lng: 80.1800 },
    { lat: 13.0520, lng: 80.1870 },
    { lat: 13.0540, lng: 80.1940 },
    { lat: 13.0560, lng: 80.2010 },
    { lat: 13.0580, lng: 80.2080 },
    { lat: 13.0590, lng: 80.2150 },
  ],
];

const ALERT_TYPES = [
  {
    type: 'COLLISION_RISK',
    severities: ['high', 'critical'],
    messages: [
      'Forward collision warning — object detected at 15m',
      'Proximity alert — vehicle closing distance rapidly',
      'Emergency braking recommended — obstacle ahead',
    ],
  },
  {
    type: 'LANE_DEPARTURE',
    severities: ['medium', 'high'],
    messages: [
      'Vehicle drifting left — lane departure detected',
      'Right lane boundary crossed — corrective action needed',
      'Unintentional lane change detected',
    ],
  },
  {
    type: 'DROWSINESS_DETECTED',
    severities: ['high', 'critical'],
    messages: [
      'Driver drowsiness detected — eye closure > 2.5s',
      'Fatigue warning — irregular steering pattern',
      'Attention level critical — recommend immediate rest stop',
    ],
  },
  {
    type: 'OVERSPEED',
    severities: ['low', 'medium', 'high'],
    messages: [
      'Speed limit exceeded — current zone: 60 km/h',
      'Excessive speed in residential area',
      'Highway speed limit breach — reduce to 120 km/h',
    ],
  },
];

const NEARBY_HOSPITALS = [
  { name: 'Apollo Hospital, Greams Road', distance_km: 2.3, eta_minutes: 8, available_beds: 12 },
  { name: 'MIOT International', distance_km: 5.1, eta_minutes: 15, available_beds: 8 },
  { name: 'Fortis Malar Hospital', distance_km: 3.7, eta_minutes: 11, available_beds: 5 },
  { name: 'Sri Ramachandra Medical Centre', distance_km: 8.2, eta_minutes: 22, available_beds: 18 },
  { name: 'Kauvery Hospital', distance_km: 4.5, eta_minutes: 13, available_beds: 9 },
];

// ---- State Tracking ----
const vehicleStates = {};
let alertIdCounter = 1;

function initVehicleState(index) {
  const route = CHENNAI_ROUTES[index % CHENNAI_ROUTES.length];
  return {
    vehicle_id: VEHICLE_IDS[index],
    model: VEHICLE_MODELS[index],
    speed: 40 + Math.random() * 40,
    rpm: 1500 + Math.random() * 2000,
    battery: 60 + Math.random() * 35,
    brake_temp: 150 + Math.random() * 100,
    fuel_level: 30 + Math.random() * 60,
    gear: 3,
    gps: { ...route[0] },
    routeIndex: 0,
    route: route,
    direction: 1,
    sensors: {
      camera: 'online',
      lidar: 'online',
      radar: 'online',
      ultrasonic: 'online',
    },
  };
}

// Initialize all vehicles
VEHICLE_IDS.forEach((_, i) => {
  vehicleStates[VEHICLE_IDS[i]] = initVehicleState(i);
});

// ---- SOS State ----
let sosState = {
  active: false,
  triggered_at: null,
  vehicle_id: null,
  location: null,
  ambulance_eta: 0,
  dispatched: false,
  nearby_hospitals: NEARBY_HOSPITALS,
  notification_sent: false,
};

// ---- Generators ----

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function evolveVehicleTelemetry(vehicleId) {
  const state = vehicleStates[vehicleId];
  if (!state) return null;

  // Smoothly fluctuate speed
  const speedDelta = (Math.random() - 0.48) * 8;
  state.speed = clamp(state.speed + speedDelta, 0, 180);

  // RPM correlates with speed
  state.rpm = clamp(800 + state.speed * 35 + (Math.random() - 0.5) * 200, 800, 7500);

  // Gear based on speed
  if (state.speed < 15) state.gear = 1;
  else if (state.speed < 30) state.gear = 2;
  else if (state.speed < 50) state.gear = 3;
  else if (state.speed < 80) state.gear = 4;
  else if (state.speed < 110) state.gear = 5;
  else state.gear = 6;

  // Battery slowly drains
  state.battery = clamp(state.battery - Math.random() * 0.05, 10, 100);

  // Brake temp fluctuates with speed
  state.brake_temp = clamp(
    120 + state.speed * 1.5 + (Math.random() - 0.5) * 20,
    100,
    400
  );

  // Fuel slowly decreases
  state.fuel_level = clamp(state.fuel_level - Math.random() * 0.03, 5, 100);

  // GPS: move along route
  const route = state.route;
  state.routeIndex += state.direction;
  if (state.routeIndex >= route.length - 1) {
    state.direction = -1;
    state.routeIndex = route.length - 1;
  } else if (state.routeIndex <= 0) {
    state.direction = 1;
    state.routeIndex = 0;
  }

  const wp = route[state.routeIndex];
  // Add slight randomness to GPS
  state.gps = {
    lat: wp.lat + (Math.random() - 0.5) * 0.0005,
    lng: wp.lng + (Math.random() - 0.5) * 0.0005,
  };

  // Occasionally degrade a sensor
  const sensorKeys = ['camera', 'lidar', 'radar', 'ultrasonic'];
  sensorKeys.forEach((key) => {
    if (Math.random() < 0.005) {
      state.sensors[key] = 'degraded';
    } else if (Math.random() < 0.002) {
      state.sensors[key] = 'offline';
    } else if (Math.random() < 0.05) {
      state.sensors[key] = 'online';
    }
  });

  return {
    vehicle_id: state.vehicle_id,
    model: state.model,
    speed: Math.round(state.speed * 10) / 10,
    rpm: Math.round(state.rpm),
    battery: Math.round(state.battery * 10) / 10,
    brake_temp: Math.round(state.brake_temp),
    fuel_level: Math.round(state.fuel_level * 10) / 10,
    gear: state.gear,
    gps: {
      lat: Math.round(state.gps.lat * 10000) / 10000,
      lng: Math.round(state.gps.lng * 10000) / 10000,
    },
    sensors: { ...state.sensors },
    timestamp: new Date().toISOString(),
  };
}

function generateAlert() {
  const alertDef = ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)];
  const severity =
    alertDef.severities[Math.floor(Math.random() * alertDef.severities.length)];
  const message =
    alertDef.messages[Math.floor(Math.random() * alertDef.messages.length)];
  const vehicleId =
    VEHICLE_IDS[Math.floor(Math.random() * VEHICLE_IDS.length)];

  const riskScores = { low: 25, medium: 55, high: 78, critical: 94 };

  return {
    id: `ALT-${String(alertIdCounter++).padStart(5, '0')}`,
    type: alertDef.type,
    severity,
    message,
    vehicle_id: vehicleId,
    risk_score: riskScores[severity] + Math.floor(Math.random() * 10 - 5),
    timestamp: new Date().toISOString(),
  };
}

function triggerSOS(vehicleId) {
  const vid = vehicleId || VEHICLE_IDS[0];
  const state = vehicleStates[vid];
  sosState = {
    active: true,
    triggered_at: new Date().toISOString(),
    vehicle_id: vid,
    location: state ? { ...state.gps } : { lat: 13.0827, lng: 80.2707 },
    ambulance_eta: 12,
    dispatched: true,
    nearby_hospitals: NEARBY_HOSPITALS.map((h) => ({
      ...h,
      available_beds: Math.max(1, h.available_beds + Math.floor(Math.random() * 4 - 2)),
    })),
    notification_sent: true,
  };
  return sosState;
}

function resetSOS() {
  sosState = {
    active: false,
    triggered_at: null,
    vehicle_id: null,
    location: null,
    ambulance_eta: 0,
    dispatched: false,
    nearby_hospitals: NEARBY_HOSPITALS,
    notification_sent: false,
  };
  return sosState;
}

function getSOSState() {
  // If SOS active, countdown ETA
  if (sosState.active && sosState.ambulance_eta > 0) {
    sosState.ambulance_eta = Math.max(0, sosState.ambulance_eta - 0.025);
    sosState.ambulance_eta = Math.round(sosState.ambulance_eta * 100) / 100;
  }
  return { ...sosState };
}

function generateSystemHealth() {
  const statuses = ['online', 'online', 'online', 'online', 'online', 'degraded'];
  return {
    api: statuses[Math.floor(Math.random() * statuses.length)],
    websocket: 'online',
    database: statuses[Math.floor(Math.random() * statuses.length)],
    uptime: Math.floor(process.uptime()),
    latency_ms: Math.round(12 + Math.random() * 35),
    connected_vehicles: VEHICLE_IDS.length,
  };
}

function getAllVehicles() {
  return VEHICLE_IDS.map((id) => evolveVehicleTelemetry(id)).filter(Boolean);
}

function getVehicle(id) {
  if (!vehicleStates[id]) return null;
  return evolveVehicleTelemetry(id);
}

module.exports = {
  VEHICLE_IDS,
  evolveVehicleTelemetry,
  generateAlert,
  triggerSOS,
  resetSOS,
  getSOSState,
  generateSystemHealth,
  getAllVehicles,
  getVehicle,
};
