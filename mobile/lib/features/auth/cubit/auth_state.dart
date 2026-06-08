part of 'auth_cubit.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState extends Equatable {
  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.token,
    this.busy = false,
    this.error,
  });

  final AuthStatus status;
  final User? user;
  final String? token;
  final bool busy;
  final String? error;

  bool get isOwner => user?.role == UserRole.owner;
  bool get isAdmin => user?.role == UserRole.admin;
  bool get isRenter => user?.role == UserRole.renter;

  AuthState copyWith({
    AuthStatus? status,
    User? user,
    String? token,
    bool? busy,
    String? error,
    bool clearError = false,
  }) =>
      AuthState(
        status: status ?? this.status,
        user: user ?? this.user,
        token: token ?? this.token,
        busy: busy ?? this.busy,
        error: clearError ? null : (error ?? this.error),
      );

  @override
  List<Object?> get props => [status, user?.id, token, busy, error];
}
