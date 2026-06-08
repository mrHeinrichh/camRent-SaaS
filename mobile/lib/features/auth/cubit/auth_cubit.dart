import 'package:equatable/equatable.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/storage/token_store.dart';
import '../../../data/models/enums.dart';
import '../../../data/models/user.dart';
import '../../../data/repositories/auth_repository.dart';

part 'auth_state.dart';

/// Holds the authenticated session. Persisted via [HydratedCubit] so the user
/// stays logged in across launches (mirrors the web zustand `persist`).
class AuthCubit extends HydratedCubit<AuthState> {
  AuthCubit(this._repo, this._tokenStore) : super(const AuthState()) {
    // Re-sync the token into the network layer after rehydration.
    if (state.token != null) {
      _tokenStore.setToken(state.token);
    }
  }

  final AuthRepository _repo;
  final TokenStore _tokenStore;

  /// Builds a failure state, capturing a server cooldown (HTTP 429) so the UI
  /// can show a countdown and disable the submit button.
  AuthState _failure(ApiException e) {
    if (e.statusCode == 429) {
      int? seconds;
      final details = e.details;
      if (details is Map && details['cooldown_seconds'] != null) {
        seconds = int.tryParse('${details['cooldown_seconds']}');
      }
      final until = seconds != null && seconds > 0
          ? DateTime.now().add(Duration(seconds: seconds))
          : null;
      return state.copyWith(busy: false, error: e.message, cooldownUntil: until);
    }
    return state.copyWith(busy: false, error: e.message);
  }

  void _applySession(AuthResult result) {
    _tokenStore.setToken(result.token);
    emit(state.copyWith(
      status: AuthStatus.authenticated,
      user: result.user,
      token: result.token,
      busy: false,
      clearError: true,
    ));
  }

  Future<bool> login(String email, String password) async {
    emit(state.copyWith(busy: true, clearError: true));
    try {
      _applySession(await _repo.login(email, password));
      return true;
    } on ApiException catch (e) {
      emit(_failure(e));
      return false;
    }
  }

  Future<bool> register(Map<String, dynamic> payload) async {
    emit(state.copyWith(busy: true, clearError: true));
    try {
      _applySession(await _repo.register(payload));
      return true;
    } on ApiException catch (e) {
      emit(_failure(e));
      return false;
    }
  }

  Future<bool> googleSignIn(String credential) async {
    emit(state.copyWith(busy: true, clearError: true));
    try {
      _applySession(await _repo.googleSignIn(credential));
      return true;
    } on ApiException catch (e) {
      emit(_failure(e));
      return false;
    }
  }

  Future<int?> sendOtp(String email) async {
    try {
      return await _repo.sendOtp(email);
    } on ApiException catch (e) {
      emit(state.copyWith(error: e.message));
      return null;
    }
  }

  Future<bool> verifyOtp(String email, String code) async {
    try {
      return await _repo.verifyOtp(email, code);
    } on ApiException catch (e) {
      emit(state.copyWith(error: e.message));
      return false;
    }
  }

  void logout() {
    _tokenStore.clear();
    emit(const AuthState(status: AuthStatus.unauthenticated));
  }

  @override
  AuthState fromJson(Map<String, dynamic> json) {
    final userJson = json['user'];
    final token = json['token'] as String?;
    if (userJson is Map<String, dynamic> && token != null) {
      return AuthState(
        status: AuthStatus.authenticated,
        user: User.fromJson(userJson),
        token: token,
      );
    }
    return const AuthState(status: AuthStatus.unauthenticated);
  }

  @override
  Map<String, dynamic>? toJson(AuthState state) {
    if (state.status == AuthStatus.authenticated &&
        state.user != null &&
        state.token != null) {
      return {'user': state.user!.toJson(), 'token': state.token};
    }
    return {};
  }
}
