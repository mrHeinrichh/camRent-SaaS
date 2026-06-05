import '../../core/utils/json.dart';
import 'item.dart';
import 'store.dart';

class OwnerApplication {
  const OwnerApplication({
    required this.id,
    required this.renterName,
    required this.renterEmail,
    required this.renterPhone,
    required this.renterAddress,
    required this.deliveryMode,
    required this.paymentMode,
    required this.totalAmount,
    required this.createdAt,
    required this.status,
    this.fraudFlag = false,
    this.customAnswers = const {},
    this.documents = const [],
    this.items = const [],
  });

  final String id;
  final String renterName;
  final String renterEmail;
  final String renterPhone;
  final String renterAddress;
  final String deliveryMode;
  final String paymentMode;
  final double totalAmount;
  final String createdAt;
  final String status;
  final bool fraudFlag;
  final Map<String, String> customAnswers;
  final List<({String type, String url})> documents;
  final List<({String name, String startDate, String endDate, int quantity})>
      items;

  factory OwnerApplication.fromJson(Map<String, dynamic> json) =>
      OwnerApplication(
        id: Json.str(json['id']),
        renterName: Json.str(json['renter_name']),
        renterEmail: Json.str(json['renter_email']),
        renterPhone: Json.str(json['renter_phone']),
        renterAddress: Json.str(json['renter_address']),
        deliveryMode: Json.str(json['delivery_mode']),
        paymentMode: Json.str(json['payment_mode']),
        totalAmount: Json.dbl(json['total_amount']),
        createdAt: Json.str(json['created_at']),
        status: Json.str(json['status']),
        fraudFlag: Json.boolVal(json['fraud_flag']),
        customAnswers: Json.stringMap(json['custom_answers']),
        documents: Json.list(json['documents'])
            .map((e) => (type: Json.str(e['type']), url: Json.str(e['url'])))
            .toList(),
        items: Json.list(json['items'])
            .map((e) => (
                  name: Json.str(e['name']),
                  startDate: Json.str(e['start_date']),
                  endDate: Json.str(e['end_date']),
                  quantity: Json.intVal(e['quantity'], 1),
                ))
            .toList(),
      );
}

class OwnerAnalytics {
  const OwnerAnalytics({
    this.totalCustomers = 0,
    this.totalCustomersRented = 0,
    this.totalProfit = 0,
    this.pendingCount = 0,
    this.reservedCount = 0,
    this.mostRentedCameras = const [],
    this.topRenters = const [],
    this.peakRentalDates = const [],
  });

  final int totalCustomers;
  final int totalCustomersRented;
  final double totalProfit;
  final int pendingCount;
  final int reservedCount;
  final List<({String name, int count})> mostRentedCameras;
  final List<({String name, String email, int rentals, double amount})>
      topRenters;
  final List<({String date, int count})> peakRentalDates;

  factory OwnerAnalytics.fromJson(Map<String, dynamic> json) => OwnerAnalytics(
        totalCustomers: Json.intVal(json['totalCustomers']),
        totalCustomersRented: Json.intVal(json['totalCustomersRented']),
        totalProfit: Json.dbl(json['totalProfit']),
        pendingCount: Json.intVal(json['pendingCount']),
        reservedCount: Json.intVal(json['reservedCount']),
        mostRentedCameras: Json.list(json['mostRentedCameras'])
            .map((e) => (name: Json.str(e['name']), count: Json.intVal(e['count'])))
            .toList(),
        topRenters: Json.list(json['topRentersOfMonth'])
            .map((e) => (
                  name: Json.str(e['renter_name']),
                  email: Json.str(e['renter_email']),
                  rentals: Json.intVal(e['rentals']),
                  amount: Json.dbl(e['amount']),
                ))
            .toList(),
        peakRentalDates: Json.list(json['peakRentalDates'])
            .map((e) => (date: Json.str(e['date']), count: Json.intVal(e['count'])))
            .toList(),
      );
}

typedef DocRef = ({String type, String url});

List<DocRef> _docs(dynamic v) => Json.list(v)
    .map((e) => (type: Json.str(e['type']), url: Json.str(e['url'])))
    .where((d) => d.url.isNotEmpty)
    .toList();

class OwnerTransaction {
  const OwnerTransaction({
    required this.id,
    required this.renterName,
    required this.renterEmail,
    this.renterPhone,
    this.renterAddress,
    this.renterEmergencyContact,
    this.renterEmergencyContactName,
    required this.totalAmount,
    required this.status,
    required this.createdAt,
    this.paymentMode,
    this.deliveryMode,
    this.deliveryAddress,
    this.storeBranchName,
    this.storeBranchAddress,
    this.items = const [],
    this.documents = const [],
    this.idTypes = const [],
  });

