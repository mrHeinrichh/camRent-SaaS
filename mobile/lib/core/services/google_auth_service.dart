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

  /// Returns the Google ID token, or null if the user cancelled.
  ///
  /// Throws [StateError] with a human-readable reason when the platform
  /// configuration is missing, so the UI can show what's actually wrong.
  Future<String?> signInIdToken() async {
    if (_isApplePlatform && Env.googleIosClientId.isEmpty) {
      throw StateError(
        'Google sign-in is not configured for iOS yet (missing iOS OAuth '
        'client id). See Env.googleIosClientId in lib/core/constants/env.dart.',
      );
    }

    // Sign out first so the account chooser always appears.
    await _googleSignIn.signOut();
    final account = await _googleSignIn.signIn();
    if (account == null) return null; // cancelled
    final auth = await account.authentication;
    final idToken = auth.idToken;
    if (idToken == null || idToken.isEmpty) {
      throw StateError(
        'Google did not return an ID token. Check the OAuth client '
        'configuration for this platform in Google Cloud Console.',
      );
    }
    return idToken;
  }
}
