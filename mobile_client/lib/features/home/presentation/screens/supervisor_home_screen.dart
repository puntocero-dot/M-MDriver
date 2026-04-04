import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/providers/auth_provider.dart';
import '../../../trips/data/models/trip_model.dart';

// ---------------------------------------------------------------------------
// Placeholder data models
// ---------------------------------------------------------------------------

class _FleetStats {
  const _FleetStats({
    required this.totalDrivers,
    required this.availableDrivers,
    required this.activeTrips,
  });

  final int totalDrivers;
  final int availableDrivers;
  final int activeTrips;
}

class _ActiveTripSummary {
  const _ActiveTripSummary({
    required this.id,
    required this.clientName,
    required this.driverName,
    required this.status,
    required this.pickup,
    required this.dropoff,
  });

  final String id;
  final String clientName;
  final String driverName;
  final TripStatus status;
  final String pickup;
  final String dropoff;
}

// ---------------------------------------------------------------------------
// TODO: Replace placeholder data with real API calls
// GET /fleet/stats   → _FleetStats
// GET /trips?status=active → List<_ActiveTripSummary>
// GET /trips?status=SOS_ACTIVE → SOS trips
// ---------------------------------------------------------------------------

const _placeholderStats = _FleetStats(
  totalDrivers: 12,
  availableDrivers: 5,
  activeTrips: 4,
);

