import 'dart:convert';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../constants/env.dart';

/// Wraps `google_sign_in` to obtain a Google ID token that the backend
/// (`POST /api/auth/google`) verifies.
///
/// Platform requirements (all in the same Google Cloud project as the web
/// client):
///  - **Android**: an *Android-type* OAuth client with package name
///    `com.camrent.camrent_mobile` and the signing SHA-1 must exist in the
///    console. `serverClientId` (the web client) makes the returned ID token's
///    audience match what the backend verifies. A missing/mismatched Android
///    client surfaces as `ApiException: 10` (DEVELOPER_ERROR).
///  - **iOS**: an *iOS-type* OAuth client is required — see
///    [Env.googleIosClientId] for the setup steps. iOS ID tokens carry the iOS
///    client id as audience, so the backend must list it in GOOGLE_CLIENT_IDS.
class GoogleAuthService {
  GoogleAuthService()
      : _googleSignIn = GoogleSignIn(
          scopes: const ['email', 'profile'],
          // iOS/macOS native client id (ignored on Android).
          clientId: Env.googleIosClientId.isEmpty
              ? null
              : Env.googleIosClientId,
          // Audience for the Android ID token = the backend's web OAuth client.
          serverClientId: Env.googleServerClientId,
        );

  final GoogleSignIn _googleSignIn;

  bool get _isApplePlatform =>
      !kIsWeb && (Platform.isIOS || Platform.isMacOS);

  static void _log(String message) => debugPrint('[google-auth] $message');

  static String _mask(String id) =>
      id.length <= 14 ? id : '${id.substring(0, 14)}…';

  /// Decodes the `aud` claim of a JWT without verifying it — logging only.
  static String _tokenAudience(String jwt) {
    try {
      final payload = json.decode(utf8.decode(
          base64Url.decode(base64Url.normalize(jwt.split('.')[1]))));
      return payload['aud']?.toString() ?? 'missing';
    } catch (_) {
      return 'unparsable';
    }
  }

  /// Returns the Google ID token, or null if the user cancelled.
  ///
  /// Throws [StateError] with a human-readable reason when the platform
  /// configuration is missing, so the UI can show what's actually wrong.
  Future<String?> signInIdToken() async {
    _log('start · platform=${kIsWeb ? 'web' : Platform.operatingSystem} '
        '· iosClientId=${Env.googleIosClientId.isEmpty ? 'NOT SET' : _mask(Env.googleIosClientId)} '
        '· serverClientId=${_mask(Env.googleServerClientId)}');

    if (_isApplePlatform && Env.googleIosClientId.isEmpty) {
      _log('ABORT — no iOS OAuth client id configured; the native Google '
          'sign-in SDK cannot start. Create an iOS-type OAuth client in '
          'Google Cloud Console and set Env.googleIosClientId + the reversed '
          'scheme in ios/Runner/Info.plist.');
      throw StateError(
        'Google sign-in is not configured for iOS yet (missing iOS OAuth '
        'client id). See Env.googleIosClientId in lib/core/constants/env.dart.',
      );
    }

    // Sign out first so the account chooser always appears.
    await _googleSignIn.signOut();
    _log('opening Google account chooser…');
    final account = await _googleSignIn.signIn();
    if (account == null) {
      _log('user cancelled the account chooser');
      return null; // cancelled
    }
    _log('account selected: ${account.email}');

    final auth = await account.authentication;
    final idToken = auth.idToken;
    if (idToken == null || idToken.isEmpty) {
      _log('ERROR — Google returned no ID token '
          '(accessToken=${auth.accessToken == null ? 'null' : 'present'}). '
          'Usually a misconfigured OAuth client for this platform.');
      throw StateError(
        'Google did not return an ID token. Check the OAuth client '
        'configuration for this platform in Google Cloud Console.',
      );
    }
    _log('idToken received · aud=${_mask(_tokenAudience(idToken))} '
        '· length=${idToken.length}. The backend must list this aud in '
        'GOOGLE_CLIENT_IDS (or GOOGLE_CLIENT_ID).');
    return idToken;
  }
}
