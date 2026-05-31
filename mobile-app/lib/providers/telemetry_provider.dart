// RoadSoS X — Telemetry Provider
// Manages live WebSocket state for the entire mobile app

import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

const String kBackendWS   = 'ws://192.168.1.100:8000/ws/telemetry'; // Update to your server IP
const String kBackendHTTP = 'http://192.168.1.100:8000';

class AIStatus {
  final String collisionRisk;
  final String laneStatus;
  final String driverStatus;
  final bool   alertRequired;
  final double riskScore;
  final int    processedFrames;
  final double processingTime;
  final Map<String, int> detectedObjects;

  AIStatus({
    required this.collisionRisk,
    required this.laneStatus,
    required this.driverStatus,
    required this.alertRequired,
    required this.riskScore,
    required this.processedFrames,
    required this.processingTime,
    required this.detectedObjects,
  });

  factory AIStatus.fromJson(Map<String, dynamic> j) => AIStatus(
    collisionRisk:    j['collision_risk']  ?? 'LOW',
    laneStatus:       j['lane_status']     ?? 'LANE STABLE',
    driverStatus:     j['driver_status']   ?? 'ALERT',
    alertRequired:    j['alert_required']  ?? false,
    riskScore:        (j['risk_score']     ?? 0).toDouble(),
    processedFrames:  j['processed_frames'] ?? 0,
    processingTime:   (j['processing_time'] ?? 0).toDouble(),
    detectedObjects: Map<String, int>.from(
      (j['detected_objects'] ?? {}).map((k, v) => MapEntry(k, (v as num).toInt()))
    ),
  );

  factory AIStatus.empty() => AIStatus(
    collisionRisk: 'LOW', laneStatus: 'LANE STABLE',
    driverStatus: 'ALERT', alertRequired: false,
    riskScore: 0, processedFrames: 0, processingTime: 0,
    detectedObjects: {},
  );
}

class EmergencyDispatch {
  final String? primaryHospitalName;
  final double? primaryEta;
  final double? primaryDistanceKm;
  final String  recommendation;

  EmergencyDispatch({
    this.primaryHospitalName,
    this.primaryEta,
    this.primaryDistanceKm,
    required this.recommendation,
  });

  factory EmergencyDispatch.fromJson(Map<String, dynamic> j) {
    final ph = j['primary_hospital'];
    return EmergencyDispatch(
      primaryHospitalName: ph?['name'],
      primaryEta:          (ph?['eta_minutes'] ?? 0).toDouble(),
      primaryDistanceKm:   (ph?['distance_km'] ?? 0).toDouble(),
      recommendation:      j['recommendation'] ?? '',
    );
  }
}

class TelemetryProvider extends ChangeNotifier {
  WebSocketChannel? _channel;
  StreamSubscription? _sub;
  Timer? _reconnectTimer;

  bool   isConnected     = false;
  bool   sosActive       = false;
  AIStatus aiStatus      = AIStatus.empty();
  EmergencyDispatch? emergencyDispatch;
  List<Map<String, dynamic>> alerts = [];

  void connect() {
    _tryConnect();
  }

  void _tryConnect() {
    try {
      _channel = WebSocketChannel.connect(Uri.parse(kBackendWS));
      isConnected = true;
      notifyListeners();

      _sub = _channel!.stream.listen(
        _onMessage,
        onError: (_) => _handleDisconnect(),
        onDone:  ()  => _handleDisconnect(),
      );
    } catch (_) {
      _handleDisconnect();
    }
  }

  void _onMessage(dynamic raw) {
    try {
      final data = jsonDecode(raw as String) as Map<String, dynamic>;
      final type = data['type'] as String? ?? '';

      if (type == 'EMERGENCY_SOS') {
        sosActive = true;
        alerts.insert(0, {
          'type':    'EMERGENCY_SOS',
          'message': '🚨 Emergency SOS Activated!',
          'time':    DateTime.now().toIso8601String(),
          'severity': 'critical',
        });
      } else if (type == 'EMERGENCY_DISPATCH') {
        emergencyDispatch = EmergencyDispatch.fromJson(data);
      } else if (data.containsKey('collision_risk')) {
        // Regular AI telemetry
        aiStatus = AIStatus.fromJson(data);

        // Auto-generate alert if needed
        if (aiStatus.alertRequired) {
          final msg = _buildAlertMessage(aiStatus);
          if (msg != null && (alerts.isEmpty || alerts.first['message'] != msg)) {
            alerts.insert(0, {
              'type':     aiStatus.collisionRisk,
              'message':  msg,
              'time':     DateTime.now().toIso8601String(),
              'severity': aiStatus.collisionRisk == 'CRITICAL' ? 'critical'
                        : aiStatus.collisionRisk == 'HIGH'     ? 'high'
                        : 'medium',
            });
            if (alerts.length > 50) alerts.removeLast();
          }
        }
      }
      notifyListeners();
    } catch (_) {}
  }

  String? _buildAlertMessage(AIStatus s) {
    if (s.driverStatus == 'SLEEPING') return '⚠️ Driver sleeping! Pull over now.';
    if (s.driverStatus == 'DROWSY')   return '⚠️ Driver drowsiness detected.';
    if (s.collisionRisk == 'CRITICAL') return '🚨 CRITICAL collision risk ahead!';
    if (s.collisionRisk == 'HIGH')    return '⚠️ High collision risk — reduce speed.';
    if (s.laneStatus == 'LANE DEPARTED') return '⚠️ Lane departure detected!';
    if (s.laneStatus == 'LANE DRIFTING') return '⚠️ Vehicle drifting out of lane.';
    return null;
  }

  Future<void> triggerSOS(double lat, double lng) async {
    sosActive = true;
    notifyListeners();

    // POST to backend
    try {
      final body = jsonEncode({
        'title':       'Mobile SOS Trigger',
        'description': 'User manually triggered SOS from mobile app',
        'severity':    'critical',
        'lat':         lat,
        'lng':         lng,
        'vehicle_id':  1,
      });
      // Use http package to POST
      // Handled by SOSScreen directly with http package
    } catch (_) {}
  }

  void resetSOS() {
    sosActive = false;
    emergencyDispatch = null;
    notifyListeners();
  }

  void _handleDisconnect() {
    isConnected = false;
    notifyListeners();
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 5), _tryConnect);
  }

  @override
  void dispose() {
    _sub?.cancel();
    _channel?.sink.close();
    _reconnectTimer?.cancel();
    super.dispose();
  }
}
