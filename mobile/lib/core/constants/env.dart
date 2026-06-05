/// Runtime environment configuration.
///
/// Mirrors `frontend/src/config/runtime.ts`. Switch [apiTarget] between
/// [ApiTarget.local] and [ApiTarget.live] to point at the local backend or the
/// deployed Render instance. You can also override at build time with:
///   flutter run --dart-define=API_TARGET=live
enum ApiTarget { local, live }

class Env {
  Env._();

  static const String _target =
      String.fromEnvironment('API_TARGET', defaultValue: 'live');

  static ApiTarget get apiTarget =>
      _target == 'local' ? ApiTarget.local : ApiTarget.live;

  /// Local backend (express dev server).
  static const String localBaseUrl = String.fromEnvironment(
    'API_URL_LOCAL',
    defaultValue: 'http://127.0.0.1:3001',
  );

  /// Deployed backend on Render.
  static const String liveBaseUrl = String.fromEnvironment(
    'API_URL_LIVE',
    defaultValue: 'https://camrent-saas.onrender.com',
  );

  static String get apiBaseUrl =>
      apiTarget == ApiTarget.live ? liveBaseUrl : localBaseUrl;

  /// Web OAuth client id used by the web app. Mobile uses platform client ids
  /// configured in the native projects; this is kept for serverAuthCode flows.
  static const String googleServerClientId =
      '921934574051-6idmbmj2a65fsabr87r7c1ms98o90g26.apps.googleusercontent.com';

  static const Duration requestTimeout = Duration(seconds: 30);
}
