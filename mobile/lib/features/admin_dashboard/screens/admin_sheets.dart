import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/content.dart';
import '../../../data/repositories/upload_repository.dart';
import '../bloc/admin_cubit.dart';

/// Confirms a destructive admin action by collecting the admin password.
Future<String?> askAdminPassword(BuildContext context, String title) {
  final controller = TextEditingController();
  return showDialog<String>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      title: Text(title),
      content: TextField(
        controller: controller,
        obscureText: true,
        decoration: const InputDecoration(
          labelText: 'Admin password',
          helperText: 'Required to confirm this action',
        ),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
          onPressed: () => Navigator.pop(dialogContext, controller.text),
          child: const Text('Confirm'),
        ),
      ],
    ),
  );
}

Future<T?> _sheet<T>(BuildContext context, Widget child) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: SingleChildScrollView(child: child),
    ),
  );
}

// ── Fraud editor ────────────────────────────────────────────────────
Future<void> showFraudEditor(BuildContext context,
    {required AdminCubit cubit, FraudListEntry? existing}) {
  final name = TextEditingController(text: existing?.fullName);
  final email = TextEditingController(text: existing?.email);
  final phone = TextEditingController(text: existing?.contactNumber);
  final reason = TextEditingController(text: existing?.reason);
  final isEdit = existing != null;

  return _sheet(
    context,
    StatefulBuilder(
      builder: (context, setState) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(isEdit ? 'Edit fraud entry' : 'Add to global fraud list',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          TextField(
              controller: name,
              decoration: const InputDecoration(labelText: 'Full name')),
          const SizedBox(height: 10),
          TextField(
              controller: email,
              decoration: const InputDecoration(labelText: 'Email')),
          const SizedBox(height: 10),
          TextField(
              controller: phone,
              decoration: const InputDecoration(labelText: 'Contact number')),
          const SizedBox(height: 10),
          TextField(
              controller: reason,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Reason')),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                final payload = {
                  'full_name': name.text.trim(),
                  'email': email.text.trim(),
                  'contact_number': phone.text.trim(),
                  'reason': reason.text.trim(),
                };
                Navigator.pop(context);
                try {
                  if (isEdit) {
                    await cubit.updateFraud(existing.id, payload);
                  } else {
                    await cubit.createFraud(payload);
                  }
                  if (context.mounted) showSnack(context, 'Saved');
                } catch (e) {
                  if (context.mounted) {
                    showSnack(context, 'Failed: $e', error: true);
                  }
                }
              },
              child: Text(isEdit ? 'Save changes' : 'Add entry'),
            ),
          ),
        ],
      ),
    ),
  );
}

// ── Announcement editor ─────────────────────────────────────────────
Future<void> showAnnouncementEditor(BuildContext context,
    {required AdminCubit cubit, Announcement? existing}) {
  final title = TextEditingController(text: existing?.title);
  final description = TextEditingController(text: existing?.description);
  final ctaLabel = TextEditingController(text: existing?.ctaLabel);
  final ctaUrl = TextEditingController(text: existing?.ctaUrl);
  final sortOrder =
      TextEditingController(text: '${existing?.sortOrder ?? 0}');
  String imageUrl = existing?.imageUrl ?? '';
  bool isActive = existing?.isActive ?? true;
  bool uploading = false;
  final picker = ImagePicker();
  final isEdit = existing != null;

  return _sheet(
    context,
    StatefulBuilder(
      builder: (context, setState) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(isEdit ? 'Edit announcement' : 'New announcement',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: uploading
                ? null
                : () async {
                    final f = await picker.pickImage(
                        source: ImageSource.gallery,
                        imageQuality: 80,
                        maxWidth: 1600);
                    if (f == null) return;
                    setState(() => uploading = true);
                    try {
                      imageUrl = await sl<UploadRepository>().upload(f.path);
                    } catch (_) {}
                    setState(() => uploading = false);
                  },
            child: Container(
              height: 120,
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.surfaceSoft,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              clipBehavior: Clip.antiAlias,
              child: uploading
                  ? const Center(child: CircularProgressIndicator())
                  : imageUrl.isEmpty
                      ? Center(
                          child: Text('Tap to add image (optional)',
                              style: TextStyle(color: AppColors.textMuted)))
                      : RemoteImage(url: imageUrl),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
              controller: title,
              decoration: const InputDecoration(labelText: 'Title')),
          const SizedBox(height: 10),
          TextField(
              controller: description,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Description')),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(
                child: TextField(
                    controller: ctaLabel,
                    decoration:
                        const InputDecoration(labelText: 'CTA label'))),
            const SizedBox(width: 10),
            Expanded(
                child: TextField(
                    controller: sortOrder,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Sort'))),
          ]),
          const SizedBox(height: 10),
          TextField(
              controller: ctaUrl,
              decoration: const InputDecoration(labelText: 'CTA URL')),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Active'),
            value: isActive,
            activeThumbColor: AppColors.accent,
            onChanged: (v) => setState(() => isActive = v),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                final payload = {
                  'title': title.text.trim(),
                  'description': description.text.trim(),
                  'image_url': imageUrl,
                  'cta_label': ctaLabel.text.trim(),
                  'cta_url': ctaUrl.text.trim(),
                  'is_active': isActive,
                  'sort_order': int.tryParse(sortOrder.text.trim()) ?? 0,
                };
                Navigator.pop(context);
                try {
                  if (isEdit) {
                    await cubit.updateAnnouncement(existing.id, payload);
                  } else {
                    await cubit.createAnnouncement(payload);
                  }
                  if (context.mounted) showSnack(context, 'Saved');
                } catch (e) {
                  if (context.mounted) {
                    showSnack(context, 'Failed: $e', error: true);
                  }
                }
              },
              child: Text(isEdit ? 'Save changes' : 'Publish'),
            ),
          ),
        ],
      ),
    ),
  );
}

