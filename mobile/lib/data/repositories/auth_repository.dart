import '../../core/constants/api_endpoints.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/json.dart';
import '../models/user.dart';

class AuthResult {
  const AuthResult({required this.token, required this.user});
  final String token;
  final User user;
}

class AuthRepository {
  AuthRepository(this._api);
  final ApiClient _api;

  Future<AuthResult> login(String email, String password) async {
    final data = Json.obj(await _api.post(
      ApiEndpoints.login,
      body: {'email': email, 'password': password},
    ));
    return AuthResult(
      token: Json.str(data['token']),
      user: User.fromJson(Json.obj(data['user'])),
    );
  }

  /// Registers either a renter or an owner. [payload] should already contain
  /// the role-specific fields (store_name, branches, etc. for owners).
  Future<AuthResult> register(Map<String, dynamic> payload) async {
    final data = Json.obj(await _api.post(ApiEndpoints.register, body: payload));
    return AuthResult(
      token: Json.str(data['token']),
      user: User.fromJson(Json.obj(data['user'])),
    );
  }

  /// Exchanges a Google ID token for a session. [allowCreate] (used by the
  /// "Sign up with Google" button) lets the backend create a renter account
  /// on first Google sign-in instead of rejecting unknown emails.
  Future<AuthResult> googleSignIn(String credential,
      {bool allowCreate = false}) async {
    final data = Json.obj(await _api.post(
      ApiEndpoints.google,
      body: {'credential': credential, 'allow_create': allowCreate},
    ));
    return AuthResult(
      token: Json.str(data['token']),
      user: User.fromJson(Json.obj(data['user'])),
    );
  }

  /// Sends an email OTP for registration verification.
  Future<int> sendOtp(String email) async {
    final data = Json.obj(await _api.post(
      ApiEndpoints.sendOtp,
      body: {'email': email},
    ));
    return Json.intVal(data['expires_in'], 600);
  }

  Future<bool> verifyOtp(String email, String code) async {
    final data = Json.obj(await _api.post(
      ApiEndpoints.verifyOtp,
      body: {'email': email, 'code': code},
    ));
    return Json.boolVal(data['success']);
  }

  Future<User> profile() async =>
      User.fromJson(Json.obj(await _api.get(ApiEndpoints.profile)));

  Future<User> updateProfile(Map<String, dynamic> payload) async =>
      User.fromJson(Json.obj(await _api.put(ApiEndpoints.profile, body: payload)));
}
