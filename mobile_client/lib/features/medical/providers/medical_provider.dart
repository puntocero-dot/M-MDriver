import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/auth_provider.dart';
import '../data/models/medical_profile_model.dart';
import '../data/repositories/medical_repository.dart';

// ---------------------------------------------------------------------------
// Repository provider
// ---------------------------------------------------------------------------

final medicalRepositoryProvider = Provider<MedicalRepository>((ref) {
  return MedicalRepository(dio: ref.watch(dioProvider));
});

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

sealed class MedicalState {
  const MedicalState();
}

class MedicalStateLoading extends MedicalState {
  const MedicalStateLoading();
}

class MedicalStateLoaded extends MedicalState {
  const MedicalStateLoaded(this.profile);
  final MedicalProfileModel? profile;
}

class MedicalStateSaving extends MedicalState {
  const MedicalStateSaving();
}

class MedicalStateError extends MedicalState {
  const MedicalStateError(this.message);
  final String message;
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class MedicalNotifier extends StateNotifier<MedicalState> {
  MedicalNotifier(this._repository) : super(const MedicalStateLoading()) {
    loadProfile();
  }

  final MedicalRepository _repository;

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  Future<void> loadProfile() async {
    state = const MedicalStateLoading();
    try {
      final profile = await _repository.getProfile();
      state = MedicalStateLoaded(profile);
    } catch (e) {
      state = MedicalStateError(
        'No se pudo cargar el perfil médico. Intente nuevamente.',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  Future<void> saveProfile(MedicalProfileModel dto) async {
    state = const MedicalStateSaving();
    try {
      final saved = await _repository.upsertProfile(dto);
      state = MedicalStateLoaded(saved);
    } catch (e) {
      state = MedicalStateError(
        'No se pudo guardar el perfil médico. Intente nuevamente.',
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  Future<void> deleteProfile() async {
    state = const MedicalStateSaving();
    try {
      await _repository.deleteProfile();
      state = const MedicalStateLoaded(null);
    } catch (e) {
      state = MedicalStateError(
        'No se pudo eliminar el perfil médico. Intente nuevamente.',
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

final medicalProvider =
    StateNotifierProvider<MedicalNotifier, MedicalState>((ref) {
  return MedicalNotifier(ref.watch(medicalRepositoryProvider));
});
