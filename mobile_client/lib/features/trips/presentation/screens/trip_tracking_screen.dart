import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/models/trip_model.dart';
import '../../providers/trip_provider.dart';

// Estilo oscuro navy para el mapa de tracking
const _trackingMapStyle = '''[
  {"elementType":"geometry","stylers":[{"color":"#0a1628"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#c5a55a"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#0a1628"}]},
  {"featureType":"administrative","elementType":"geometry","stylers":[{"color":"#1c2d54"}]},
  {"featureType":"poi","stylers":[{"visibility":"off"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#132040"}]},
  {"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#1c2d54"}]},
  {"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#1c2d54"}]},
  {"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#c5a55a"}]},
  {"featureType":"transit","stylers":[{"visibility":"off"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#050d1a"}]}
]''';

class TripTrackingScreen extends ConsumerStatefulWidget {
  const TripTrackingScreen({super.key, required this.tripId});

  final String tripId;

  @override
  ConsumerState<TripTrackingScreen> createState() => _TripTrackingScreenState();
}

class _TripTrackingScreenState extends ConsumerState<TripTrackingScreen> {
  Timer? _pollingTimer;
  GoogleMapController? _mapController;
  LatLng? _driverPosition;
  LatLng? _pickupPosition;
  LatLng? _dropoffPosition;

  // San Salvador centro — fallback mientras no hay coordenadas
  static const _sanSalvador = LatLng(13.6929, -89.2182);

  @override
  void initState() {
    super.initState();
    // Load trip immediately, then poll every 10 seconds.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(tripProvider.notifier).refreshTrip(widget.tripId);
    });
    _pollingTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      ref.read(tripProvider.notifier).refreshTrip(widget.tripId);
    });
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _mapController?.dispose();
    super.dispose();
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    controller.setMapStyle(_trackingMapStyle);
  }

  Set<Marker> _buildMarkers() {
    final markers = <Marker>{};
    if (_pickupPosition != null) {
      markers.add(Marker(
        markerId: const MarkerId('pickup'),
        position: _pickupPosition!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
        infoWindow: const InfoWindow(title: 'Punto de recogida'),
      ));
    }
    if (_dropoffPosition != null) {
      markers.add(Marker(
        markerId: const MarkerId('dropoff'),
        position: _dropoffPosition!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueYellow),
        infoWindow: const InfoWindow(title: 'Destino'),
      ));
    }
    if (_driverPosition != null) {
      markers.add(Marker(
        markerId: const MarkerId('driver'),
        position: _driverPosition!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
        infoWindow: const InfoWindow(title: 'Conductor'),
        rotation: 0,
      ));
    }
    return markers;
  }

  // ---------------------------------------------------------------------------
  // SOS
  // ---------------------------------------------------------------------------

  void _triggerSOS() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.navyMedium,
        title: const Text(
          'SOS — ¿Confirmar emergencia?',
          style: TextStyle(
            fontFamily: 'Inter',
            color: AppColors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        content: const Text(
          'Se notificará al supervisor y se compartirá tu ubicación en tiempo real.',
          style: TextStyle(fontFamily: 'Inter', color: AppColors.grey300),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text(
              'Cancelar',
              style: TextStyle(color: AppColors.grey500),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.sosRed,
              foregroundColor: AppColors.white,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              // TODO: Implement SOS API call — POST /trips/:id/sos
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  backgroundColor: AppColors.sosRed,
                  content: Text(
                    'Alerta SOS enviada',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      color: AppColors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              );
            },
            child: const Text(
              'Confirmar SOS',
              style: TextStyle(fontFamily: 'Inter', fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Share trip
  // ---------------------------------------------------------------------------

  Future<void> _shareTrip() async {
    final token =
        await ref.read(tripProvider.notifier).generateShareToken(widget.tripId);
    if (!mounted) return;
    if (token != null) {
      await Clipboard.setData(ClipboardData(text: token));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AppColors.navyLight,
            content: Text(
              'Enlace de seguimiento copiado al portapapeles',
              style: TextStyle(fontFamily: 'Inter', color: AppColors.white),
            ),
          ),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.error,
          content: Text(
            'No se pudo generar el enlace',
            style: TextStyle(fontFamily: 'Inter', color: AppColors.white),
          ),
        ),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final tripState = ref.watch(tripProvider);

    TripModel? trip;
    if (tripState is TripStateActive) {
      trip = tripState.trip;
    }

    return Scaffold(
      backgroundColor: AppColors.navyDark,
      body: Stack(
        children: [
          // ── Mapa en tiempo real ──────────────────────────────────────
          GoogleMap(
            onMapCreated: _onMapCreated,
            initialCameraPosition: CameraPosition(
              target: _pickupPosition ?? _sanSalvador,
              zoom: 15,
            ),
            markers: _buildMarkers(),
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            compassEnabled: false,
            mapToolbarEnabled: false,
            trafficEnabled: false,
          ),

          // -------------------------------------------------------------------
          // Top bar: back + title + SOS
          // -------------------------------------------------------------------
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  _CircleIconButton(
                    icon: Icons.arrow_back_ios_new,
                    onPressed: () => context.pop(),
                  ),
                  const Spacer(),
                  // SOS button — always visible
                  _SOSButton(onPressed: _triggerSOS),
                ],
              ),
            ),
          ),

          // -------------------------------------------------------------------
          // Bottom sheet
          // -------------------------------------------------------------------
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _TripBottomSheet(
              trip: trip,
              onShare: _shareTrip,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Bottom sheet
// ---------------------------------------------------------------------------

class _TripBottomSheet extends StatelessWidget {
  const _TripBottomSheet({required this.trip, required this.onShare});

  final TripModel? trip;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.navyMedium,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black38,
            blurRadius: 16,
            offset: Offset(0, -4),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: trip == null
          ? const _LoadingState()
          : _TripContent(trip: trip!, onShare: onShare),
    );
  }
}

class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 24),
      child: Center(
        child: CircularProgressIndicator(color: AppColors.gold),
      ),
    );
  }
}

