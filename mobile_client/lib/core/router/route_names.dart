class RouteNames {
  RouteNames._();

  static const String login = '/login';
  static const String register = '/register';
  static const String clientHome = '/home/client';
  static const String driverHome = '/home/driver';
  static const String supervisorHome = '/home/supervisor';
  static const String tripRequest = '/trip/request';
  static const String tripTracking = '/trip/:id/tracking';
  static const String profile = '/profile';
  static const String medical = '/medical';
  static const String sos = '/sos/:tripId';

  /// Build a concrete SOS path from a [tripId].
  static String sosPath(String tripId) => '/sos/$tripId';
}
