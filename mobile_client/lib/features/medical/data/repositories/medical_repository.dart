import 'package:dio/dio.dart';

import '../models/medical_profile_model.dart';

/// Repository for the authenticated user's medical profile.
///
/// All methods talk to the backend via [Dio] (already configured with the
/// AuthInterceptor that attaches the Bearer token).
class MedicalRepository {
  const MedicalRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  /// Returns the current user's medical profile, or `null` if none exists.
  Future<MedicalProfileModel?> getProfile() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/medical/profile',
      );
      final data = response.data;
      if (data == null) return null;
      return MedicalProfileModel.fromJson(data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      rethrow;
    }
  }

  // ---------------------------------------------------------------------------
  // Write
  // ---------------------------------------------------------------------------

  /// Creates or updates the user's medical profile.
  Future<MedicalProfileModel> upsertProfile(MedicalProfileModel profile) async {
    final response = await _dio.put<Map<String, dynamic>>(
      '/medical/profile',
      data: profile.toJson(),
    );
    return MedicalProfileModel.fromJson(response.data!);
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  /// Permanently removes the user's medical profile.
  Future<void> deleteProfile() async {
    await _dio.delete<void>('/medical/profile');
  }
}
