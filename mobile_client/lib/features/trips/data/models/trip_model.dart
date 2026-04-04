// ignore_for_file: invalid_annotation_target
import 'package:freezed_annotation/freezed_annotation.dart';

part 'trip_model.freezed.dart';
part 'trip_model.g.dart';

enum TripStatus {
  @JsonValue('QUOTED') quoted,
  @JsonValue('CONFIRMED') confirmed,
  @JsonValue('DRIVER_ASSIGNED') driverAssigned,
  @JsonValue('EN_ROUTE_TO_PICKUP') enRouteToPickup,
  @JsonValue('AT_PICKUP') atPickup,
  @JsonValue('IN_TRANSIT') inTransit,
  @JsonValue('AT_STOP') atStop,
  @JsonValue('WAITING_AT_STOP') waitingAtStop,
  @JsonValue('COMPLETED') completed,
  @JsonValue('CANCELLED') cancelled,
  @JsonValue('SOS_ACTIVE') sosActive,
}

@freezed
class TripStopModel with _$TripStopModel {
  const factory TripStopModel({
    required String id,
    required int stopOrder,
    required String address,
    DateTime? arrivedAt,
    DateTime? departedAt,
    String? notes,
  }) = _TripStopModel;

  factory TripStopModel.fromJson(Map<String, dynamic> json) =>
      _$TripStopModelFromJson(json);
}

@freezed
class TripModel with _$TripModel {
  const factory TripModel({
    required String id,
    required String clientId,
    String? driverId,
    required TripStatus status,
    required String pickupAddress,
    required String dropoffAddress,
    required double quotedPrice,
    double? finalPrice,
    @Default('USD') String currency,
    @Default([]) List<TripStopModel> stops,
    String? shareToken,
    @Default(false) bool isSharedLive,
    DateTime? scheduledAt,
    DateTime? startedAt,
    DateTime? completedAt,
    required DateTime createdAt,
  }) = _TripModel;

  factory TripModel.fromJson(Map<String, dynamic> json) =>
      _$TripModelFromJson(json);
}

@freezed
class QuoteModel with _$QuoteModel {
  const factory QuoteModel({
    required double estimatedPrice,
    required int estimatedDistanceMeters,
    required int estimatedDurationSeconds,
    required QuoteBreakdown breakdown,
    required DateTime expiresAt,
    @Default('USD') String currency,
  }) = _QuoteModel;

  factory QuoteModel.fromJson(Map<String, dynamic> json) =>
      _$QuoteModelFromJson(json);
}

@freezed
class QuoteBreakdown with _$QuoteBreakdown {
  const factory QuoteBreakdown({
    required double base,
    required double distance,
    required double time,
    required double stops,
    required double fuel,
    required double vehicleSurcharge,
  }) = _QuoteBreakdown;

  factory QuoteBreakdown.fromJson(Map<String, dynamic> json) =>
      _$QuoteBreakdownFromJson(json);
}
