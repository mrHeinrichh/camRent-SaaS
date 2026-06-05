import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/item.dart';
import '../../../data/repositories/upload_repository.dart';
import '../bloc/owner_cubit.dart';

/// Opens the create/edit gear sheet. Pass [existing] to edit, omit to create.
Future<void> showGearEditor(
  BuildContext context, {
  required OwnerCubit cubit,
  required String storeId,
  Item? existing,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) =>
        _GearEditorSheet(cubit: cubit, storeId: storeId, existing: existing),
  );
}

class _GearEditorSheet extends StatefulWidget {
  const _GearEditorSheet({
    required this.cubit,
    required this.storeId,
    this.existing,
  });

  final OwnerCubit cubit;
  final String storeId;
  final Item? existing;

  @override
  State<_GearEditorSheet> createState() => _GearEditorSheetState();
}

class _GearEditorSheetState extends State<_GearEditorSheet> {
  final _formKey = GlobalKey<FormState>();
  final _picker = ImagePicker();

  late final _name = TextEditingController(text: widget.existing?.name);
  late final _description =
      TextEditingController(text: widget.existing?.description);
  late final _category = TextEditingController(text: widget.existing?.category);
  late final _brand = TextEditingController(text: widget.existing?.brand);
  late final _dailyPrice = TextEditingController(
      text: widget.existing == null ? '' : '${widget.existing!.dailyPrice}');
  late final _deposit = TextEditingController(
      text: widget.existing == null ? '' : '${widget.existing!.depositAmount}');
  late final _stock = TextEditingController(
      text: widget.existing == null ? '1' : '${widget.existing!.stock ?? 1}');

  late String _imageUrl = widget.existing?.imageUrl ?? '';
  late bool _available = widget.existing?.isAvailable ?? true;
  bool _uploading = false;
  bool _saving = false;

  bool get _isEdit => widget.existing != null;

  @override
  void dispose() {
    for (final c in [
      _name,
      _description,
      _category,
      _brand,
      _dailyPrice,
      _deposit,
      _stock,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickImage() async {
    final file = await _picker.pickImage(
        source: ImageSource.gallery, imageQuality: 75, maxWidth: 1600);
    if (file == null) return;
    setState(() => _uploading = true);
    try {
      final url = await sl<UploadRepository>().upload(file.path);
      setState(() => _imageUrl = url);
    } catch (_) {
      if (mounted) showSnack(context, 'Image upload failed', error: true);
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_imageUrl.isEmpty) {
      showSnack(context, 'Please upload a gear photo', error: true);
      return;
    }
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'name': _name.text.trim(),
      'description': _description.text.trim(),
      'category': _category.text.trim(),
      'brand': _brand.text.trim(),
      'daily_price': double.tryParse(_dailyPrice.text.trim()) ?? 0,
      'deposit_amount': double.tryParse(_deposit.text.trim()) ?? 0,
      'stock': int.tryParse(_stock.text.trim()) ?? 1,
      'is_available': _available,
      'image_url': _imageUrl,
    };
    try {
      if (_isEdit) {
        await widget.cubit.updateItem(widget.existing!.id, payload);
      } else {
        await widget.cubit.createItem({...payload, 'store_id': widget.storeId});
      }
      if (mounted) {
        Navigator.pop(context);
        showSnack(context, _isEdit ? 'Gear updated' : 'Gear added');
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
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(_isEdit ? 'Edit gear' : 'Add gear',
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 14),
              GestureDetector(
                onTap: _uploading ? null : _pickImage,
                child: Container(
                  height: 150,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceSoft,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: _uploading
                      ? const Center(child: CircularProgressIndicator())
                      : _imageUrl.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.add_a_photo_outlined,
                                      color: AppColors.textMuted),
                                  SizedBox(height: 6),
                                  Text('Tap to upload photo',
                                      style: TextStyle(
                                          color: AppColors.textMuted)),
                                ],
                              ),
                            )
                          : Stack(
                              fit: StackFit.expand,
                              children: [
                                RemoteImage(url: _imageUrl),
                                const Positioned(
                                  right: 8,
                                  bottom: 8,
                                  child: CircleAvatar(
                                    radius: 16,
                                    backgroundColor: AppColors.accent,
                                    child: Icon(Icons.edit,
                                        size: 16,
                                        color: AppColors.accentText),
                                  ),
                                ),
                              ],
                            ),
                ),
              ),
              const SizedBox(height: 14),
              _field(_name, 'Name', required: true),
              _field(_description, 'Description', maxLines: 2),
              Row(
                children: [
                  Expanded(child: _field(_category, 'Category')),
                  const SizedBox(width: 10),
                  Expanded(child: _field(_brand, 'Brand')),
                ],
              ),
              Row(
                children: [
                  Expanded(
                      child: _field(_dailyPrice, 'Daily price (₱)',
                          number: true, required: true)),
                  const SizedBox(width: 10),
                  Expanded(child: _field(_deposit, 'Deposit (₱)', number: true)),
                ],
              ),
              _field(_stock, 'Stock', number: true),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Available for rent'),
                value: _available,
                activeThumbColor: AppColors.accent,
                onChanged: (v) => setState(() => _available = v),
              ),
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
                      : Text(_isEdit ? 'Save changes' : 'Add gear'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    bool required = false,
    bool number = false,
    int maxLines = 1,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: number
            ? const TextInputType.numberWithOptions(decimal: true)
            : TextInputType.text,
        decoration: InputDecoration(labelText: label),
        validator: required
            ? (v) => (v == null || v.trim().isEmpty) ? '$label required' : null
            : null,
      ),
    );
  }
}
