/// Central registry of all API endpoint paths.
/// Base URL is configured in [ApiClient].
class ApiEndpoints {
  ApiEndpoints._();

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refreshToken = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';

  // ---------------------------------------------------------------------------
  // Trips
  // ---------------------------------------------------------------------------
  static const String tripsBase = '/trips';
  static const String tripQuote = '/trips/quote';

  static String tripById(String id) => '/trips/$id';
  static String tripTracking(String id) => '/trips/$id/tracking';
  static String tripCancel(String id) => '/trips/$id/cancel';
  static String tripComplete(String id) => '/trips/$id/complete';

  // ---------------------------------------------------------------------------
  // Location / Telemetry
  // ---------------------------------------------------------------------------
  static const String locationBatch = '/location/batch';

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
  static const String userProfile = '/users/profile';
  static String userById(String id) => '/users/$id';

  // ---------------------------------------------------------------------------
  // WebSocket
  // ---------------------------------------------------------------------------
  static String tripSocket(String tripId) => '/ws/trips/$tripId';
  static const String driverSocket = '/ws/driver';
}
