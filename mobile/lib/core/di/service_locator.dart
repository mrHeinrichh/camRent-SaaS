import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../data/repositories/admin_repository.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/catalog_repository.dart';
import '../../data/repositories/notification_repository.dart';
import '../../data/repositories/order_repository.dart';
import '../../data/repositories/owner_repository.dart';
import '../../data/repositories/upload_repository.dart';
import '../network/api_client.dart';
import '../services/app_notifier.dart';
import '../services/notification_service.dart';
import '../storage/app_preferences.dart';
import '../storage/cache_service.dart';
import '../storage/token_store.dart';

final GetIt sl = GetIt.instance;

/// Wires the network + repository layer. Call once at startup.
void setupServiceLocator(SharedPreferences prefs, CacheService cache) {
  sl.registerSingleton<AppPreferences>(AppPreferences(prefs));
  sl.registerSingleton<CacheService>(cache);
  sl.registerLazySingleton<TokenStore>(() => TokenStore());
  sl.registerLazySingleton<ApiClient>(
      () => ApiClient(sl<TokenStore>(), cache: sl<CacheService>()));

  sl.registerLazySingleton<AuthRepository>(() => AuthRepository(sl()));
  sl.registerLazySingleton<CatalogRepository>(() => CatalogRepository(sl()));
  sl.registerLazySingleton<OrderRepository>(() => OrderRepository(sl()));
  sl.registerLazySingleton<UploadRepository>(() => UploadRepository(sl()));
  sl.registerLazySingleton<OwnerRepository>(() => OwnerRepository(sl()));
  sl.registerLazySingleton<AdminRepository>(() => AdminRepository(sl()));
  sl.registerLazySingleton<NotificationRepository>(
      () => NotificationRepository(sl()));

  sl.registerLazySingleton<NotificationService>(() => NotificationService());
  sl.registerLazySingleton<AppNotifier>(() => AppNotifier(
      sl<NotificationRepository>(),
      sl<NotificationService>(),
      sl<CacheService>()));
}
