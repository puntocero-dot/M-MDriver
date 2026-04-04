import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/auth_provider.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

sealed class SosState {
  const SosState();
}

class SosStateIdle extends SosState {
  const SosStateIdle();
}

class SosStateActive extends SosState {
  const SosStateActive({required this.alertId, required this.tripId});
  final String alertId;
  final String tripId;
}

class SosStateResolved extends SosState {
  const SosStateResolved();
}

class SosStateError extends SosState {
  const SosStateError(this.message);
  final String message;
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class SosNotifier extends StateNotifier<SosState> {
  SosNotifier(this._ref) : super(const SosStateIdle());

  final Ref _ref;

  /// Sends a SOS trigger to the backend.
  ///
  /// [tripId] — the active trip ID.
  /// [lat] / [lng] — the driver/client's current coordinates.
  Future<void> triggerSOS({
    required String tripId,
    required double lat,
    required double lng,
  }) async {
    try {
      final dio = _ref.read(dioProvider);
      final response = await dio.post<Map<String, dynamic>>(
        '/sos/trigger',
        data: {
          'tripId': tripId,
          'lat': lat,
          'lng': lng,
        },
      );
      final alertId =
          (response.data?['alertId'] as String?) ?? 'unknown';
      state = SosStateActive(alertId: alertId, tripId: tripId);
    } catch (e) {
      state = SosStateError(
        'No se pudo enviar la alerta SOS. Llame al 911 inmediatamente.',
      );
    }
  }

  /// Marks the SOS as resolved.
  ///
  /// NOTE: Resolution is typically triggered by a supervisor via the admin
  /// panel or an incoming push notification — not directly by the client.
  /// This method exists so the screen can react to that resolution event.
  void markResolved() {
    state = const SosStateResolved();
  }

  /// Resets the SOS state back to idle (e.g. after navigating away).
  void reset() {
    state = const SosStateIdle();
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final sosProvider = StateNotifierProvider<SosNotifier, SosState>((ref) {
  return SosNotifier(ref);
});
