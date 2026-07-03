import 'package:camrent_mobile/core/constants/env.dart';
import 'package:camrent_mobile/core/services/google_auth_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:integration_test/integration_test.dart';

/// Diagnostic probe for the Google sign-in stack. Runs the REAL
/// `google_sign_in` plugin on a device/simulator (no mocks) and prints what
/// each layer does, so a failing sign-in can be attributed to the exact layer:
/// app guard → native SDK config → Google token.
///
///   cd mobile && flutter test integration_test/google_sign_in_probe_test.dart \
///     -d <device-id>
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('probe: app-level GoogleAuthService', (tester) async {
    debugPrintProbe('Env.googleIosClientId = '
        '${Env.googleIosClientId.isEmpty ? '(EMPTY — not configured)' : Env.googleIosClientId}');
    debugPrintProbe('Env.googleServerClientId = ${Env.googleServerClientId}');

    try {
      final token = await GoogleAuthService()
          .signInIdToken()
          .timeout(const Duration(seconds: 20));
      debugPrintProbe(token == null
          ? 'service returned null (user cancelled)'
          : 'service returned an ID token (${token.length} chars) — app side OK');
    } catch (e) {
      debugPrintProbe('GoogleAuthService threw ${e.runtimeType}: $e');
    }
  });

  testWidgets('probe: raw plugin without iOS client id (original failure)',
      (tester) async {
    // Reproduces the pre-fix setup: no clientId passed, nothing in Info.plist.
    final raw = GoogleSignIn(
      scopes: const ['email', 'profile'],
      serverClientId: Env.googleServerClientId,
    );
    try {
      final account =
          await raw.signIn().timeout(const Duration(seconds: 20));
      debugPrintProbe('raw plugin signIn returned: ${account?.email}');
    } catch (e) {
      debugPrintProbe('raw plugin threw ${e.runtimeType}: $e');
    }
  });
}

void debugPrintProbe(String message) {
  // ignore: avoid_print
  print('[GOOGLE-PROBE] $message');
}
