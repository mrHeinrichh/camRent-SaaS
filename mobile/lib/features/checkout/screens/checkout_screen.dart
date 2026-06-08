import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/utils/currency.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/rental_form.dart';
import '../../../data/models/store.dart';
import '../../../data/repositories/catalog_repository.dart';
import '../../../data/repositories/order_repository.dart';
import '../../../data/repositories/upload_repository.dart';
import '../../auth/cubit/auth_cubit.dart';
import '../../cart/cubit/cart_cubit.dart';
import '../bloc/checkout_cubit.dart';

/// Identity documents required at checkout (the 5 IDs + the proof of billing),
/// mirroring the web rental application.
const _idDocs = <String, String>{
  'id1_front': 'ID 1 — Front',
  'id1_back': 'ID 1 — Back',
  'id2_front': 'ID 2 — Front',
  'id2_back': 'ID 2 — Back',
  'selfie_id': 'Selfie with ID',
};
const _billingKey = 'proof_of_billing';

class CheckoutScreen extends StatelessWidget {
  const CheckoutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cart = context.read<CartCubit>().state;
    final storeId = cart.storeId;
    if (storeId == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Rental application')),
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
  final _picker = ImagePicker();
  int _step = 0;

  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _emergencyName = TextEditingController();
  final _emergency = TextEditingController();
  final _address = TextEditingController();
  final _deliveryAddress = TextEditingController();
  final _voucher = TextEditingController();

  String? _branchId;
  String _deliveryMode = '';
  String _paymentMode = 'cash';
  final Map<String, String> _customAnswers = {};
  bool _agree = false;
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

  Future<void> _openUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (mounted) {
      showSnack(context, 'Could not open the document', error: true);
    }
  }

  Future<void> _pickAndUpload(String key, {bool lease = false}) async {
    final file = await _picker.pickImage(
        source: ImageSource.gallery, imageQuality: 70, maxWidth: 1600);
    if (file == null || !mounted) return;
    final cubit = context.read<CheckoutCubit>();
    if (lease) {
      await cubit.uploadLeaseAgreement(file.path);
    } else {
      await cubit.uploadDocument(key, file.path);
    }
  }

  bool _validateStep(CheckoutState state) {
    String? err;
    if (_step == 0) {
      if (_name.text.trim().isEmpty) {
        err = 'Full name is required';
      } else if (!_email.text.contains('@')) {
        err = 'A valid email is required';
      } else if (_phone.text.trim().length < 7) {
        err = 'A valid contact number is required';
      } else if (_emergencyName.text.trim().isEmpty) {
        err = 'Emergency contact name is required';
      } else if (_emergency.text.trim().length < 7) {
        err = 'A valid emergency contact number is required';
      } else if (_address.text.trim().isEmpty) {
        err = 'Present address is required';
      }
    } else if (_step == 1) {
      if (_branchId == null) {
        err = 'Please select a branch';
      } else if (_deliveryMode.isEmpty) {
        err = 'Please choose a delivery mode';
      } else if (_deliveryAddress.text.trim().isEmpty) {
        err = 'Delivery address is required';
      }
    }
    if (err != null) {
      showSnack(context, err, error: true);
      return false;
    }
    return true;
  }

