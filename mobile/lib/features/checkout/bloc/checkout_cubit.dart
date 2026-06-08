import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/utils/json.dart';
import '../../../data/models/cart_item.dart';
import '../../../data/models/order.dart';
import '../../../data/models/rental_form.dart';
import '../../../data/models/store.dart';
import '../../../data/repositories/catalog_repository.dart';
import '../../../data/repositories/order_repository.dart';
import '../../../data/repositories/upload_repository.dart';

enum CheckoutStatus { loading, ready, submitting, success, error }

/// The five required identity documents enforced by the backend.
const requiredDocKeys = <String, String>{
  'id1_front': 'ID 1 — Front',
  'id1_back': 'ID 1 — Back',
  'id2_front': 'ID 2 — Front',
  'id2_back': 'ID 2 — Back',
  'selfie_id': 'Selfie with ID',
};

class CheckoutState extends Equatable {
  const CheckoutState({
    this.status = CheckoutStatus.loading,
    this.store,
    this.rentalForm,
    this.documentUrls = const {},
    this.leaseAgreementUrl,
    this.uploadingKey,
    this.appliedVoucher,
    this.orderId,
    this.error,
  });

  final CheckoutStatus status;
  final Store? store;
  final RentalFormSchema? rentalForm;
  final Map<String, String> documentUrls;
  final String? leaseAgreementUrl;
  final String? uploadingKey;
  final AppliedVoucher? appliedVoucher;
  final String? orderId;
  final String? error;

  bool get allDocsUploaded =>
      requiredDocKeys.keys.every((k) => documentUrls[k]?.isNotEmpty ?? false);

  CheckoutState copyWith({
    CheckoutStatus? status,
    Store? store,
    RentalFormSchema? rentalForm,
    Map<String, String>? documentUrls,
    String? leaseAgreementUrl,
    String? uploadingKey,
    bool clearUploading = false,
    AppliedVoucher? appliedVoucher,
    bool clearVoucher = false,
    String? orderId,
    String? error,
  }) =>
      CheckoutState(
        status: status ?? this.status,
        store: store ?? this.store,
        rentalForm: rentalForm ?? this.rentalForm,
        documentUrls: documentUrls ?? this.documentUrls,
        leaseAgreementUrl: leaseAgreementUrl ?? this.leaseAgreementUrl,
        uploadingKey: clearUploading ? null : (uploadingKey ?? this.uploadingKey),
        appliedVoucher:
            clearVoucher ? null : (appliedVoucher ?? this.appliedVoucher),
        orderId: orderId ?? this.orderId,
        error: error,
      );

  @override
  List<Object?> get props => [
        status,
        store?.id,
        documentUrls,
        leaseAgreementUrl,
        uploadingKey,
        appliedVoucher?.code,
        orderId,
        error,
      ];
}

class CheckoutCubit extends Cubit<CheckoutState> {
  CheckoutCubit(this._catalog, this._orders, this._uploads)
      : super(const CheckoutState());

  final CatalogRepository _catalog;
  final OrderRepository _orders;
  final UploadRepository _uploads;

  Future<void> load(String storeId, AppliedVoucher? existingVoucher) async {
    emit(const CheckoutState(status: CheckoutStatus.loading));
    try {
      final store = await _catalog.store(storeId);
      RentalFormSchema? form;
      try {
        form = await _catalog.rentalForm(storeId);
      } catch (_) {}
      emit(state.copyWith(
        status: CheckoutStatus.ready,
        store: store,
        rentalForm: form,
        appliedVoucher: existingVoucher,
      ));
    } on ApiException catch (e) {
      emit(state.copyWith(status: CheckoutStatus.error, error: e.message));
    }
  }

  Future<void> uploadDocument(String key, String filePath) async {
    emit(state.copyWith(uploadingKey: key, error: null));
    try {
      final url = await _uploads.upload(filePath);
      emit(state.copyWith(
        documentUrls: {...state.documentUrls, key: url},
        clearUploading: true,
      ));
    } on ApiException catch (e) {
      emit(state.copyWith(clearUploading: true, error: e.message));
    }
  }

  Future<void> uploadLeaseAgreement(String filePath) async {
    emit(state.copyWith(uploadingKey: 'lease', error: null));
    try {
      final url = await _uploads.upload(filePath);
      emit(state.copyWith(leaseAgreementUrl: url, clearUploading: true));
    } on ApiException catch (e) {
      emit(state.copyWith(clearUploading: true, error: e.message));
    }
  }

  Future<bool> applyVoucher(String code) async {
    if (state.store == null) return false;
    try {
      final voucher = await _orders.validateVoucher(state.store!.id, code);
      emit(state.copyWith(appliedVoucher: voucher));
      return true;
    } on ApiException catch (e) {
      emit(state.copyWith(error: e.message));
      return false;
    }
  }

  void removeVoucher() => emit(state.copyWith(clearVoucher: true));

  Future<bool> submit({
    required List<CartItem> items,
    required double totalAmount,
    required Map<String, dynamic> renterDetails,
    required Map<String, String> customAnswers,
  }) async {
    emit(state.copyWith(status: CheckoutStatus.submitting, error: null));
    try {
      final payload = <String, dynamic>{
        'store_id': state.store!.id,
        ...renterDetails,
        'items': items
            .map((e) => {
                  'id': e.id,
                  'name': e.name,
                  'startDate': e.startDate,
                  'endDate': e.endDate,
                  'startTime': e.startTime,
                  'endTime': e.endTime,
                  'quantity': e.quantity,
                  'daily_price': e.dailyPrice,
                  'deposit_amount': e.depositAmount,
                })
            .toList(),
        'total_amount': totalAmount,
        'document_urls': state.documentUrls,
        'custom_answers': customAnswers,
        if (state.leaseAgreementUrl != null)
          'lease_agreement_submission_url': state.leaseAgreementUrl,
        if (state.appliedVoucher != null)
          'voucher_code': state.appliedVoucher!.code,
      };
      final id = await _orders.createOrder(payload);
      emit(state.copyWith(status: CheckoutStatus.success, orderId: id));
      return true;
    } on ApiException catch (e) {
      emit(state.copyWith(status: CheckoutStatus.ready, error: e.message));
      return false;
    }
  }
}

/// Helper to read branch options for a store.
List<Map<String, String>> branchOptions(Store store) {
  if (store.branches.isEmpty) {
    return [
      {'id': 'main', 'name': 'Main Branch', 'address': store.address}
    ];
  }
  return store.branches
      .map((b) => {
            'id': Json.str(b.id),
            'name': Json.str(b.name, 'Branch'),
            'address': b.address,
          })
      .toList();
}
