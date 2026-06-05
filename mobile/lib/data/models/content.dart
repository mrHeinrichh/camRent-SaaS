import '../../core/utils/json.dart';

class Announcement {
  const Announcement({
    required this.id,
    required this.title,
    this.description,
    this.imageUrl,
    this.ctaLabel,
    this.ctaUrl,
    this.isActive = true,
    this.sortOrder = 0,
  });

  final String id;
  final String title;
  final String? description;
  final String? imageUrl;
  final String? ctaLabel;
  final String? ctaUrl;
  final bool isActive;
  final int sortOrder;

  factory Announcement.fromJson(Map<String, dynamic> json) => Announcement(
        id: Json.str(json['id']),
        title: Json.str(json['title']),
        description: Json.strOrNull(json['description']),
        imageUrl: Json.strOrNull(json['image_url']),
        ctaLabel: Json.strOrNull(json['cta_label']),
        ctaUrl: Json.strOrNull(json['cta_url']),
        isActive: Json.boolVal(json['is_active'], true),
        sortOrder: Json.intVal(json['sort_order']),
      );
}

class DonationEntry {
  const DonationEntry({required this.label, required this.url});
  final String label;
  final String url;

  factory DonationEntry.fromJson(Map<String, dynamic> json) => DonationEntry(
        label: Json.str(json['label']),
        url: Json.str(json['url']),
      );
}

class DonationSettings {
  const DonationSettings({
    this.message = '',
    this.qrCodes = const [],
    this.bankDetails = const [],
    this.isActive = false,
  });

  final String message;
  final List<DonationEntry> qrCodes;
  final List<DonationEntry> bankDetails;
  final bool isActive;

  factory DonationSettings.fromJson(Map<String, dynamic> json) =>
      DonationSettings(
        message: Json.str(json['message']),
        qrCodes:
            Json.list(json['qr_codes']).map(DonationEntry.fromJson).toList(),
        bankDetails: Json.list(json['bank_details'])
            .map(DonationEntry.fromJson)
            .toList(),
        isActive: Json.boolVal(json['is_active']),
      );
}

class FooterLink {
  const FooterLink({required this.label, this.page, this.url, this.requiresLogin = false});
  final String label;
  final String? page;
  final String? url;
  final bool requiresLogin;

  factory FooterLink.fromJson(Map<String, dynamic> json) => FooterLink(
        label: Json.str(json['label']),
        page: Json.strOrNull(json['page']),
        url: Json.strOrNull(json['url']),
        requiresLogin: Json.boolVal(json['requires_login']),
      );
}

class SiteContent {
  const SiteContent({
    required this.homeBadge,
    required this.homeTitle,
    required this.homeSubtitle,
    this.policySections = const [],
    this.faqItems = const [],
    this.rentalGuideItems = const [],
    this.footerAboutText = '',
  });

  final String homeBadge;
  final String homeTitle;
  final String homeSubtitle;
  final List<({String title, String body})> policySections;
  final List<({String q, String a})> faqItems;
  final List<String> rentalGuideItems;
  final String footerAboutText;

  static const fallback = SiteContent(
    homeBadge: 'Camera gear, on demand',
    homeTitle: 'Rent pro camera gear from trusted local stores',
    homeSubtitle:
        'Browse cameras, lenses, lighting and more from verified rental stores near you.',
  );

  factory SiteContent.fromJson(Map<String, dynamic> json) {
    final home = Json.obj(json['home']);
    final policies = Json.obj(json['policies']);
    final footer = Json.obj(json['footer']);
    return SiteContent(
      homeBadge: Json.str(home['badge'], fallback.homeBadge),
      homeTitle: Json.str(home['title'], fallback.homeTitle),
      homeSubtitle: Json.str(home['subtitle'], fallback.homeSubtitle),
      policySections: Json.list(policies['sections'])
          .map((e) => (title: Json.str(e['title']), body: Json.str(e['body'])))
          .toList(),
      faqItems: Json.list(policies['faq_items'])
          .map((e) => (q: Json.str(e['q']), a: Json.str(e['a'])))
          .toList(),
      rentalGuideItems: Json.stringList(policies['rental_guide_items']),
      footerAboutText: Json.str(footer['about_text']),
    );
  }
}

class SupportTicket {
  const SupportTicket({
    required this.id,
    required this.type,
    required this.subject,
    required this.message,
    required this.status,
    required this.priority,
    this.adminReply,
    required this.createdAt,
    this.storeName,
    this.ownerEmail,
  });

  final String id;
  final String type; // feedback | support | bug | store_report
  final String subject;
  final String message;
  final String status; // open | in_progress | resolved | closed
  final String priority; // low | medium | high
  final String? adminReply;
  final String createdAt;
  final String? storeName;
  final String? ownerEmail;

  factory SupportTicket.fromJson(Map<String, dynamic> json) => SupportTicket(
        id: Json.str(json['id']),
        type: Json.str(json['type'], 'support'),
        subject: Json.str(json['subject']),
        message: Json.str(json['message']),
        status: Json.str(json['status'], 'open'),
        priority: Json.str(json['priority'], 'medium'),
        adminReply: Json.strOrNull(json['admin_reply']),
        createdAt: Json.str(json['created_at']),
        storeName: Json.strOrNull(json['store_name']),
        ownerEmail: Json.strOrNull(json['owner_email']),
      );
}

class FraudListEntry {
  const FraudListEntry({
    required this.id,
    this.scope,
    this.status,
    required this.fullName,
    required this.email,
    required this.contactNumber,
    required this.reason,
    this.storeName,
    this.reportedByEmail = '',
  });

  final String id;
  final String? scope; // internal | global
  final String? status; // approved | pending
  final String fullName;
  final String email;
  final String contactNumber;
  final String reason;
  final String? storeName;
  final String reportedByEmail;

  factory FraudListEntry.fromJson(Map<String, dynamic> json) => FraudListEntry(
        id: Json.str(json['id']),
        scope: Json.strOrNull(json['scope']),
        status: Json.strOrNull(json['status']),
        fullName: Json.str(json['full_name']),
        email: Json.str(json['email']),
        contactNumber: Json.str(json['contact_number']),
        reason: Json.str(json['reason']),
        storeName: Json.strOrNull(json['store_name']),
        reportedByEmail: Json.str(json['reported_by_email']),
      );
}
