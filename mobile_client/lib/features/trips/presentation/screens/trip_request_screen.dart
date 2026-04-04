import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/router/route_names.dart';
import '../../providers/trip_provider.dart';
import '../../data/models/trip_model.dart';

/// Multi-step trip request screen.
///
/// Step 1 — Pickup address
/// Step 2 — Destination + optional stops
/// Step 3 — Quote breakdown + confirm
class TripRequestScreen extends ConsumerStatefulWidget {
  const TripRequestScreen({super.key});

  @override
  ConsumerState<TripRequestScreen> createState() => _TripRequestScreenState();
}

class _TripRequestScreenState extends ConsumerState<TripRequestScreen> {
  int _currentStep = 0;

  final _pickupController = TextEditingController();
  final _dropoffController = TextEditingController();
  final List<TextEditingController> _stopControllers = [];

  @override
  void dispose() {
    _pickupController.dispose();
    _dropoffController.dispose();
    for (final c in _stopControllers) {
      c.dispose();
    }
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  void _addStop() {
    setState(() => _stopControllers.add(TextEditingController()));
  }

  void _removeStop(int index) {
    setState(() {
      _stopControllers[index].dispose();
      _stopControllers.removeAt(index);
    });
  }

  bool get _pickupValid => _pickupController.text.trim().isNotEmpty;
  bool get _dropoffValid => _dropoffController.text.trim().isNotEmpty;

  List<String> get _stops =>
      _stopControllers.map((c) => c.text.trim()).where((s) => s.isNotEmpty).toList();

  Future<void> _requestQuote() async {
    // TODO: Replace hardcoded coordinates with real geocoding results
    // when a geocoding service (e.g., Google Places API) is integrated.
    await ref.read(tripProvider.notifier).requestQuote(
          pickupAddress: _pickupController.text.trim(),
          dropoffAddress: _dropoffController.text.trim(),
          stops: _stops,
        );

    final current = ref.read(tripProvider);
    if (current is TripStateQuoteReady && mounted) {
      setState(() => _currentStep = 2);
    } else if (current is TripStateError && mounted) {
      _showError(current.message);
    }
  }

  Future<void> _confirmTrip() async {
    final trip = await ref.read(tripProvider.notifier).confirmTrip();
    if (!mounted) return;
    if (trip != null) {
      context.pushReplacement(
        RouteNames.tripTracking.replaceFirst(':id', trip.id),
      );
    } else {
      final err = ref.read(tripProvider);
      if (err is TripStateError) _showError(err.message);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.error,
        content: Text(message,
            style: const TextStyle(fontFamily: 'Inter', color: AppColors.white)),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final tripState = ref.watch(tripProvider);
    final isLoading = tripState is TripStateLoadingQuote ||
        tripState is TripStateCreatingTrip;

    return Scaffold(
      backgroundColor: AppColors.navyDark,
      appBar: AppBar(
        backgroundColor: AppColors.navyDark,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.white),
          onPressed: () {
            if (_currentStep > 0) {
              setState(() => _currentStep--);
              ref.read(tripProvider.notifier).reset();
            } else {
              context.pop();
            }
          },
        ),
        title: Text(
          _stepTitle,
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppColors.white,
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: _StepProgressBar(currentStep: _currentStep, totalSteps: 3),
        ),
      ),
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.gold),
            )
          : _buildCurrentStep(tripState),
    );
  }

  String get _stepTitle {
    switch (_currentStep) {
      case 0:
        return 'Punto de recogida';
      case 1:
        return 'Destino';
      case 2:
        return 'Cotización';
      default:
        return 'Solicitar viaje';
    }
  }

  Widget _buildCurrentStep(TripState tripState) {
    switch (_currentStep) {
      case 0:
        return _StepPickup(
          controller: _pickupController,
          onNext: () {
            if (_pickupValid) setState(() => _currentStep = 1);
          },
        );
      case 1:
        return _StepDestination(
          dropoffController: _dropoffController,
          stopControllers: _stopControllers,
          onAddStop: _addStop,
          onRemoveStop: _removeStop,
          onNext: () {
            if (_dropoffValid) _requestQuote();
          },
        );
      case 2:
        if (tripState is TripStateQuoteReady) {
          return _StepQuote(
            quote: tripState.quote,
            pickupAddress: tripState.pickupAddress,
            dropoffAddress: tripState.dropoffAddress,
            onConfirm: _confirmTrip,
          );
        }
        return const Center(
          child: Text(
            'Cotización no disponible',
            style: TextStyle(color: AppColors.grey300, fontFamily: 'Inter'),
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

class _StepProgressBar extends StatelessWidget {
  const _StepProgressBar({
    required this.currentStep,
    required this.totalSteps,
  });

  final int currentStep;
  final int totalSteps;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        children: List.generate(totalSteps, (i) {
          final active = i <= currentStep;
          return Expanded(
            child: Container(
              height: 3,
              margin: EdgeInsets.only(right: i < totalSteps - 1 ? 4 : 0),
              decoration: BoxDecoration(
                color: active ? AppColors.gold : AppColors.navyLight,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Step 1 — Pickup
// ---------------------------------------------------------------------------

class _StepPickup extends StatelessWidget {
  const _StepPickup({required this.controller, required this.onNext});

  final TextEditingController controller;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '¿Desde dónde te recogemos?',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 16,
              color: AppColors.grey300,
            ),
          ),
          const SizedBox(height: 24),
          // TODO: Replace TextField with Google Places autocomplete widget
          // when GOOGLE_MAPS_API_KEY is configured.
          _GoldTextField(
            controller: controller,
            label: 'Dirección de recogida',
            icon: Icons.my_location,
          ),
          const SizedBox(height: 12),
          const Text(
            '// TODO: Google Places autocomplete — requiere GOOGLE_MAPS_API_KEY',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 11,
              color: AppColors.grey500,
              fontStyle: FontStyle.italic,
            ),
          ),
          const Spacer(),
          _GoldButton(
            label: 'Continuar',
            onPressed: onNext,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Step 2 — Destination + stops
// ---------------------------------------------------------------------------

class _StepDestination extends StatelessWidget {
  const _StepDestination({
    required this.dropoffController,
    required this.stopControllers,
    required this.onAddStop,
    required this.onRemoveStop,
    required this.onNext,
  });

  final TextEditingController dropoffController;
  final List<TextEditingController> stopControllers;
  final VoidCallback onAddStop;
  final ValueChanged<int> onRemoveStop;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '¿A dónde vamos?',
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 16,
              color: AppColors.grey300,
            ),
          ),
          const SizedBox(height: 24),
          // TODO: Replace TextField with Google Places autocomplete widget
          _GoldTextField(
            controller: dropoffController,
            label: 'Dirección de destino',
            icon: Icons.location_on_outlined,
          ),
          const SizedBox(height: 20),
          if (stopControllers.isNotEmpty) ...[
            const Text(
              'Paradas intermedias',
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: AppColors.grey300,
              ),
            ),
            const SizedBox(height: 12),
            ...stopControllers.asMap().entries.map((entry) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Expanded(
                      child: _GoldTextField(
                        controller: entry.value,
                        label: 'Parada ${entry.key + 1}',
                        icon: Icons.radio_button_unchecked,
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.close, color: AppColors.grey500),
                      onPressed: () => onRemoveStop(entry.key),
                    ),
                  ],
                ),
              );
            }),
          ],
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: onAddStop,
            icon: const Icon(Icons.add_circle_outline, color: AppColors.gold),
            label: const Text(
              'Agregar parada',
              style: TextStyle(
                fontFamily: 'Inter',
                color: AppColors.gold,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const Spacer(),
          _GoldButton(
            label: 'Ver cotización',
            onPressed: onNext,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Step 3 — Quote breakdown
// ---------------------------------------------------------------------------

class _StepQuote extends StatelessWidget {
  const _StepQuote({
    required this.quote,
    required this.pickupAddress,
    required this.dropoffAddress,
    required this.onConfirm,
  });

  final QuoteModel quote;
  final String pickupAddress;
  final String dropoffAddress;
  final VoidCallback onConfirm;

  String _formatDistance(int meters) {
    if (meters >= 1000) {
      return '${(meters / 1000).toStringAsFixed(1)} km';
    }
    return '${meters} m';
  }

  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    if (minutes >= 60) {
      final hours = minutes ~/ 60;
      final mins = minutes % 60;
      return '${hours}h ${mins}min';
    }
    return '${minutes} min';
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Route summary
          _RouteCard(
            pickupAddress: pickupAddress,
            dropoffAddress: dropoffAddress,
          ),
          const SizedBox(height: 20),

          // Stats row
          Row(
            children: [
              _StatChip(
                icon: Icons.route_outlined,
                label: _formatDistance(quote.estimatedDistanceMeters),
              ),
              const SizedBox(width: 12),
              _StatChip(
                icon: Icons.access_time_outlined,
                label: _formatDuration(quote.estimatedDurationSeconds),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Price breakdown card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.navyMedium,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.navyLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Desglose del precio',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.white,
                  ),
                ),
                const SizedBox(height: 16),
                _PriceRow(
                  label: 'Tarifa base',
                  amount: quote.breakdown.base,
                  currency: quote.currency,
                ),
                _PriceRow(
                  label: 'Distancia',
                  amount: quote.breakdown.distance,
                  currency: quote.currency,
                ),
                _PriceRow(
                  label: 'Tiempo',
                  amount: quote.breakdown.time,
                  currency: quote.currency,
                ),
                if (quote.breakdown.stops > 0)
                  _PriceRow(
                    label: 'Paradas',
                    amount: quote.breakdown.stops,
                    currency: quote.currency,
                  ),
                _PriceRow(
                  label: 'Combustible',
                  amount: quote.breakdown.fuel,
                  currency: quote.currency,
                ),
                if (quote.breakdown.vehicleSurcharge > 0)
                  _PriceRow(
                    label: 'Recargo vehículo',
                    amount: quote.breakdown.vehicleSurcharge,
                    currency: quote.currency,
                  ),
                const Divider(color: AppColors.navyLight, height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Total estimado',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.white,
                      ),
                    ),
                    Text(
                      '\$${quote.estimatedPrice.toStringAsFixed(2)} ${quote.currency}',
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 22,
                        fontWeight: FontWeight.w700,
                        color: AppColors.gold,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Cotización válida hasta ${_formatExpiry(quote.expiresAt)}',
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 12,
              color: AppColors.grey500,
            ),
          ),
          const SizedBox(height: 32),
          _GoldButton(
            label: 'Confirmar viaje',
            onPressed: onConfirm,
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  String _formatExpiry(DateTime dt) {
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

// ---------------------------------------------------------------------------
// Shared small widgets
// ---------------------------------------------------------------------------

class _GoldTextField extends StatelessWidget {
  const _GoldTextField({
    required this.controller,
    required this.label,
    required this.icon,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      style: const TextStyle(
        fontFamily: 'Inter',
        color: AppColors.white,
      ),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(
          fontFamily: 'Inter',
          color: AppColors.grey500,
        ),
        prefixIcon: Icon(icon, color: AppColors.gold, size: 20),
        filled: true,
        fillColor: AppColors.navyMedium,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.navyLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.gold, width: 1.5),
        ),
      ),
    );
  }
}

class _GoldButton extends StatelessWidget {
  const _GoldButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.gold,
          foregroundColor: AppColors.navyDark,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Text(
          label,
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _RouteCard extends StatelessWidget {
  const _RouteCard({
    required this.pickupAddress,
    required this.dropoffAddress,
  });

  final String pickupAddress;
  final String dropoffAddress;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.navyMedium,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.navyLight),
      ),
      child: Column(
        children: [
          _AddressRow(
            icon: Icons.my_location,
            color: AppColors.gold,
            address: pickupAddress,
          ),
          const Padding(
            padding: EdgeInsets.only(left: 10),
            child: Column(
              children: [
                SizedBox(height: 4),
                Row(
                  children: [
                    SizedBox(
                      width: 20,
                      child: Column(
                        children: [
                          _DotDivider(),
                          _DotDivider(),
                          _DotDivider(),
                        ],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 4),
              ],
            ),
          ),
          _AddressRow(
            icon: Icons.location_on,
            color: AppColors.goldLight,
            address: dropoffAddress,
          ),
        ],
      ),
    );
  }
}

class _DotDivider extends StatelessWidget {
  const _DotDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 2,
      height: 4,
      margin: const EdgeInsets.symmetric(vertical: 1),
      decoration: BoxDecoration(
        color: AppColors.grey500,
        borderRadius: BorderRadius.circular(1),
      ),
    );
  }
}

class _AddressRow extends StatelessWidget {
  const _AddressRow({
    required this.icon,
    required this.color,
    required this.address,
  });

  final IconData icon;
  final Color color;
  final String address;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            address,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 14,
              color: AppColors.white,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.navyMedium,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.navyLight),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: AppColors.gold, size: 16),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 13,
              color: AppColors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  const _PriceRow({
    required this.label,
    required this.amount,
    required this.currency,
  });

  final String label;
  final double amount;
  final String currency;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 14,
              color: AppColors.grey300,
            ),
          ),
          Text(
            '\$${amount.toStringAsFixed(2)}',
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 14,
              color: AppColors.white,
            ),
          ),
        ],
      ),
    );
  }
}
