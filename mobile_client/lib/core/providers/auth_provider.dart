import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../network/api_client.dart';
import '../storage/secure_storage_service.dart';
import '../../features/auth/data/models/user_model.dart';
import '../../features/auth/data/repositories/auth_repository.dart';

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------

final dioProvider = Provider<Dio>((ref) => ApiClient.instance);

final secureStorageProvider = Provider<SecureStorageService>(
  (ref) => SecureStorageService.instance,
);

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    dio: ref.watch(dioProvider),
    storage: ref.watch(secureStorageProvider),
  );
});

// ---------------------------------------------------------------------------
// Auth State
// ---------------------------------------------------------------------------

sealed class AuthState {
  const AuthState();
}

class AuthStateLoading extends AuthState {
  const AuthStateLoading();
}

class AuthStateAuthenticated extends AuthState {
  const AuthStateAuthenticated(this.user);
  final UserModel user;
}

class AuthStateUnauthenticated extends AuthState {
  const AuthStateUnauthenticated();
}

// ---------------------------------------------------------------------------
// Auth Notifier
// ---------------------------------------------------------------------------

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._repository, this._storage)
      : super(const AuthStateLoading()) {
    _init();
  }

  final AuthRepository _repository;
  final SecureStorageService _storage;

  Future<void> _init() async {
    final token = await _storage.getAccessToken();
    if (token == null) {
      state = const AuthStateUnauthenticated();
      return;
    }
    final user = await _repository.getCurrentUser();
    if (user != null) {
      state = AuthStateAuthenticated(user);
    } else {
      state = const AuthStateUnauthenticated();
    }
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    state = const AuthStateLoading();
    try {
      final response = await _repository.login(
        email: email,
        password: password,
      );
      state = AuthStateAuthenticated(response.user);
    } catch (_) {
      state = const AuthStateUnauthenticated();
      rethrow;
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String phone,
  }) async {
    state = const AuthStateLoading();
    try {
      final response = await _repository.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
      );
      state = AuthStateAuthenticated(response.user);
    } catch (_) {
      state = const AuthStateUnauthenticated();
      rethrow;
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    state = const AuthStateUnauthenticated();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.watch(authRepositoryProvider),
    ref.watch(secureStorageProvider),
  );
});
