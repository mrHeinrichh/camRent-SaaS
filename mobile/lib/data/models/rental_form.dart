import '../../core/utils/json.dart';

enum RentalFormFieldType { text, textarea, number, date, select }

RentalFormFieldType _fieldType(String? value) {
  switch (value) {
    case 'textarea':
      return RentalFormFieldType.textarea;
    case 'number':
      return RentalFormFieldType.number;
    case 'date':
      return RentalFormFieldType.date;
    case 'select':
      return RentalFormFieldType.select;
    default:
      return RentalFormFieldType.text;
  }
}

class RentalFormField {
  const RentalFormField({
    required this.id,
    required this.label,
    required this.type,
    required this.required,
    this.placeholder,
    this.options = const [],
  });

  final String id;
  final String label;
  final RentalFormFieldType type;
  final bool required;
  final String? placeholder;
  final List<String> options;

  factory RentalFormField.fromJson(Map<String, dynamic> json) =>
      RentalFormField(
        id: Json.str(json['id']),
        label: Json.str(json['label']),
        type: _fieldType(Json.strOrNull(json['type'])),
        required: Json.boolVal(json['required']),
        placeholder: Json.strOrNull(json['placeholder']),
        options: Json.stringList(json['options']),
      );
}

class RentalFormSettings {
  const RentalFormSettings({
    this.showBranchMap = true,
    this.referenceText,
    this.referenceImageUrl,
    this.referenceImagePosition,
  });

  final bool showBranchMap;
  final String? referenceText;
  final String? referenceImageUrl;
  final String? referenceImagePosition; // top | mid

  factory RentalFormSettings.fromJson(Map<String, dynamic> json) =>
      RentalFormSettings(
        showBranchMap: Json.boolVal(json['show_branch_map'], true),
        referenceText: Json.strOrNull(json['reference_text']),
        referenceImageUrl: Json.strOrNull(json['reference_image_url']),
        referenceImagePosition:
            Json.strOrNull(json['reference_image_position']),
      );
}

class RentalFormSchema {
  const RentalFormSchema({
    required this.standardVersion,
    this.fields = const [],
    this.settings,
  });

  final String standardVersion;
  final List<RentalFormField> fields;
  final RentalFormSettings? settings;

  factory RentalFormSchema.fromJson(Map<String, dynamic> json) =>
      RentalFormSchema(
        standardVersion: Json.str(json['standard_version']),
        fields:
            Json.list(json['fields']).map(RentalFormField.fromJson).toList(),
        settings: json['settings'] is Map
            ? RentalFormSettings.fromJson(Json.obj(json['settings']))
            : null,
      );
}
