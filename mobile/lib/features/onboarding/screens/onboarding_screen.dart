import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../../core/di/service_locator.dart';
import '../../../core/storage/app_preferences.dart';

/// One onboarding page: an icon, headline, summary, and a few feature bullets.
class _OnboardPage {
  const _OnboardPage({
    required this.icon,
    required this.title,
    required this.summary,
    required this.points,
    required this.accent,
  });

  final IconData icon;
  final String title;
  final String summary;
  final List<String> points;
  final Color accent;
}

const _pages = <_OnboardPage>[
  _OnboardPage(
    icon: Icons.photo_camera,
    title: 'Welcome to CamRent PH',
    summary:
        'A camera-gear rental marketplace built for the Philippine market. Browse trusted local stores, compare available gear, and book with a cleaner, fraud-aware flow.',
    points: [
      'Verified rental stores in one place',
      'Cameras, lenses, lighting and more',
      'Transparent daily pricing in ₱',
    ],
    accent: AppColors.accent,
  ),
  _OnboardPage(
    icon: Icons.shopping_bag_outlined,
    title: 'Rent in a few taps',
    summary:
        'Find the gear you need, pick your rental dates, and submit a rental application directly to the store — all from your phone.',
    points: [
      'Search and filter gear by category',
      'Live availability with booked-date blocking',
      'Cart with vouchers and clear totals',
      'Pickup or delivery, your choice',
    ],
    accent: AppColors.success,
  ),
  _OnboardPage(
    icon: Icons.verified_user_outlined,
    title: 'Safe & accountable',
    summary:
        'Rentals are protected by identity verification and fraud-aware screening so both renters and stores can transact with confidence.',
    points: [
      'Secure 2-ID + selfie verification',
      'Signed lease agreements & deposits',
      'Fraud-list screening across stores',
      'Store ratings and reviews',
    ],
    accent: AppColors.warning,
  ),
  _OnboardPage(
    icon: Icons.storefront_outlined,
    title: 'For renters & store owners',
    summary:
        'Renters track every rental from their account. Store owners get a full dashboard to run the business — applications, gear, vouchers, customers and analytics.',
    points: [
      'Renter: order history & cancellations',
      'Owner: approve/reject applications',
      'Owner: vouchers, customers & insights',
      'Admin: store approvals & oversight',
    ],
    accent: AppColors.accent,
  ),
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _pageController = PageController();
  int _index = 0;

  bool get _isLast => _index == _pages.length - 1;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await sl<AppPreferences>().markOnboardingSeen();
    if (mounted) context.go('/');
  }

  void _next() {
    if (_isLast) {
      _finish();
    } else {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: _finish,
                child: const Text('Skip'),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _pages.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (context, i) => _OnboardPageView(page: _pages[i]),
              ),
            ),
            _Dots(count: _pages.length, index: _index),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _next,
                  child: Text(_isLast ? 'Get started' : 'Next'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardPageView extends StatelessWidget {
  const _OnboardPageView({required this.page});
  final _OnboardPage page;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          // Animated icon badge.
          TweenAnimationBuilder<double>(
            key: ValueKey(page.title),
            tween: Tween(begin: 0.8, end: 1.0),
            duration: const Duration(milliseconds: 420),
            curve: Curves.easeOutBack,
            builder: (context, scale, child) =>
                Transform.scale(scale: scale, child: child),
            child: Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                color: page.accent.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: page.accent.withValues(alpha: 0.4)),
              ),
              child: Icon(page.icon, size: 44, color: page.accent),
            ),
          ),
          const SizedBox(height: 28),
          Text(
            page.title,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              height: 1.15,
              color: AppColors.text,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            page.summary,
            style: const TextStyle(
              fontSize: 15,
              height: 1.5,
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(height: 24),
          ...page.points.asMap().entries.map(
                (entry) => _FeatureRow(
                  text: entry.value,
                  accent: page.accent,
                  delayMs: 120 + entry.key * 90,
                ),
              ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _FeatureRow extends StatelessWidget {
  const _FeatureRow({
    required this.text,
    required this.accent,
    required this.delayMs,
  });

  final String text;
  final Color accent;
  final int delayMs;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 380 + delayMs),
      curve: Curves.easeOut,
      builder: (context, t, child) => Opacity(
        opacity: t.clamp(0.0, 1.0),
        child: Transform.translate(offset: Offset(0, (1 - t) * 12), child: child),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.check_circle, size: 20, color: accent),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                text,
                style: const TextStyle(fontSize: 14.5, color: AppColors.text),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Dots extends StatelessWidget {
  const _Dots({required this.count, required this.index});
  final int count;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (i) {
        final active = i == index;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOut,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          width: active ? 22 : 8,
          height: 8,
          decoration: BoxDecoration(
            color: active ? AppColors.accent : AppColors.border,
            borderRadius: BorderRadius.circular(999),
          ),
        );
      }),
    );
  }
}
