// RoadSoS X — Live Map Screen
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../providers/telemetry_provider.dart';

class MapScreen extends StatelessWidget {
  const MapScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.watch<TelemetryProvider>();

    // Default: Chennai (or use real GPS from geolocator)
    const defaultLat = 13.0827;
    const defaultLng = 80.2707;

    return Scaffold(
      appBar: AppBar(
        title: Text('Live Map', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF0EA5E9),
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          FlutterMap(
            options: const MapOptions(
              initialCenter: LatLng(defaultLat, defaultLng),
              initialZoom: 15,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.roadsos.x',
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: const LatLng(defaultLat, defaultLng),
                    width: 48, height: 48,
                    child: Container(
                      decoration: BoxDecoration(
                        color: t.sosActive
                            ? const Color(0xFFDC2626)
                            : const Color(0xFF0EA5E9),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: [BoxShadow(
                          color: (t.sosActive
                              ? const Color(0xFFDC2626)
                              : const Color(0xFF0EA5E9)).withOpacity(0.4),
                          blurRadius: 12,
                        )],
                      ),
                      child: Icon(
                        t.sosActive ? Icons.emergency : Icons.directions_car,
                        color: Colors.white, size: 22,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Risk overlay
          Positioned(
            top: 16, left: 16, right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.95),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(
                  color: Colors.black.withOpacity(0.1), blurRadius: 12,
                )],
              ),
              child: Row(
                children: [
                  const Icon(Icons.my_location, color: Color(0xFF0EA5E9)),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Vehicle Location', style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                      Text('${defaultLat.toStringAsFixed(4)}, ${defaultLng.toStringAsFixed(4)}',
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: t.sosActive
                          ? const Color(0xFFDC2626)
                          : const Color(0xFF16A34A),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      t.sosActive ? 'SOS' : t.aiStatus.collisionRisk,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
