import 'package:dio/dio.dart';

import '../constants/env.dart';
import '../storage/cache_service.dart';
import '../storage/token_store.dart';
import 'api_exception.dart';

/// Thin wrapper around [Dio] that mirrors `frontend/src/lib/api.ts`:
/// - prefixes `/api` paths with the configured base URL
/// - attaches the bearer token
/// - normalizes errors into [ApiException]
/// - optionally serves GETs from an encrypted on-device cache
class ApiClient {
  ApiClient(this._tokenStore, {CacheService? cache}) : _cache = cache {
    _dio = Dio(
      BaseOptions(
        baseUrl: Env.apiBaseUrl,
        connectTimeout: Env.requestTimeout,
        receiveTimeout: Env.requestTimeout,
        sendTimeout: Env.requestTimeout,
        headers: {'Accept': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = _tokenStore.token;
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  late final Dio _dio;
  final TokenStore _tokenStore;
  final CacheService? _cache;

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _request(() => _dio.get(path, queryParameters: query));

  /// Cache-first GET: returns fresh cached JSON within [ttl] (no network call),
  /// otherwise fetches and updates the cache. On network failure, falls back to
  /// any stale cached copy. Pass [forceRefresh] (e.g. pull-to-refresh) to skip
  /// the cache read. The bearer token is folded into the cache key so a
  /// different account never reads another's cached data.
  Future<dynamic> getCached(
    String path, {
    Map<String, dynamic>? query,
    Duration ttl = const Duration(minutes: 3),
    bool forceRefresh = false,
  }) async {
    final cache = _cache;
    if (cache == null) return get(path, query: query);

    final key = _cacheKey(path, query);
    if (!forceRefresh) {
      final cached = cache.read(key, ttl: ttl);
      if (cached != null) return cached;
    }
    try {
      final data = await get(path, query: query);
      await cache.write(key, data);
      return data;
    } on ApiException {
      final stale = cache.readStale(key);
      if (stale != null) return stale;
      rethrow;
    }
  }

  String _cacheKey(String path, Map<String, dynamic>? query) {
    final token = _tokenStore.token ?? 'anon';
    final acct = token.length > 12 ? token.substring(token.length - 12) : token;
    final q = query == null ? '' : query.toString();
    return '$acct|$path|$q';
  }

  Future<dynamic> post(String path, {Object? body}) =>
      _request(() => _dio.post(path, data: body));

  Future<dynamic> put(String path, {Object? body}) =>
      _request(() => _dio.put(path, data: body));

  Future<dynamic> patch(String path, {Object? body}) =>
      _request(() => _dio.patch(path, data: body));

  Future<dynamic> delete(String path, {Object? body}) =>
      _request(() => _dio.delete(path, data: body));

  /// Multipart upload — used by `/api/upload*` endpoints for IDs / images.
  Future<dynamic> uploadFile(
    String path, {
    required String filePath,
    String field = 'file',
    Map<String, dynamic>? extra,
  }) {
    final form = FormData.fromMap({
      ...?extra,
      field: MultipartFile.fromFileSync(filePath),
    });
    return _request(() => _dio.post(path, data: form));
  }

  Future<dynamic> _request(Future<Response> Function() run) async {
    try {
      final response = await run();
      return response.data;
    } on DioException catch (error) {
      throw _toApiException(error);
    }
  }

  ApiException _toApiException(DioException error) {
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return ApiException(
        'Request timed out. Please check your connection and try again.',
      );
    }

    final data = error.response?.data;
    String? message;
    String? code;
    if (data is Map) {
      message = data['error']?.toString();
      code = data['code']?.toString();
    }

    return ApiException(
      message ??
          'Request failed (${error.response?.statusCode ?? 'network error'})',
      statusCode: error.response?.statusCode,
      code: code,
      details: data,
    );
  }
}
