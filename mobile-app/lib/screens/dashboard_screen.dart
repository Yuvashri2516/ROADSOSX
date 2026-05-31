// RoadSoS X — Dashboard Screen (Home)
// Shows live AI telemetry, risk card, object counts, and alert feed

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/telemetry_provider.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  Color _riskColor(String risk) {
    switch (risk) {
      case 'CRITICAL': return const Color(0xFFDC2626);
      case 'HIGH':     return const Color(0xFFEA580C);
      case 'MEDIUM':   return const Color(0xFFD97706);
      default:         return const Color(0xFF16A34A);
    }
  }

  IconData _riskIcon(String risk) {
    switch (risk) {
      case 'CRITICAL': return Icons.crisis_alert;
      case 'HIGH':     return Icons.warning_amber_rounded;
      case 'MEDIUM':   return Icons.info_outline;
      default:         return Icons.check_circle_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<TelemetryProvider>();
    final ai = t.aiStatus;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            pinned: true,
            backgroundColor: const Color(0xFF0EA5E9),
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                'RoadSoS X',
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF0EA5E9), Color(0xFF0D9488)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Row(
                  children: [
                    Container(
                      width: 10, height: 10,
                      decoration: BoxDecoration(
                        color: t.isConnected ? const Color(0xFF4ADE80) : const Color(0xFFEF4444),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      t.isConnected ? 'Live' : 'Offline',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ],
                ),
              )
            ],
          ),

          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // ── Risk Hero Card ──────────────────────────────
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: _riskColor(ai.collisionRisk),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: _riskColor(ai.collisionRisk).withOpacity(0.35),
                        blurRadius: 20, offset: const Offset(0, 8),
                      )
                    ],
                  ),
                  child: Row(
                    children: [
                      Icon(_riskIcon(ai.collisionRisk), color: Colors.white, size: 48),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('COLLISION RISK',
                              style: GoogleFonts.outfit(color: Colors.white70, fontSize: 12)),
                            Text(ai.collisionRisk,
                              style: GoogleFonts.outfit(
                                color: Colors.white,
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                              )),
                            Text('Score: ${ai.riskScore.toStringAsFixed(0)}%',
                              style: const TextStyle(color: Colors.white70, fontSize: 13)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // ── Status Row ──────────────────────────────────
                Row(
                  children: [
                    Expanded(child: _StatusCard(
                      icon: Icons.straighten,
                      label: 'Lane',
                      value: ai.laneStatus.replaceAll('LANE ', ''),
                      color: ai.laneStatus == 'LANE STABLE'
                          ? const Color(0xFF16A34A) : const Color(0xFFEA580C),
                    )),
                    const SizedBox(width: 12),
                    Expanded(child: _StatusCard(
                      icon: Icons.face,
                      label: 'Driver',
                      value: ai.driverStatus,
                      color: ai.driverStatus == 'ALERT'
                          ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                    )),
                  ],
                ),

                const SizedBox(height: 16),

                // ── Object Detection Grid ───────────────────────
                Text('Detected Objects',
                  style: GoogleFonts.outfit(
                    fontSize: 18, fontWeight: FontWeight.bold,
                    color: const Color(0xFF1E293B),
                  )),
                const SizedBox(height: 10),
                GridView.count(
                  crossAxisCount: 4,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  children: [
                    _ObjectChip('🚗', 'Cars',    ai.detectedObjects['car']    ?? 0),
                    _ObjectChip('🚛', 'Trucks',  ai.detectedObjects['truck']  ?? 0),
                    _ObjectChip('🚌', 'Buses',   ai.detectedObjects['bus']    ?? 0),
                    _ObjectChip('🚶', 'People',  ai.detectedObjects['person'] ?? 0),
                  ],
                ),

                const SizedBox(height: 16),

                // ── Processing Stats ────────────────────────────
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10, offset: const Offset(0, 4),
                    )],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _Stat('${ai.processingTime.toStringAsFixed(0)}ms', 'Latency'),
                      _divider(),
                      _Stat('${ai.processedFrames}', 'Frames'),
                      _divider(),
                      _Stat('${(1000 / (ai.processingTime + 1)).toStringAsFixed(0)} fps', 'Speed'),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // ── Alerts Feed ─────────────────────────────────
                Text('Alert Feed',
                  style: GoogleFonts.outfit(
                    fontSize: 18, fontWeight: FontWeight.bold,
                    color: const Color(0xFF1E293B),
                  )),
                const SizedBox(height: 10),
                if (t.alerts.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Center(
                      child: Text('✅ No active alerts', style: TextStyle(color: Colors.grey)),
                    ),
                  )
                else
                  ...t.alerts.take(10).map((a) => _AlertTile(alert: a)),

                const SizedBox(height: 80),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider() => Container(height: 40, width: 1, color: Colors.grey.shade200);
}

class _StatusCard extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final Color color;
  const _StatusCard({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 8),
          Text(label, style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
          Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13),
            maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}

class _ObjectChip extends StatelessWidget {
  final String emoji, label;
  final int count;
  const _ObjectChip(this.emoji, this.label, this.count);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 22)),
          Text('$count', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
          Text(label, style: TextStyle(color: Colors.grey.shade500, fontSize: 9)),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String value, label;
  const _Stat(this.value, this.label);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20, color: const Color(0xFF1E293B))),
        Text(label, style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
      ],
    );
  }
}

class _AlertTile extends StatelessWidget {
  final Map<String, dynamic> alert;
  const _AlertTile({required this.alert});

  Color _color() {
    switch (alert['severity']) {
      case 'critical': return const Color(0xFFDC2626);
      case 'high':     return const Color(0xFFEA580C);
      default:         return const Color(0xFFD97706);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _color().withOpacity(0.08),
        border: Border.all(color: _color().withOpacity(0.25)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 4, height: 36,
            decoration: BoxDecoration(color: _color(), borderRadius: BorderRadius.circular(2)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(alert['message'] ?? '', style: TextStyle(color: _color(), fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
