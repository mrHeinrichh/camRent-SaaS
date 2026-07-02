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

  /// Web OAuth client id (same Google Cloud project as the backend). On
  /// Android this is passed as `serverClientId` so the ID token's audience
  /// matches what the backend verifies.
  static const String googleServerClientId =
      '921934574051-6idmbmj2a65fsabr87r7c1ms98o90g26.apps.googleusercontent.com';

  /// iOS OAuth client id — REQUIRED for Google sign-in on iOS.
  ///
  /// Create it in Google Cloud Console → APIs & Services → Credentials →
  /// "Create credentials" → "OAuth client ID" → type **iOS**, bundle id
  /// `com.camrent.camrentMobile`, then:
  ///  1. paste the client id here (or pass --dart-define=GOOGLE_IOS_CLIENT_ID=…),
  ///  2. put its REVERSED form in ios/Runner/Info.plist under
  ///     CFBundleURLSchemes (com.googleusercontent.apps.XXXX),
  ///  3. add the client id to the backend's GOOGLE_CLIENT_IDS env var so it
  ///     accepts iOS ID tokens.
  static const String googleIosClientId = String.fromEnvironment(
    'GOOGLE_IOS_CLIENT_ID',
    defaultValue: '',
  );

  static const Duration requestTimeout = Duration(seconds: 30);
}
