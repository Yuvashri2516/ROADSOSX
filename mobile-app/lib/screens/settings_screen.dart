// RoadSoS X — Settings Screen
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _serverCtrl   = TextEditingController(text: '192.168.1.100');
  final _contactCtrl  = TextEditingController();
  bool _autoSOS = true;
  bool _voiceAlerts = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _serverCtrl.text  = prefs.getString('server_ip') ?? '192.168.1.100';
      _contactCtrl.text = prefs.getString('emergency_contact') ?? '';
      _autoSOS          = prefs.getBool('auto_sos') ?? true;
      _voiceAlerts      = prefs.getBool('voice_alerts') ?? true;
    });
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('server_ip', _serverCtrl.text);
    await prefs.setString('emergency_contact', _contactCtrl.text);
    await prefs.setBool('auto_sos', _autoSOS);
    await prefs.setBool('voice_alerts', _voiceAlerts);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Settings saved!'), backgroundColor: Color(0xFF16A34A)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Settings', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF0EA5E9),
        foregroundColor: Colors.white,
        actions: [
          TextButton(
            onPressed: _save,
            child: const Text('Save', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SectionHeader('Connection'),
          _Card(child: Column(children: [
            _TextField(controller: _serverCtrl, label: 'Backend Server IP', hint: '192.168.1.100'),
          ])),

          _SectionHeader('Emergency Contacts'),
          _Card(child: _TextField(
            controller: _contactCtrl,
            label: 'Emergency Contact Number',
            hint: '+91 XXXXX XXXXX',
            keyboardType: TextInputType.phone,
          )),

          _SectionHeader('Safety Preferences'),
          _Card(child: Column(children: [
            SwitchListTile(
              title: const Text('Automatic SOS'),
              subtitle: const Text('Trigger SOS automatically on crash detection'),
              value: _autoSOS,
              onChanged: (v) => setState(() => _autoSOS = v),
              activeColor: const Color(0xFF0EA5E9),
            ),
            const Divider(height: 1),
            SwitchListTile(
              title: const Text('Voice Alerts'),
              subtitle: const Text('Speak collision and lane warnings aloud'),
              value: _voiceAlerts,
              onChanged: (v) => setState(() => _voiceAlerts = v),
              activeColor: const Color(0xFF0EA5E9),
            ),
          ])),

          _SectionHeader('About'),
          _Card(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _InfoRow('App Version',   '1.0.0'),
              _InfoRow('Backend API',   'FastAPI v2.0.0'),
              _InfoRow('AI Engine',     'YOLOv8 + MediaPipe'),
              _InfoRow('Maps',          'OpenStreetMap / OSRM'),
              _InfoRow('Team',          '6 Members'),
              _InfoRow('Tagline',       '"Predict. Prevent. Protect."'),
            ],
          )),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 12),
    child: Text(title, style: GoogleFonts.outfit(
      fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF0EA5E9))),
  );
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
    ),
    child: child,
  );
}

class _TextField extends StatelessWidget {
  final TextEditingController controller;
  final String label, hint;
  final TextInputType keyboardType;
  const _TextField({required this.controller, required this.label, required this.hint, this.keyboardType = TextInputType.text});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(16),
    child: TextField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label, hintText: hint,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        filled: true, fillColor: const Color(0xFFF8FAFC),
      ),
    ),
  );
}

class _InfoRow extends StatelessWidget {
  final String label, value;
  const _InfoRow(this.label, this.value);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
    child: Row(
      children: [
        Text(label, style: TextStyle(color: Colors.grey.shade500)),
        const Spacer(),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
      ],
    ),
  );
}
