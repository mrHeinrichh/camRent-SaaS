import 'package:google_sign_in/google_sign_in.dart';

import '../constants/env.dart';

/// Wraps `google_sign_in` to obtain a Google ID token that the backend
/// (`POST /api/auth/google`) verifies. The same flow handles both login and
/// sign-up: the backend creates the account on first Google sign-in.
class GoogleAuthService {
  GoogleAuthService()
      : _googleSignIn = GoogleSignIn(
          scopes: const ['email', 'profile'],
          // Audience for the ID token = the backend's web OAuth client.
          serverClientId: Env.googleServerClientId,
        );

  final GoogleSignIn _googleSignIn;

  /// Returns the Google ID token, or null if the user cancelled.
  Future<String?> signInIdToken() async {
    // Sign out first so the account chooser always appears.
    await _googleSignIn.signOut();
    final account = await _googleSignIn.signIn();
    if (account == null) return null; // cancelled
    final auth = await account.authentication;
    return auth.idToken;
  }
}
