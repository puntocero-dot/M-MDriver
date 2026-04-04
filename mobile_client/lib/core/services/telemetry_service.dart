import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:sensors_plus/sensors_plus.dart';

import '../network/api_client.dart';
import 'location_service.dart';

// ---------------------------------------------------------------------------
// Data classes
// ---------------------------------------------------------------------------

/// A single driving-event record queued before batch-upload.
class DrivingEventRecord {
  const DrivingEventRecord({
    required this.tripId,
    required this.driverId,
    required this.eventType,
    required this.severity,
    required this.lat,
    required this.lng,
    required this.speedKmh,
    required this.recordedAt,
  });

  final String tripId;
  final String driverId;

  /// One of: HARD_BRAKE | HARD_ACCELERATION | SHARP_TURN | SPEEDING
  final String eventType;

  /// Normalised severity score in the range [1, 10].
  final double severity;

  final double lat;
  final double lng;
  final double speedKmh;
  final DateTime recordedAt;

  Map<String, dynamic> toJson() => {
        'tripId': tripId,
        'driverId': driverId,
        'eventType': eventType,
        'severity': severity,
        'lat': lat,
        'lng': lng,
        'speedKmh': speedKmh,
        'recordedAt': recordedAt.toUtc().toIso8601String(),
      };
}

// ---------------------------------------------------------------------------
// Thresholds (adjustable per deployment)
// ---------------------------------------------------------------------------

class _Thresholds {
  /// Forward deceleration threshold in g (9.81 m/s²). Negative = braking.
  static const double hardBrake = -0.7;

  /// Forward acceleration threshold in g.
  static const double hardAcceleration = 0.5;

  /// Rotation-rate threshold in rad/s for a sharp turn (absolute value).
  static const double sharpTurn = 1.5;

  /// Speed threshold in km/h above which SPEEDING is recorded.
  static const double speeding = 80.0;
}

// ---------------------------------------------------------------------------
// TelemetryService
// ---------------------------------------------------------------------------

/// Monitors accelerometer and gyroscope sensors during an active trip to
/// detect dangerous driving events. Events are batched and sent every 30 s.
///
/// Only call [startMonitoring] when the trip status is IN_TRANSIT.
/// Always call [stopMonitoring] when the trip ends.
class TelemetryService {
  TelemetryService._();

  static final TelemetryService instance = TelemetryService._();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  final List<DrivingEventRecord> _eventQueue = [];

  StreamSubscription<AccelerometerEvent>? _accelSub;
  StreamSubscription<GyroscopeEvent>? _gyroSub;
  StreamSubscription<Position>? _gpsSub;
  Timer? _flushTimer;

  String? _tripId;
  String? _driverId;
  double _currentLat = 0.0;
  double _currentLng = 0.0;
  double _currentSpeedKmh = 0.0;

  bool _isMonitoring = false;

  // Debounce: avoid flooding the queue with repeated events for the same
  // sensor spike.
  final Map<String, DateTime> _lastEventTime = {};
  static const Duration _eventCooldown = Duration(seconds: 2);

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /// Begins sensor monitoring for [tripId] / [driverId].
  void startMonitoring(String tripId, String driverId) {
    if (_isMonitoring) stopMonitoring();

    _tripId = tripId;
    _driverId = driverId;
    _isMonitoring = true;
    _eventQueue.clear();
    _lastEventTime.clear();

    _startGpsTracking();
    _startAccelerometer();
    _startGyroscope();
    _flushTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _flushEvents(),
    );