  Future<void> _submit(CheckoutState state) async {
    final store = state.store!;
    // Documents
    for (final key in _idDocs.keys) {
      if ((state.documentUrls[key] ?? '').isEmpty) {
        showSnack(context, 'Please upload all valid IDs and a selfie',
            error: true);
        return;
      }
    }
    if ((state.documentUrls[_billingKey] ?? '').isEmpty) {
      showSnack(context, 'Proof of billing address is required', error: true);
      return;
    }
    if ((store.leaseAgreementFileUrl?.isNotEmpty ?? false) &&
        state.leaseAgreementUrl == null) {
      showSnack(context, 'Completed lease agreement is required', error: true);
      return;
    }
    for (final field in state.rentalForm?.fields ?? <RentalFormField>[]) {
      if (field.required && (_customAnswers[field.id]?.isEmpty ?? true)) {
        showSnack(context, '${field.label} is required', error: true);
        return;
      }
    }
    if (!_agree) {
      showSnack(context, 'Please agree to the rental terms to continue',
          error: true);
      return;
    }

    final cart = context.read<CartCubit>().state;
    final branch = branchOptions(store).firstWhere((b) => b['id'] == _branchId);
    final total = cart.rentalSubtotal +
        store.securityDeposit -
        (state.appliedVoucher?.discountAmount ?? 0);

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
      'delivery_address': _deliveryAddress.text.trim(),
      'payment_mode': _paymentMode,
    };

