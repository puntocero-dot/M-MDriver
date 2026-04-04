import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import 'location_service.dart';
import '../storage/secure_storage_service.dart';

// ---------------------------------------------------------------------------
// NOTE: This service implements the Socket.io wire protocol manually using
// [web_socket_channel], because the official socket.io-client JS library is
// not available in Flutter.
//
// The Socket.io v4 protocol frames events as:
//   42["eventName", { ...payload }]
//
// If you prefer a higher-level API, replace this class with the
// `socket_io_client` Flutter package (pub.dev/packages/socket_io_client).
// Usage would be:
//   import 'package:socket_io_client/socket_io_client.dart' as IO;
//   _socket = IO.io('$_wsBaseUrl/tracking', <String, dynamic>{
//     'transports': ['websocket'],
//     'auth': {'token': token},
//   });
//   _socket.emit('driver:location', payload);
// ---------------------------------------------------------------------------

/// Streams the driver's real-time GPS position to the backend tracking
/// namespace over a Socket.io-compatible WebSocket connection.
///
/// Usage:
/// ```dart
/// await DriverTrackingService.instance.startTracking(tripId);
/// // …when trip ends…
/// DriverTrackingService.instance.stopTracking();
/// ```
class DriverTrackingService {
  DriverTrackingService._();

  static final DriverTrackingService instance = DriverTrackingService._();

  // ---------------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------------

  static const String _wsBaseUrl = String.fromEnvironment(
    'WS_BASE_URL',
    defaultValue: 'wss://api.mmdriver.com',
  );

  static const Duration _sendInterval = Duration(seconds: 3);
  static const Duration _maxBackoff = Duration(seconds: 30);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  WebSocketChannel? _channel;
  Timer? _locationTimer;
  Timer? _reconnectTimer;
  String? _activeTripId;
  bool _stopped = false;
  int _reconnectAttempts = 0;

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /// Connects to the backend `/tracking` namespace and begins emitting
  /// `driver:location` events every [_sendInterval].
  Future<void> startTracking(String tripId) async {
    _stopped = false;
    _activeTripId = tripId;
    _reconnectAttempts = 0;
    await _connect(tripId);
  }

  /// Stops location streaming and closes the WebSocket connection.
  void stopTracking() {
    _stopped = true;
    _locationTimer?.cancel();
    _locationTimer = null;
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
    _channel?.sink.close();
    _channel = null;
    _activeTripId = null;
    _reconnectAttempts = 0;
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  Future<void> _connect(String tripId) async {
    if (_stopped) return;

    final token = await SecureStorageService.instance.getAccessToken();
    if (token == null) {
      debugPrint('[DriverTracking] No access token — aborting connection.');
      return;
    }

    // Socket.io connection URL for the /tracking namespace.
    final uri = Uri.parse('$_wsBaseUrl/tracking?token=$token');

    try {
      _channel = WebSocketChannel.connect(uri);

      // Socket.io handshake: send namespace connect packet "40"
      _channel!.sink.add('40');

      // Listen for incoming frames (pings, acks, etc.)
      _channel!.stream.listen(
        _onFrame,
        onError: _onError,
        onDone: _onDone,
        cancelOnError: false,
      );

      _reconnectAttempts = 0;
      _startLocationTimer(tripId);
      debugPrint('[DriverTracking] Connected. Streaming trip $tripId.');
    } catch (e) {
      debugPrint('[DriverTracking] Connection error: $e');
      _scheduleReconnect(tripId);
    }
  }

  void _startLocationTimer(String tripId) {
    _locationTimer?.cancel();
    _locationTimer = Timer.periodic(_sendInterval, (_) async {
      try {
        final position = await LocationService.instance.getCurrentPosition();
        _sendLocation(tripId, position);
      } catch (e) {
        debugPrint('[DriverTracking] Could not read GPS: $e');
      }
    });
  }

  void _sendLocation(String tripId, Position position) {
    if (_channel == null || _stopped) return;

    final payload = {
      'tripId': tripId,
      'lat': position.latitude,
      'lng': position.longitude,
      'speed': position.speed < 0 ? 0.0 : position.speed, // m/s from geolocator
      'heading': position.heading,
      'accuracy': position.accuracy,
    };

    // Socket.io v4 event packet: 42["eventName", payload]
    final frame = '42${jsonEncode(['driver:location', payload])}';
    _channel!.sink.add(frame);

    debugPrint(
      '[DriverTracking] Sent driver:location '
      '(${position.latitude.toStringAsFixed(5)}, '
      '${position.longitude.toStringAsFixed(5)})',
    );
  }

  void _onFrame(dynamic frame) {
    final data = frame.toString();

    // Socket.io ping — respond with pong.
    if (data == '2') {
      _channel?.sink.add('3');
      return;
    }

    debugPrint('[DriverTracking] Frame received: $data');
  }

  void _onError(Object error) {
    debugPrint('[DriverTracking] WebSocket error: $error');
    _locationTimer?.cancel();
    _locationTimer = null;
    if (!_stopped && _activeTripId != null) {
      _scheduleReconnect(_activeTripId!);
    }
  }

  void _onDone() {
    debugPrint('[DriverTracking] WebSocket closed.');
    _locationTimer?.cancel();
    _locationTimer = null;
    if (!_stopped && _activeTripId != null) {
      _scheduleReconnect(_activeTripId!);
    }
  }

  void _scheduleReconnect(String tripId) {
    if (_stopped) return;
    _reconnectTimer?.cancel();

    // Exponential backoff: 2^attempt seconds, capped at _maxBackoff.
    final backoffSeconds = min(
      pow(2, _reconnectAttempts).toInt(),
      _maxBackoff.inSeconds,
    );
    _reconnectAttempts++;

    debugPrint(
      '[DriverTracking] Reconnecting in ${backoffSeconds}s '
      '(attempt $_reconnectAttempts)…',
    );

    _reconnectTimer = Timer(Duration(seconds: backoffSeconds), () {
      _connect(tripId);
    });
  }
}
