import 'dart:async';

import 'package:geolocator/geolocator.dart';

/// Wraps [Geolocator] for location permission management and position streaming.
class LocationService {
  LocationService._();

  static final LocationService instance = LocationService._();

  StreamSubscription<Position>? _subscription;
  final StreamController<Position> _controller =
      StreamController<Position>.broadcast();

  // ---------------------------------------------------------------------------
  // Permissions
  // ---------------------------------------------------------------------------

  /// Returns the current [LocationPermission] without requesting it.
  Future<LocationPermission> checkPermissions() =>
      Geolocator.checkPermission();

  /// Requests location permission from the OS.
  /// Returns the resulting [LocationPermission] after the user responds.
  Future<LocationPermission> requestPermissions() =>
      Geolocator.requestPermission();

  /// Returns `true` if the app has at least *while-in-use* location permission.
  Future<bool> get hasPermission async {
    final permission = await checkPermissions();
    return permission == LocationPermission.whileInUse ||
        permission == LocationPermission.always;
  }

  // ---------------------------------------------------------------------------
  // Single fix
  // ---------------------------------------------------------------------------

  /// Returns the device's current [Position].
  /// Throws a [LocationServiceDisabledException] if location services are off.
  /// Throws a [PermissionDeniedException] if permission is denied.
  Future<Position> getCurrentPosition() => Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );

  // ---------------------------------------------------------------------------
  // Streaming
  // ---------------------------------------------------------------------------

  /// Returns a broadcast [Stream<Position>] that emits updates while active.
  /// Calling this multiple times is safe — the same stream is returned.
  Stream<Position> startLocationStream({
    LocationAccuracy accuracy = LocationAccuracy.high,
    int distanceFilter = 5, // metres
  }) {
    if (_subscription == null) {
      const settings = LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 5,
      );
      _subscription =
          Geolocator.getPositionStream(locationSettings: settings).listen(
        (Position position) => _controller.add(position),
        onError: _controller.addError,
      );
    }
    return _controller.stream;
  }

  /// Cancels the active location stream.
  Future<void> stopLocationStream() async {
    await _subscription?.cancel();
    _subscription = null;
  }

  /// Disposes resources. Call from your Riverpod [Ref.onDispose] callback.
  Future<void> dispose() async {
    await stopLocationStream();
    await _controller.close();
  }
}