final _placeholderActiveTrips = [
  const _ActiveTripSummary(
    id: 'trip-001',
    clientName: 'María López',
    driverName: 'Carlos Rivas',
    status: TripStatus.inTransit,
    pickup: 'Colonia Escalón',
    dropoff: 'Aeropuerto Int. Monseñor Romero',
  ),
  const _ActiveTripSummary(
    id: 'trip-002',
    clientName: 'José Martínez',
    driverName: 'Ana Molina',
    status: TripStatus.enRouteToPickup,
    pickup: 'Centro Histórico',
    dropoff: 'Hotel Sheraton',
  ),
  const _ActiveTripSummary(
    id: 'trip-003',
    clientName: 'Clínica San Rafael',
    driverName: 'Pedro Flores',
    status: TripStatus.sosActive,
    pickup: 'Hospital Bloom',
    dropoff: 'Clínica San Rafael',
  ),
  const _ActiveTripSummary(
    id: 'trip-004',
    clientName: 'Roberto Díaz',
    driverName: 'Luis Herrera',
    status: TripStatus.driverAssigned,
    pickup: 'Santa Elena',
    dropoff: 'Antiguo Cuscatlán',
  ),
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

class SupervisorHomeScreen extends ConsumerWidget {
  const SupervisorHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState is AuthStateAuthenticated ? authState.user : null;

    final sosTrips = _placeholderActiveTrips
        .where((t) => t.status == TripStatus.sosActive)
        .toList();

    final regularTrips = _placeholderActiveTrips
        .where((t) => t.status != TripStatus.sosActive)
        .toList();

    return Scaffold(
      backgroundColor: AppColors.navyDark,
      appBar: AppBar(
        backgroundColor: AppColors.navyDark,
        elevation: 0,
        title: RichText(
          text: const TextSpan(
            children: [
              TextSpan(
                text: 'M&M',
                style: TextStyle(
                  fontFamily: 'PlayfairDisplay',
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.gold,
                ),
              ),
              TextSpan(
                text: ' Supervisor',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.white,
                ),
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline, color: AppColors.white),
            onPressed: () {},
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.gold,
        backgroundColor: AppColors.navyMedium,
        onRefresh: () async {
          // TODO: Refresh fleet stats and trip list from API
          await Future<void>.delayed(const Duration(milliseconds: 800));
        },
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Greeting
            Text(
              'Hola, ${user?.firstName ?? 'Supervisor'}',
              style: const TextStyle(
                fontFamily: 'Inter',
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.white,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Panel de control en tiempo real',
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 14,
                color: AppColors.grey300,
              ),
            ),
            const SizedBox(height: 24),

            // Fleet stats
            _FleetStatsRow(stats: _placeholderStats),
            const SizedBox(height: 28),

            // SOS Alerts
            if (sosTrips.isNotEmpty) ...[
              _SectionHeader(
                title: 'Alertas SOS',
                icon: Icons.warning_amber_rounded,
                iconColor: AppColors.sosRed,
                count: sosTrips.length,
              ),
              const SizedBox(height: 12),
              ...sosTrips.map((t) => _SOSAlertCard(trip: t)),
              const SizedBox(height: 28),
            ],

            // Active trips
            _SectionHeader(
              title: 'Viajes activos',
              icon: Icons.directions_car_outlined,
              iconColor: AppColors.gold,
              count: regularTrips.length,
            ),
            const SizedBox(height: 12),
            if (regularTrips.isEmpty)
              const _EmptyState(message: 'No hay viajes activos en este momento')
            else
              ...regularTrips.map((t) => _ActiveTripCard(trip: t)),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Fleet stats row
// ---------------------------------------------------------------------------

class _FleetStatsRow extends StatelessWidget {
  const _FleetStatsRow({required this.stats});

  final _FleetStats stats;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            label: 'Conductores',
            value: '${stats.totalDrivers}',
            icon: Icons.badge_outlined,
            color: AppColors.info,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            label: 'Disponibles',
            value: '${stats.availableDrivers}',
            icon: Icons.check_circle_outline,
            color: AppColors.success,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            label: 'Viajes activos',
            value: '${stats.activeTrips}',
            icon: Icons.directions_car_outlined,
            color: AppColors.gold,
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.navyMedium,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.navyLight),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 11,
              color: AppColors.grey500,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.count,
  });

  final String title;
  final IconData icon;
  final Color iconColor;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: iconColor, size: 18),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.white,
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.navyLight,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            '$count',
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 12,
              color: AppColors.grey300,
            ),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// SOS alert card
// ---------------------------------------------------------------------------

class _SOSAlertCard extends StatelessWidget {
  const _SOSAlertCard({required this.trip});

  final _ActiveTripSummary trip;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.sosRed.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.sosRed.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.warning_amber_rounded,
                color: AppColors.sosRed,
                size: 18,
              ),
              const SizedBox(width: 8),
              const Text(
                'SOS ACTIVO',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.sosRed,
                  letterSpacing: 1,
                ),
              ),
              const Spacer(),
              Text(
                trip.id,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 11,
                  color: AppColors.grey500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _TripInfoRow(label: 'Cliente', value: trip.clientName),
          const SizedBox(height: 4),
          _TripInfoRow(label: 'Conductor', value: trip.driverName),
          const SizedBox(height: 4),
          _TripInfoRow(label: 'Ruta', value: '${trip.pickup} → ${trip.dropoff}'),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 40,
            child: ElevatedButton.icon(
              onPressed: () {
                // TODO: Open trip detail / contact driver
              },
              icon: const Icon(Icons.phone_outlined, size: 16),
              label: const Text(
                'Contactar conductor',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.sosRed,
                foregroundColor: AppColors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Active trip card
// ---------------------------------------------------------------------------

class _ActiveTripCard extends StatelessWidget {
  const _ActiveTripCard({required this.trip});

  final _ActiveTripSummary trip;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.navyMedium,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.navyLight),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status indicator dot
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: _statusColor(trip.status),
                shape: BoxShape.circle,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        trip.clientName,
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.white,
                        ),
                      ),
                    ),
                    _StatusPill(status: trip.status),
                  ],
                ),
                const SizedBox(height: 4),
                _TripInfoRow(label: 'Conductor', value: trip.driverName),
                const SizedBox(height: 4),
                _TripInfoRow(
                  label: 'Ruta',
                  value: '${trip.pickup} → ${trip.dropoff}',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _statusColor(TripStatus status) {
    switch (status) {
      case TripStatus.inTransit:
        return AppColors.gold;
      case TripStatus.enRouteToPickup:
      case TripStatus.driverAssigned:
        return AppColors.info;
      case TripStatus.atPickup:
        return AppColors.goldLight;
      case TripStatus.completed:
        return AppColors.success;
      case TripStatus.sosActive:
        return AppColors.sosRed;
      case TripStatus.cancelled:
        return AppColors.error;
      default:
        return AppColors.grey500;
    }
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.status});

  final TripStatus status;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _color.withOpacity(0.4)),
      ),
      child: Text(
        _label,
        style: TextStyle(
          fontFamily: 'Inter',
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: _color,
        ),
      ),
    );
  }

  Color get _color {
    switch (status) {
      case TripStatus.inTransit:
        return AppColors.gold;
      case TripStatus.enRouteToPickup:
      case TripStatus.driverAssigned:
        return AppColors.info;
      case TripStatus.atPickup:
        return AppColors.goldLight;
      case TripStatus.completed:
        return AppColors.success;
      case TripStatus.sosActive:
        return AppColors.sosRed;
      case TripStatus.cancelled:
        return AppColors.error;
      default:
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
        return 'Asignado';
      case TripStatus.enRouteToPickup:
        return 'En camino';
      case TripStatus.atPickup:
        return 'En recogida';
      case TripStatus.inTransit:
        return 'En tránsito';
      case TripStatus.atStop:
        return 'En parada';
      case TripStatus.waitingAtStop:
        return 'Esperando';
      case TripStatus.completed:
        return 'Completado';
      case TripStatus.cancelled:
        return 'Cancelado';
      case TripStatus.sosActive:
        return 'SOS';
    }
  }
}

// ---------------------------------------------------------------------------
// Small shared widgets
// ---------------------------------------------------------------------------

class _TripInfoRow extends StatelessWidget {
  const _TripInfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$label: ',
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 12,
            color: AppColors.grey500,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 12,
              color: AppColors.grey300,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Center(
        child: Text(
          message,
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 14,
            color: AppColors.grey500,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
