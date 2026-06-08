# CamRent Mobile (Flutter + BLoC)

Native iOS/Android client for the CamRent camera-rental marketplace. It talks to
the same REST backend as the web app (`../backend`) and re-implements the web
feature set (`../frontend`) for mobile.

## State management — BLoC pattern

This app uses `flutter_bloc` throughout:

- **Cubits** for screen/feature state (`HomeCubit`, `StoreCubit`, `ItemCubit`,
  `AccountCubit`, `OwnerCubit`, `AdminCubit`, `CheckoutCubit`).
- **HydratedCubit** for state that must survive restarts:
  - `AuthCubit` — session (user + JWT), mirroring the web `persist` store.
  - `CartCubit` — cart lines + applied voucher, with the same "one store at a
    time" rule and line-item identity (id + dates + times) as the web zustand store.

App-wide cubits (`AuthCubit`, `CartCubit`, `HomeCubit`) are provided above the
router in `app/app.dart`; feature cubits are scoped to their route via
`BlocProvider`.

## Folder structure

```
lib/
  app/                     # App wiring: theme, router, shell, root widget
    app.dart               # Root MaterialApp.router + global BlocProviders
    app_router.dart        # go_router config + role guards
    main_shell.dart        # Bottom-nav shell (Home / Cart / Account) + drawer
    theme.dart             # Palette + ThemeData (ported from web siteTheme)
  core/
    constants/             # env (API target/base URL) + api_endpoints registry
    network/               # Dio ApiClient + ApiException
    storage/               # In-memory TokenStore read by the auth interceptor
    di/                    # get_it service locator
    utils/                 # currency, dates, rental pricing, JSON coercion
    widgets/               # Shared widgets (RemoteImage, EmptyState, badges…)
  data/
    models/                # Plain Dart models mirroring frontend/src/types/domain.ts
    repositories/          # One repository per backend domain
  features/
    auth/                  # login, register wizard (renter+owner), OTP, AuthCubit
    home/                  # gear feed + filters
    store/                 # store detail + reviews
    item/                  # gear detail, date range, add-to-cart
    cart/                  # CartCubit + cart screen
    checkout/              # rental application: docs upload, custom form, voucher
    account/               # renter order history + cancel
    owner_dashboard/       # overview, gear, applications, vouchers, support
    admin_dashboard/       # overview, stores approval, customers, fraud, support
    static_pages/          # about, policies/FAQ, donate
    onboarding/            # animated splash + first-run app-summary onboarding
```

## First launch

`/splash` is the initial route: an animated brand reveal that then routes
**first-time ("initial") users** to `/onboarding` — a 4-page swipeable summary of
what the app is, how renting works, trust & safety, and the renter/owner/admin
roles. A "seen" flag is persisted via `SharedPreferences` (`AppPreferences`), so
returning users skip straight to the home feed. "Skip" or "Get started" both set
the flag.

## Configuration

The backend base URL is resolved in `core/constants/env.dart`. It defaults to the
live Render deployment. Override at run/build time:

```bash
# Live (default)
flutter run

# Local backend (e.g. http://127.0.0.1:3001)
flutter run --dart-define=API_TARGET=local

# Custom URLs
flutter run --dart-define=API_TARGET=live --dart-define=API_URL_LIVE=https://my-api.example.com
```

> Note: pointing at a local **http** backend on a physical device/emulator
> requires enabling cleartext traffic. The default (live) uses HTTPS.

## Running

```bash
cd mobile
flutter pub get
flutter run                 # debug on a connected device/emulator
flutter build apk           # Android release
flutter build ios           # iOS release (needs Xcode signing)
```

## Feature parity with the web app

| Area | Web | Mobile |
|------|-----|--------|
| Auth (login / register / OTP / role routing) | ✅ | ✅ |
| Gear feed + search + category filter | ✅ | ✅ |
| Store page + reviews + write review | ✅ | ✅ |
| Item detail + availability + add to cart | ✅ | ✅ |
| Cart (one-store rule, vouchers, totals) | ✅ | ✅ |
| Checkout (ID uploads, custom rental form, lease, voucher) | ✅ | ✅ |
| Account order history + cancel | ✅ | ✅ |
| Owner dashboard (stats, gear, applications, vouchers, support) | ✅ | ✅ |
| Admin console (stores, customers, fraud, support) | ✅ | ✅ |
| Static pages (about, policies, donate) | ✅ | ✅ |

Google sign-in is wired in `AuthRepository.googleSignIn`; to enable the button,
add `google_sign_in` platform configuration (OAuth client IDs) and call
`AuthCubit.googleSignIn` with the returned `idToken`.
