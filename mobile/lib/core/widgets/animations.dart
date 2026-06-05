import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Shared motion language, ported from the web app's framer-motion page
/// transitions (`App.tsx`) and the `interaction-3d.css` hover/press effects.

/// Wraps a route page with the signature CamRent entrance: fade in, slide up,
/// subtle scale and a slight 3D tilt (rotateX) on a 1200px perspective —
/// matching the web `<motion.div>` transition.
CustomTransitionPage<T> buildPageTransition<T>({
  required Widget child,
  required GoRouterState state,
}) {
  return CustomTransitionPage<T>(
    key: state.pageKey,
    transitionDuration: const Duration(milliseconds: 420),
    reverseTransitionDuration: const Duration(milliseconds: 280),
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      // Spring-like curve approximating { stiffness: 220, damping: 26 }.
      final curved = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      );
      return AnimatedBuilder(
        animation: curved,
        builder: (context, _) {
          final t = curved.value;
          final dy = (1 - t) * 18.0; // y: 18 -> 0
          final scale = 0.985 + 0.015 * t; // scale: 0.985 -> 1
          final rotateX = (1 - t) * -0.07; // ~ -4deg -> 0
          return Opacity(
            opacity: t.clamp(0.0, 1.0),
            child: Transform(
              alignment: Alignment.center,
              transform: Matrix4.identity()
                ..setEntry(3, 2, 0.001) // perspective ~1200
                ..translateByDouble(0.0, dy, 0.0, 1.0)
                ..rotateX(rotateX)
                ..scaleByDouble(scale, scale, 1.0, 1.0),
              child: child,
            ),
          );
        },
        child: child,
      );
    },
  );
}

/// Tappable wrapper that scales down on press (and lifts on release), mirroring
/// the `.i3d-btn` / `.i3d-card` interactions. Use around cards and list tiles.
class PressableScale extends StatefulWidget {
  const PressableScale({
    super.key,
    required this.child,
    this.onTap,
    this.pressedScale = 0.97,
    this.borderRadius,
  });

  final Widget child;
  final VoidCallback? onTap;
  final double pressedScale;
  final BorderRadius? borderRadius;

  @override
  State<PressableScale> createState() => _PressableScaleState();
}

class _PressableScaleState extends State<PressableScale> {
  bool _pressed = false;

  void _set(bool value) {
    if (_pressed != value) setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: (_) => _set(true),
      onTapUp: (_) => _set(false),
      onTapCancel: () => _set(false),
      child: AnimatedScale(
        scale: _pressed ? widget.pressedScale : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}

/// One-shot fade + slide-up entrance for content and list/grid items. Pass an
/// [index] to stagger a list of children.
class EntranceEffect extends StatefulWidget {
  const EntranceEffect({
    super.key,
    required this.child,
    this.index = 0,
    this.offset = 16,
    this.staggerStep = const Duration(milliseconds: 45),
    this.duration = const Duration(milliseconds: 380),
  });

  final Widget child;
  final int index;
  final double offset;
  final Duration staggerStep;
  final Duration duration;

  @override
  State<EntranceEffect> createState() => _EntranceEffectState();
}

class _EntranceEffectState extends State<EntranceEffect>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller =
      AnimationController(vsync: this, duration: widget.duration);
  late final Animation<double> _anim =
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic);

  @override
  void initState() {
    super.initState();
    final delay = widget.staggerStep * widget.index;
    Future.delayed(delay, () {
      if (mounted) _controller.forward();
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
      animation: _anim,
      builder: (context, child) => Opacity(
        opacity: _anim.value,
        child: Transform.translate(
          offset: Offset(0, (1 - _anim.value) * widget.offset),
          child: child,
        ),
      ),
      child: widget.child,
    );
  }
}
