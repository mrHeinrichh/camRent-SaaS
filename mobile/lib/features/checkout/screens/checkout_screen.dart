import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/utils/currency.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/rental_form.dart';
import '../../../data/repositories/catalog_repository.dart';
import '../../../data/repositories/order_repository.dart';
import '../../../data/repositories/upload_repository.dart';
import '../../auth/cubit/auth_cubit.dart';
import '../../cart/cubit/cart_cubit.dart';
import '../bloc/checkout_cubit.dart';

class CheckoutScreen extends StatelessWidget {
  const CheckoutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cart = context.read<CartCubit>().state;
    final storeId = cart.storeId;
    if (storeId == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Checkout')),
        body: const EmptyState(
            title: 'Cart is empty', icon: Icons.shopping_cart_outlined),
      );
    }
    return BlocProvider(
      create: (_) => CheckoutCubit(
        sl<CatalogRepository>(),
        sl<OrderRepository>(),
        sl<UploadRepository>(),
      )..load(storeId, cart.appliedVoucher),
      child: const _CheckoutView(),
    );
  }
}

class _CheckoutView extends StatefulWidget {
  const _CheckoutView();

  @override
  State<_CheckoutView> createState() => _CheckoutViewState();
}

class _CheckoutViewState extends State<_CheckoutView> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _emergencyName = TextEditingController();
  final _emergency = TextEditingController();
  final _address = TextEditingController();
  final _deliveryAddress = TextEditingController();
  final _voucher = TextEditingController();
  final _picker = ImagePicker();

  String? _branchId;
  String _deliveryMode = 'pickup';
  String _paymentMode = 'cash';
  final Map<String, String> _customAnswers = {};
  bool _prefilled = false;

  @override
  void dispose() {
    for (final c in [
      _name,
      _email,
      _phone,
      _emergencyName,
      _emergency,
      _address,
      _deliveryAddress,
      _voucher,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void _prefill() {
    if (_prefilled) return;
    final user = context.read<AuthCubit>().state.user;
    if (user != null) {
      _name.text = user.fullName;
      _email.text = user.email;
      _phone.text = user.phone ?? '';
    }
    _prefilled = true;
  }

  Future<void> _pickAndUpload(String key, {bool lease = false}) async {
    final file = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 70,
      maxWidth: 1600,
    );
    if (file == null || !mounted) return;
    final cubit = context.read<CheckoutCubit>();
    if (lease) {
      await cubit.uploadLeaseAgreement(file.path);
    } else {
      await cubit.uploadDocument(key, file.path);
    }
  }

  Future<void> _submit(CheckoutState state) async {
    if (!_formKey.currentState!.validate()) return;
    if (_branchId == null) {
      showSnack(context, 'Please select a branch', error: true);
      return;
    }
    if (!state.allDocsUploaded) {
      showSnack(context, 'Upload all required IDs and a selfie', error: true);
      return;
    }
    final store = state.store!;
    if ((store.leaseAgreementFileUrl?.isNotEmpty ?? false) &&
        (state.leaseAgreementUrl == null)) {
      showSnack(context, 'Completed lease agreement is required', error: true);
      return;
    }
    // Validate required custom fields.
    for (final field in state.rentalForm?.fields ?? <RentalFormField>[]) {
      if (field.required && (_customAnswers[field.id]?.isEmpty ?? true)) {
        showSnack(context, '${field.label} is required', error: true);
        return;
      }
    }

    final cart = context.read<CartCubit>().state;
    final branch = branchOptions(store).firstWhere((b) => b['id'] == _branchId);
    final renterDetails = {
      'renter_name': _name.text.trim(),
      'renter_email': _email.text.trim(),
      'renter_phone': _phone.text.trim(),
      'renter_emergency_contact_name': _emergencyName.text.trim(),
      'renter_emergency_contact': _emergency.text.trim(),
      'renter_address': _address.text.trim(),
      'store_branch_id': _branchId,
      'store_branch_name': branch['name'],
      'store_branch_address': branch['address'],
      'delivery_mode': _deliveryMode,
      'delivery_address': _deliveryMode == 'delivery'
          ? _deliveryAddress.text.trim()
          : branch['address'],
      'payment_mode': _paymentMode,
    };

    final ok = await context.read<CheckoutCubit>().submit(
          items: cart.items,
          totalAmount: cart.total,
          renterDetails: renterDetails,
          customAnswers: _customAnswers,
        );
    if (ok && mounted) {
      context.read<CartCubit>().clearCart();
      context.go('/success');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: BlocConsumer<CheckoutCubit, CheckoutState>(
        listenWhen: (p, c) => p.error != c.error && c.error != null,
        listener: (context, state) =>
            showSnack(context, state.error!, error: true),
        builder: (context, state) {
          if (state.status == CheckoutStatus.loading) {
            return const LoadingView();
          }
          if (state.store == null) {
            return ErrorView(message: state.error ?? 'Failed to load checkout');
          }
          _prefill();
          final store = state.store!;
          final branches = branchOptions(store);
          _branchId ??= branches.first['id'];
          final deliveryModes = store.deliveryModes.isEmpty
              ? ['pickup', 'delivery']
              : store.deliveryModes;
          final cart = context.watch<CartCubit>().state;

          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _section('Renter details'),
                _field(_name, 'Full name'),
                _field(_email, 'Email', keyboard: TextInputType.emailAddress),
                _field(_phone, 'Phone (+639...)', keyboard: TextInputType.phone),
                _field(_emergencyName, 'Emergency contact name'),
                _field(_emergency, 'Emergency contact (+639...)',
                    keyboard: TextInputType.phone),
                _field(_address, 'Home address', maxLines: 2),
                const SizedBox(height: 8),
                _section('Pickup / branch'),
                DropdownButtonFormField<String>(
                  initialValue: _branchId,
                  decoration: const InputDecoration(labelText: 'Branch'),
                  items: branches
                      .map((b) => DropdownMenuItem(
                            value: b['id'],
                            child: Text('${b['name']} — ${b['address']}',
                                overflow: TextOverflow.ellipsis),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() => _branchId = v),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: deliveryModes.contains(_deliveryMode)
                      ? _deliveryMode
                      : deliveryModes.first,
                  decoration: const InputDecoration(labelText: 'Delivery mode'),
                  items: deliveryModes
                      .map((m) => DropdownMenuItem(
                          value: m, child: Text(_titleCase(m))))
                      .toList(),
                  onChanged: (v) =>
                      setState(() => _deliveryMode = v ?? _deliveryMode),
                ),
                if (_deliveryMode == 'delivery') ...[
                  const SizedBox(height: 12),
                  _field(_deliveryAddress, 'Delivery address', maxLines: 2),
                ],
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _paymentMode,
                  decoration: const InputDecoration(labelText: 'Payment mode'),
                  items: const [
                    DropdownMenuItem(value: 'cash', child: Text('Cash')),
                    DropdownMenuItem(
                        value: 'gcash', child: Text('GCash / e-wallet')),
                    DropdownMenuItem(
                        value: 'bank', child: Text('Bank transfer')),
                  ],
                  onChanged: (v) =>
                      setState(() => _paymentMode = v ?? _paymentMode),
                ),
                const SizedBox(height: 16),
                _section('Required documents'),
                Text(
                  'Upload 2 valid IDs (front & back) and a selfie holding your ID.',
                  style: TextStyle(color: AppColors.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 8),
                ...requiredDocKeys.entries.map(
                  (e) => _DocTile(
                    label: e.value,
                    uploaded: state.documentUrls[e.key]?.isNotEmpty ?? false,
                    uploading: state.uploadingKey == e.key,
                    onTap: () => _pickAndUpload(e.key),
                  ),
                ),
                if (store.leaseAgreementFileUrl?.isNotEmpty ?? false) ...[
                  const SizedBox(height: 8),
                  _section('Lease agreement'),
                  _DocTile(
                    label: 'Signed lease agreement',
                    uploaded: state.leaseAgreementUrl != null,
                    uploading: state.uploadingKey == 'lease',
                    onTap: () => _pickAndUpload('lease', lease: true),
                  ),
                ],
                if ((state.rentalForm?.fields.isNotEmpty ?? false)) ...[
                  const SizedBox(height: 8),
                  _section('Additional questions'),
                  ...state.rentalForm!.fields.map(_buildCustomField),
                ],
                const SizedBox(height: 16),
                _section('Voucher'),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _voucher,
                        decoration:
                            const InputDecoration(labelText: 'Voucher code'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton(
                      onPressed: () async {
                        final ok = await context
                            .read<CheckoutCubit>()
                            .applyVoucher(_voucher.text.trim());
                        if (context.mounted) {
                          showSnack(context,
                              ok ? 'Voucher applied' : 'Invalid voucher',
                              error: !ok);
                        }
                      },
                      child: const Text('Apply'),
                    ),
                  ],
                ),
                if (state.appliedVoucher != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      'Applied ${state.appliedVoucher!.code}: -${formatPHP(state.appliedVoucher!.discountAmount)}',
                      style: const TextStyle(color: AppColors.success),
                    ),
                  ),
                const SizedBox(height: 20),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold)),
                        Text(
                          formatPHP(cart.rentalSubtotal +
                              cart.depositTotal -
                              (state.appliedVoucher?.discountAmount ?? 0)),
                          style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.accent),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: state.status == CheckoutStatus.submitting
                      ? null
                      : () => _submit(state),
                  child: state.status == CheckoutStatus.submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Submit rental application'),
                ),
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCustomField(RentalFormField field) {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: field.type == RentalFormFieldType.select
          ? DropdownButtonFormField<String>(
              decoration: InputDecoration(
                  labelText: field.label + (field.required ? ' *' : '')),
              items: field.options
                  .map((o) => DropdownMenuItem(value: o, child: Text(o)))
                  .toList(),
              onChanged: (v) =>
                  setState(() => _customAnswers[field.id] = v ?? ''),
            )
          : TextField(
              maxLines:
                  field.type == RentalFormFieldType.textarea ? 3 : 1,
              keyboardType: field.type == RentalFormFieldType.number
                  ? TextInputType.number
                  : TextInputType.text,
              decoration: InputDecoration(
                labelText: field.label + (field.required ? ' *' : ''),
                hintText: field.placeholder,
              ),
              onChanged: (v) => _customAnswers[field.id] = v,
            ),
    );
  }

  Widget _section(String title) => Padding(
        padding: const EdgeInsets.only(top: 12, bottom: 8),
        child: Text(title,
            style:
                const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      );

  Widget _field(TextEditingController controller, String label,
      {TextInputType? keyboard, int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboard,
        maxLines: maxLines,
        decoration: InputDecoration(labelText: label),
        validator: (v) =>
            (v == null || v.trim().isEmpty) ? '$label is required' : null,
      ),
    );
  }

  String _titleCase(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);
}

class _DocTile extends StatelessWidget {
  const _DocTile({
    required this.label,
    required this.uploaded,
    required this.uploading,
    required this.onTap,
  });

  final String label;
  final bool uploaded;
  final bool uploading;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(
          uploaded ? Icons.check_circle : Icons.upload_file_outlined,
          color: uploaded ? AppColors.success : AppColors.textMuted,
        ),
        title: Text(label),
        trailing: uploading
            ? const SizedBox(
                height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2))
            : TextButton(
                onPressed: onTap,
                child: Text(uploaded ? 'Replace' : 'Upload'),
              ),
        onTap: uploading ? null : onTap,
      ),
    );
  }
}
