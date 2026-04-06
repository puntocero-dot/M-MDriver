import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'auth_interceptor.dart';

/// Dio HTTP client singleton.
/// All feature repositories obtain their [Dio] instance from here.
class ApiClient {
  ApiClient._();

  static const String _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://m-mdriver-production.up.railway.app/api/v1',
  );

  static final Dio _instance = _build();

  /// Returns the configured [Dio] instance.
  static Dio get instance => _instance;

  static Dio _build() {
    final options = BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    );

    final dio = Dio(options);

    // Auth interceptor — attaches Bearer token and handles 401 refresh.
    dio.interceptors.add(AuthInterceptor(dio));

    // Logging — debug builds only.
    if (kDebugMode) {
      dio.interceptors.add(
        LogInterceptor(
          requestBody: true,
          responseBody: true,
          requestHeader: false,
          responseHeader: false,
          error: true,
          logPrint: (Object object) => debugPrint(object.toString()),
        ),
      );
    }

    return dio;
  }
}
