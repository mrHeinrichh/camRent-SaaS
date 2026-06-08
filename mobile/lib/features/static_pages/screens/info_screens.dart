import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../app/theme.dart';
import '../../home/bloc/home_cubit.dart';

/// About / How it works page (uses shared site content).
class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final content = context.watch<HomeCubit>().state.content;
    return Scaffold(
      appBar: AppBar(title: const Text('About CamRent')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(content.homeTitle,
              style: const TextStyle(
                  fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(content.homeSubtitle,
              style: TextStyle(color: AppColors.textMuted)),
          const SizedBox(height: 20),
          if (content.footerAboutText.isNotEmpty)
            Text(content.footerAboutText,
                style: const TextStyle(height: 1.5)),
          const SizedBox(height: 20),
          const _HowItWorks(),
        ],
      ),
    );
  }
}

class _HowItWorks extends StatelessWidget {
  const _HowItWorks();

  @override
  Widget build(BuildContext context) {
    const steps = [
      ('Browse', 'Find pro camera gear from verified local stores.'),
      ('Book', 'Pick your dates, upload your IDs, and apply to rent.'),
      ('Pickup', 'Get approved, pick up or get gear delivered.'),
      ('Return', 'Return on time and rate your experience.'),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('How it works',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        ...steps.asMap().entries.map((e) => ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                backgroundColor: AppColors.accent,
                foregroundColor: AppColors.accentText,
                child: Text('${e.key + 1}'),
              ),
              title: Text(e.value.$1,
                  style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Text(e.value.$2),
            )),
      ],
    );
  }
}

/// Policies / FAQ page.
class PoliciesScreen extends StatelessWidget {
  const PoliciesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final content = context.watch<HomeCubit>().state.content;
    return Scaffold(
      appBar: AppBar(title: const Text('Policies & FAQ')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (content.rentalGuideItems.isNotEmpty) ...[
            const Text('Rental guide',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ...content.rentalGuideItems.map((g) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.check_circle_outline,
                          size: 18, color: AppColors.accent),
                      const SizedBox(width: 8),
                      Expanded(child: Text(g)),
                    ],
                  ),
                )),
            const SizedBox(height: 20),
          ],
          ...content.policySections.map((s) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.title,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 6),
                      Text(s.body,
                          style: TextStyle(color: AppColors.textMuted)),
                    ],
                  ),
                ),
              )),
          if (content.faqItems.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Text('Frequently asked questions',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ...content.faqItems.map((f) => Card(
                  child: ExpansionTile(
                    shape: const Border(),
                    title: Text(f.q,
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    childrenPadding:
                        const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    children: [
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(f.a,
                            style: TextStyle(color: AppColors.textMuted)),
                      ),
                    ],
                  ),
                )),
          ],
        ],
      ),
    );
  }
}

/// Donate / support page.
class DonateScreen extends StatelessWidget {
  const DonateScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Support CamRent')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Icon(Icons.favorite, size: 56, color: AppColors.accent),
          SizedBox(height: 16),
          Text('Help keep CamRent running',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          SizedBox(height: 8),
          Text(
            'CamRent connects renters with trusted local camera stores. If this platform helped you, consider supporting its development and hosting.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }
}
