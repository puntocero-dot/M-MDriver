import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../network/api_client.dart';
import '../network/api_endpoints.dart';
import '../storage/local_database.dart';

/// Offline GPS coordinate queue backed by SQLite.
///
/// When the device is offline, coordinates are enqueued locally.
/// Once connectivity is restored, call [flush] to batch-upload pending points.
class LocationQueue {
  LocationQueue._();

  static final LocationQueue instance = LocationQueue._();

  static const _kTable = 'location_queue';

  // ---------------------------------------------------------------------------
  // Write
  // ---------------------------------------------------------------------------

  /// Stores a coordinate in the local SQLite queue for later upload.
  Future<void> enqueue({
    required double latitude,
    required double longitude,
    double? accuracy,
    double? speed,
    double? heading,
    String? tripId,
  }) async {
    final db = await LocalDatabase.instance.database;
    await db.insert(_kTable, {
      'latitude': latitude,
      'longitude': longitude,
      'accuracy': accuracy,
      'speed': speed,
      'heading': heading,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
      'trip_id': tripId,
    });
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  /// Returns the number of coordinates currently pending upload.
  Future<int> getPendingCount() async {
    final db = await LocalDatabase.instance.database;
    final result =
        await db.rawQuery('SELECT COUNT(*) AS cnt FROM $_kTable');
    return (result.first['cnt'] as int?) ?? 0;
  }

  // ---------------------------------------------------------------------------
  // Flush
  // ---------------------------------------------------------------------------

  /// Uploads all queued coordinates to the backend in a single batch request.
  /// Successfully uploaded records are removed from the local queue.
  Future<void> flush() async {
    final db = await LocalDatabase.instance.database;
    final rows = await db.query(
      _kTable,
      orderBy: 'timestamp ASC',
      limit: 500, // upload in chunks to avoid oversized payloads
    );

    if (rows.isEmpty) return;

    final ids = rows.map((r) => r['id'] as int).toList();
    final payload = rows
        .map(
          (r) => {
            'latitude': r['latitude'],
            'longitude': r['longitude'],
            'accuracy': r['accuracy'],
            'speed': r['speed'],
            'heading': r['heading'],
            'timestamp': r['timestamp'],
            'trip_id': r['trip_id'],
          },
        )
        .toList();

    try {
      await ApiClient.instance.post<void>(
        ApiEndpoints.locationBatch,
        data: {'coordinates': payload},
      );

      // Remove the successfully uploaded rows.
      await db.delete(
        _kTable,
        where: 'id IN (${ids.map((_) => '?').join(',')})',
        whereArgs: ids,
      );
    } on DioException catch (e) {
      // Network error — leave rows in queue for next flush attempt.
      debugPrint('[LocationQueue] flush failed: ${e.message}');
    }
  }
}
