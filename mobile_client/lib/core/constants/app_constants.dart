class AppConstants {
  AppConstants._();

  static const String appName = 'M&M Driver';
  static const String slogan = 'Su conductor personal, en su propio vehículo';

  // API
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);

  // Quote validity
  static const Duration quoteValidity = Duration(minutes: 15);

  // GPS
  static const Duration gpsUpdateInterval = Duration(seconds: 3);
  static const int gpsQueueFlushThreshold = 10;

  // Storage keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userIdKey = 'user_id';
  static const String userRoleKey = 'user_role';
}
