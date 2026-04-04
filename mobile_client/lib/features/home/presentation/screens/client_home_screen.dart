import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../../core/router/route_names.dart';

// San Salvador — posición por defecto mientras se obtiene GPS
const _defaultPosition = LatLng(13.6929, -89.2182);

// Estilo oscuro (navy) para el mapa — compatible con M&M brand
// Se puede generar en https://mapstyle.withgoogle.com
const _mapDarkStyle = '''[
  {"elementType":"geometry","stylers":[{"color":"#0a1628"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#c5a55a"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#0a1628"}]},
  {"featureType":"administrative","elementType":"geometry","stylers":[{"color":"#1c2d54"}]},
  {"featureType":"poi","stylers":[{"visibility":"off"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#132040"}]},
  {"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#1c2d54"}]},
  {"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#9ca5b3"}]},
  {"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#1c2d54"}]},
  {"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#c5a55a"}]},
  {"featureType":"transit","stylers":[{"visibility":"off"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#050d1a"}]},
  {"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#515c6d"}]}
]''';

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

  late AnimationController _cardAnimController;
  late Animation<double> _cardSlide;

  @override
  void initState() {
    super.initState();
    _cardAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _cardSlide = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(parent: _cardAnimController, curve: Curves.easeOutCubic),
    );
    _initLocation();
  }

  @override
  void dispose() {
    _locationSub?.cancel();
    _mapController?.dispose();
    _cardAnimController.dispose();
    super.dispose();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Location
  // ──────────────────────────────────────────────────────────────────────────

  Future<void> _initLocation() async {
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever) {
        setState(() => _locationLoading = false);
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
      // Seguimiento en tiempo real (opcional — no drena batería en home)
      _locationSub = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 20, // actualiza cada 20m
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

  void _centerOnUser() {
    if (_currentPosition != null) _animateTo(_currentPosition!);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Map
  // ──────────────────────────────────────────────────────────────────────────

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    controller.setMapStyle(_mapDarkStyle);
    setState(() => _mapReady = true);
    _cardAnimController.forward();
    if (_currentPosition != null) _animateTo(_currentPosition!);
  }

  Set<Marker> get _markers {
    if (_currentPosition == null) return {};
    return {
      Marker(
        markerId: const MarkerId('user'),
        position: _currentPosition!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
        infoWindow: const InfoWindow(title: 'Mi ubicación'),
      ),
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Build
  // ──────────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState is AuthStateAuthenticated ? authState.user : null;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
      child: Scaffold(
        backgroundColor: AppColors.navyDark,
        body: Stack(
          children: [
            // ── Mapa ──────────────────────────────────────────────────────
            GoogleMap(
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

            // ── Fade de carga ─────────────────────────────────────────────
            if (!_mapReady)
              Container(
                color: AppColors.navyDark,
                child: const Center(
                  child: CircularProgressIndicator(color: AppColors.gold),
                ),
              ),

            // ── Header flotante ───────────────────────────────────────────
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: _FloatingHeader(userName: user?.firstName),
            ),

            // ── Botón centrar ─────────────────────────────────────────────
            Positioned(
              right: 16,
              bottom: 280,
              child: _MapButton(
                icon: Icons.my_location,
                onTap: _centerOnUser,
                tooltip: 'Centrar en mi posición',
              ),
            ),

            // ── Tarjeta inferior ──────────────────────────────────────────
            AnimatedBuilder(
              animation: _cardSlide,
              builder: (_, child) => Positioned(
                bottom: _cardSlide.value * -300,
                left: 0,
                right: 0,
                child: child!,
              ),
              child: _BottomCard(
                onRequestDriver: () => context.push(RouteNames.tripRequest),
                onLogout: () => ref.read(authProvider.notifier).logout(),
                onProfile: () {}, // TODO: context.push(RouteNames.profile)
                onMedical: () {}, // TODO: context.push(RouteNames.medical)
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Widgets
// ─────────────────────────────────────────────────────────────────────────────

class _FloatingHeader extends StatelessWidget {
  const _FloatingHeader({this.userName});
  final String? userName;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 8,
        left: 20,
        right: 20,
        bottom: 12,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppColors.navyDark.withOpacity(0.95),
            AppColors.navyDark.withOpacity(0.0),
          ],
          stops: const [0.6, 1.0],
        ),
      ),
      child: Row(
        children: [
          // Logo
          RichText(
            text: const TextSpan(
              children: [
                TextSpan(
                  text: 'M&M',
                  style: TextStyle(
                    fontFamily: 'PlayfairDisplay',
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.gold,
                    letterSpacing: 0.5,
                  ),
                ),
                TextSpan(
                  text: ' Driver',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: AppColors.white,
                  ),
                ),
              ],
            ),
          ),
          const Spacer(),
          // Bienvenida
          if (userName != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.navyMedium.withOpacity(0.9),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.navyLight),
              ),
              child: Text(
                'Hola, $userName',
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 13,
                  color: AppColors.white,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _MapButton extends StatelessWidget {
  const _MapButton({
    required this.icon,
    required this.onTap,
    required this.tooltip,
  });
  final IconData icon;
  final VoidCallback onTap;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.navyMedium,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.navyLight),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Icon(icon, color: AppColors.gold, size: 20),
        ),
      ),
    );
  }
}

class _BottomCard extends StatelessWidget {
  const _BottomCard({
    required this.onRequestDriver,
    required this.onLogout,
    required this.onProfile,
    required this.onMedical,
  });

  final VoidCallback onRequestDriver;
  final VoidCallback onLogout;
  final VoidCallback onProfile;
  final VoidCallback onMedical;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
      decoration: BoxDecoration(
        color: AppColors.navyMedium,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(
          top: BorderSide(color: AppColors.navyLight.withOpacity(0.6)),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 24,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: AppColors.navyLight,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          const Text(
            '¿A dónde vamos hoy?',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: AppColors.white,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Su conductor personal, en su propio vehículo',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 13,
              color: AppColors.grey300,
            ),
          ),
          const SizedBox(height: 20),

          // Botón principal
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton.icon(
              onPressed: onRequestDriver,
              icon: const Icon(Icons.directions_car_rounded, size: 22),
              label: const Text(
                'Solicitar Conductor',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.2,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: AppColors.navyDark,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Quick access row
          Row(
            children: [
              _QuickButton(
                icon: Icons.person_outline_rounded,
                label: 'Perfil',
                onTap: onProfile,
              ),
              const SizedBox(width: 12),
              _QuickButton(
                icon: Icons.medical_information_outlined,
                label: 'Médico',
                onTap: onMedical,
                accentColor: AppColors.info,
              ),
              const SizedBox(width: 12),
              _QuickButton(
                icon: Icons.logout_rounded,
                label: 'Salir',
                onTap: onLogout,
                accentColor: AppColors.grey500,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickButton extends StatelessWidget {
  const _QuickButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.accentColor,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? accentColor;

  @override
  Widget build(BuildContext context) {
    final color = accentColor ?? AppColors.gold;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.navyDark,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.navyLight),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 11,
                  color: color.withOpacity(0.85),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
