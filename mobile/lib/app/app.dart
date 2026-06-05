import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../core/di/service_locator.dart';
import '../core/storage/token_store.dart';
import '../data/repositories/auth_repository.dart';
import '../data/repositories/catalog_repository.dart';
import '../features/auth/cubit/auth_cubit.dart';
import '../features/cart/cubit/cart_cubit.dart';
import '../features/home/bloc/home_cubit.dart';
import 'app_router.dart';
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

  @override
  void initState() {
    super.initState();
    _authCubit = AuthCubit(sl<AuthRepository>(), sl<TokenStore>());
    _cartCubit = CartCubit();
    _homeCubit = HomeCubit(sl<CatalogRepository>())..load();
  }

  @override
  void dispose() {
    _authCubit.close();
    _cartCubit.close();
    _homeCubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _authCubit),
        BlocProvider.value(value: _cartCubit),
        BlocProvider.value(value: _homeCubit),
      ],
      child: MaterialApp.router(
        title: 'CamRent',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        routerConfig: buildRouter(_authCubit),
      ),
    );
  }
}