    final ok = await context.read<CheckoutCubit>().submit(
          items: cart.items,
          totalAmount: total < 0 ? 0 : total,
          renterDetails: renterDetails,
          customAnswers: _customAnswers,
        );
    if (ok && mounted) {
      context.read<CartCubit>().clearCart();
      context.go('/success');
    }
  }

  // Completion progress, mirroring the web mini progress bar.
  double _completion(CheckoutState state) {
    final store = state.store;
    final checks = <bool>[
      _name.text.trim().isNotEmpty,
      _email.text.contains('@'),
      _phone.text.trim().isNotEmpty,
      _emergencyName.text.trim().isNotEmpty,
      _emergency.text.trim().isNotEmpty,
      _address.text.trim().isNotEmpty,
      _branchId != null,
      _deliveryMode.isNotEmpty,
      _deliveryAddress.text.trim().isNotEmpty,
      _paymentMode.isNotEmpty,
      ..._idDocs.keys.map((k) => (state.documentUrls[k] ?? '').isNotEmpty),
      (state.documentUrls[_billingKey] ?? '').isNotEmpty,
      (store?.leaseAgreementFileUrl?.isEmpty ?? true) ||
          state.leaseAgreementUrl != null,
      _agree,
    ];
    final done = checks.where((c) => c).length;
    return done / checks.length;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Rental application')),
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
          final deliveryModes =
              store.deliveryModes.isEmpty ? ['Store Pickup'] : store.deliveryModes;
          if (_deliveryMode.isEmpty) _deliveryMode = deliveryModes.first;

          return Column(
            children: [
              _StepHeader(step: _step, completion: _completion(state)),
              Expanded(
                child: IndexedStack(
                  index: _step,
                  children: [
                    _stepPersonal(),
                    _stepDelivery(store, branches, deliveryModes,
                        state.rentalForm?.settings?.showBranchMap ?? true),
                    _stepRequirements(state, store),
                  ],
                ),
              ),
              _BottomBar(
                step: _step,
                submitting: state.status == CheckoutStatus.submitting,
                onBack: () => setState(() => _step -= 1),
                onNext: () {
                  if (_validateStep(state)) setState(() => _step += 1);
                },
                onSubmit: () => _submit(state),
              ),
            ],
          );
        },
      ),
    );
  }

  // ── Step 1: personal ──────────────────────────────────────────────
  Widget _stepPersonal() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionTitle('Personal details', 'Match your valid IDs exactly.'),
        _field(_name, 'Full name'),
        _field(_email, 'Email', keyboard: TextInputType.emailAddress),
        _field(_phone, 'Contact number (+639...)',
            keyboard: TextInputType.phone),
        _field(_emergencyName, 'Emergency contact name'),
        _field(_emergency, 'Emergency contact number (+639...)',
            keyboard: TextInputType.phone),
        _field(_address, 'Present address', maxLines: 2),
      ],
    );
  }

  // ── Step 2: delivery & branch ─────────────────────────────────────
  Widget _stepDelivery(Store store, List<Map<String, String>> branches,
      List<String> deliveryModes, bool hasMap) {
    final selectedBranch = store.branches.isEmpty
        ? null
        : store.branches.firstWhere(
            (b) => '${b.id}' == _branchId,
            orElse: () => store.branches.first,
          );
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionTitle('Pickup & delivery', 'Where and how you will get the gear.'),
        DropdownButtonFormField<String>(
          initialValue: _branchId,
          decoration: const InputDecoration(labelText: 'Store branch'),
          items: branches
              .map((b) => DropdownMenuItem(
                    value: b['id'],
                    child: Text('${b['name']} — ${b['address']}',
                        overflow: TextOverflow.ellipsis),
                  ))
              .toList(),
          onChanged: (v) => setState(() => _branchId = v),
        ),
        if (hasMap &&
            selectedBranch?.locationLat != null &&
            selectedBranch?.locationLng != null) ...[
          const SizedBox(height: 10),
          _MapCard(
            lat: selectedBranch!.locationLat!,
            lng: selectedBranch.locationLng!,
            address: selectedBranch.address,
          ),
        ],
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue:
              deliveryModes.contains(_deliveryMode) ? _deliveryMode : deliveryModes.first,
          decoration: const InputDecoration(labelText: 'Delivery mode'),
          items: deliveryModes
              .map((m) => DropdownMenuItem(value: m, child: Text(m)))
              .toList(),
          onChanged: (v) => setState(() => _deliveryMode = v ?? _deliveryMode),
        ),
        const SizedBox(height: 12),
        _field(_deliveryAddress, 'Delivery / meet-up address', maxLines: 2),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _paymentMode,
          decoration: const InputDecoration(labelText: 'Payment mode'),
          items: const [
            DropdownMenuItem(value: 'cash', child: Text('Cash')),
            DropdownMenuItem(value: 'gcash', child: Text('GCash / e-wallet')),
            DropdownMenuItem(value: 'bank', child: Text('Bank transfer')),
          ],
          onChanged: (v) => setState(() => _paymentMode = v ?? _paymentMode),
        ),
      ],
    );
  }

  // ── Step 3: requirements & review ─────────────────────────────────
  Widget _stepRequirements(CheckoutState state, Store store) {
    final settings = state.rentalForm?.settings;
    final cart = context.watch<CartCubit>().state;
    final total = cart.rentalSubtotal +
        store.securityDeposit -
        (state.appliedVoucher?.discountAmount ?? 0);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (settings?.referenceText != null &&
            settings!.referenceText!.isNotEmpty) ...[
          _ReferenceBox(
            text: settings.referenceText!,
            imageUrl: settings.referenceImageUrl,
          ),
          const SizedBox(height: 12),
        ],
        _sectionTitle('Identity verification',
            'Upload 2 valid IDs (front & back) and a selfie holding an ID.'),
        ..._idDocs.entries.map((e) => _DocTile(
              label: e.value,
              uploaded: (state.documentUrls[e.key] ?? '').isNotEmpty,
              uploading: state.uploadingKey == e.key,
              onTap: () => _pickAndUpload(e.key),
            )),
        const SizedBox(height: 8),
        _sectionTitle('Proof of billing address', null),
        _DocTile(
          label: 'Billing address document',
          uploaded: (state.documentUrls[_billingKey] ?? '').isNotEmpty,
          uploading: state.uploadingKey == _billingKey,
          onTap: () => _pickAndUpload(_billingKey),
        ),
        if (store.leaseAgreementFileUrl?.isNotEmpty ?? false) ...[
          const SizedBox(height: 8),
          _sectionTitle('Lease agreement',
              'Upload the signed lease agreement given by your official rental shop.'),
          _NoteBox(
            text:
                'Download the official lease agreement from this store, sign it, then upload your signed copy below.',
            actionLabel: 'View official lease agreement',
            onAction: () => _openUrl(store.leaseAgreementFileUrl!),
          ),
          const SizedBox(height: 8),
          _DocTile(
            label: 'Signed lease agreement',
            uploaded: state.leaseAgreementUrl != null,
            uploading: state.uploadingKey == 'lease',
            onTap: () => _pickAndUpload('lease', lease: true),
          ),
        ],
        if (state.rentalForm?.fields.isNotEmpty ?? false) ...[
          const SizedBox(height: 8),
          _sectionTitle('Store questions', null),
          ...state.rentalForm!.fields.map(_buildCustomField),
        ],
        const SizedBox(height: 12),
        _sectionTitle('Voucher', null),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _voucher,
                decoration: const InputDecoration(labelText: 'Voucher code'),
              ),
            ),
            const SizedBox(width: 8),
            OutlinedButton(
              onPressed: () async {
                final ok = await context
                    .read<CheckoutCubit>()
                    .applyVoucher(_voucher.text.trim());
                if (!mounted) return;
                showSnack(context, ok ? 'Voucher applied' : 'Invalid voucher',
                    error: !ok);
              },
              child: const Text('Apply'),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _SummaryCard(
          rentalSubtotal: cart.rentalSubtotal,
          deposit: store.securityDeposit,
          voucher: state.appliedVoucher?.discountAmount ?? 0,
          voucherCode: state.appliedVoucher?.code,
          total: total < 0 ? 0 : total,
        ),
        const SizedBox(height: 8),
        CheckboxListTile(
          contentPadding: EdgeInsets.zero,
          value: _agree,
          activeColor: AppColors.accent,
          controlAffinity: ListTileControlAffinity.leading,
          onChanged: (v) => setState(() => _agree = v ?? false),
          title: Text(
            'I confirm my details are accurate and I agree to the store\'s rental terms, deposit and return policy.',
            style: TextStyle(color: AppColors.textMuted, fontSize: 13),
          ),
        ),
        const SizedBox(height: 80),
      ],
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
              maxLines: field.type == RentalFormFieldType.textarea ? 3 : 1,
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

  Widget _sectionTitle(String title, String? subtitle) => Padding(
        padding: const EdgeInsets.only(top: 6, bottom: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style:
                    const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
            if (subtitle != null)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(subtitle,
                    style:
                        TextStyle(color: AppColors.textMuted, fontSize: 12.5)),
              ),
          ],
        ),
      );

  Widget _field(TextEditingController controller, String label,
      {TextInputType? keyboard, int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        keyboardType: keyboard,
        maxLines: maxLines,
        onChanged: (_) => setState(() {}), // update progress bar live
        decoration: InputDecoration(labelText: label),
      ),
    );
  }
}

