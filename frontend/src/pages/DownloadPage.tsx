import { useState } from 'react';
import {
  Apple,
  Boxes,
  CalendarDays,
  Camera,
  Download,
  ExternalLink,
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  Share2,
  Smartphone,
  X,
} from 'lucide-react';

// Where the Android APK is served from. Drop the signed release APK at
// `frontend/public/downloads/CamRentPH.apk` (or change this to a hosted URL,
// e.g. a GitHub Release asset).
const APK_URL = '/downloads/CamRentPH.apk';
const WEB_APP_URL = 'https://camrentph.vercel.app';

const features = [
  {
    icon: ShieldCheck,
    title: 'Fraud prevention',
    desc: 'Review renter details, rental history, and reported issues before approval — with a shared fraud list across stores.',
  },
  {
    icon: QrCode,
    title: 'Custom rental form + store link + QR',
    desc: 'Share your own rental page via link, QR code, or social media. Customers book directly from your store.',
  },
  {
    icon: Boxes,
    title: 'Inventory & gear tracking',
    desc: 'Monitor cameras, lenses, and accessories with live availability, stock, and rental status.',
  },
  {
    icon: CalendarDays,
    title: 'Clear booking calendar',
    desc: 'See reservations, pickups, returns, and blocked dates at a glance.',
  },
  {
    icon: LayoutDashboard,
    title: 'All-in-one dashboard',
    desc: 'Manage bookings, gear, customers, applications, vouchers and analytics in one place.',
  },
  {
    icon: Share2,
    title: 'Customer & transaction records',
    desc: 'Keep complete renter records, submitted IDs, and transaction history for every booking.',
  },
];

const screenshots = [
  { src: '/app/screens/2.png', caption: 'Manage rentals in one place' },
  { src: '/app/screens/3.png', caption: 'All-in-one rental management' },
  { src: '/app/screens/4.png', caption: 'Reduce rental risk' },
  { src: '/app/screens/5.png', caption: 'Track every gear item' },
  { src: '/app/screens/6.png', caption: 'Clear booking calendar' },
  { src: '/app/screens/7.png', caption: 'Share your store link' },
];

export function DownloadPage({ onBackHome }: { onBackHome?: () => void }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#0d0b09] text-white antialiased">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d9a26a] text-[#2f1f12]">
            <Camera className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">CamRent PH</span>
        </div>
        <button
          type="button"
          onClick={onBackHome}
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
        >
          Open web app
        </button>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(1200px 500px at 15% -10%, rgba(120,90,55,0.45), transparent), radial-gradient(900px 500px at 110% 10%, rgba(217,162,106,0.18), transparent)',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-10 pt-6 md:grid-cols-[1.05fr_0.95fr] md:pb-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/70">
              <Camera className="h-3.5 w-3.5" /> CamRent PH Mobile
            </span>
            <h1 className="mt-5 max-w-xl text-4xl font-black leading-tight sm:text-5xl">
              Camera rental tracking made{' '}
              <span className="text-[#d9a26a]">safer, simpler, and easier.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/65">
              Browse trusted rental shops, book pro camera gear, and manage your store —
              all from your phone. Built for the Philippine market with fraud-aware screening.
            </p>

            {/* Primary download buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={APK_URL}
                download
                className="inline-flex items-center gap-2 rounded-2xl bg-[#d9a26a] px-5 py-3.5 text-sm font-bold text-[#2f1f12] shadow-lg shadow-black/40 transition hover:brightness-105"
              >
                <Download className="h-5 w-5" /> Download APK (Android)
              </a>
              <a
                href={WEB_APP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-5 py-3.5 text-sm font-semibold text-white/85 transition hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4" /> Use the web app
              </a>
            </div>

            {/* Store badges (coming soon) */}
            <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
              Also coming soon to
            </p>
            <img
              src="/app/store-badges.png"
              alt="Coming soon to Google Play and the App Store"
              className="mt-3 h-12 w-auto opacity-95 sm:h-14"
            />
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/45">
              <span className="inline-flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" /> Android APK available now
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Apple className="h-3.5 w-3.5" /> iOS — coming soon
              </span>
            </div>
          </div>

          {/* Hero phone composite */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-[#d9a26a]/20 to-transparent blur-2xl" />
            <img
              src="/app/screens/1.png"
              alt="CamRent PH app preview"
              className="relative w-full rounded-[1.5rem] border border-white/10 shadow-2xl shadow-black/60"
            />
          </div>
        </div>
      </section>

      {/* Coming soon banner for iOS */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Apple className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold">iOS release — coming soon</p>
              <p className="text-sm text-white/60">
                The App Store version is in review. For now, use the Android APK or the web app.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-[#d9a26a]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#d9a26a]">
            Coming soon
          </span>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-2xl font-extrabold sm:text-3xl">Everything you need to rent and run a shop</h2>
        <p className="mt-2 max-w-2xl text-white/60">
          The same powerful tools as the web app, in your pocket — for renters and store owners.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-[#d9a26a]/40 hover:bg-white/[0.05]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d9a26a]/15 text-[#d9a26a]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshots */}
      <section className="mx-auto max-w-6xl px-5 pb-14">
        <h2 className="text-2xl font-extrabold sm:text-3xl">A closer look</h2>
        <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-4">
          {screenshots.map((shot) => (
            <button
              key={shot.src}
              type="button"
              onClick={() => setLightbox(shot.src)}
              className="group w-[230px] shrink-0 snap-start text-left"
            >
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <img
                  src={shot.src}
                  alt={shot.caption}
                  className="h-[420px] w-full object-cover transition group-hover:scale-[1.02]"
                />
              </div>
              <p className="mt-2 px-1 text-sm text-white/60">{shot.caption}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Download CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-3xl border border-[#d9a26a]/30 bg-gradient-to-br from-[#d9a26a]/15 to-transparent p-8 text-center sm:p-12">
          <h2 className="text-2xl font-black sm:text-3xl">Get CamRent PH today</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/65">
            Install the Android app now. iOS and the Play Store / App Store listings are on the way.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={APK_URL}
              download
              className="inline-flex items-center gap-2 rounded-2xl bg-[#d9a26a] px-6 py-3.5 text-sm font-bold text-[#2f1f12] shadow-lg shadow-black/40 transition hover:brightness-105"
            >
              <Download className="h-5 w-5" /> Download APK
            </a>
            <a
              href={WEB_APP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white/85 transition hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" /> Open web app
            </a>
          </div>
          <p className="mt-4 text-xs text-white/40">
            Android 7.0+ · Allow “install from unknown sources” when prompted.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/40">
        © {new Date().getFullYear()} CamRent PH · Camera rental marketplace
      </footer>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white"
            onClick={() => setLightbox(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightbox}
            alt="Screenshot"
            className="max-h-[90vh] w-auto rounded-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