class _TripContent extends StatelessWidget {
  const _TripContent({required this.trip, required this.onShare});

  final TripModel trip;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Handle bar
        Center(
          child: Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              color: AppColors.navyLight,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),

        // Status badge
        _StatusBadge(status: trip.status),
        const SizedBox(height: 16),

        // Driver info (if assigned)
        if (trip.driverId != null) ...[
          Row(
            children: [
              const CircleAvatar(
                radius: 22,
                backgroundColor: AppColors.navyLight,
                child: Icon(Icons.person, color: AppColors.grey300, size: 24),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Tu conductor',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: AppColors.grey500,
                    ),
                  ),
                  // TODO: Fetch driver details from /users/:driverId
                  const Text(
                    'Conductor asignado',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: AppColors.white,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.phone_outlined, color: AppColors.gold),
                // TODO: Implement call driver — requires driver phone number
                onPressed: () {},
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: AppColors.navyLight),
          const SizedBox(height: 16),
        ],

        // Route summary
        _RouteInfoRow(
          icon: Icons.my_location,
          iconColor: AppColors.gold,
          label: 'Recogida',
          address: trip.pickupAddress,
        ),
        const SizedBox(height: 8),
        _RouteInfoRow(
          icon: Icons.location_on,
          iconColor: AppColors.goldLight,
          label: 'Destino',
          address: trip.dropoffAddress,
        ),
        const SizedBox(height: 20),

        // Estimated arrival
        if (_showEta(trip.status))
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.navyLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.access_time_outlined,
                    color: AppColors.gold, size: 16),
                const SizedBox(width: 8),
                const Text(
                  'Llegada estimada: ',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    color: AppColors.grey300,
                  ),
                ),
                // TODO: Calculate real ETA from backend or Google Maps
                const Text(
                  '~15 min',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.white,
                  ),
                ),
              ],
            ),
          ),

        const SizedBox(height: 16),

        // Share trip button
        SizedBox(
          width: double.infinity,
          height: 44,
          child: OutlinedButton.icon(
            onPressed: onShare,
            icon: const Icon(Icons.share_outlined, size: 18),
            label: const Text(
              'Compartir viaje',
              style: TextStyle(
                fontFamily: 'Inter',
                fontWeight: FontWeight.w500,
              ),
            ),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.gold,
              side: const BorderSide(color: AppColors.gold),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ),
      ],
    );
  }

  bool _showEta(TripStatus status) {
    return status == TripStatus.driverAssigned ||
        status == TripStatus.enRouteToPickup ||
        status == TripStatus.atPickup ||
        status == TripStatus.inTransit;
  }
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final TripStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: _bgColor.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: _bgColor.withOpacity(0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: _bgColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _label,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: _bgColor,
            ),
          ),
        ],
      ),
    );
  }

  Color get _bgColor {
    switch (status) {
      case TripStatus.inTransit:
      case TripStatus.atStop:
      case TripStatus.waitingAtStop:
        return AppColors.gold;
      case TripStatus.completed:
        return AppColors.success;
      case TripStatus.sosActive:
        return AppColors.sosRed;
      case TripStatus.enRouteToPickup:
      case TripStatus.driverAssigned:
        return AppColors.info;
      case TripStatus.atPickup:
        return AppColors.goldLight;
      case TripStatus.cancelled:
        return AppColors.error;
      case TripStatus.quoted:
      case TripStatus.confirmed:
        return AppColors.grey500;
    }
  }

  String get _label {
    switch (status) {
      case TripStatus.quoted:
        return 'Cotizado';
      case TripStatus.confirmed:
        return 'Confirmado';
      case TripStatus.driverAssigned:
        return 'Conductor asignado';
      case TripStatus.enRouteToPickup:
        return 'En camino a recogida';
      case TripStatus.atPickup:
        return 'En punto de recogida';
      case TripStatus.inTransit:
        return 'En tránsito';
      case TripStatus.atStop:
        return 'En parada';
      case TripStatus.waitingAtStop:
        return 'Esperando en parada';
      case TripStatus.completed:
        return 'Completado';
      case TripStatus.cancelled:
        return 'Cancelado';
      case TripStatus.sosActive:
        return 'SOS ACTIVO';
    }
  }
}

// ---------------------------------------------------------------------------
// Small reusable widgets
// ---------------------------------------------------------------------------

class _RouteInfoRow extends StatelessWidget {
  const _RouteInfoRow({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.address,
  });

  final IconData icon;
  final Color iconColor;
  final String label;
  final String address;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: iconColor, size: 18),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 11,
                  color: AppColors.grey500,
                ),
              ),
              Text(
                address,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 14,
                  color: AppColors.white,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CircleIconButton extends StatelessWidget {
  const _CircleIconButton({required this.icon, required this.onPressed});

  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.navyMedium,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Icon(icon, color: AppColors.white, size: 20),
        ),
      ),
    );
  }
}

class _SOSButton extends StatelessWidget {
  const _SOSButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.sosRed,
        foregroundColor: AppColors.white,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        elevation: 4,
      ),
      child: const Text(
        'SOS',
        style: TextStyle(
          fontFamily: 'Inter',
          fontSize: 15,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.5,
        ),
      ),
    );
  }
}
