/// Holds the current bearer token in memory so the Dio interceptor can attach
/// it to every request. The source of truth for persistence is [AuthCubit]
/// (HydratedBloc); this is just the live value the network layer reads.
class TokenStore {
  String? _token;

  String? get token => _token;

  void setToken(String? token) => _token = token;

  void clear() => _token = null;
}
