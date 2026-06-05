import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/widgets/animations.dart';
import '../../../core/widgets/app_widgets.dart';
import '../../../data/repositories/catalog_repository.dart';
import '../../home/widgets/gear_card.dart';
import '../bloc/store_cubit.dart';

class StoreScreen extends StatelessWidget {
  const StoreScreen({super.key, required this.storeId});
  final String storeId;

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => StoreCubit(sl<CatalogRepository>())..load(storeId),
      child: Scaffold(
        body: BlocBuilder<StoreCubit, StoreState>(
          builder: (context, state) {
            if (state.status == StoreStatus.loading) {
              return const LoadingView();
            }
            if (state.status == StoreStatus.error || state.store == null) {
              return ErrorView(
                message: state.error ?? 'Store not found',
                onRetry: () => context.read<StoreCubit>().load(storeId),
              );
            }
            final store = state.store!;
            return CustomScrollView(
              slivers: [
                SliverAppBar(
                  expandedHeight: 200,
                  pinned: true,
                  flexibleSpace: FlexibleSpaceBar(
                    title: Text(store.name),
                    background: RemoteImage(url: store.bannerUrl),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            RemoteImage(
                              url: store.logoUrl,
                              width: 56,
                              height: 56,
                              borderRadius: BorderRadius.circular(28),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(store.name,
                                      style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold)),
                                  Row(
                                    children: [
                                      const Icon(Icons.star,
                                          size: 15, color: AppColors.accent),
                                      const SizedBox(width: 4),
                                      Text(
                                          '${store.rating.toStringAsFixed(1)} · ${store.totalReviews} reviews',
                                          style: TextStyle(
                                              color: AppColors.textMuted,
                                              fontSize: 12)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (store.description.isNotEmpty)
                          Text(store.description,
                              style:
                                  TextStyle(color: AppColors.textMuted)),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(Icons.location_on_outlined,
                                size: 16, color: AppColors.textMuted),
                            const SizedBox(width: 4),
                            Expanded(
                                child: Text(store.address,
                                    style: TextStyle(
                                        color: AppColors.textMuted,
                                        fontSize: 13))),
                          ],
                        ),
                        const SizedBox(height: 16),
                        const Text('Available gear',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
                if (state.items.isEmpty)
                  const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child: EmptyState(
                        title: 'No gear listed yet',
                        icon: Icons.photo_camera_back_outlined,
                      ),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithMaxCrossAxisExtent(
                        maxCrossAxisExtent: 230,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        mainAxisExtent: 290,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final item = state.items[index];
                          return EntranceEffect(
                            index: index % 8,
                            child: GearCard(
                              item: item,
                              onOpenItem: () => context.push('/item/${item.id}'),
                              onOpenStore: () =>
                                  context.push('/store/${item.storeId}'),
                            ),
                          );
                        },
                        childCount: state.items.length,
                      ),
                    ),
                  ),
                SliverToBoxAdapter(
                  child: _ReviewsSection(state: state),
                ),
                const SliverToBoxAdapter(child: SizedBox(height: 32)),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _ReviewsSection extends StatelessWidget {
  const _ReviewsSection({required this.state});
  final StoreState state;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('Reviews',
                  style:
                      TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const Spacer(),
              if (state.eligibleToReview)
                TextButton.icon(
                  onPressed: () => _showReviewSheet(context),
                  icon: const Icon(Icons.rate_review_outlined, size: 18),
                  label: const Text('Write a review'),
                ),
            ],
          ),
          const SizedBox(height: 8),
          if (state.reviews.isEmpty)
            Text('No reviews yet.',
                style: TextStyle(color: AppColors.textMuted))
          else
            ...state.reviews.map(
              (r) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(r.renterName,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600)),
                          const Spacer(),
                          Row(
                            children: List.generate(
                              5,
                              (i) => Icon(
                                i < r.rating
                                    ? Icons.star
                                    : Icons.star_border,
                                size: 14,
                                color: AppColors.accent,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (r.description.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(r.description,
                            style:
                                TextStyle(color: AppColors.textMuted)),
                      ],
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showReviewSheet(BuildContext context) {
    final cubit = context.read<StoreCubit>();
    int rating = 5;
    final controller = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 16,
        ),
        child: StatefulBuilder(
          builder: (context, setState) => Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Rate this store',
                  style:
                      TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Row(
                children: List.generate(
                  5,
                  (i) => IconButton(
                    onPressed: () => setState(() => rating = i + 1),
                    icon: Icon(
                      i < rating ? Icons.star : Icons.star_border,
                      color: AppColors.accent,
                    ),
                  ),
                ),
              ),
              TextField(
                controller: controller,
                maxLines: 3,
                decoration:
                    const InputDecoration(hintText: 'Share your experience'),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    final ok =
                        await cubit.submitReview(rating, controller.text.trim());
                    if (sheetContext.mounted) Navigator.pop(sheetContext);
                    if (context.mounted) {
                      showSnack(context,
                          ok ? 'Review submitted' : 'Could not submit review',
                          error: !ok);
                    }
                  },
                  child: const Text('Submit review'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
