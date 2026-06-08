import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// Encrypted on-device cache used for an offline-first / fewer-API-calls
/// strategy. Responses are stored in an AES-encrypted Hive box whose key lives
/// in the platform secure storage (Keychain / Keystore).
class CacheService {
  CacheService._(this._box);

  static const _boxName = 'camrent_cache';
  static const _keyName = 'camrent_cache_key_v1';

  final Box _box;

  static Future<CacheService> init() async {
    await Hive.initFlutter();

    const secure = FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
    );

    String? base64Key = await secure.read(key: _keyName);
    if (base64Key == null) {
      final key = Hive.generateSecureKey();
      base64Key = base64UrlEncode(key);
      await secure.write(key: _keyName, value: base64Key);
    }
    final cipher = HiveAesCipher(base64Url.decode(base64Key));

    Box box;
    try {
      box = await Hive.openBox(_boxName, encryptionCipher: cipher);
    } catch (_) {
      // Corrupt box or rotated key — reset rather than crash.
      await Hive.deleteBoxFromDisk(_boxName);
      box = await Hive.openBox(_boxName, encryptionCipher: cipher);
    }
    return CacheService._(box);
  }

  /// Returns the cached decoded JSON for [key] if present and not older than
  /// [ttl]; otherwise null.
  dynamic read(String key, {Duration? ttl}) {
    final raw = _box.get(key);
    if (raw is! String) return null;
    try {
      final entry = jsonDecode(raw) as Map<String, dynamic>;
      final ts = entry['ts'] as int? ?? 0;
      if (ttl != null &&
          DateTime.now().millisecondsSinceEpoch - ts > ttl.inMilliseconds) {
        return null; // stale
      }
      return entry['data'];
    } catch (_) {
      return null;
    }
  }

  /// Returns the cached value regardless of age (used as an offline fallback).
  dynamic readStale(String key) => read(key, ttl: null);

  Future<void> write(String key, dynamic data) async {
    await _box.put(
      key,
      jsonEncode({'ts': DateTime.now().millisecondsSinceEpoch, 'data': data}),
    );
  }

  Future<void> remove(String key) => _box.delete(key);

  Future<void> clear() => _box.clear();
}
