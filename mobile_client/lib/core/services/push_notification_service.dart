import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../network/api_client.dart';

// ---------------------------------------------------------------------------
// Background handler — MUST be a top-level function (not a class method).
// Flutter isolate restriction: no context / providers available here.
// ---------------------------------------------------------------------------

/// Called by Firebase when a push notification arrives while the app is
/// terminated or in the background.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Firebase is already initialised by the system before this is called.
  debugPrint(
    '[FCM-BG] Message received: ${message.messageId} '
    '| data: ${message.data}',
  );
  // Heavy work (DB writes, API calls) should be avoided here to keep the
  // isolate short-lived. Defer to foreground onMessageOpenedApp handler.
}

// ---------------------------------------------------------------------------
// PushNotificationService
// ---------------------------------------------------------------------------

/// Wraps [FirebaseMessaging] to handle permission, token registration, and
/// routing for incoming push notifications.
///
/// Call [initialize] once after [Firebase.initializeApp()] in main().
class PushNotificationService {
  PushNotificationService._();

  static final PushNotificationService instance = PushNotificationService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  // A navigator key is needed to push routes from outside the widget tree.
  // Pass the same key that is given to MaterialApp / GoRouter.
  GlobalKey<NavigatorState>? _navigatorKey;

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  /// Initialises Firebase Messaging. Must be called after [Firebase.initializeApp].
  ///
  /// [navigatorKey] — the same key used in GoRouter / MaterialApp so that
  /// in-app navigation can be triggered from notification callbacks.
  Future<void> initialize({
    required GlobalKey<NavigatorState> navigatorKey,
  }) async {
    _navigatorKey = navigatorKey;

    // Register the background handler.
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    await _requestPermission();
    await _registerToken();
    _listenForeground();
    _listenOpenedApp();
    _handleInitialMessage();
  }

  // ---------------------------------------------------------------------------
  // Permission
  // ---------------------------------------------------------------------------

  Future<void> _requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    debugPrint(
      '[FCM] Permission status: ${settings.authorizationStatus.name}',
    );
  }

  // ---------------------------------------------------------------------------
  // Token registration
  // ---------------------------------------------------------------------------

  /// Returns the FCM device token and registers it with the backend.
  Future<String?> getToken() async {
    final token = await _messaging.getToken();
    if (token != null) {
      await _registerTokenWithBackend(token);
    }
    return token;
  }

  Future<void> _registerToken() async {
    final token = await _messaging.getToken();
    if (token != null) {
      await _registerTokenWithBackend(token);
    }

    // Re-register whenever the token rotates.
    _messaging.onTokenRefresh.listen(_registerTokenWithBackend);
  }

  Future<void> _registerTokenWithBackend(String token) async {
    try {
      final dio = ApiClient.instance;
      await dio.post<void>(
        '/notifications/token',
        data: {'fcmToken': token, 'platform': defaultTargetPlatform.name},
      );
      debugPrint('[FCM] Token registered with backend.');
    } on DioException catch (e) {
      debugPrint('[FCM] Token registration failed: ${e.message}');
    }
  }

  // ---------------------------------------------------------------------------
  // Foreground messages
  // ---------------------------------------------------------------------------

  void _listenForeground() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('[FCM] Foreground message: ${message.notification?.title}');
      _showInAppBanner(message);
    });
  }

  /// Displays a lightweight in-app banner using a [SnackBar] overlaid on the
  /// current screen. For a richer experience consider the
  /// `flutter_local_notifications` package.
  void _showInAppBanner(RemoteMessage message) {
    final context = _navigatorKey?.currentContext;
    if (context == null) return;

    final title = message.notification?.title ?? 'M&M Driver';
    final body = message.notification?.body ?? '';

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF1A2340), // navy
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                color: Color(0xFFD4AF37), // gold
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
            if (body.isNotEmpty)
              Text(
                body,
                style: const TextStyle(color: Colors.white70, fontSize: 13),
              ),
          ],
        ),
        action: SnackBarAction(
          label: 'Ver',
          textColor: const Color(0xFFD4AF37),
          onPressed: () => _handleNotificationTap(message.data),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // App-opened-from-notification
  // ---------------------------------------------------------------------------

  void _listenOpenedApp() {
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('[FCM] App opened from notification: ${message.data}');
      _handleNotificationTap(message.data);
    });
  }

  /// Handles the initial message when the app is launched cold from a
  /// notification tap.
  Future<void> _handleInitialMessage() async {
    final initial = await _messaging.getInitialMessage();
    if (initial != null) {
      debugPrint('[FCM] App launched from notification: ${initial.data}');
      // Small delay to let the widget tree mount.
      await Future<void>.delayed(const Duration(milliseconds: 500));
      _handleNotificationTap(initial.data);
    }
  }

  // ---------------------------------------------------------------------------
  // Routing logic
  // ---------------------------------------------------------------------------

  void _handleNotificationTap(Map<String, dynamic> data) {
    final router = _navigatorKey?.currentContext;
    if (router == null) return;

    final type = data['type'] as String?;
    final tripId = data['tripId'] as String?;
    final alertId = data['alertId'] as String?;

    switch (type) {
      case 'TRIP_ASSIGNED':
      case 'TRIP_STARTED':
      case 'TRIP_STATUS':
        if (tripId != null) {
          _navigatorKey!.currentContext!
              .go('/trip/$tripId/tracking');
        }
      case 'SOS_ALERT':
        if (tripId != null) {
          _navigatorKey!.currentContext!.go('/sos/$tripId');
        }
      case 'TRIP_CANCELLED':
        _navigatorKey!.currentContext!.go('/home/client');
      default:
        debugPrint('[FCM] Unknown notification type: $type | alert: $alertId');
    }
  }
}
