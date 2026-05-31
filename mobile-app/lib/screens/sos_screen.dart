// RoadSoS X — Emergency SOS Screen
// Full-screen emergency activation with hospital dispatch info

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/telemetry_provider.dart';

class SOSScreen extends StatefulWidget {
  const SOSScreen({super.key});
  @override
  State<SOSScreen> createState() => _SOSScreenState();
}

class _SOSScreenState extends State<SOSScreen> with SingleTickerProviderStateMixin {
  late AnimationController _pulseCtrl;
  bool _sending = false;
  Position? _position;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _getLocation();
  }

  Future<void> _getLocation() async {
    try {
      final perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied) return;
      final pos = await Geolocator.getCurrentPosition();
      setState(() => _position = pos);
    } catch (_) {}
  }

  Future<void> _triggerSOS() async {
    setState(() => _sending = true);
    final lat = _position?.latitude  ?? 13.0827;
    final lng = _position?.longitude ?? 80.2707;

    try {
      await http.post(
        Uri.parse('${kBackendHTTP}/incidents/'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'title':       'MOBILE SOS — Emergency',
          'description': 'Driver manually triggered SOS from RoadSoS X mobile app',
          'severity':    'critical',
          'lat':         lat,
          'lng':         lng,
          'vehicle_id':  1,
        }),
      );
      context.read<TelemetryProvider>().sosActive = true;
      context.read<TelemetryProvider>().notifyListeners();
    } catch (e) {
      // Still activate locally even if backend unreachable
      context.read<TelemetryProvider>().sosActive = true;
      context.read<TelemetryProvider>().notifyListeners();
    }
    setState(() => _sending = false);
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t  = context.watch<TelemetryProvider>();
    final ed = t.emergencyDispatch;

    return Scaffold(
      backgroundColor: t.sosActive ? const Color(0xFFFEF2F2) : const Color(0xFFF8FAFC),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              // ── Header ───────────────────────────────────────
              Row(
                children: [
                  Text('Emergency SOS',
                    style: GoogleFonts.outfit(
                      fontSize: 24, fontWeight: FontWeight.bold,
                      color: const Color(0xFF1E293B),
                    )),
                  const Spacer(),
                  if (t.sosActive)
                    TextButton(
                      onPressed: t.resetSOS,
                      child: const Text('Reset', style: TextStyle(color: Colors.grey)),
                    ),
                ],
              ),

              const SizedBox(height: 32),

              // ── SOS Button ───────────────────────────────────
              AnimatedBuilder(
                animation: _pulseCtrl,
                builder: (context, child) {
                  final scale = t.sosActive
                    ? 1.0 + _pulseCtrl.value * 0.06
                    : 1.0;
                  return Transform.scale(
                    scale: scale,
                    child: child,
                  );
                },
                child: GestureDetector(
                  onTap: t.sosActive || _sending ? null : _triggerSOS,
                  child: Container(
                    width: 200, height: 200,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: t.sosActive ? const Color(0xFFDC2626) : const Color(0xFFEF4444),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFDC2626).withOpacity(t.sosActive ? 0.5 : 0.3),
                          blurRadius: t.sosActive ? 40 : 20,
                          spreadRadius: t.sosActive ? 10 : 0,
                        )
                      ],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.emergency, color: Colors.white, size: 64),
                        const SizedBox(height: 8),
                        Text(
                          _sending ? 'SENDING...' : t.sosActive ? 'ACTIVE' : 'SOS',
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              if (!t.sosActive)
                Text(
                  'Tap to activate emergency SOS.\nThis will alert emergency services and your contacts.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey.shade600, height: 1.6),
                ),

              // ── Emergency Dispatch Info ───────────────────────
              if (t.sosActive && ed != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFDC2626).withOpacity(0.2)),
                    boxShadow: [BoxShadow(
                      color: Colors.black.withOpacity(0.05), blurRadius: 12,
                    )],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        const Icon(Icons.local_hospital, color: Color(0xFFDC2626)),
                        const SizedBox(width: 8),
                        Text('Nearest Hospital', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                      ]),
                      const SizedBox(height: 12),
                      Text(ed.primaryHospitalName ?? 'Searching...',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                      if (ed.primaryEta != null) ...[
                        const SizedBox(height: 4),
                        Text('ETA: ${ed.primaryEta!.toStringAsFixed(1)} min  •  ${ed.primaryDistanceKm!.toStringAsFixed(1)} km',
                          style: TextStyle(color: Colors.grey.shade600)),
                      ],
                      const SizedBox(height: 8),
                      Text(ed.recommendation,
                        style: const TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
              ],

              if (t.sosActive && ed == null) ...[
                const SizedBox(height: 16),
                const CircularProgressIndicator(color: Color(0xFFDC2626)),
                const SizedBox(height: 8),
                const Text('Finding nearest emergency services...', style: TextStyle(color: Colors.grey)),
              ],

              const Spacer(),

              // ── Quick Call Buttons ────────────────────────────
              Row(
                children: [
                  Expanded(child: _CallButton(label: '🚑 Ambulance', number: 'tel:108')),
                  const SizedBox(width: 12),
                  Expanded(child: _CallButton(label: '🚔 Police',    number: 'tel:100')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CallButton extends StatelessWidget {
  final String label, number;
  const _CallButton({required this.label, required this.number});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFFEF2F2),
        foregroundColor: const Color(0xFFDC2626),
        side: const BorderSide(color: Color(0xFFDC2626)),
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      onPressed: () => launchUrl(Uri.parse(number)),
      child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
    );
  }
}
