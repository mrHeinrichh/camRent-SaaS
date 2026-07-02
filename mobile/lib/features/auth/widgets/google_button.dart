import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/services/google_auth_service.dart';
import '../../../core/widgets/app_widgets.dart';
import '../cubit/auth_cubit.dart';

/// "Continue with Google" button. On the register screen ([signUp] = true) the
/// backend creates a renter account on first Google sign-in; on the login
/// screen an unknown email is rejected with a hint to register first.
class GoogleButton extends StatefulWidget {
  const GoogleButton(
      {super.key, this.label = 'Continue with Google', this.signUp = false});

  final String label;
  final bool signUp;

  @override
  State<GoogleButton> createState() => _GoogleButtonState();
}

class _GoogleButtonState extends State<GoogleButton> {
  final _google = GoogleAuthService();
  bool _busy = false;

  Future<void> _handle() async {
    final authCubit = context.read<AuthCubit>();
    final router = GoRouter.of(context);
    setState(() => _busy = true);
    try {
      final idToken = await _google.signInIdToken();
      if (idToken == null) {
        if (mounted) setState(() => _busy = false);
        return; // user cancelled
      }
      final ok =
          await authCubit.googleSignIn(idToken, allowCreate: widget.signUp);
      if (!mounted) return;
      setState(() => _busy = false);
      if (ok) {
        router.go('/');
      } else {
        // Surface the backend's reason (e.g. "No account exists for this
        // Google email…") instead of a generic failure.
        final message = authCubit.state.error;
        if (message != null && message.isNotEmpty) {
          showSnack(context, message, error: true);
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      final detail = e is StateError ? e.message : e.toString();
      showSnack(context, 'Google sign-in failed: $detail', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: _busy ? null : _handle,
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 13),
        side: BorderSide(color: AppColors.border),
        backgroundColor: AppColors.surfaceSoft,
      ),
      child: _busy
          ? const SizedBox(
              height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
          : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const _GoogleGlyph(),
                const SizedBox(width: 10),
                Text(widget.label,
                    style: TextStyle(
                        color: AppColors.text, fontWeight: FontWeight.w700)),
              ],
            ),
    );
  }
}

/// Minimal multi-color "G" mark so we don't need an asset.
class _GoogleGlyph extends StatelessWidget {
  const _GoogleGlyph();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 20,
      height: 20,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(4),
        gradient: const SweepGradient(
          colors: [
            Color(0xFF4285F4),
            Color(0xFF34A853),
            Color(0xFFFBBC05),
            Color(0xFFEA4335),
            Color(0xFF4285F4),
          ],
        ),
      ),
      child: const Text('G',
          style: TextStyle(
              color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
    );
  }
}
