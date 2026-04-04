import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/services/location_service.dart';
import '../../../medical/data/models/medical_profile_model.dart';
import '../../../medical/providers/medical_provider.dart';
import '../../providers/sos_provider.dart';

// Design tokens
const Color _deepRed = Color(0xFF8B0000);
const Color _brightRed = Color(0xFFD32F2F);
const Color _gold = Color(0xFFD4AF37);

class SosScreen extends ConsumerStatefulWidget {
  const SosScreen({super.key, required this.tripId});

  final String tripId;

  @override
  ConsumerState<SosScreen> createState() => _SosScreenState();
}

class _SosScreenState extends ConsumerState<SosScreen>
    with SingleTickerProviderStateMixin {
  // Animation
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  // GPS
  double? _currentLat;
  double? _currentLng;
  StreamSubscription<Position>? _gpsSub;

  // Cancel tap count (requires double-tap)
  int _cancelTaps = 0;
  Timer? _cancelResetTimer;

  @override
  void initState() {
    super.initState();

    // Pulse animation for the SOS text
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _initGps();
    _triggerSOS();
  }

  Future<void> _initGps() async {
    try {
      final pos = await LocationService.instance.getCurrentPosition();
      if (mounted) {
        setState(() {
          _currentLat = pos.latitude;
          _currentLng = pos.longitude;
        });
      }

      _gpsSub = LocationService.instance
          .startLocationStream()
          .listen((Position p) {
        if (mounted) {
          setState(() {
            _currentLat = p.latitude;
            _currentLng = p.longitude;
          });
        }
      });
    } catch (_) {
      // GPS unavailable — still show SOS screen.
    }
  }

  Future<void> _triggerSOS() async {
    final lat = _currentLat ?? 0.0;
    final lng = _currentLng ?? 0.0;
    await ref.read(sosProvider.notifier).triggerSOS(
          tripId: widget.tripId,
          lat: lat,
          lng: lng,
        );
  }

  void _onCancelTap() {
    _cancelTaps++;
    _cancelResetTimer?.cancel();

    if (_cancelTaps >= 2) {
      _cancelTaps = 0;
      _handleCancel();
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Toque de nuevo para cancelar la alerta',
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: Color(0xFF5A0000),
        duration: Duration(seconds: 2),
      ),
    );

    _cancelResetTimer = Timer(const Duration(seconds: 3), () {
      _cancelTaps = 0;
    });
  }

  void _handleCancel() {
    ref.read(sosProvider.notifier).reset();
    if (mounted) context.pop();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _gpsSub?.cancel();
    LocationService.instance.stopLocationStream();
    _cancelResetTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sosState = ref.watch(sosProvider);
    final medState = ref.watch(medicalProvider);

    // Auto-navigate when supervisor resolves the SOS.
    ref.listen<SosState>(sosProvider, (_, next) {
      if (next is SosStateResolved && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Alerta SOS resuelta por supervisión.'),
            backgroundColor: Color(0xFF1B4332),
          ),
        );
        context.pop();
      }
    });

    final alertId = sosState is SosStateActive ? sosState.alertId : null;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [_deepRed, _brightRed],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(),

                // Pulsing SOS text
                ScaleTransition(
                  scale: _pulseAnimation,
                  child: const Text(
                    'SOS',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 96,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 12,
                      shadows: [
                        Shadow(
                          color: Colors.black45,
                          blurRadius: 20,
                          offset: Offset(0, 6),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 12),

                const Text(
                  'AYUDA EN CAMINO',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 4,
                  ),
                ),

                const SizedBox(height: 32),

                // Info card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                        color: Colors.white24, width: 1),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _infoRow(
                        'Viaje',
                        widget.tripId,
                      ),
                      if (alertId != null)
                        _infoRow('ID alerta', alertId),
                      if (_currentLat != null && _currentLng != null)
                        _infoRow(
                          'Coordenadas',
                          '${_currentLat!.toStringAsFixed(5)}, '
                              '${_currentLng!.toStringAsFixed(5)}',
                        ),
                      _buildMedicalSummary(medState),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                if (sosState is SosStateError)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.black38,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      sosState.message,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),

                const Spacer(),

                // Cancel button — requires double-tap
                OutlinedButton(
                  onPressed: _onCancelTap,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Colors.white, width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 36, vertical: 14),
                  ),
                  child: const Text(
                    'CANCELAR ALERTA',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      letterSpacing: 1.5,
                    ),
                  ),
                ),

                const SizedBox(height: 8),

                const Text(
                  'Toque dos veces para cancelar',
                  style: TextStyle(color: Colors.white54, fontSize: 12),
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$label: ',
            style: const TextStyle(
              color: Colors.white54,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: Colors.white, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMedicalSummary(MedicalState state) {
    if (state is! MedicalStateLoaded) return const SizedBox.shrink();
    final profile = state.profile;
    if (profile == null) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(color: Colors.white24, height: 16),
        const Text(
          'Información médica',
          style: TextStyle(
            color: _gold,
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 4),
        if (profile.bloodType != null)
          _infoRow('Tipo de sangre', profile.bloodType!),
        if (profile.allergies != null)
          _infoRow('Alergias', profile.allergies!),
        if (profile.medicalConditions != null)
          _infoRow('Condiciones', profile.medicalConditions!),
        if (profile.doctorPhone != null)
          _infoRow('Tel. doctor', profile.doctorPhone!),
      ],
    );
  }
}
