import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../app/theme.dart';
import '../features/auth/cubit/auth_cubit.dart';
import '../features/cart/cubit/cart_cubit.dart';
import '../features/settings/theme_cubit.dart';

/// Bottom-navigation shell hosting the renter tabs (Home, Cart, Account) with a
/// drawer for static pages. Mirrors the web Navbar.
class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const _AppDrawer(),
      appBar: AppBar(
        title: const Text('CamRentPH',
            style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          BlocBuilder<AuthCubit, AuthState>(
            builder: (context, state) {
              if (state.status == AuthStatus.authenticated) {
                return const SizedBox.shrink();
              }
              return TextButton(
                onPressed: () => context.push('/login'),
                child: const Text('Sign in'),
              );
            },
          ),
        ],
      ),
      body: navigationShell,
      bottomNavigationBar: BlocBuilder<CartCubit, CartState>(
        builder: (context, cart) {
          return NavigationBar(
            selectedIndex: navigationShell.currentIndex,
            onDestinationSelected: (index) => navigationShell.goBranch(
              index,
              initialLocation: index == navigationShell.currentIndex,
            ),
            destinations: [
              const NavigationDestination(
                icon: Icon(Icons.home_outlined),
                selectedIcon: Icon(Icons.home),
                label: 'Home',
              ),
              NavigationDestination(
                icon: Badge(
                  isLabelVisible: cart.count > 0,
                  label: Text('${cart.count}'),
                  child: const Icon(Icons.shopping_cart_outlined),
                ),
                selectedIcon: const Icon(Icons.shopping_cart),
                label: 'Cart',
              ),
              const NavigationDestination(
                icon: Icon(Icons.person_outline),
                selectedIcon: Icon(Icons.person),
                label: 'Account',
              ),
            ],
          );
        },
      ),
    );
  }
}

class _AppDrawer extends StatelessWidget {
  const _AppDrawer();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthCubit>().state;
    return Drawer(
      child: SafeArea(
        child: ListView(
          children: [
            DrawerHeader(
              decoration: BoxDecoration(color: AppColors.surface),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const Icon(Icons.photo_camera,
                      size: 36, color: AppColors.accent),
                  const SizedBox(height: 8),
                  Text(
                    auth.user?.fullName ?? 'Welcome to CamRent',
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  if (auth.user != null)
                    Text(auth.user!.email,
                        style: TextStyle(color: AppColors.textMuted)),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.home_outlined),
              title: const Text('Home'),
              onTap: () {
                Navigator.pop(context);
                context.go('/');
              },
            ),
            ListTile(
              leading: const Icon(Icons.info_outline),
              title: const Text('About'),
              onTap: () {
                Navigator.pop(context);
                context.push('/about');
              },
            ),
            ListTile(
              leading: const Icon(Icons.policy_outlined),
              title: const Text('Policies & FAQ'),
              onTap: () {
                Navigator.pop(context);
                context.push('/policies');
              },
            ),
            ListTile(
              leading: const Icon(Icons.favorite_outline),
              title: const Text('Support us'),
              onTap: () {
                Navigator.pop(context);
                context.push('/donate');
              },
            ),
            const Divider(),
            BlocBuilder<ThemeCubit, ThemeMode>(
              builder: (context, mode) => SwitchListTile(
                secondary: Icon(mode == ThemeMode.dark
                    ? Icons.dark_mode
                    : Icons.light_mode),
                title: const Text('Dark mode'),
                value: mode == ThemeMode.dark,
                activeThumbColor: AppColors.accent,
                onChanged: (_) => context.read<ThemeCubit>().toggle(),
              ),
            ),
            const Divider(),
            if (auth.isOwner)
              ListTile(
                leading: const Icon(Icons.storefront_outlined),
                title: const Text('Store dashboard'),
                onTap: () {
                  Navigator.pop(context);
                  context.go('/owner');
                },
              ),
            if (auth.isAdmin)
              ListTile(
                leading: const Icon(Icons.admin_panel_settings_outlined),
                title: const Text('Admin console'),
                onTap: () {
                  Navigator.pop(context);
                  context.go('/admin');
                },
              ),
            if (auth.status == AuthStatus.authenticated)
              ListTile(
                leading: const Icon(Icons.logout),
                title: const Text('Sign out'),
                onTap: () {
                  Navigator.pop(context);
                  context.read<AuthCubit>().logout();
                  context.go('/');
                },
              )
            else
              ListTile(
                leading: const Icon(Icons.login),
                title: const Text('Sign in'),
                onTap: () {
                  Navigator.pop(context);
                  context.push('/login');
                },
              ),
          ],
        ),
      ),
    );
  }
}