class _StepHeader extends StatelessWidget {
  const _StepHeader({required this.step, required this.completion});
  final int step;
  final double completion;

  static const _labels = ['Personal', 'Delivery', 'Requirements'];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        children: [
          Row(
            children: List.generate(3, (i) {
              final active = i <= step;
              return Expanded(
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 14,
                      backgroundColor:
                          active ? AppColors.accent : AppColors.surfaceSoft,
                      child: Text('${i + 1}',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: active
                                  ? AppColors.accentText
                                  : AppColors.textMuted)),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(_labels[i],
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight:
                                  i == step ? FontWeight.w700 : FontWeight.w500,
                              color: i == step
                                  ? AppColors.text
                                  : AppColors.textMuted)),
                    ),
                  ],
                ),
              );
            }),
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: completion,
              minHeight: 6,
              backgroundColor: AppColors.surfaceSoft,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(AppColors.accent),
            ),
          ),
          const SizedBox(height: 4),
          Align(
            alignment: Alignment.centerRight,
            child: Text('${(completion * 100).round()}% complete',
                style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
          ),
        ],
      ),
    );
  }
}

class _BottomBar extends StatelessWidget {
  const _BottomBar({
    required this.step,
    required this.submitting,
    required this.onBack,
    required this.onNext,
    required this.onSubmit,
  });