    debugPrint('[Telemetry] Monitoring started for trip $tripId.');
  }

  /// Stops all sensor subscriptions and flushes any remaining queued events.
  void stopMonitoring() {
    _isMonitoring = false;

    _flushTimer?.cancel();
    _flushTimer = null;

    _accelSub?.cancel();
    _accelSub = null;

    _gyroSub?.cancel();
    _gyroSub = null;

    _gpsSub?.cancel();
    _gpsSub = null;

    // Final flush — fire-and-forget.
    _flushEvents();

    _tripId = null;
    _driverId = null;

    debugPrint('[Telemetry] Monitoring stopped.');
  }

  // ---------------------------------------------------------------------------
  // GPS tracking (supplies current position for event records)
  // ---------------------------------------------------------------------------

  void _startGpsTracking() {
    final stream = LocationService.instance.startLocationStream();
    _gpsSub = stream.listen((Position p) {
      _currentLat = p.latitude;
      _currentLng = p.longitude;
      _currentSpeedKmh = p.speed < 0 ? 0.0 : p.speed * 3.6; // m/s → km/h

      // Check SPEEDING independently of sensor events.
      if (_currentSpeedKmh > _Thresholds.speeding) {
        final magnitude = _currentSpeedKmh - _Thresholds.speeding;
        final severity = _calculateSeverity(magnitude, _Thresholds.speeding);
        _recordEvent('SPEEDING', severity);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Accelerometer — detects HARD_BRAKE and HARD_ACCELERATION
  // ---------------------------------------------------------------------------

  void _startAccelerometer() {
    _accelSub = accelerometerEventStream().listen((AccelerometerEvent event) {
      // event.x = forward/backward axis (positive = forward).
      final gForceX = event.x / 9.81;

      if (gForceX < _Thresholds.hardBrake) {
        final magnitude = gForceX.abs() - _Thresholds.hardBrake.abs();
        final severity =
            _calculateSeverity(magnitude, _Thresholds.hardBrake.abs());
        _recordEvent('HARD_BRAKE', severity);
      } else if (gForceX > _Thresholds.hardAcceleration) {
        final magnitude = gForceX - _Thresholds.hardAcceleration;
        final severity =
            _calculateSeverity(magnitude, _Thresholds.hardAcceleration);
        _recordEvent('HARD_ACCELERATION', severity);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Gyroscope — detects SHARP_TURN
  // ---------------------------------------------------------------------------

  void _startGyroscope() {
    _gyroSub = gyroscopeEventStream().listen((GyroscopeEvent event) {
      // event.z = yaw (rotation around vertical axis).
      final yaw = event.z;

      if (yaw.abs() > _Thresholds.sharpTurn) {
        final magnitude = yaw.abs() - _Thresholds.sharpTurn;
        final severity = _calculateSeverity(magnitude, _Thresholds.sharpTurn);
        _recordEvent('SHARP_TURN', severity);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Event recording helpers
  // ---------------------------------------------------------------------------

  void _recordEvent(String eventType, double severity) {
    if (!_isMonitoring || _tripId == null || _driverId == null) return;

    // Cooldown — skip if the same event type fired recently.
    final last = _lastEventTime[eventType];
    if (last != null &&
        DateTime.now().difference(last) < _eventCooldown) {
      return;
    }
    _lastEventTime[eventType] = DateTime.now();

    final record = DrivingEventRecord(
      tripId: _tripId!,
      driverId: _driverId!,
      eventType: eventType,
      severity: severity.clamp(1.0, 10.0),
      lat: _currentLat,
      lng: _currentLng,
      speedKmh: _currentSpeedKmh,
      recordedAt: DateTime.now(),
    );

    _eventQueue.add(record);
    debugPrint(
      '[Telemetry] Event queued: $eventType '
      'severity=${severity.toStringAsFixed(2)}',
    );
  }

  // ---------------------------------------------------------------------------
  // Batch flush
  // ---------------------------------------------------------------------------

  Future<void> _flushEvents() async {
    if (_eventQueue.isEmpty) return;

    final batch = List<DrivingEventRecord>.from(_eventQueue);
    _eventQueue.clear();

    try {
      final dio = ApiClient.instance;
      await dio.post<void>(
        '/telemetry/events',
        data: {'events': batch.map((e) => e.toJson()).toList()},
      );
      debugPrint('[Telemetry] Flushed ${batch.length} events to backend.');
    } on DioException catch (e) {
      // Put events back so they are retried on the next flush cycle.
      _eventQueue.insertAll(0, batch);
      debugPrint('[Telemetry] Flush failed: ${e.message}. Re-queued ${batch.length} events.');
    }
  }

  // ---------------------------------------------------------------------------
  // Severity calculation
  // ---------------------------------------------------------------------------

  /// Maps a [magnitude] above a given [threshold] to a [1, 10] severity score.
  ///
  /// Uses a simple linear scale where a magnitude equal to 2× the threshold
  /// yields a severity of 10.
  double _calculateSeverity(double magnitude, double threshold) {
    if (threshold == 0) return 1.0;
    final ratio = magnitude / threshold; // 0 = just at limit, 1 = double limit
    final severity = 1.0 + ratio * 9.0; // maps [0,1] → [1,10]
    return severity.clamp(1.0, 10.0);
  }
}
