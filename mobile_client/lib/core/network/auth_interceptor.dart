import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';
import 'api_endpoints.dart';

/// Dio interceptor that:
/// 1. Attaches `Authorization: Bearer <token>` to every outgoing request.
/// 2. On 401, attempts a silent token refresh.
/// 3. If refresh fails, clears stored tokens so the router redirects to /login.
class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._dio);

  final Dio _dio;
  bool _isRefreshing = false;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await SecureStorageService.instance.getAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final statusCode = err.response?.statusCode;

    // Only attempt refresh on 401 responses, and not on the refresh endpoint
    // itself (avoid infinite loop).
    if (statusCode == 401 &&
        err.requestOptions.path != ApiEndpoints.refreshToken &&
        !_isRefreshing) {
      _isRefreshing = true;
      try {
        final refreshed = await _tryRefreshToken();
        if (refreshed) {
          // Retry the original request with the new token.
          final newToken =
              await SecureStorageService.instance.getAccessToken();
          final retryOptions = Options(
            method: err.requestOptions.method,
            headers: {
              ...err.requestOptions.headers,
              'Authorization': 'Bearer $newToken',
            },
          );
          final response = await _dio.request<dynamic>(
            err.requestOptions.path,
            data: err.requestOptions.data,
            queryParameters: err.requestOptions.queryParameters,
            options: retryOptions,
          );
          handler.resolve(response);
          return;
        }
      } catch (_) {
        // Fall through to token clearing.
      } finally {
        _isRefreshing = false;
      }

      // Refresh failed — clear tokens so GoRouter redirects to /login.
      await SecureStorageService.instance.clearTokens();
    }

    handler.next(err);
  }

  /// Attempts to refresh the access token using the stored refresh token.
  /// Returns `true` if successful and tokens have been persisted.
  Future<bool> _tryRefreshToken() async {
    final refreshToken =
        await SecureStorageService.instance.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return false;

    final response = await _dio.post<Map<String, dynamic>>(
      ApiEndpoints.refreshToken,
      data: {'refresh_token': refreshToken},
      options: Options(
        // Skip the auth interceptor for this request.
        extra: {'skipAuth': true},
      ),
    );

    final data = response.data;
    if (data == null) return false;

    final newAccess = data['access_token'] as String?;
    final newRefresh = data['refresh_token'] as String?;

    if (newAccess == null) return false;

    await SecureStorageService.instance.saveTokens(
      accessToken: newAccess,
      refreshToken: newRefresh ?? refreshToken,
    );
    return true;
  }
}