  final String id;
  final String renterName;
  final String renterEmail;
  final String? renterPhone;
  final String? renterAddress;
  final String? renterEmergencyContact;
  final String? renterEmergencyContactName;
  final double totalAmount;
  final String status;
  final String createdAt;
  final String? paymentMode;
  final String? deliveryMode;
  final String? deliveryAddress;
  final String? storeBranchName;
  final String? storeBranchAddress;
  final List<({String name, String startDate, String endDate, int quantity})>
      items;
  final List<DocRef> documents;
  final List<String> idTypes;

  factory OwnerTransaction.fromJson(Map<String, dynamic> json) =>
      OwnerTransaction(
        id: Json.str(json['id']),
        renterName: Json.str(json['renter_name']),
        renterEmail: Json.str(json['renter_email']),
        renterPhone: Json.strOrNull(json['renter_phone']),
        renterAddress: Json.strOrNull(json['renter_address']),
        renterEmergencyContact:
            Json.strOrNull(json['renter_emergency_contact']),
        renterEmergencyContactName:
            Json.strOrNull(json['renter_emergency_contact_name']),
        totalAmount: Json.dbl(json['total_amount']),
        status: Json.str(json['status']),
        createdAt: Json.str(json['created_at']),
        paymentMode: Json.strOrNull(json['payment_mode']),
        deliveryMode: Json.strOrNull(json['delivery_mode']),
        deliveryAddress: Json.strOrNull(json['delivery_address']),
        storeBranchName: Json.strOrNull(json['store_branch_name']),
        storeBranchAddress: Json.strOrNull(json['store_branch_address']),
        items: Json.list(json['items'])
            .map((e) => (
                  name: Json.str(e['name']),
                  startDate: Json.str(e['start_date']),
                  endDate: Json.str(e['end_date']),
                  quantity: Json.intVal(e['quantity'], 1),
                ))
            .toList(),
        documents: _docs(json['documents']),
        idTypes: Json.stringList(json['id_types']),
      );
}

class OwnerCustomer {
  const OwnerCustomer({
    required this.renterName,
    required this.renterEmail,
    this.renterPhone,
    this.renterAddress,
    this.transactionCount = 0,
    this.idTypes = const [],
    this.mostlyRentedGears = const [],
    this.requirements = const [],
  });

  final String renterName;
  final String renterEmail;
  final String? renterPhone;
  final String? renterAddress;
  final int transactionCount;
  final List<String> idTypes;
  final List<({String name, int count})> mostlyRentedGears;
  final List<DocRef> requirements;

  factory OwnerCustomer.fromJson(Map<String, dynamic> json) => OwnerCustomer(
        renterName: Json.str(json['renter_name']),
        renterEmail: Json.str(json['renter_email']),
        renterPhone: Json.strOrNull(json['renter_phone']),
        renterAddress: Json.strOrNull(json['renter_address']),
        transactionCount: Json.intVal(json['transaction_count']),
        idTypes: Json.stringList(json['id_types']),
        mostlyRentedGears: Json.list(json['mostly_rented_gears'])
            .map((e) => (name: Json.str(e['name']), count: Json.intVal(e['count'])))
            .toList(),
        requirements: _docs(json['requirements']),
      );
}

class OwnerDashboardData {
  const OwnerDashboardData({
    this.store,
    this.totalRentals = 0,
    this.totalRevenue = 0,
    this.items = const [],
    this.analytics,
    this.storeRatings = const [],
    this.recentTransactions = const [],
    this.customers = const [],
  });

  final Store? store;
  final int totalRentals;
  final double totalRevenue;
  final List<Item> items;
  final OwnerAnalytics? analytics;
  final List<({String renterName, int rating, String description, String createdAt})>
      storeRatings;
  final List<OwnerTransaction> recentTransactions;
  final List<OwnerCustomer> customers;

  factory OwnerDashboardData.fromJson(Map<String, dynamic> json) {
    final stats = Json.obj(json['stats']);
    return OwnerDashboardData(
      store: json['store'] is Map ? Store.fromJson(Json.obj(json['store'])) : null,
      totalRentals: Json.intVal(stats['total_rentals']),
      totalRevenue: Json.dbl(stats['total_revenue']),
      items: Json.list(json['items']).map(Item.fromJson).toList(),
      analytics: json['ownerAnalytics'] is Map
          ? OwnerAnalytics.fromJson(Json.obj(json['ownerAnalytics']))
          : null,
      storeRatings: Json.list(json['storeRatings'])
          .map((e) => (
                renterName: Json.str(e['renter_name']),
                rating: Json.intVal(e['rating']),
                description: Json.str(e['description']),
                createdAt: Json.str(e['created_at']),
              ))
          .toList(),
      recentTransactions: Json.list(json['recentTransactions'])
          .map(OwnerTransaction.fromJson)
          .toList(),
      customers: Json.list(json['customers']).map(OwnerCustomer.fromJson).toList(),
    );
  }
}

