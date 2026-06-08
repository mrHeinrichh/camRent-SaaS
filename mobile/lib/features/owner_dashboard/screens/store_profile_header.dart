import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/store.dart';
import '../../../data/repositories/upload_repository.dart';
import '../bloc/owner_cubit.dart';
import 'store_profile_sheet.dart';

/// Facebook-style editable store header: cover photo with an edit button, an
/// overlapping circular profile photo (logo) with its own edit button, and the
/// store's name/rating/address/description with an "Edit details" action.
class StoreProfileHeader extends StatefulWidget {
  const StoreProfileHeader({super.key, required this.store, required this.cubit});

  final Store store;
  final OwnerCubit cubit;

  @override
  State<StoreProfileHeader> createState() => _StoreProfileHeaderState();
}

class _StoreProfileHeaderState extends State<StoreProfileHeader> {
  final _picker = ImagePicker();
  String? _uploading; // 'cover' | 'logo'

  Future<void> _changePhoto(String which) async {
    final file = await _picker.pickImage(
        source: ImageSource.gallery, imageQuality: 82, maxWidth: 1600);
    if (file == null) return;
    setState(() => _uploading = which);
    try {
      final url = await sl<UploadRepository>().upload(file.path);
      await widget.cubit.updateStoreProfile(
          {which == 'cover' ? 'banner_url' : 'logo_url': url});
      if (mounted) {
        showSnack(context,
            which == 'cover' ? 'Cover photo updated' : 'Profile photo updated');
      }
    } catch (e) {
      if (mounted) showSnack(context, 'Upload failed', error: true);
    } finally {
      if (mounted) setState(() => _uploading = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final store = widget.store;
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceSoft,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover + overlapping avatar.
          Stack(
            clipBehavior: Clip.none,
            children: [
              SizedBox(
                height: 150,
                width: double.infinity,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    RemoteImage(url: store.bannerUrl),
                    if (_uploading == 'cover')
                      Container(
                        color: Colors.black26,
                        child: const Center(child: CircularProgressIndicator()),
                      ),
                  ],
                ),
              ),
              Positioned(
                right: 10,
                bottom: 10,
                child: _EditCircle(
                  onTap: _uploading != null ? null : () => _changePhoto('cover'),
                  label: 'Edit cover',
                ),
              ),
              Positioned(
                left: 16,
                bottom: -38,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceSoft,
                        shape: BoxShape.circle,
                      ),
                      child: ClipOval(
                        child: SizedBox(
                          width: 84,
                          height: 84,
                          child: _uploading == 'logo'
                              ? const Center(
                                  child: CircularProgressIndicator())
                              : RemoteImage(url: store.logoUrl),
                        ),
                      ),
                    ),
                    Positioned(
                      right: -2,
                      bottom: -2,
                      child: _EditCircle(
                        small: true,
                        onTap: _uploading != null
                            ? null
                            : () => _changePhoto('logo'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 48),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        store.name,
                        style: const TextStyle(
                            fontSize: 20, fontWeight: FontWeight.w800),
                      ),
                    ),
                    StatusBadge(store.status, color: statusColor(store.status)),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.star, size: 16, color: AppColors.accent),
                    const SizedBox(width: 4),
                    Text(
                      '${store.rating.toStringAsFixed(1)} · ${store.totalReviews} reviews',
                      style: TextStyle(
                          color: AppColors.textMuted, fontSize: 13),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.location_on_outlined,
                        size: 16, color: AppColors.textMuted),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        store.address.isEmpty ? 'No address set' : store.address,
                        style: TextStyle(
                            color: AppColors.textMuted, fontSize: 13),
                      ),
                    ),
                  ],
                ),
                if (store.description.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(store.description,
                      style: TextStyle(
                          color: AppColors.textMuted, height: 1.4)),
                ],
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => showStoreProfileEditor(
                          context,
                          cubit: widget.cubit,
                          store: store,
                        ),
                        icon: const Icon(Icons.edit_outlined, size: 18),
                        label: const Text('Edit details'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _changePhoto('cover'),
                        icon: const Icon(Icons.photo_camera_back_outlined,
                            size: 18),
                        label: const Text('Cover'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EditCircle extends StatelessWidget {
  const _EditCircle({this.onTap, this.label, this.small = false});

  final VoidCallback? onTap;
  final String? label;
  final bool small;

  @override
  Widget build(BuildContext context) {
    final circle = Container(
      padding: EdgeInsets.all(small ? 6 : 8),
      decoration: BoxDecoration(
        color: AppColors.accent,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.surfaceSoft, width: 2),
        boxShadow: const [
          BoxShadow(color: Color(0x33000000), blurRadius: 6, offset: Offset(0, 2)),
        ],
      ),
      child: Icon(Icons.photo_camera,
          size: small ? 14 : 16, color: AppColors.accentText),
    );

    if (label == null) {
      return GestureDetector(onTap: onTap, child: circle);
    }
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.55),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.photo_camera, size: 15, color: Colors.white),
            const SizedBox(width: 6),
            Text(label!,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
