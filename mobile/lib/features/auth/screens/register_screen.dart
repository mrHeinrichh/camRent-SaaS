import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/app_widgets.dart';
import '../cubit/auth_cubit.dart';
import '../widgets/cooldown_button.dart';
import '../widgets/google_button.dart';

/// Registration wizard supporting both renter and owner sign-up with email OTP
/// verification, mirroring the web `RegisterWizard`.
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  int _step = 0;
  String _role = 'renter';
  bool _otpVerified = false;
  bool _otpSent = false;

  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _otp = TextEditingController();

  // Owner fields
  final _storeName = TextEditingController();
  final _storeDescription = TextEditingController();
  final _storeAddress = TextEditingController();
  final _branchAddress = TextEditingController();
  final _lat = TextEditingController();
  final _lng = TextEditingController();
  String _billingMode = 'twenty_four_hour';

  @override
  void dispose() {
    for (final c in [
      _fullName,
      _email,
      _phone,
      _password,
      _otp,
      _storeName,
      _storeDescription,
      _storeAddress,
      _branchAddress,
      _lat,
      _lng,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _sendOtp() async {
    if (!_email.text.contains('@')) {
      showSnack(context, 'Enter a valid email first', error: true);
      return;
    }
    final seconds = await context.read<AuthCubit>().sendOtp(_email.text.trim());
    if (!mounted) return;
    if (seconds != null) {
      setState(() => _otpSent = true);
      showSnack(context, 'OTP sent to your email');
    }
  }

  Future<void> _verifyOtp() async {
    final ok = await context
        .read<AuthCubit>()
        .verifyOtp(_email.text.trim(), _otp.text.trim());
    if (!mounted) return;
    setState(() => _otpVerified = ok);
    showSnack(context, ok ? 'Email verified' : 'Invalid code', error: !ok);
  }

  Future<void> _submit() async {
    if (!_otpVerified) {
      showSnack(context, 'Please verify your email first', error: true);
      return;
    }
    final payload = <String, dynamic>{
      'full_name': _fullName.text.trim(),
      'email': _email.text.trim(),
      'phone': _phone.text.trim(),
      'password': _password.text,
      'role': _role,
    };
    if (_role == 'owner') {
      final lat = double.tryParse(_lat.text.trim());
      final lng = double.tryParse(_lng.text.trim());
      if (lat == null || lng == null) {
        showSnack(context, 'Branch pin location (lat/lng) is required',
            error: true);
        return;
      }
      payload.addAll({
        'store_name': _storeName.text.trim(),
        'store_description': _storeDescription.text.trim(),
        'store_address': _storeAddress.text.trim(),
        'rental_billing_mode': _billingMode,
        'branches': [
          {
            'name': 'Main Branch',
            'address': _branchAddress.text.trim().isEmpty
                ? _storeAddress.text.trim()
                : _branchAddress.text.trim(),
            'location_lat': lat,
            'location_lng': lng,
          }
        ],
      });
    }
    final ok = await context.read<AuthCubit>().register(payload);
    if (ok && mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AuthCubit>().state;
    return Scaffold(
      appBar: AppBar(title: const Text('Create account')),
      body: BlocListener<AuthCubit, AuthState>(
        listenWhen: (p, c) => p.error != c.error && c.error != null,
        listener: (context, s) => showSnack(context, s.error!, error: true),
        child: Stepper(
          currentStep: _step,
          onStepContinue: () {
            if (_step < 2) {
              setState(() => _step++);
            } else {
              _submit();
            }
          },
          onStepCancel: _step == 0 ? null : () => setState(() => _step--),
          controlsBuilder: (context, details) => Padding(
            padding: const EdgeInsets.only(top: 16),
            child: Row(
              children: [
                _step == 2
                    ? CooldownButton(
                        label: 'Create account',
                        busy: state.busy,
                        cooldownUntil: state.cooldownUntil,
                        onPressed: details.onStepContinue ?? () {},
                      )
                    : ElevatedButton(
                        onPressed: state.busy ? null : details.onStepContinue,
                        child: const Text('Next'),
                      ),
                const SizedBox(width: 12),
                if (_step > 0)
                  TextButton(
                    onPressed: details.onStepCancel,
                    child: const Text('Back'),
                  ),
              ],
            ),
          ),
          steps: [
            Step(
              title: const Text('Account type'),
              isActive: _step >= 0,
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  RadioGroup<String>(
                    groupValue: _role,
                    onChanged: (v) => setState(() => _role = v ?? _role),
                    child: const Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        RadioListTile<String>(
                          value: 'renter',
                          title: Text('Renter'),
                          subtitle: Text('Browse and rent camera gear'),
                        ),
                        RadioListTile<String>(
                          value: 'owner',
                          title: Text('Store owner'),
                          subtitle: Text('List your gear and manage rentals'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: Divider(color: AppColors.border)),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 12),
                        child: Text('or sign up instantly',
                            style: TextStyle(color: AppColors.textMuted)),
                      ),
                      Expanded(child: Divider(color: AppColors.border)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const GoogleButton(
                      label: 'Sign up with Google', signUp: true),
                ],
              ),
            ),
            Step(
              title: const Text('Your details'),
              isActive: _step >= 1,
              content: Column(
                children: [
                  TextField(
                    controller: _fullName,
                    decoration: const InputDecoration(labelText: 'Full name'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                        labelText: 'Phone (E.164, e.g. +639171234567)'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _password,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'Password'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(labelText: 'Email'),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _sendOtp,
                          child: Text(_otpSent ? 'Resend code' : 'Send code'),
                        ),
                      ),
                    ],
                  ),
                  if (_otpSent) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _otp,
                            keyboardType: TextInputType.number,
                            decoration:
                                const InputDecoration(labelText: 'OTP code'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton(
                          onPressed: _verifyOtp,
                          child: const Text('Verify'),
                        ),
                      ],
                    ),
                  ],
                  if (_otpVerified)
                    const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: Row(
                        children: [
                          Icon(Icons.verified, color: AppColors.success, size: 18),
                          SizedBox(width: 6),
                          Text('Email verified',
                              style: TextStyle(color: AppColors.success)),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            Step(
              title: Text(_role == 'owner' ? 'Store details' : 'Confirm'),
              isActive: _step >= 2,
              content: _role == 'owner'
                  ? Column(
                      children: [
                        TextField(
                          controller: _storeName,
                          decoration:
                              const InputDecoration(labelText: 'Store name'),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _storeDescription,
                          maxLines: 2,
                          decoration: const InputDecoration(
                              labelText: 'Store description'),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _storeAddress,
                          decoration:
                              const InputDecoration(labelText: 'Store address'),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _branchAddress,
                          decoration: const InputDecoration(
                              labelText: 'Main branch address'),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _lat,
                                keyboardType:
                                    const TextInputType.numberWithOptions(
                                        decimal: true, signed: true),
                                decoration:
                                    const InputDecoration(labelText: 'Latitude'),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: TextField(
                                controller: _lng,
                                keyboardType:
                                    const TextInputType.numberWithOptions(
                                        decimal: true, signed: true),
                                decoration: const InputDecoration(
                                    labelText: 'Longitude'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          initialValue: _billingMode,
                          decoration: const InputDecoration(
                              labelText: 'Rental billing mode'),
                          items: const [
                            DropdownMenuItem(
                                value: 'twenty_four_hour',
                                child: Text('24-hour periods')),
                            DropdownMenuItem(
                                value: 'calendar_day',
                                child: Text('Calendar days')),
                          ],
                          onChanged: (v) =>
                              setState(() => _billingMode = v ?? _billingMode),
                        ),
                      ],
                    )
                  : Text(
                      'Review your details and tap "Create account" to finish.',
                      style: TextStyle(color: AppColors.textMuted),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
