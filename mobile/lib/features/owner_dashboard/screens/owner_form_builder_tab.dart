import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../app/theme.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/rental_form.dart';
import '../bloc/owner_cubit.dart';

/// Editable working copy of one custom field.
class _FieldDraft {
  _FieldDraft({
    required this.id,
    String label = '',
    this.type = RentalFormFieldType.text,
    this.required = false,
    String placeholder = '',
    String options = '',
  })  : label = TextEditingController(text: label),
        placeholder = TextEditingController(text: placeholder),
        options = TextEditingController(text: options);

  final String id;
  final TextEditingController label;
  final TextEditingController placeholder;
  final TextEditingController options;
  RentalFormFieldType type;
  bool required;

  void dispose() {
    label.dispose();
    placeholder.dispose();
    options.dispose();
  }
}

/// Form Builder: standard fields are fixed; owners add custom fields renters
/// must fill out at checkout. Mirrors the web "Form Builder" tab.
class OwnerFormBuilderTab extends StatefulWidget {
  const OwnerFormBuilderTab({super.key, required this.state});
  final OwnerState state;

  @override
  State<OwnerFormBuilderTab> createState() => _OwnerFormBuilderTabState();
}

class _OwnerFormBuilderTabState extends State<OwnerFormBuilderTab> {
  late List<_FieldDraft> _drafts;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _drafts = (widget.state.rentalForm?.fields ?? const [])
        .map((f) => _FieldDraft(
              id: f.id,
              label: f.label,
              type: f.type,
              required: f.required,
              placeholder: f.placeholder ?? '',
              options: f.options.join(', '),
            ))
        .toList();
  }

  @override
  void dispose() {
    for (final d in _drafts) {
      d.dispose();
    }
    super.dispose();
  }

  void _addField() {
    setState(() {
      _drafts.add(_FieldDraft(
          id: 'field_${DateTime.now().millisecondsSinceEpoch}'));
    });
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final fields = _drafts
        .where((d) => d.label.text.trim().isNotEmpty)
        .map((d) => RentalFormField(
              id: d.id,
              label: d.label.text.trim(),
              type: d.type,
              required: d.required,
              placeholder: d.placeholder.text.trim().isEmpty
                  ? null
                  : d.placeholder.text.trim(),
              options: d.type == RentalFormFieldType.select
                  ? d.options.text
                      .split(',')
                      .map((e) => e.trim())
                      .where((e) => e.isNotEmpty)
                      .toList()
                  : const [],
            ))
        .toList();
    try {
      await context.read<OwnerCubit>().saveRentalForm(fields);
      if (mounted) showSnack(context, 'Rental form saved');
    } catch (e) {
      if (mounted) showSnack(context, 'Could not save: $e', error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addField,
        icon: const Icon(Icons.add),
        label: const Text('Add field'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surfaceSoft,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline,
                    size: 18, color: AppColors.textMuted),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Standard fields (name, contacts, IDs, address) are always required. Add extra fields your store needs.',
                    style: TextStyle(
                        color: AppColors.textMuted, fontSize: 12.5),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          if (_drafts.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text('No custom fields yet. Tap "Add field".',
                    style: TextStyle(color: AppColors.textMuted)),
              ),
            ),
          ..._drafts.asMap().entries.map((e) => _fieldCard(e.key, e.value)),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Save rental form'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _fieldCard(int index, _FieldDraft d) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 12,
                  backgroundColor: AppColors.accent,
                  child: Text('${index + 1}',
                      style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.accentText,
                          fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 8),
                const Text('Custom field',
                    style: TextStyle(fontWeight: FontWeight.w700)),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.delete_outline,
                      color: AppColors.danger),
                  onPressed: () => setState(() {
                    _drafts.removeAt(index).dispose();
                  }),
                ),
              ],
            ),
            TextField(
              controller: d.label,
              decoration: const InputDecoration(labelText: 'Field label'),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<RentalFormFieldType>(
                    initialValue: d.type,
                    decoration: const InputDecoration(labelText: 'Type'),
                    items: const [
                      DropdownMenuItem(
                          value: RentalFormFieldType.text, child: Text('Text')),
                      DropdownMenuItem(
                          value: RentalFormFieldType.textarea,
                          child: Text('Paragraph')),
                      DropdownMenuItem(
                          value: RentalFormFieldType.number,
                          child: Text('Number')),
                      DropdownMenuItem(
                          value: RentalFormFieldType.date, child: Text('Date')),
                      DropdownMenuItem(
                          value: RentalFormFieldType.select,
                          child: Text('Dropdown')),
                    ],
                    onChanged: (v) => setState(
                        () => d.type = v ?? RentalFormFieldType.text),
                  ),
                ),
                const SizedBox(width: 10),
                Column(
                  children: [
                    const Text('Required', style: TextStyle(fontSize: 11)),
                    Switch(
                      value: d.required,
                      activeThumbColor: AppColors.accent,
                      onChanged: (v) => setState(() => d.required = v),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: d.placeholder,
              decoration:
                  const InputDecoration(labelText: 'Placeholder (optional)'),
            ),
            if (d.type == RentalFormFieldType.select) ...[
              const SizedBox(height: 10),
              TextField(
                controller: d.options,
                decoration: const InputDecoration(
                    labelText: 'Options (comma-separated)'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
