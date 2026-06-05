import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../app/theme.dart';
import 'app_widgets.dart';

/// Friendly label for a backend document type key.
String documentLabel(String type) {
  switch (type) {
    case 'id1_front':
      return 'ID 1 · Front';
    case 'id1_back':
      return 'ID 1 · Back';
    case 'id2_front':
      return 'ID 2 · Front';
    case 'id2_back':
      return 'ID 2 · Back';
    case 'selfie_id':
      return 'Selfie with ID';
    case 'billing_address':
      return 'Billing address';
    case 'lease':
    case 'lease_agreement':
    case 'lease_agreement_submission':
      return 'Lease agreement';
    default:
      return type
          .replaceAll('_', ' ')
          .split(' ')
          .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
          .join(' ');
  }
}

/// A labelled grid of document thumbnails (IDs, selfies, etc). Tapping a
/// thumbnail opens a full-screen, zoomable, swipeable viewer.
class DocumentGallery extends StatelessWidget {
  const DocumentGallery({
    super.key,
    required this.documents,
    this.title = 'Submitted documents',
  });

  final List<({String type, String url})> documents;
  final String title;

  @override
  Widget build(BuildContext context) {
    if (documents.isEmpty) {
      return Row(
        children: [
          Icon(Icons.image_not_supported_outlined,
              size: 16, color: AppColors.textMuted),
          const SizedBox(width: 6),
          Text('No documents submitted',
              style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
        ],
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: documents.asMap().entries.map((e) {
            return _Thumb(
              doc: e.value,
              onTap: () => _openViewer(context, e.key),
            );
          }).toList(),
        ),
      ],
    );
  }

  void _openViewer(BuildContext context, int index) {
    Navigator.of(context).push(PageRouteBuilder(
      opaque: false,
      barrierColor: Colors.black,
      pageBuilder: (_, __, ___) =>
          _DocViewer(documents: documents, initialIndex: index),
      transitionsBuilder: (_, anim, __, child) =>
          FadeTransition(opacity: anim, child: child),
    ));
  }
}

class _Thumb extends StatelessWidget {
  const _Thumb({required this.doc, required this.onTap});
  final ({String type, String url}) doc;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 100,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Hero(
              tag: 'doc-${doc.url}',
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Stack(
                  children: [
                    RemoteImage(
                      url: doc.url,
                      width: 100,
                      height: 100,
                    ),
                    Positioned(
                      right: 4,
                      bottom: 4,
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Icon(Icons.zoom_in,
                            size: 14, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(documentLabel(doc.type),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 10.5)),
          ],
        ),
      ),
    );
  }
}

class _DocViewer extends StatefulWidget {
  const _DocViewer({required this.documents, required this.initialIndex});
  final List<({String type, String url})> documents;
  final int initialIndex;

  @override
  State<_DocViewer> createState() => _DocViewerState();
}

class _DocViewerState extends State<_DocViewer> {
  late final PageController _controller =
      PageController(initialPage: widget.initialIndex);
  late int _index = widget.initialIndex;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final docs = widget.documents;
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          '${documentLabel(docs[_index].type)}  (${_index + 1}/${docs.length})',
          style: const TextStyle(fontSize: 15),
        ),
      ),
      body: PageView.builder(
        controller: _controller,
        itemCount: docs.length,
        onPageChanged: (i) => setState(() => _index = i),
        itemBuilder: (context, i) {
          return Center(
            child: Hero(
              tag: 'doc-${docs[i].url}',
              child: InteractiveViewer(
                minScale: 0.8,
                maxScale: 5,
                child: CachedNetworkImage(
                  imageUrl: docs[i].url,
                  fit: BoxFit.contain,
                  placeholder: (_, __) => const Center(
                      child: CircularProgressIndicator(color: Colors.white)),
                  errorWidget: (_, __, ___) => const Icon(
                      Icons.broken_image_outlined,
                      color: Colors.white54,
                      size: 64),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
