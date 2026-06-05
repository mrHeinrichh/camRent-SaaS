import 'package:dio/dio.dart';

import '../constants/env.dart';
import '../storage/token_store.dart';
import 'api_exception.dart';

/// Thin wrapper around [Dio] that mirrors `frontend/src/lib/api.ts`:
/// - prefixes `/api` paths with the configured base URL
/// - attaches the bearer token
/// - normalizes errors into [ApiException]
class ApiClient {
  ApiClient(this._tokenStore) {
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

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _request(() => _dio.get(path, queryParameters: query));

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
