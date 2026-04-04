import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/router/route_names.dart';

// San Salvador — posición por defecto mientras se obtiene GPS
const _defaultPosition = LatLng(13.6929, -89.2182);

// Stitch "Midnight Concierge" — dark map matching #131313 surface palette
const _mapStyle = '''[
  {"elementType":"geometry","stylers":[{"color":"#131313"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#f2ca50"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#131313"}]},
  {"featureType":"administrative","elementType":"geometry","stylers":[{"color":"#1c1b1b"}]},
  {"featureType":"administrative.country","elementType":"labels.text.fill","stylers":[{"color":"#9ca5b3"}]},
  {"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#c7c6c4"}]},
  {"featureType":"poi","stylers":[{"visibility":"off"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#201f1f"}]},
  {"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#353534"}]},
  {"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#99907c"}]},
  {"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#2a2a2a"}]},
  {"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#f2ca50","weight":0.5}]},
  {"featureType":"transit","stylers":[{"visibility":"off"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#0e0e0e"}]},
  {"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#4d4635"}]}
]''';

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

class ClientHomeScreen extends ConsumerStatefulWidget {
  const ClientHomeScreen({super.key});

  @override
  ConsumerState<ClientHomeScreen> createState() => _ClientHomeScreenState();
}

class _ClientHomeScreenState extends ConsumerState<ClientHomeScreen>
    with TickerProviderStateMixin {
  GoogleMapController? _mapController;
  LatLng? _currentPosition;
  bool _locationLoading = true;
  bool _mapReady = false;
  StreamSubscription<Position>? _locationSub;

  // Sheet slide-up animation
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
      if (perm == LocationPermission.deniedForever) {
        if (mounted) setState(() => _locationLoading = false);
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      if (mounted) {
        setState(() {
          _currentPosition = LatLng(pos.latitude, pos.longitude);
          _locationLoading = false;
        });
        _animateTo(_currentPosition!);
      }
      _locationSub = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 25,
        ),
      ).listen((p) {
        if (mounted) {
          setState(() => _currentPosition = LatLng(p.latitude, p.longitude));
        }
      });
    } catch (_) {
      if (mounted) setState(() => _locationLoading = false);
    }
  }

  void _animateTo(LatLng target) {
    _mapController?.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(target: target, zoom: 15.5),
      ),
    );
  }

  // ── Map ───────────────────────────────────────────────────────────────────

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    controller.setMapStyle(_mapStyle);
    setState(() => _mapReady = true);
    _sheetAnim.forward();
    if (_currentPosition != null) _animateTo(_currentPosition!);
  }

  Set<Marker> get _markers {
    if (_currentPosition == null) return {};
    return {
      Marker(
        markerId: const MarkerId('user'),
        position: _currentPosition!,
        icon: BitmapDescriptor.defaultMarkerWithHue(42), // gold hue
        infoWindow: const InfoWindow(title: 'Mi ubicación'),
      ),
    };
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState is AuthStateAuthenticated ? authState.user : null;
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
                  zoom: 13,
                ),
                markers: _markers,
                myLocationEnabled: true,
                myLocationButtonEnabled: false,
                zoomControlsEnabled: false,
                compassEnabled: false,
                mapToolbarEnabled: false,
                buildingsEnabled: true,
                trafficEnabled: false,
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

            // ── Top gradient + header ────────────────────────────────────
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: _TopHeader(userName: user?.firstName),
            ),

            // ── Center-user FAB ──────────────────────────────────────────
            Positioned(
              right: 16,
              bottom: 320 + bottomPad,
              child: _GlassButton(
                icon: Icons.my_location_outlined,
                tooltip: 'Centrar mapa',
                onTap: () {
                  if (_currentPosition != null) _animateTo(_currentPosition!);
                },
              ),
            ),

            // ── Glassmorphic bottom sheet ────────────────────────────────
            AnimatedBuilder(
              animation: _sheetAnim,
              builder: (_, child) => Positioned(
                bottom: _sheetSlide.value * -380,
                left: 0,
                right: 0,
                child: FadeTransition(opacity: _sheetFade, child: child!),
              ),
              child: _BottomSheet(
                onRequestDriver: () => context.push(RouteNames.tripRequest),
                onProfile:        () => context.push(RouteNames.profile),
                onMedical:        () => context.push(RouteNames.medical),
                onLogout:         () => ref.read(authProvider.notifier).logout(),
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
// Top Header — gradient scrim + logo + greeting
// ─────────────────────────────────────────────────────────────────────────────

class _TopHeader extends StatelessWidget {
  const _TopHeader({this.userName});
  final String? userName;

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
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Logo — "M&M Driver" Manrope gold
          RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: 'M&M',
                  style: GoogleFonts.manrope(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.gold,
                    letterSpacing: 0.3,
                    shadows: const [
                      Shadow(
                        color: Color(0x4DF2CA50), // gold glow 30%
                        blurRadius: 20,
                      ),
                    ],
                  ),
                ),
                TextSpan(
                  text: '  Driver',
                  style: GoogleFonts.manrope(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: AppColors.onSurface,
                    letterSpacing: 0.1,
                  ),
                ),
              ],
            ),
          ),
          const Spacer(),
          // Greeting pill
          if (userName != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerHighest.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppColors.outlineVariant.withOpacity(0.5),
                      width: 0.5,
                    ),
                  ),
                  child: Text(
                    'Hola, $userName',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: AppColors.onSurface,
                    ),
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

