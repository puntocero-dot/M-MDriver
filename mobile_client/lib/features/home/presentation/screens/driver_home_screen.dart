import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/router/route_names.dart';

// San Salvador center
const _defaultPosition = LatLng(13.6929, -89.2182);

// Same Stitch dark map style
const _mapStyle = '''[
  {"elementType":"geometry","stylers":[{"color":"#131313"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#f2ca50"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#131313"}]},
  {"featureType":"poi","stylers":[{"visibility":"off"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#201f1f"}]},
  {"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#353534"}]},
  {"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#99907c"}]},
  {"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#2a2a2a"}]},
  {"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#f2ca50","weight":0.5}]},
  {"featureType":"transit","stylers":[{"visibility":"off"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#0e0e0e"}]}
]''';

// ─────────────────────────────────────────────────────────────────────────────
// Local state providers
// ─────────────────────────────────────────────────────────────────────────────

final _driverAvailableProvider = StateProvider<bool>((ref) => false);
final _availabilityLoadingProvider = StateProvider<bool>((ref) => false);

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

class DriverHomeScreen extends ConsumerStatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  ConsumerState<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends ConsumerState<DriverHomeScreen>
    with TickerProviderStateMixin {
  GoogleMapController? _mapController;
  LatLng? _currentPosition;
  bool _mapReady = false;
  StreamSubscription<Position>? _locationSub;

  late AnimationController _sheetAnim;
  late Animation<double> _sheetSlide;
  late Animation<double> _sheetFade;

  @override
  void initState() {
    super.initState();
    _sheetAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _sheetSlide = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(parent: _sheetAnim, curve: Curves.easeOutCubic),
    );
    _sheetFade = CurvedAnimation(parent: _sheetAnim, curve: Curves.easeIn);
    _initLocation();
  }

  @override
  void dispose() {
    _locationSub?.cancel();
    _mapController?.dispose();
    _sheetAnim.dispose();
    super.dispose();
  }

  // ── Location ──────────────────────────────────────────────────────────────

  Future<void> _initLocation() async {
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever) return;

      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      if (mounted) {
        setState(() => _currentPosition = LatLng(pos.latitude, pos.longitude));
        _animateTo(_currentPosition!);
      }
      _locationSub = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,
        ),
      ).listen((p) {
        if (mounted) {
          setState(() => _currentPosition = LatLng(p.latitude, p.longitude));
        }
      });
    } catch (_) {}
  }

  void _animateTo(LatLng target) {
    _mapController?.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(target: target, zoom: 15.5),
      ),
    );
  }

  // ── Map ───────────────────────────────────────────────────────────────────

  void _onMapCreated(GoogleMapController c) {
    _mapController = c;
    c.setMapStyle(_mapStyle);
    setState(() => _mapReady = true);
    _sheetAnim.forward();
    if (_currentPosition != null) _animateTo(_currentPosition!);
  }

  Set<Marker> get _markers {
    if (_currentPosition == null) return {};
    return {
      Marker(
        markerId: const MarkerId('driver'),
        position: _currentPosition!,
        icon: BitmapDescriptor.defaultMarkerWithHue(42), // gold
        infoWindow: const InfoWindow(title: 'Mi posición'),
      ),
    };
  }

  // ── Availability toggle ───────────────────────────────────────────────────

  Future<void> _toggleAvailability() async {
    final current = ref.read(_driverAvailableProvider);
    final newValue = !current;
    ref.read(_availabilityLoadingProvider.notifier).state = true;

    try {
      final authState = ref.read(authProvider);
      if (authState is! AuthStateAuthenticated) return;

      final dio = ref.read(dioProvider);
      await dio.patch(
        ApiEndpoints.driverAvailability,
        data: {'available': newValue},
        options: Options(
          headers: {'Authorization': 'Bearer ${authState.token}'},
        ),
      );
      ref.read(_driverAvailableProvider.notifier).state = newValue;
    } on DioException catch (e) {
      if (mounted) {
        final msg = e.response?.data?['message'] as String? ??
            'Error al cambiar disponibilidad';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg,
                style: GoogleFonts.inter(color: AppColors.onSurface)),
            backgroundColor: AppColors.surfaceContainerHigh,
          ),
        );
      }
    } finally {
      ref.read(_availabilityLoadingProvider.notifier).state = false;
    }
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState is AuthStateAuthenticated ? authState.user : null;
    final isAvailable = ref.watch(_driverAvailableProvider);
    final bottomPad = MediaQuery.of(context).padding.bottom;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
      child: Scaffold(
        backgroundColor: AppColors.surface,
        body: Stack(
          children: [
            // ── Full-screen map ──────────────────────────────────────────
            Positioned.fill(
              child: GoogleMap(
                onMapCreated: _onMapCreated,
                initialCameraPosition: const CameraPosition(
                  target: _defaultPosition,
                  zoom: 14,
                ),
                markers: _markers,
                myLocationEnabled: true,
                myLocationButtonEnabled: false,
                zoomControlsEnabled: false,
                compassEnabled: false,
                mapToolbarEnabled: false,
                buildingsEnabled: true,
              ),
            ),

            // ── Loading overlay ──────────────────────────────────────────
            if (!_mapReady)
              Positioned.fill(
                child: Container(
                  color: AppColors.surface,
                  child: const Center(
                    child: CircularProgressIndicator(
                      color: AppColors.gold,
                      strokeWidth: 2,
                    ),
                  ),
                ),
              ),

            // ── Top header ───────────────────────────────────────────────
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: _DriverTopBar(
                isAvailable: isAvailable,
                userName: user?.firstName ?? 'Conductor',
              ),
            ),

            // ── Center FAB ───────────────────────────────────────────────
            Positioned(
              right: 16,
              bottom: 300 + bottomPad,
              child: _GlassBtn(
                icon: Icons.my_location_outlined,
                onTap: () {
                  if (_currentPosition != null) _animateTo(_currentPosition!);
                },
              ),
            ),

            // ── Bottom panel ─────────────────────────────────────────────
            AnimatedBuilder(
              animation: _sheetAnim,
              builder: (_, child) => Positioned(
                bottom: _sheetSlide.value * -320,
                left: 0,
                right: 0,
                child: FadeTransition(opacity: _sheetFade, child: child!),
              ),
              child: _DriverBottomPanel(
                driverName: user?.firstName ?? 'Conductor',
                isAvailable: isAvailable,
                isLoading: ref.watch(_availabilityLoadingProvider),
                onToggle: _toggleAvailability,
                onProfile: () => context.push(RouteNames.profile),
                bottomPad: bottomPad,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Driver Top Bar
// ─────────────────────────────────────────────────────────────────────────────

class _DriverTopBar extends StatelessWidget {
  const _DriverTopBar({required this.isAvailable, required this.userName});
  final bool isAvailable;
  final String userName;

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    return Container(
      padding: EdgeInsets.fromLTRB(20, topPad + 10, 20, 40),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppColors.surface.withOpacity(0.92),
            AppColors.surface.withOpacity(0.0),
          ],
          stops: const [0.55, 1.0],
        ),
      ),
      child: Row(
        children: [
          // Logo
          Text(
            'M&M Driver',
            style: GoogleFonts.manrope(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppColors.gold,
              letterSpacing: 0.2,
              shadows: const [
                Shadow(color: Color(0x4DF2CA50), blurRadius: 16),
              ],
            ),
          ),
          const Spacer(),
          // Status badge
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isAvailable
                      ? AppColors.success.withOpacity(0.15)
                      : AppColors.surfaceContainerHighest.withOpacity(0.6),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isAvailable
                        ? AppColors.success.withOpacity(0.5)
                        : AppColors.outlineVariant.withOpacity(0.4),
                    width: 0.5,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        color: isAvailable
                            ? AppColors.success
                            : AppColors.outline,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isAvailable ? 'Disponible' : 'No disponible',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isAvailable
                            ? AppColors.success
                            : AppColors.outline,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Glass FAB
// ─────────────────────────────────────────────────────────────────────────────

class _GlassBtn extends StatelessWidget {
  const _GlassBtn({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerHighest.withOpacity(0.6),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: AppColors.outlineVariant.withOpacity(0.4),
                width: 0.5,
              ),
            ),
            child: Icon(icon, color: AppColors.gold, size: 20),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Driver Bottom Panel — glassmorphic
// ─────────────────────────────────────────────────────────────────────────────

class _DriverBottomPanel extends StatelessWidget {
  const _DriverBottomPanel({
    required this.driverName,
    required this.isAvailable,
    required this.isLoading,
    required this.onToggle,
    required this.onProfile,
    required this.bottomPad,
  });

  final String driverName;
  final bool isAvailable;
  final bool isLoading;
  final VoidCallback onToggle;
  final VoidCallback onProfile;
  final double bottomPad;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
        child: Container(
          padding: EdgeInsets.fromLTRB(24, 16, 24, 24 + bottomPad),
          decoration: BoxDecoration(
            color: const Color(0xFF353534).withOpacity(0.7),
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border(
              top: BorderSide(
                color: AppColors.outlineVariant.withOpacity(0.25),
                width: 0.5,
              ),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: AppColors.outline.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Greeting
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Hola, $driverName',
                          style: GoogleFonts.manrope(
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: AppColors.onSurface,
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isAvailable
                              ? 'Listo para recibir viajes'
                              : 'No estás recibiendo viajes',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: isAvailable
                                ? AppColors.success
                                : AppColors.outline,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Profile action
                  GestureDetector(
                    onTap: onProfile,
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.person_outline_rounded,
                        color: AppColors.gold,
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Availability toggle CTA
              isLoading
                  ? Container(
                      height: 56,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Center(
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: AppColors.gold,
                            strokeWidth: 2,
                          ),
                        ),
                      ),
                    )
                  : isAvailable
                      ? _OutlineToggle(
                          label: 'Pausar disponibilidad',
                          icon: Icons.pause_circle_outline,
                          onTap: onToggle,
                        )
                      : _GoldToggle(
                          label: 'Activar disponibilidad',
                          icon: Icons.play_circle_outline,
                          onTap: onToggle,
                        ),
              const SizedBox(height: 16),

              // Stats row
              const _StatsRow(),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle buttons
// ─────────────────────────────────────────────────────────────────────────────

class _GoldToggle extends StatelessWidget {
  const _GoldToggle({required this.label, required this.icon, required this.onTap});
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 56,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment(-0.7, -0.7),
          end: Alignment(0.7, 0.7),
          colors: [Color(0xFFF2CA50), Color(0xFFD4AF37)],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFF2CA50).withOpacity(0.2),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: const Color(0xFF3C2F00), size: 20),
              const SizedBox(width: 10),
              Text(
                label.toUpperCase(),
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF3C2F00),
                  letterSpacing: 0.6,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OutlineToggle extends StatelessWidget {
  const _OutlineToggle({required this.label, required this.icon, required this.onTap});
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 56,
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.outlineVariant.withOpacity(0.6),
          width: 0.5,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: AppColors.secondary, size: 20),
              const SizedBox(width: 10),
              Text(
                label.toUpperCase(),
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.secondary,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats Row (placeholder — future: pull from API)
// ─────────────────────────────────────────────────────────────────────────────

class _StatsRow extends StatelessWidget {
  const _StatsRow();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: const [
        _StatChip(label: 'Hoy', value: '0 viajes'),
        SizedBox(width: 10),
        _StatChip(label: 'Semana', value: '0 viajes'),
        SizedBox(width: 10),
        _StatChip(label: 'Rating', value: '—'),
      ],
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: GoogleFonts.manrope(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: AppColors.onSurface,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11,
                color: AppColors.outline,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
