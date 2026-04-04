import 'package:dio/dio.dart';
import '../models/trip_model.dart';

/// Repository for all trip-related API calls.
class TripRepository {
  TripRepository({required Dio dio}) : _dio = dio;

  final Dio _dio;

  // ---------------------------------------------------------------------------
  // Quote
  // ---------------------------------------------------------------------------

  /// Fetches a price quote for a trip.
  /// [stops] is a list of intermediate stop addresses.
  /// [vehicleType] defaults to 'STANDARD'.
  Future<QuoteModel> getQuote({
    required double pickupLat,
    required double pickupLng,
    required double dropoffLat,
    required double dropoffLng,
    List<String> stops = const [],
    String vehicleType = 'STANDARD',
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/quoter/quote',
      data: {
        'pickup': {'lat': pickupLat, 'lng': pickupLng},
        'dropoff': {'lat': dropoffLat, 'lng': dropoffLng},
        'stops': stops,
        'vehicleType': vehicleType,
      },
    );
    return QuoteModel.fromJson(response.data!);
  }

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  /// Creates a new trip after the client confirms a quote.
  Future<TripModel> createTrip({
    required String pickupAddress,
    required double pickupLat,
    required double pickupLng,
    required String dropoffAddress,
    required double dropoffLat,
    required double dropoffLng,
    required double quotedPrice,
    List<Map<String, String>> stops = const [],
    String vehicleType = 'STANDARD',
    DateTime? scheduledAt,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/trips',
      data: {
        'pickupAddress': pickupAddress,
        'pickup': {'lat': pickupLat, 'lng': pickupLng},
        'dropoffAddress': dropoffAddress,
        'dropoff': {'lat': dropoffLat, 'lng': dropoffLng},
        'quotedPrice': quotedPrice,
        'stops': stops,
        'vehicleType': vehicleType,
        if (scheduledAt != null) 'scheduledAt': scheduledAt.toIso8601String(),
      },
    );
    return TripModel.fromJson(response.data!);
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  /// Returns the authenticated client's trip history (paginated).
  Future<List<TripModel>> getMyTrips({int page = 1, int limit = 20}) async {
    final response = await _dio.get<List<dynamic>>(
      '/trips/my',
      queryParameters: {'page': page, 'limit': limit},
    );
    return response.data!
        .cast<Map<String, dynamic>>()
        .map(TripModel.fromJson)
        .toList();
  }

  /// Returns a single trip by its ID.
  Future<TripModel> getTripById(String id) async {
    final response = await _dio.get<Map<String, dynamic>>('/trips/$id');
    return TripModel.fromJson(response.data!);
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  /// Updates the status of a trip (driver use).
  Future<TripModel> updateStatus({
    required String tripId,
    required TripStatus status,
  }) async {
    final response = await _dio.patch<Map<String, dynamic>>(
      '/trips/$tripId/status',
      data: {'status': status.name.toUpperCase()},
    );
    return TripModel.fromJson(response.data!);
  }

  // ---------------------------------------------------------------------------
  // Share token
  // ---------------------------------------------------------------------------

  /// Generates (or re-generates) a live-share token for the given trip.
  /// Returns the raw token string.
  Future<String> generateShareToken(String tripId) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/trips/$tripId/share',
    );
    return response.data!['token'] as String;
  }
}