class _GlassButton extends StatelessWidget {
  const _GlassButton({
    required this.icon,
    required this.onTap,
    this.tooltip = '',
  });
  final IconData icon;
  final VoidCallback onTap;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: ClipRRect(
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
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Glassmorphic Bottom Sheet
// ─────────────────────────────────────────────────────────────────────────────

class _BottomSheet extends StatelessWidget {
  const _BottomSheet({
    required this.onRequestDriver,
    required this.onProfile,
    required this.onMedical,
    required this.onLogout,
    required this.bottomPad,
  });

  final VoidCallback onRequestDriver;
  final VoidCallback onProfile;
  final VoidCallback onMedical;
  final VoidCallback onLogout;
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
            // Glass & Gradient rule — surfaceContainerHighest at 60% opacity
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
              // ── Drag handle ────────────────────────────────────────────
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

              // ── Heading ────────────────────────────────────────────────
              Text(
                '¿A dónde vamos hoy?',
                style: GoogleFonts.manrope(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.onSurface,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Su conductor personal, en su propio vehículo',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppColors.secondary,
                ),
              ),
              const SizedBox(height: 20),

              // ── Route card ─────────────────────────────────────────────
              _RouteCard(onTap: onRequestDriver),
              const SizedBox(height: 16),

              // ── Preferences row ────────────────────────────────────────
              const _PreferencesRow(),
              const SizedBox(height: 20),

              // ── Gold gradient CTA ──────────────────────────────────────
              _GoldCTA(
                label: 'Solicitar Conductor',
                icon: Icons.directions_car_rounded,
                onTap: onRequestDriver,
              ),
              const SizedBox(height: 16),

              // ── Quick actions ──────────────────────────────────────────
              Row(
                children: [
                  _QuickAction(
                    icon: Icons.person_outline_rounded,
                    label: 'Perfil',
                    onTap: onProfile,
                  ),
                  const SizedBox(width: 10),
                  _QuickAction(
                    icon: Icons.medical_information_outlined,
                    label: 'Médico',
                    onTap: onMedical,
                    color: AppColors.tertiary,
                  ),
                  const SizedBox(width: 10),
                  _QuickAction(
                    icon: Icons.logout_rounded,
                    label: 'Salir',
                    onTap: onLogout,
                    color: AppColors.outline,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Card — origin / destination inputs
// ─────────────────────────────────────────────────────────────────────────────

class _RouteCard extends StatelessWidget {
  const _RouteCard({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            // Origin
            Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: const BoxDecoration(
                    color: AppColors.gold,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    'Mi ubicación actual',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.onSurface,
                    ),
                  ),
                ),
                const Icon(
                  Icons.gps_fixed_outlined,
                  color: AppColors.gold,
                  size: 16,
                ),
              ],
            ),

            // Connector line
            Padding(
              padding: const EdgeInsets.only(left: 4.5),
              child: Row(
                children: [
                  Container(
                    width: 1,
                    height: 20,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    color: AppColors.outlineVariant,
                  ),
                ],
              ),
            ),

            // Destination
            Row(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: AppColors.secondary,
                      width: 1.5,
                    ),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    '¿A dónde va?',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: AppColors.outline,
                    ),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Médico',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.tertiary,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Preferences Row
// ─────────────────────────────────────────────────────────────────────────────

class _PreferencesRow extends StatelessWidget {
  const _PreferencesRow();

  static const _prefs = [
    _PrefItem(Icons.accessible_outlined,  'Movilidad',  AppColors.tertiary),
    _PrefItem(Icons.volume_off_outlined,  'Silencio',   AppColors.secondary),
    _PrefItem(Icons.support_agent_outlined,'Asistencia', AppColors.gold),
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: _prefs
          .map((p) => Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                    right: p == _prefs.last ? 0 : 8,
                  ),
                  child: _PrefChip(item: p),
                ),
              ))
          .toList(),
    );
  }
}

class _PrefItem {
  const _PrefItem(this.icon, this.label, this.color);
  final IconData icon;
  final String label;
  final Color color;
}

class _PrefChip extends StatelessWidget {
  const _PrefChip({required this.item});
  final _PrefItem item;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(item.icon, color: item.color, size: 20),
          const SizedBox(height: 4),
          Text(
            item.label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: item.color.withOpacity(0.9),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Gold Gradient CTA — "Jewel" treatment
// ─────────────────────────────────────────────────────────────────────────────

class _GoldCTA extends StatelessWidget {
  const _GoldCTA({
    required this.label,
    required this.icon,
    required this.onTap,
  });
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
            blurRadius: 20,
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
                  letterSpacing: 0.8,
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
// Quick Action buttons
// ─────────────────────────────────────────────────────────────────────────────

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = AppColors.gold,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.surfaceContainerLow,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(height: 4),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: color.withOpacity(0.85),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
