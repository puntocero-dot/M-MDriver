import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../core/providers/auth_provider.dart';
import '../data/models/trip_model.dart';
import '../data/repositories/trip_repository.dart';

// ---------------------------------------------------------------------------
// Repository provider
// ---------------------------------------------------------------------------

final tripRepositoryProvider = Provider<TripRepository>((ref) {
  return TripRepository(dio: ref.watch(dioProvider));
});

// ---------------------------------------------------------------------------
// Trip State
// ---------------------------------------------------------------------------

sealed class TripState {
  const TripState();
}

class TripStateInitial extends TripState {
  const TripStateInitial();
}

class TripStateLoadingQuote extends TripState {
  const TripStateLoadingQuote();
}

class TripStateQuoteReady extends TripState {
  const TripStateQuoteReady({
    required this.quote,
    required this.pickupAddress,
    required this.dropoffAddress,
    required this.stops,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropoffLat,
    required this.dropoffLng,
  });

  final QuoteModel quote;
  final String pickupAddress;
  final String dropoffAddress;
  final List<String> stops;
  final double pickupLat;
  final double pickupLng;
  final double dropoffLat;
  final double dropoffLng;
}

class TripStateCreatingTrip extends TripState {
  const TripStateCreatingTrip();
}

class TripStateActive extends TripState {
  const TripStateActive(this.trip);
  final TripModel trip;
}

class TripStateError extends TripState {
  const TripStateError(this.message);
  final String message;
}

// ---------------------------------------------------------------------------
// Trip Notifier
// ---------------------------------------------------------------------------

class TripNotifier extends StateNotifier<TripState> {
  TripNotifier(this._repository) : super(const TripStateInitial());

  final TripRepository _repository;

  // ---------------------------------------------------------------------------
  // Quote
  // ---------------------------------------------------------------------------

  /// Requests a price quote. Coordinates default to San Salvador center when
  /// geocoding is not yet implemented.
  /// TODO: Replace fixed coordinates with real geocoding results.
  Future<void> requestQuote({
    required String pickupAddress,
    required String dropoffAddress,
    List<String> stops = const [],
    // TODO: Remove hardcoded coords — integrate geocoding service
    double pickupLat = 13.6929,
    double pickupLng = -89.2182,
    double dropoffLat = 13.7020,
    double dropoffLng = -89.2240,
    String vehicleType = 'STANDARD',
  }) async {
    state = const TripStateLoadingQuote();
    try {
      final quote = await _repository.getQuote(
        pickupLat: pickupLat,
        pickupLng: pickupLng,
        dropoffLat: dropoffLat,
        dropoffLng: dropoffLng,
        stops: stops,
        vehicleType: vehicleType,
      );
      state = TripStateQuoteReady(
        quote: quote,
        pickupAddress: pickupAddress,
        dropoffAddress: dropoffAddress,
        stops: stops,
        pickupLat: pickupLat,
        pickupLng: pickupLng,
        dropoffLat: dropoffLat,
        dropoffLng: dropoffLng,
      );
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ??
          'Error al obtener cotización';
      state = TripStateError(msg);
    } catch (_) {
      state = const TripStateError('Error inesperado al obtener cotización');
    }
  }

  // ---------------------------------------------------------------------------
  // Confirm
  // ---------------------------------------------------------------------------

  /// Confirms the current quote and creates the trip on the backend.
  Future<TripModel?> confirmTrip() async {
    final current = state;
    if (current is! TripStateQuoteReady) return null;

    state = const TripStateCreatingTrip();
    try {
      final trip = await _repository.createTrip(
        pickupAddress: current.pickupAddress,
        pickupLat: current.pickupLat,
        pickupLng: current.pickupLng,
        dropoffAddress: current.dropoffAddress,
        dropoffLat: current.dropoffLat,
        dropoffLng: current.dropoffLng,
        quotedPrice: current.quote.estimatedPrice,
        stops: current.stops
            .asMap()
            .entries
            .map((e) => {'order': '${e.key + 1}', 'address': e.value})
            .toList(),
      );
      state = TripStateActive(trip);
      return trip;
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ??
          'Error al crear el viaje';
      state = TripStateError(msg);
      return null;
    } catch (_) {
      state = const TripStateError('Error inesperado al crear el viaje');
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Cancel
  // ---------------------------------------------------------------------------

  void cancelTrip() {
    state = const TripStateInitial();
  }

  // ---------------------------------------------------------------------------
  // Reset (go back to initial after error)
  // ---------------------------------------------------------------------------

  void reset() {
    state = const TripStateInitial();
  }

  // ---------------------------------------------------------------------------
  // Refresh active trip
  // ---------------------------------------------------------------------------

  Future<void> refreshTrip(String tripId) async {
    try {
      final trip = await _repository.getTripById(tripId);
      state = TripStateActive(trip);
    } catch (_) {
      // Silently ignore polling errors — keep the last known state.
    }
  }

  // ---------------------------------------------------------------------------
  // Share token
  // ---------------------------------------------------------------------------

  Future<String?> generateShareToken(String tripId) async {
    try {
      return await _repository.generateShareToken(tripId);
    } catch (_) {
      return null;
    }
  }
}

final tripProvider =
    StateNotifierProvider<TripNotifier, TripState>((ref) {
  return TripNotifier(ref.watch(tripRepositoryProvider));
});
