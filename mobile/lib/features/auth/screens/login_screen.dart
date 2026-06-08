import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/app_widgets.dart';
import '../cubit/auth_cubit.dart';
import '../widgets/cooldown_button.dart';
import '../widgets/google_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final ok = await context
        .read<AuthCubit>()
        .login(_email.text.trim(), _password.text);
    if (ok && mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign in')),
      body: BlocConsumer<AuthCubit, AuthState>(
        listenWhen: (p, c) => p.error != c.error && c.error != null,
        listener: (context, state) =>
            showSnack(context, state.error!, error: true),
        builder: (context, state) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 12),
                  const Icon(Icons.photo_camera,
                      size: 56, color: AppColors.accent),
                  const SizedBox(height: 12),
                  const Text(
                    'Welcome back to CamRent',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Rent pro camera gear from trusted stores',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 28),
                  TextFormField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      prefixIcon: Icon(Icons.email_outlined),
                    ),
                    validator: (v) =>
                        (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _password,
                    obscureText: _obscure,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outline),
                      suffixIcon: IconButton(
                        icon: Icon(_obscure
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                    validator: (v) =>
                        (v == null || v.isEmpty) ? 'Enter your password' : null,
                  ),
                  const SizedBox(height: 24),
                  CooldownButton(
                    label: 'Sign in',
                    busy: state.busy,
                    cooldownUntil: state.cooldownUntil,
                    onPressed: _submit,
                  ),
                  const SizedBox(height: 18),
                  const _OrDivider(),
                  const SizedBox(height: 18),
                  const GoogleButton(label: 'Sign in with Google'),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text("Don't have an account?",
                          style: TextStyle(color: AppColors.textMuted)),
                      TextButton(
                        onPressed: () => context.push('/register'),
                        child: const Text('Create one'),
                      ),
                    ],
                  ),
                  TextButton(
                    onPressed: () => context.go('/'),
                    child: const Text('Continue browsing'),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: Divider(color: AppColors.border)),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 12),
          child: Text('or', style: TextStyle(color: AppColors.textMuted)),
        ),
        Expanded(child: Divider(color: AppColors.border)),
      ],
    );
  }
}
