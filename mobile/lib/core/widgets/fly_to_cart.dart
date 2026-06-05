import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../app/theme.dart';
import '../../features/cart/cubit/cart_cubit.dart';
import 'app_widgets.dart';

/// App-bar cart action showing a live item-count badge that "pops" whenever the
/// cart count increases.
class CartBadgeIcon extends StatefulWidget {
  const CartBadgeIcon({super.key, required this.onTap, this.iconKey});

  final VoidCallback onTap;
  final GlobalKey? iconKey;

  @override
  State<CartBadgeIcon> createState() => _CartBadgeIconState();
}

class _CartBadgeIconState extends State<CartBadgeIcon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 420),
  );
  late final Animation<double> _scale = TweenSequence<double>([
    TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.45), weight: 40),
    TweenSequenceItem(tween: Tween(begin: 1.45, end: 1.0), weight: 60),
  ]).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

  int _last = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<CartCubit, CartState>(
      listenWhen: (p, c) => c.count > _last,
      listener: (_, c) {
        _last = c.count;
        _controller.forward(from: 0);
      },
      child: BlocBuilder<CartCubit, CartState>(
        builder: (context, state) {
          _last = state.count;
          return IconButton(
            key: widget.iconKey,
            tooltip: 'Cart',
            onPressed: widget.onTap,
            icon: ScaleTransition(
              scale: _scale,
              child: Badge(
                isLabelVisible: state.count > 0,
                label: Text('${state.count}'),
                backgroundColor: AppColors.accent,
                textColor: AppColors.accentText,
                child: const Icon(Icons.shopping_cart_outlined),
              ),
            ),
          );
        },
      ),
    );
  }
}

Offset? _centerOf(GlobalKey key) {
  final box = key.currentContext?.findRenderObject() as RenderBox?;
  if (box == null || !box.hasSize) return null;
  return box.localToGlobal(box.size.center(Offset.zero));
}

/// Animates a small thumbnail flying along an arc from [sourceKey] to
/// [targetKey] (the cart icon), then removes itself.
void flyToCart({
  required BuildContext context,
  required GlobalKey sourceKey,
  required GlobalKey targetKey,
  String? imageUrl,
}) {
  final overlay = Overlay.of(context);
  final start = _centerOf(sourceKey);
  final end = _centerOf(targetKey);
  if (start == null || end == null) return;

  late OverlayEntry entry;
  entry = OverlayEntry(
    builder: (_) => _FlyingItem(
      start: start,
      end: end,
      imageUrl: imageUrl,
      onDone: () => entry.remove(),
    ),
  );
  overlay.insert(entry);
}

class _FlyingItem extends StatefulWidget {
  const _FlyingItem({
    required this.start,
    required this.end,
    required this.onDone,
    this.imageUrl,
  });

  final Offset start;
  final Offset end;
  final VoidCallback onDone;
  final String? imageUrl;

  @override
  State<_FlyingItem> createState() => _FlyingItemState();
}

class _FlyingItemState extends State<_FlyingItem>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 620),
  );
  late final Animation<double> _t =
      CurvedAnimation(parent: _controller, curve: Curves.easeInCubic);

  @override
  void initState() {
    super.initState();
    _controller.forward();
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) widget.onDone();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _t,
      builder: (context, _) {
        final t = _t.value;
        // Quadratic arc: lift the midpoint upward for a natural toss.
        final lift = -90.0 * (1 - (2 * t - 1) * (2 * t - 1));
        final pos = Offset.lerp(widget.start, widget.end, t)!
            .translate(0, lift);
        final size = 56.0 * (1 - 0.6 * t);
        return Positioned(
          left: pos.dx - size / 2,
          top: pos.dy - size / 2,
          child: Opacity(
            opacity: (1 - t * 0.4).clamp(0.0, 1.0),
            child: Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.accent,
                boxShadow: const [
                  BoxShadow(
                      color: Color(0x44000000),
                      blurRadius: 12,
                      offset: Offset(0, 6)),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: widget.imageUrl == null
                  ? const Icon(Icons.photo_camera, color: AppColors.accentText)
                  : RemoteImage(url: widget.imageUrl, fit: BoxFit.cover),
            ),
          ),
        );
      },
    );
  }
}
