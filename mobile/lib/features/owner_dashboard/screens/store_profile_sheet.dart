import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/store.dart';
import '../../../data/repositories/upload_repository.dart';
import '../bloc/owner_cubit.dart';

Future<void> showStoreProfileEditor(
  BuildContext context, {
  required OwnerCubit cubit,
  required Store store,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => _StoreProfileSheet(cubit: cubit, store: store),
  );
}

class _StoreProfileSheet extends StatefulWidget {
  const _StoreProfileSheet({required this.cubit, required this.store});
  final OwnerCubit cubit;
  final Store store;

  @override
  State<_StoreProfileSheet> createState() => _StoreProfileSheetState();
}

class _StoreProfileSheetState extends State<_StoreProfileSheet> {
  final _formKey = GlobalKey<FormState>();
  final _picker = ImagePicker();

  late final _name = TextEditingController(text: widget.store.name);
  late final _description =
      TextEditingController(text: widget.store.description);
  late final _address = TextEditingController(text: widget.store.address);

  late String _logoUrl = widget.store.logoUrl;
  late String _bannerUrl = widget.store.bannerUrl;
  String? _uploadingField;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    _address.dispose();
    super.dispose();
  }

  Future<void> _pick(String field) async {
    final file = await _picker.pickImage(
        source: ImageSource.gallery, imageQuality: 80, maxWidth: 1600);
    if (file == null) return;
    setState(() => _uploadingField = field);
    try {
      final url = await sl<UploadRepository>().upload(file.path);
      setState(() {
        if (field == 'logo') {
          _logoUrl = url;
        } else {
          _bannerUrl = url;
        }
      });
    } catch (_) {
      if (mounted) showSnack(context, 'Upload failed', error: true);
    } finally {
      if (mounted) setState(() => _uploadingField = null);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await widget.cubit.updateStoreProfile({
        'name': _name.text.trim(),
        'description': _description.text.trim(),
        'address': _address.text.trim(),
        'logo_url': _logoUrl,
        'banner_url': _bannerUrl,
      });
      if (mounted) {
        Navigator.pop(context);
        showSnack(context, 'Store profile updated');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        showSnack(context, 'Could not save: $e', error: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Edit store profile',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 14),
              _imageRow('Banner', _bannerUrl, 'banner', 90),
              const SizedBox(height: 10),
              _imageRow('Logo', _logoUrl, 'logo', 64, circle: true),
              const SizedBox(height: 14),
              _field(_name, 'Store name', required: true),
              _field(_description, 'Description', maxLines: 3),
              _field(_address, 'Address', required: true, maxLines: 2),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Save changes'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _imageRow(String label, String url, String field, double size,
      {bool circle = false}) {
    final uploading = _uploadingField == field;
    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(circle ? size / 2 : 12),
          child: SizedBox(
            width: circle ? size : size * 1.6,
            height: size,
            child: uploading
                ? const Center(child: CircularProgressIndicator())
                : RemoteImage(url: url),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              TextButton.icon(
                onPressed: uploading ? null : () => _pick(field),
                icon: const Icon(Icons.upload_outlined, size: 18),
                label: Text('Change $label'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _field(TextEditingController c, String label,
      {bool required = false, int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextFormField(
        controller: c,
        maxLines: maxLines,
        decoration: InputDecoration(labelText: label),
        validator: required
            ? (v) => (v == null || v.trim().isEmpty) ? '$label required' : null
            : null,
      ),
    );
  }
}
