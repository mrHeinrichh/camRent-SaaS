/// Defensive JSON coercion helpers — the backend sometimes returns numbers as
/// strings, nulls where objects are expected, etc.
class Json {
  Json._();

  static String str(dynamic v, [String fallback = '']) =>
      v?.toString() ?? fallback;

  static String? strOrNull(dynamic v) => v?.toString();

  static double dbl(dynamic v, [double fallback = 0]) {
    if (v == null) return fallback;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? fallback;
  }

  static double? dblOrNull(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }

  static int intVal(dynamic v, [int fallback = 0]) {
    if (v == null) return fallback;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString()) ?? fallback;
  }

  static int? intOrNull(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString());
  }

  static bool boolVal(dynamic v, [bool fallback = false]) {
    if (v == null) return fallback;
    if (v is bool) return v;
    if (v is num) return v != 0;
    final s = v.toString().toLowerCase();
    return s == 'true' || s == '1' || s == 'yes';
  }

  static Map<String, dynamic> obj(dynamic v) =>
      v is Map ? Map<String, dynamic>.from(v) : <String, dynamic>{};

  static List<Map<String, dynamic>> list(dynamic v) => v is List
      ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList()
      : <Map<String, dynamic>>[];

  static List<String> stringList(dynamic v) =>
      v is List ? v.map((e) => e.toString()).toList() : <String>[];

  static Map<String, String> stringMap(dynamic v) {
    if (v is! Map) return <String, String>{};
    return v.map((key, value) => MapEntry(key.toString(), value.toString()));
  }
}
