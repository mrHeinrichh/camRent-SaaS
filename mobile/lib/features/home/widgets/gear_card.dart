import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../../core/utils/currency.dart';
import '../../../core/widgets/animations.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/models/item.dart';

/// Gear card matching the web `GearCard` — image with rating badge, name,
/// description, category/brand/stock line, store row, price and a View Details
/// button.
class GearCard extends StatelessWidget {
  const GearCard({
    super.key,
    required this.item,
    required this.onOpenItem,
    required this.onOpenStore,
  });

  final Item item;
  final VoidCallback onOpenItem;
  final VoidCallback onOpenStore;

  @override
  Widget build(BuildContext context) {
    return PressableScale(
      onTap: onOpenItem,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceSoft,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.border),
          boxShadow: const [
            BoxShadow(color: AppColors.shadow, blurRadius: 22, offset: Offset(0, 12)),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                SizedBox(
                  height: 120,
                  width: double.infinity,
                  child: RemoteImage(url: item.imageUrl),
                ),
                Positioned(
                  right: 8,
                  top: 8,
                  child: _RatingPill(rating: item.store?.rating ?? 0),
                ),
              ],
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 14),
                    ),
                    const SizedBox(height: 2),
                    Flexible(
                      child: Text(
                        item.description.isEmpty
                            ? 'No description provided.'
                            : item.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 11.5,
                            height: 1.3),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${item.category.isEmpty ? 'Uncategorized' : item.category} • ${item.brand ?? 'Others'} • Stock: ${item.stock ?? 0}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          color: AppColors.textMuted, fontSize: 10.5),
                    ),
                    const SizedBox(height: 8),
                    if (item.store != null)
                      GestureDetector(
                        onTap: onOpenStore,
                        child: Row(
                          children: [
                            RemoteImage(
                              url: item.store!.logoUrl,
                              width: 24,
                              height: 24,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                item.store!.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                    const Spacer(),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              formatPHP(item.dailyPrice),
                              style: const TextStyle(
                                  fontWeight: FontWeight.w800, fontSize: 15),
                            ),
                            Text('per day',
                                style: TextStyle(
                                    color: AppColors.textMuted, fontSize: 10)),
                          ],
                        ),
                        const Spacer(),
                        _ViewButton(onTap: onOpenItem),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RatingPill extends StatelessWidget {
  const _RatingPill({required this.rating});
  final double rating;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star, size: 13, color: Color(0xFFEAB308)),
          const SizedBox(width: 3),
          Text(rating.toStringAsFixed(1),
              style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A))),
        ],
      ),
    );
  }
}

class _ViewButton extends StatelessWidget {
  const _ViewButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: AppColors.accent,
          borderRadius: BorderRadius.circular(999),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.visibility_outlined, size: 14, color: AppColors.accentText),
            SizedBox(width: 4),
            Text('View',
                style: TextStyle(
                    color: AppColors.accentText,
                    fontSize: 12,
                    fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