  final int step;
  final bool submitting;
  final VoidCallback onBack;
  final VoidCallback onNext;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final isLast = step == 2;
    return Container(
      padding: EdgeInsets.fromLTRB(
          16, 10, 16, 10 + MediaQuery.of(context).padding.bottom),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          if (step > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: submitting ? null : onBack,
                child: const Text('Back'),
              ),
            ),
          if (step > 0) const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: submitting ? null : (isLast ? onSubmit : onNext),
              child: submitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(isLast ? 'Submit application' : 'Continue'),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapCard extends StatelessWidget {
  const _MapCard(
      {required this.lat, required this.lng, required this.address});
  final double lat;
  final double lng;
  final String address;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () async {
        final uri = Uri.parse(
            'https://www.google.com/maps/search/?api=1&query=$lat,$lng');
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surfaceSoft,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            const Icon(Icons.map_outlined, color: AppColors.accent),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Branch location',
                      style: TextStyle(fontWeight: FontWeight.w600)),
                  Text(address,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style:
                          TextStyle(color: AppColors.textMuted, fontSize: 12)),
                ],
              ),
            ),
            Icon(Icons.open_in_new, size: 16, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}

class _NoteBox extends StatelessWidget {
  const _NoteBox({required this.text, this.actionLabel, this.onAction});
  final String text;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.accent.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.accent.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.sticky_note_2_outlined,
                  size: 16, color: AppColors.accent),
              const SizedBox(width: 8),
              Expanded(
                child: Text(text,
                    style: const TextStyle(fontSize: 12.5, height: 1.4)),
              ),
            ],
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: onAction,
                style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    visualDensity: VisualDensity.compact),
                icon: const Icon(Icons.download_outlined, size: 18),
                label: Text(actionLabel!),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ReferenceBox extends StatelessWidget {
  const _ReferenceBox({required this.text, this.imageUrl});
  final String text;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.accent.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.accent.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.info_outline, size: 16, color: AppColors.accent),
              SizedBox(width: 6),
              Text('Store instructions',
                  style: TextStyle(fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 8),
          if (imageUrl != null && imageUrl!.isNotEmpty) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: RemoteImage(url: imageUrl, height: 150, width: double.infinity),
            ),
            const SizedBox(height: 8),
          ],
          Text(text, style: const TextStyle(fontSize: 13, height: 1.4)),
        ],
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({
    required this.rentalSubtotal,
    required this.deposit,
    required this.voucher,
    required this.voucherCode,
    required this.total,
  });

  final double rentalSubtotal;
  final double deposit;
  final double voucher;
  final String? voucherCode;
  final double total;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceSoft,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          _row('Rental subtotal', formatPHP(rentalSubtotal)),
          _row('Security deposit', formatPHP(deposit)),
          if (voucher > 0)
            _row('Voucher${voucherCode != null ? ' ($voucherCode)' : ''}',
                '- ${formatPHP(voucher)}',
                accent: true),
          const Divider(),
          _row('Total', formatPHP(total), bold: true),
        ],
      ),
    );
  }

  Widget _row(String label, String value,
      {bool bold = false, bool accent = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: TextStyle(
                  color: bold ? AppColors.text : AppColors.textMuted,
                  fontWeight: bold ? FontWeight.bold : FontWeight.normal)),
          Text(value,
              style: TextStyle(
                  color: accent ? AppColors.accent : AppColors.text,
                  fontWeight: bold ? FontWeight.bold : FontWeight.w600,
                  fontSize: bold ? 18 : 14)),
        ],
      ),
    );
  }
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
                height: 18,
                width: 18,
                child: CircularProgressIndicator(strokeWidth: 2))
            : TextButton(
                onPressed: onTap,
                child: Text(uploaded ? 'Replace' : 'Upload'),
              ),
        onTap: uploading ? null : onTap,
      ),
    );
  }
}