// ── Donation settings editor ────────────────────────────────────────
Future<void> showDonationEditor(BuildContext context,
    {required AdminCubit cubit, required DonationSettings settings}) {
  final message = TextEditingController(text: settings.message);
  bool isActive = settings.isActive;

  return _sheet(
    context,
    StatefulBuilder(
      builder: (context, setState) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Donation settings',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          TextField(
              controller: message,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Message')),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Show donation section'),
            value: isActive,
            activeThumbColor: AppColors.accent,
            onChanged: (v) => setState(() => isActive = v),
          ),
          const SizedBox(height: 8),
          Text(
            'QR codes and bank details are managed on the web admin.',
            style: TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                try {
                  await cubit.updateDonation({
                    'message': message.text.trim(),
                    'is_active': isActive,
                    'qr_codes':
                        settings.qrCodes.map((e) => {'label': e.label, 'url': e.url}).toList(),
                    'bank_details': settings.bankDetails
                        .map((e) => {'label': e.label, 'url': e.url})
                        .toList(),
                  });
                  if (context.mounted) showSnack(context, 'Saved');
                } catch (e) {
                  if (context.mounted) {
                    showSnack(context, 'Failed: $e', error: true);
                  }
                }
              },
              child: const Text('Save'),
            ),
          ),
        ],
      ),
    ),
  );
}

// ── Site content (home) editor ──────────────────────────────────────
Future<void> showSiteContentEditor(BuildContext context,
    {required AdminCubit cubit}) async {
  Map<String, dynamic> raw;
  try {
    raw = await cubit.siteContentRaw();
  } catch (e) {
    if (context.mounted) showSnack(context, 'Could not load content', error: true);
    return;
  }
  if (!context.mounted) return;
  final home = (raw['home'] is Map) ? Map<String, dynamic>.from(raw['home']) : {};
  final badge = TextEditingController(text: '${home['badge'] ?? ''}');
  final title = TextEditingController(text: '${home['title'] ?? ''}');
  final subtitle = TextEditingController(text: '${home['subtitle'] ?? ''}');

  return _sheet(
    context,
    Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Home page content',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        TextField(
            controller: badge,
            decoration: const InputDecoration(labelText: 'Badge')),
        const SizedBox(height: 10),
        TextField(
            controller: title,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'Title')),
        const SizedBox(height: 10),
        TextField(
            controller: subtitle,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Subtitle')),
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () async {
              // Preserve the rest of the content; only edit home.*
              final payload = Map<String, dynamic>.from(raw)
                ..['home'] = {
                  'badge': badge.text.trim(),
                  'title': title.text.trim(),
                  'subtitle': subtitle.text.trim(),
                };
              Navigator.pop(context);
              try {
                await cubit.updateSiteContent(payload);
                if (context.mounted) showSnack(context, 'Home content saved');
              } catch (e) {
                if (context.mounted) {
                  showSnack(context, 'Failed: $e', error: true);
                }
              }
            },
            child: const Text('Save'),
          ),
        ),
      ],
    ),
  );
}
