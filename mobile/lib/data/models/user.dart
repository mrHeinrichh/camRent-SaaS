import '../../core/utils/json.dart';
import 'enums.dart';

class User {
  const User({
    required this.id,
    required this.email,
    required this.role,
    required this.fullName,
    required this.avatarUrl,
    this.phone,
    this.isActive = true,
  });

  final String id;
  final String email;
  final UserRole role;
  final String fullName;
  final String avatarUrl;
  final String? phone;
  final bool isActive;

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: Json.str(json['id']),
        email: Json.str(json['email']),
        role: userRoleFromString(Json.strOrNull(json['role'])),
        fullName: Json.str(json['full_name']),
        avatarUrl: Json.str(json['avatar_url']),
        phone: Json.strOrNull(json['phone']),
        isActive: Json.boolVal(json['is_active'], true),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'role': userRoleToString(role),
        'full_name': fullName,
        'avatar_url': avatarUrl,
        'phone': phone,
        'is_active': isActive,
      };
}
