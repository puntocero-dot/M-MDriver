import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

/// SQLite database helper — used for offline GPS queue and local cache.
class LocalDatabase {
  LocalDatabase._();

  static final LocalDatabase instance = LocalDatabase._();

  static const _kDatabaseName = 'mm_driver.db';
  static const _kDatabaseVersion = 1;

  Database? _db;

  /// Returns the open [Database], initialising it on first access.
  Future<Database> get database async {
    _db ??= await _init();
    return _db!;
  }

  Future<Database> _init() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, _kDatabaseName);

    return openDatabase(
      path,
      version: _kDatabaseVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE location_queue (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude  REAL    NOT NULL,
        longitude REAL    NOT NULL,
        accuracy  REAL,
        speed     REAL,
        heading   REAL,
        timestamp INTEGER NOT NULL,
        trip_id   TEXT
      )
    ''');
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // Future migrations go here.
  }

  /// Closes the database connection (call on app disposal / tests).
  Future<void> close() async {
    await _db?.close();
    _db = null;
  }
}
