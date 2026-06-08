import 'dart:async';

import 'package:flutter/material.dart';

/// Primary submit button that disables itself and shows a live countdown while
/// an auth cooldown ([cooldownUntil], from the server's rate limit) is active.
class CooldownButton extends StatefulWidget {
  const CooldownButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.busy = false,
    this.cooldownUntil,
  });

  final String label;
  final VoidCallback onPressed;
  final bool busy;
  final DateTime? cooldownUntil;

  @override
  State<CooldownButton> createState() => _CooldownButtonState();
}

class _CooldownButtonState extends State<CooldownButton> {
  Timer? _timer;

  int get _remaining {
    final until = widget.cooldownUntil;
    if (until == null) return 0;
    final secs = until.difference(DateTime.now()).inSeconds;
    return secs > 0 ? secs : 0;
  }

  @override
  void didUpdateWidget(covariant CooldownButton old) {
    super.didUpdateWidget(old);
    _syncTimer();
  }

  @override
  void initState() {
    super.initState();
    _syncTimer();
  }

  void _syncTimer() {
    if (_remaining > 0 && _timer == null) {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (!mounted) return;
        if (_remaining <= 0) {
          _timer?.cancel();
          _timer = null;
        }
        setState(() {});
      });
    } else if (_remaining <= 0) {
      _timer?.cancel();
      _timer = null;
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final remaining = _remaining;
    final blocked = widget.busy || remaining > 0;
    return ElevatedButton(
      onPressed: blocked ? null : widget.onPressed,
      child: widget.busy
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Text(remaining > 0 ? 'Try again in ${remaining}s' : widget.label),
    );
  }
}
