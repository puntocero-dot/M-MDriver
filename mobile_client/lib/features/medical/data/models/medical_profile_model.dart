// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';

part 'medical_profile_model.freezed.dart';
part 'medical_profile_model.g.dart';

@freezed
class MedicalProfileModel with _$MedicalProfileModel {
  const factory MedicalProfileModel({
    String? bloodType,
    String? allergies,
    String? medicalConditions,
    String? medications,
    String? emergencyInstructions,
    String? doctorName,
    String? doctorPhone,
    String? insuranceProvider,
  }) = _MedicalProfileModel;

  factory MedicalProfileModel.fromJson(Map<String, dynamic> json) =>
      _$MedicalProfileModelFromJson(json);
}