class SystemSummary {
  const SystemSummary({
    this.totalIncome = 0,
    this.totalAssetsValue = 0,
    this.totalCustomers = 0,
    this.totalStores = 0,
    this.pendingMerchants = 0,
    this.openSupportTickets = 0,
    this.totalRatings = 0,
  });

  final double totalIncome;
  final double totalAssetsValue;
  final int totalCustomers;
  final int totalStores;
  final int pendingMerchants;
  final int openSupportTickets;
  final int totalRatings;

  factory SystemSummary.fromJson(Map<String, dynamic> json) => SystemSummary(
        totalIncome: Json.dbl(json['totalIncome']),
        totalAssetsValue: Json.dbl(json['totalAssetsValue']),
        totalCustomers: Json.intVal(json['totalCustomers']),
        totalStores: Json.intVal(json['totalStores']),
        pendingMerchants: Json.intVal(json['pendingMerchants']),
        openSupportTickets: Json.intVal(json['openSupportTickets']),
        totalRatings: Json.intVal(json['totalRatings']),
      );
}

class StoreInsight {
  const StoreInsight({
    required this.storeId,
    required this.storeName,
    this.ownerEmail,
    this.income = 0,
    this.assetsValue = 0,
    this.assetsCount = 0,
    this.customersCount = 0,
    this.averageRating,
    this.dueDaysRemaining,
    this.overdue = false,
  });

  final String storeId;
  final String storeName;
  final String? ownerEmail;
  final double income;
  final double assetsValue;
  final int assetsCount;
  final int customersCount;
  final double? averageRating;
  final int? dueDaysRemaining;
  final bool overdue;

  factory StoreInsight.fromJson(Map<String, dynamic> json) => StoreInsight(
        storeId: Json.str(json['store_id']),
        storeName: Json.str(json['store_name']),
        ownerEmail: Json.strOrNull(json['owner_email']),
        income: Json.dbl(json['income']),
        assetsValue: Json.dbl(json['assets_value']),
        assetsCount: Json.intVal(json['assets_count']),
        customersCount: Json.intVal(json['customers_count']),
        averageRating: Json.dblOrNull(json['average_rating']),
        dueDaysRemaining: Json.intOrNull(json['due_days_remaining']),
        overdue: Json.boolVal(json['overdue']),
      );
}

class CustomerInsight {
  const CustomerInsight({
    required this.fullName,
    required this.email,
    this.isActive = true,
    this.transactionCount = 0,
    this.totalSpent = 0,
  });

  final String fullName;
  final String email;
  final bool isActive;
  final int transactionCount;
  final double totalSpent;

  factory CustomerInsight.fromJson(Map<String, dynamic> json) =>
      CustomerInsight(
        fullName: Json.str(json['full_name']),
        email: Json.str(json['email']),
        isActive: Json.boolVal(json['is_active'], true),
        transactionCount: Json.intVal(json['transaction_count']),
        totalSpent: Json.dbl(json['total_spent']),
      );
}

class AdminDashboardData {
  const AdminDashboardData({
    this.pendingStores = const [],
    this.allStores = const [],
    this.storeInsights = const [],
    this.customerInsights = const [],
    this.summary,
  });

  final List<Store> pendingStores;
  final List<Store> allStores;
  final List<StoreInsight> storeInsights;
  final List<CustomerInsight> customerInsights;
  final SystemSummary? summary;

  factory AdminDashboardData.fromJson(Map<String, dynamic> json) =>
      AdminDashboardData(
        pendingStores:
            Json.list(json['pendingStores']).map(Store.fromJson).toList(),
        allStores: Json.list(json['allStores']).map(Store.fromJson).toList(),
        storeInsights: Json.list(json['storeInsights'])
            .map(StoreInsight.fromJson)
            .toList(),
        customerInsights: Json.list(json['customerInsights'])
            .map(CustomerInsight.fromJson)
            .toList(),
        summary: json['systemSummary'] is Map
            ? SystemSummary.fromJson(Json.obj(json['systemSummary']))
            : null,
      );
}
