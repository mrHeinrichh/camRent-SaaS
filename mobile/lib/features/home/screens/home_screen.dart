import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/constants/home_constants.dart';
import '../../../core/widgets/animations.dart';
import '../../../core/widgets/app_widgets.dart';
import '../bloc/home_cubit.dart';
import '../widgets/gear_card.dart';
import '../widgets/home_filter_bar.dart';
import '../widgets/store_card.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<HomeCubit, HomeState>(
      listenWhen: (p, c) => p.error != c.error && c.error != null,
      listener: (context, state) => showSnack(context, state.error!, error: true),
      builder: (context, state) {
        if (state.status == HomeStatus.loading ||
            state.status == HomeStatus.initial) {
          return const LoadingView();
        }
        if (state.status == HomeStatus.error) {
          return ErrorView(
            message: state.error ?? 'Failed to load',
            onRetry: () => context.read<HomeCubit>().load(),
          );
        }

        final isGears = state.viewMode == ViewMode.gears;
        final gears = state.filteredGears;
        final stores = state.filteredStores;
        final total = isGears ? gears.length : stores.length;

        return RefreshIndicator(
          onRefresh: () => context.read<HomeCubit>().load(),
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(child: _Hero(state: state)),
              SliverToBoxAdapter(child: _SearchField(state: state)),
              SliverToBoxAdapter(child: HomeFilterBar(state: state)),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 6, 16, 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isGears ? 'Available Gears' : 'Available Stores',
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w700),
                      ),
                      Text('$total result(s)',
                          style: const TextStyle(
                              color: AppColors.textMuted, fontSize: 12)),
                    ],
                  ),
                ),
              ),
              if (total == 0)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: EmptyState(
                      icon: Icons.search_off,
                      title: 'No Data Available',
                      message:
                          'This section is not available as of the moment. Try again later or change your filters.',
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
                  sliver: SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: 230,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.62,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        if (isGears) {
                          final item = gears[index];
                          return EntranceEffect(
                            index: index % 8,
                            child: GearCard(
                              item: item,
                              onOpenItem: () => context.push('/item/${item.id}'),
                              onOpenStore: () =>
                                  context.push('/store/${item.storeId}'),
                            ),
                          );
                        }
                        final store = stores[index];
                        return EntranceEffect(
                          index: index % 8,
                          child: StoreCard(
                            store: store,
                            onOpen: () => context.push('/store/${store.id}'),
                          ),
                        );
                      },
                      childCount: total,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.state});
  final HomeState state;

  @override
  Widget build(BuildContext context) {
    final content = state.content;
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 4),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surfaceSoft,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(color: AppColors.shadow, blurRadius: 24, offset: Offset(0, 14)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: Border.all(color: AppColors.textMuted, width: 2)
                .toBoxDecoration(),
            child: Text(
              content.homeBadge,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: AppColors.textMuted,
                letterSpacing: -0.5,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            content.homeTitle,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              height: 1.2,
              color: AppColors.text,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content.homeSubtitle,
            style: const TextStyle(
                color: AppColors.textMuted, fontSize: 14, height: 1.45),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text('${state.storeCount} Stores',
                  style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 13,
                      fontWeight: FontWeight.w600)),
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 10),
                width: 4,
                height: 4,
                decoration: const BoxDecoration(
                    color: AppColors.border, shape: BoxShape.circle),
              ),
              Text('${state.gearCount} Gears',
                  style: const TextStyle(
                      color: AppColors.textMuted,
                      fontSize: 13,
                      fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 18),
          const _HeroPhotos(),
        ],
      ),
    );
  }
}

/// Stacked, slightly overlapping hero photos echoing the web's 3D photo cluster.
class _HeroPhotos extends StatelessWidget {
  const _HeroPhotos();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200,
      child: Stack(
        children: [
          Positioned(
            right: 0,
            top: 0,
            width: MediaQuery.of(context).size.width * 0.62,
            height: 150,
            child: _photo(kHeroImages[0], const Offset(0, 0)),
          ),
          Positioned(
            left: 0,
            top: 44,
            width: MediaQuery.of(context).size.width * 0.55,
            height: 130,
            child: _photo(kHeroImages[1], const Offset(0, 0)),
          ),
          Positioned(
            right: 8,
            bottom: 0,
            width: MediaQuery.of(context).size.width * 0.30,
            height: 84,
            child: _photo(kHeroImages[2], const Offset(0, 0)),
          ),
        ],
      ),
    );
  }

  Widget _photo(String url, Offset _) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: const [
          BoxShadow(
              color: Color(0x330F172A), blurRadius: 26, offset: Offset(0, 16)),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: RemoteImage(url: url, fit: BoxFit.cover),
    );
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({required this.state});
  final HomeState state;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      child: TextField(
        decoration: const InputDecoration(
          hintText: 'Search cameras, lenses, stores…',
          prefixIcon: Icon(Icons.search),
        ),
        onChanged: (v) => context.read<HomeCubit>().setQuery(v),
      ),
    );
  }
}

extension _BorderToDecoration on Border {
  BoxDecoration toBoxDecoration() => BoxDecoration(border: this);
}
