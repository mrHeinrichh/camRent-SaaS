import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../core/di/service_locator.dart';
import '../core/services/app_notifier.dart';
import '../core/storage/token_store.dart';
import '../data/repositories/auth_repository.dart';
import '../data/repositories/catalog_repository.dart';
import '../features/auth/cubit/auth_cubit.dart';
import '../features/cart/cubit/cart_cubit.dart';
import '../features/home/bloc/home_cubit.dart';
import '../features/settings/theme_cubit.dart';
import 'app_router.dart';
import 'package:go_router/go_router.dart';
import 'theme.dart';

class CamRentApp extends StatefulWidget {
  const CamRentApp({super.key});

  @override
  State<CamRentApp> createState() => _CamRentAppState();
}

class _CamRentAppState extends State<CamRentApp> {
  late final AuthCubit _authCubit;
  late final CartCubit _cartCubit;
  late final HomeCubit _homeCubit;
  late final ThemeCubit _themeCubit;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authCubit = AuthCubit(sl<AuthRepository>(), sl<TokenStore>());
    _cartCubit = CartCubit();
    _homeCubit = HomeCubit(sl<CatalogRepository>())..load();
    _themeCubit = ThemeCubit();
    // Build the router exactly once — rebuilding it on every MaterialApp
    // rebuild causes the Navigator to reconcile duplicate page keys and crash.
    _router = buildRouter(_authCubit);
    // Start notification polling if a user is already signed in.
    _syncAppNotifier(_authCubit.state);
  }

  void _syncAppNotifier(AuthState state) {
    final notifier = sl<AppNotifier>();
    if (state.status == AuthStatus.authenticated && state.user != null) {
      notifier.start(state.user!.id);
    } else {
      notifier.stop();
    }
  }

  @override
  void dispose() {
    _authCubit.close();
    _cartCubit.close();
    _homeCubit.close();
    _themeCubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _authCubit),
        BlocProvider.value(value: _cartCubit),
        BlocProvider.value(value: _homeCubit),
        BlocProvider.value(value: _themeCubit),
      ],
      child: BlocListener<AuthCubit, AuthState>(
        listenWhen: (p, c) =>
            p.status != c.status || p.user?.id != c.user?.id,
        listener: (context, state) => _syncAppNotifier(state),
        child: BlocBuilder<ThemeCubit, ThemeMode>(
        builder: (context, mode) {
          // Keep the custom-widget palette in sync with the active ThemeData.
          AppColors.brightness =
              mode == ThemeMode.dark ? Brightness.dark : Brightness.light;
          return MaterialApp.router(
            title: 'CamRentPH',
            debugShowCheckedModeBanner: false,
            theme: buildAppTheme(Brightness.light),
            darkTheme: buildAppTheme(Brightness.dark),
            themeMode: mode,
            routerConfig: _router,
          );
        },
        ),
      ),
    );
  }
}
