// ============================================================
// RoadSoS X — Mock API & WebSocket Simulation Server
// Express REST + Socket.IO real-time telemetry engine
// ============================================================

require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const {
  VEHICLE_IDS,
  evolveVehicleTelemetry,
  generateAlert,
  triggerSOS,
  resetSOS,
  getSOSState,
  generateSystemHealth,
  getAllVehicles,
  getVehicle,
} = require('./data/mockData');

const PORT = process.env.PORT || 4000;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Middleware
app.use(cors());
app.use(express.json());

// ---- REST API Endpoints ----

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'roadsos-x-mock-server',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// List all vehicles
app.get('/api/vehicles', (req, res) => {
  res.json({
    success: true,
    data: getAllVehicles(),
    count: VEHICLE_IDS.length,
  });
});

// Single vehicle
app.get('/api/vehicles/:id', (req, res) => {
  const vehicle = getVehicle(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'Vehicle not found' });
  }
  res.json({ success: true, data: vehicle });
});

// Recent alerts
const alertHistory = [];
app.get('/api/alerts', (req, res) => {
  res.json({
    success: true,
    data: alertHistory.slice(-50),
    count: alertHistory.length,
  });
});

// System health
app.get('/api/system-health', (req, res) => {
  res.json({
    success: true,
    data: generateSystemHealth(),
  });
});

// Trigger SOS
app.post('/api/sos/trigger', (req, res) => {
  const { vehicle_id } = req.body || {};
  const sos = triggerSOS(vehicle_id);

  // Broadcast SOS to all connected clients
  io.emit('sos-update', sos);

  console.log(`🚨 SOS TRIGGERED for vehicle ${sos.vehicle_id}`);

  res.json({ success: true, data: sos });
});

// Reset SOS
app.post('/api/sos/reset', (req, res) => {
  const sos = resetSOS();
  io.emit('sos-update', sos);
  console.log('✅ SOS Reset — All clear');
  res.json({ success: true, data: sos });
});

// ---- Socket.IO Real-Time Events ----

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Send initial state
  socket.emit('telemetry', evolveVehicleTelemetry(VEHICLE_IDS[0]));
  socket.emit('system-health', generateSystemHealth());
  socket.emit('sos-update', getSOSState());

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  socket.on('request-vehicle', (vehicleId) => {
    const data = getVehicle(vehicleId);
    if (data) socket.emit('telemetry', data);
  });
});

// ---- Broadcast Loops ----

// Telemetry broadcast every 1.5 seconds
setInterval(() => {
  // Broadcast primary vehicle telemetry
  const primaryTelemetry = evolveVehicleTelemetry(VEHICLE_IDS[0]);
  if (primaryTelemetry) {
    io.emit('telemetry', primaryTelemetry);
  }

  // Broadcast all vehicles telemetry
  const allVehicles = getAllVehicles();
  io.emit('all-vehicles', allVehicles);
}, 1500);

// Alert broadcast every 5-12 seconds (random)
function scheduleNextAlert() {
  const delay = 5000 + Math.random() * 7000;
  setTimeout(() => {
    const alert = generateAlert();
    alertHistory.push(alert);

    // Keep history manageable
    if (alertHistory.length > 200) {
      alertHistory.splice(0, alertHistory.length - 200);
    }

    io.emit('alert', alert);
    console.log(
      `⚠️  Alert: ${alert.type} [${alert.severity}] — ${alert.vehicle_id}`
    );
    scheduleNextAlert();
  }, delay);
}
scheduleNextAlert();

// SOS state updates every 2 seconds (when active)
setInterval(() => {
  const sos = getSOSState();
  if (sos.active) {
    io.emit('sos-update', sos);
  }
}, 2000);

// System health broadcast every 3 seconds
setInterval(() => {
  io.emit('system-health', generateSystemHealth());
}, 3000);

// ---- Start Server ----

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     🚗  RoadSoS X — Mock Server v1.0.0      ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  REST API:    http://localhost:${PORT}/api     ║`);
  console.log(`║  WebSocket:   http://localhost:${PORT}         ║`);
  console.log('║  Status:      ✅ OPERATIONAL                 ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`📡 Broadcasting telemetry for ${VEHICLE_IDS.length} vehicles...`);
});
