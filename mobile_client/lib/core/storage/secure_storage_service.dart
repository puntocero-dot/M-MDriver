import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Thin wrapper around [FlutterSecureStorage] for auth token management.
///
/// All keys are private constants so callers never hardcode raw strings.
class SecureStorageService {
  SecureStorageService._();

  static final SecureStorageService instance = SecureStorageService._();

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  // ---------------------------------------------------------------------------
  // Keys
  // ---------------------------------------------------------------------------
  static const _kAccessToken = 'mm_access_token';
  static const _kRefreshToken = 'mm_refresh_token';
  static const _kUserId = 'mm_user_id';
  static const _kUserRole = 'mm_user_role';

  // ---------------------------------------------------------------------------
  // Tokens
  // ---------------------------------------------------------------------------

  /// Persists both access and refresh tokens atomically.
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _kAccessToken, value: accessToken),
      _storage.write(key: _kRefreshToken, value: refreshToken),
    ]);
  }

  /// Returns the stored access token, or `null` if not present.
  Future<String?> getAccessToken() => _storage.read(key: _kAccessToken);

  /// Returns the stored refresh token, or `null` if not present.
  Future<String?> getRefreshToken() => _storage.read(key: _kRefreshToken);

  /// Removes both tokens from secure storage.
  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: _kAccessToken),
      _storage.delete(key: _kRefreshToken),
    ]);
  }

  // ---------------------------------------------------------------------------
  // User identity
  // ---------------------------------------------------------------------------

  /// Persists the authenticated user's UUID.
  Future<void> saveUserId(String userId) =>
      _storage.write(key: _kUserId, value: userId);

  /// Returns the stored user UUID, or `null` if not authenticated.
  Future<String?> getUserId() => _storage.read(key: _kUserId);

  /// Persists the authenticated user's role (e.g. "client", "driver").
  Future<void> saveUserRole(String role) =>
      _storage.write(key: _kUserRole, value: role);

  /// Returns the stored user role, or `null` if not set.
  Future<String?> getUserRole() => _storage.read(key: _kUserRole);

  // ---------------------------------------------------------------------------
  // Housekeeping
  // ---------------------------------------------------------------------------

  /// Erases all keys managed by this service (on logout / account deletion).
  Future<void> clearAll() async {
    await Future.wait([
      _storage.delete(key: _kAccessToken),
      _storage.delete(key: _kRefreshToken),
      _storage.delete(key: _kUserId),
      _storage.delete(key: _kUserRole),
    ]);
  }
}
