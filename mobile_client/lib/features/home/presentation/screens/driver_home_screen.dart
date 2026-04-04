import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/providers/auth_provider.dart';

// ---------------------------------------------------------------------------
// Local state for driver availability
// ---------------------------------------------------------------------------

final _driverAvailableProvider = StateProvider<bool>((ref) => false);

class DriverHomeScreen extends ConsumerWidget {
  const DriverHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState is AuthStateAuthenticated ? authState.user : null;
    final isAvailable = ref.watch(_driverAvailableProvider);

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
                text: ' Driver',
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
          // Availability status badge
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isAvailable
                      ? AppColors.success.withOpacity(0.15)
                      : AppColors.grey800,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isAvailable
                        ? AppColors.success.withOpacity(0.6)
                        : AppColors.grey500,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: isAvailable ? AppColors.success : AppColors.grey500,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isAvailable ? 'Disponible' : 'No disponible',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isAvailable
                            ? AppColors.success
                            : AppColors.grey500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          // -----------------------------------------------------------------
          // Map placeholder
          // TODO: Replace with google_maps_flutter GoogleMap widget.
          // Requires GOOGLE_MAPS_API_KEY in AndroidManifest.xml & Info.plist.
          // -----------------------------------------------------------------
          Container(
            color: AppColors.navyMedium,
            child: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.map_outlined, size: 64, color: AppColors.grey500),
                  SizedBox(height: 16),
                  Text(
                    'Mapa de rutas',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      color: AppColors.grey500,
                    ),
                  ),
                  Text(
                    'TODO: Google Maps — requiere GOOGLE_MAPS_API_KEY',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 11,
                      color: AppColors.grey500,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // -----------------------------------------------------------------
          // Bottom panel
          // -----------------------------------------------------------------
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _DriverBottomPanel(
              driverName: user?.firstName ?? 'Conductor',
              isAvailable: isAvailable,
              onToggleAvailability: () {
                ref.read(_driverAvailableProvider.notifier).state =
                    !isAvailable;
                // TODO: Notify backend of availability change
                // POST /drivers/availability { available: !isAvailable }
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Bottom panel
// ---------------------------------------------------------------------------

class _DriverBottomPanel extends StatelessWidget {
  const _DriverBottomPanel({
    required this.driverName,
    required this.isAvailable,
    required this.onToggleAvailability,
  });

  final String driverName;
  final bool isAvailable;
  final VoidCallback onToggleAvailability;

  // TODO: Replace with real trip assignment from WebSocket / polling
  // Currently using placeholder data to demonstrate the UI layout.
  static const bool _hasPendingTrip = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
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
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: AppColors.navyLight,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          Text(
            'Hola, $driverName',
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppColors.white,
            ),
          ),
          const SizedBox(height: 20),

          // Availability toggle
          _AvailabilityToggle(
            isAvailable: isAvailable,
            onToggle: onToggleAvailability,
          ),

          // Trip assignment card (placeholder)
          if (_hasPendingTrip) ...[
            const SizedBox(height: 20),
            _AssignedTripCard(),
          ],
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Availability toggle
// ---------------------------------------------------------------------------

class _AvailabilityToggle extends StatelessWidget {
  const _AvailabilityToggle({
    required this.isAvailable,
    required this.onToggle,
  });

  final bool isAvailable;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton.icon(
        onPressed: onToggle,
        icon: Icon(
          isAvailable ? Icons.toggle_on : Icons.toggle_off,
          size: 24,
        ),
        label: Text(
          isAvailable ? 'Disponible' : 'No disponible',
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor:
              isAvailable ? AppColors.success : AppColors.grey800,
          foregroundColor: AppColors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Assigned trip card
// ---------------------------------------------------------------------------

class _AssignedTripCard extends StatelessWidget {
  // ignore: unused_element
  const _AssignedTripCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.navyLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gold.withOpacity(0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.gold,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Nuevo viaje asignado',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.gold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // TODO: Populate from real trip data
          const _InfoRow(icon: Icons.person_outline, text: 'Cliente: Juan García'),
          const SizedBox(height: 6),
          const _InfoRow(
            icon: Icons.my_location,
            text: 'Col. Escalón, San Salvador',
          ),
          const SizedBox(height: 6),
          const _InfoRow(
            icon: Icons.location_on_outlined,
            text: 'Aeropuerto Internacional',
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 44,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      // TODO: Launch navigation — integrate with maps_launcher
                    },
                    icon: const Icon(Icons.navigation_outlined, size: 18),
                    label: const Text(
                      'Iniciar navegación',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.gold,
                      foregroundColor: AppColors.navyDark,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: SizedBox(
                  height: 44,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      // TODO: Call client — requires client phone number from API
                    },
                    icon: const Icon(Icons.phone_outlined, size: 18),
                    label: const Text(
                      'Llamar cliente',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.white,
                      side: const BorderSide(color: AppColors.grey500),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppColors.grey300, size: 16),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 13,
              color: AppColors.grey300,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
