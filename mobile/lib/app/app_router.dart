import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

import '../core/widgets/animations.dart';
import '../features/account/screens/account_screen.dart';
import '../features/admin_dashboard/screens/admin_dashboard_screen.dart';
import '../features/auth/cubit/auth_cubit.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/cart/screens/cart_screen.dart';
import '../features/checkout/screens/checkout_screen.dart';
import '../features/checkout/screens/success_screen.dart';
import '../features/home/screens/home_screen.dart';
import '../features/item/screens/item_screen.dart';
import '../features/onboarding/screens/onboarding_screen.dart';
import '../features/onboarding/screens/splash_screen.dart';
import '../features/owner_dashboard/screens/owner_dashboard_screen.dart';
import '../features/static_pages/screens/info_screens.dart';
import '../features/store/screens/store_screen.dart';
import 'main_shell.dart';

final _rootKey = GlobalKey<NavigatorState>();
final _shellHomeKey = GlobalKey<NavigatorState>();
final _shellCartKey = GlobalKey<NavigatorState>();
final _shellAccountKey = GlobalKey<NavigatorState>();

GoRouter buildRouter(AuthCubit authCubit) {
  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/splash',
    refreshListenable: _CubitListenable(authCubit.stream),
    redirect: (context, state) {
      final auth = authCubit.state;
      final loc = state.matchedLocation;
      final loggedIn = auth.status == AuthStatus.authenticated;

      // Splash and onboarding are always reachable.
      if (loc == '/splash' || loc == '/onboarding') return null;

      // Role guards for dashboards.
      if (loc.startsWith('/owner') && !auth.isOwner) {
        return loggedIn ? '/' : '/login';
      }
      if (loc.startsWith('/admin') && !auth.isAdmin) {
        return loggedIn ? '/' : '/login';
      }
      // Account requires login.
      if (loc == '/account' && !loggedIn) return '/login';
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => buildPageTransition(
          state: state,
          child: const SplashScreen(),
        ),
      ),
      GoRoute(
        path: '/onboarding',
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => buildPageTransition(
          state: state,
          child: const OnboardingScreen(),
        ),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            navigatorKey: _shellHomeKey,
            routes: [
              GoRoute(
                path: '/',
                pageBuilder: (context, state) => buildPageTransition(
                  state: state,
                  child: const HomeScreen(),
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellCartKey,
            routes: [
              GoRoute(
                path: '/cart',
                pageBuilder: (context, state) => buildPageTransition(
                  state: state,
                  child: const CartScreen(),
                ),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellAccountKey,
            routes: [
              GoRoute(
                path: '/account',
                pageBuilder: (context, state) => buildPageTransition(
                  state: state,
                  child: const AccountScreen(),
                ),
              ),
            ],
          ),
        ],
      ),

      // Top-level routes (pushed over the shell).
      GoRoute(
        path: '/store/:id',
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => buildPageTransition(
          state: state,
          child: StoreScreen(storeId: state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/item/:id',
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => buildPageTransition(
          state: state,
          child: ItemScreen(itemId: state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/checkout',
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => buildPageTransition(
          state: state,
          child: const CheckoutScreen(),
        ),
      ),
      GoRoute(
        path: '/success',
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => buildPageTransition(
          state: state,
          child: const SuccessScreen(),
        ),
      ),
      GoRoute(
        path: '/login',
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => buildPageTransition(
          state: state,
          child: const LoginScreen(),
        ),
      ),
      GoRoute(
        path: '/register',
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => buildPageTransition(
          state: state,
          child: const RegisterScreen(),
        ),
      ),
      GoRoute(
        path: '/about',
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => buildPageTransition(
          state: state,
          child: const AboutScreen(),
        ),
      ),
      GoRoute(
        path: '/policies',
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => buildPageTransition(
          state: state,
          child: const PoliciesScreen(),
        ),
      ),
      GoRoute(
        path: '/donate',
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => buildPageTransition(
          state: state,
          child: const DonateScreen(),
        ),
      ),
      GoRoute(
        path: '/owner',
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => buildPageTransition(
          state: state,
          child: const OwnerDashboardScreen(),
        ),
      ),
      GoRoute(
        path: '/admin',
        parentNavigatorKey: _rootKey,
        pageBuilder: (context, state) => buildPageTransition(
          state: state,
          child: const AdminDashboardScreen(),
        ),
      ),
    ],
  );
}

/// Bridges a bloc [Stream] to a [Listenable] for go_router refreshes.
class _CubitListenable extends ChangeNotifier {
  _CubitListenable(Stream<dynamic> stream) {
    notifyListeners();
    _sub = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  late final StreamSubscription<dynamic> _sub;

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}
