import '../../core/constants/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/json.dart';

class UploadRepository {
  UploadRepository(this._api);
  final ApiClient _api;

  /// Authenticated upload (IDs, selfies, lease agreements).
  Future<String> upload(String filePath) async {
    final data = Json.obj(await _api.uploadFile(ApiEndpoints.upload, filePath: filePath));
    return Json.str(data['url'] ?? data['secure_url']);
  }

  /// Public upload used during registration (logos/banners) before auth.
  Future<String> uploadPublic(String filePath) async {
    final data =
        Json.obj(await _api.uploadFile(ApiEndpoints.uploadPublic, filePath: filePath));
    return Json.str(data['url'] ?? data['secure_url']);
  }
}
