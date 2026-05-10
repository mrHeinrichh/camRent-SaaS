import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  Bell,
  Camera,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  MapPin,
  PackageCheck,
  QrCode,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";

export type CamRentIntroProps = {
  layout: "desktop" | "mobile";
  siteUrl: string;
};

const palette = {
  bg: "#f0ece6",
  surface: "#f7f4ef",
  surfaceSoft: "#fcfbf8",
  border: "#e2dbd1",
  text: "#2f1e12",
  muted: "#5b554e",
  accent: "#d9a26a",
  blue: "#2563eb",
  green: "#059669",
  red: "#dc2626",
  slate: "#0f172a",
};

const cameraImages = [
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80",
];

const customerFeatures = [
  { label: "Browse trusted rental stores", icon: Store },
  { label: "Compare available gears", icon: Search },
  { label: "Book with cleaner requirements", icon: ShoppingBag },
];

const storeFeatures = [
  { label: "Manage inventory and bookings", icon: PackageCheck },
  { label: "Show payment QR references", icon: QrCode },
  { label: "Share your store link fast", icon: ExternalLink },
];

const fraudFeatures = [
  { label: "Fraud-aware renter screening", icon: ShieldCheck },
  { label: "Internal and global report flow", icon: Bell },
  { label: "Safer rental decisions", icon: CheckCircle2 },
];

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

const px = (value: number) => `${value}px`;

const useScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = (start: number, duration: number) =>
    interpolate(frame, [start * fps, (start + duration) * fps], [0, 1], {
      ...clamp,
      easing: easeOut,
    });

  const exit = (start: number, duration: number) =>
    interpolate(frame, [start * fps, (start + duration) * fps], [1, 0], {
      ...clamp,
      easing: Easing.in(Easing.cubic),
    });

  const pulse = (start: number, duration: number) =>
    interpolate(frame, [start * fps, (start + duration) * fps], [0, 1], {
      ...clamp,
      easing: easeInOut,
    });

  return { frame, fps, enter, exit, pulse };
};

const fitText = (text: string, max: number) => {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
};

const StatPill: React.FC<{
  label: string;
  value: string;
  color: string;
  progress: number;
}> = ({ label, value, color, progress }) => {
  return (
    <div
      style={{
        borderRadius: 22,
        border: `1px solid ${palette.border}`,
        background: palette.surfaceSoft,
        padding: "18px 20px",
        boxShadow: "0 14px 32px rgba(47,30,18,0.08)",
        opacity: progress,
        transform: `translateY(${px((1 - progress) * 24)})`,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          borderRadius: 999,
          background: color,
          color: "#fff",
          padding: "5px 10px",
          fontSize: 16,
          fontWeight: 900,
          letterSpacing: 0.8,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 12,
          color: palette.text,
          fontSize: 38,
          fontWeight: 950,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{
  label: string;
  helper: string;
  icon: React.ElementType;
  progress: number;
  accent: string;
}> = ({ label, helper, icon: Icon, progress, accent }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        borderRadius: 26,
        border: `1px solid ${palette.border}`,
        background: "#fff",
        padding: 20,
        boxShadow: "0 18px 42px rgba(15,23,42,0.08)",
        opacity: progress,
        transform: `translateX(${px((1 - progress) * 34)}) scale(${0.98 + progress * 0.02})`,
      }}
    >
      <div
        style={{
          display: "grid",
          placeItems: "center",
          width: 56,
          height: 56,
          borderRadius: 18,
          background: accent,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        <Icon size={28} strokeWidth={2.4} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 26, fontWeight: 950, color: palette.text, lineHeight: 1.08 }}>
          {label}
        </div>
        <div style={{ marginTop: 6, fontSize: 18, fontWeight: 650, color: palette.muted, lineHeight: 1.25 }}>
          {helper}
        </div>
      </div>
    </div>
  );
};

const BrandMark: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14 * scale }}>
    <Img
      src={staticFile("assets/camrent-logo.svg")}
      style={{
        width: 58 * scale,
        height: 58 * scale,
        borderRadius: 16 * scale,
        boxShadow: "0 12px 24px rgba(47,30,18,0.18)",
      }}
    />
    <div>
      <div
        style={{
          color: palette.text,
          fontSize: 29 * scale,
          fontWeight: 950,
          letterSpacing: -0.4 * scale,
          lineHeight: 1,
        }}
      >
        CamRent PH
      </div>
      <div
        style={{
          marginTop: 4 * scale,
          color: palette.muted,
          fontSize: 12 * scale,
          fontWeight: 900,
          letterSpacing: 2.4 * scale,
          textTransform: "uppercase",
        }}
      >
        Rental operations platform
      </div>
    </div>
  </div>
);

const BrowserPreview: React.FC<{ progress: number; compact?: boolean }> = ({ progress, compact }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardLift = interpolate(frame, [2.1 * fps, 5.8 * fps], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });

  const width = compact ? 600 : 860;
  const height = compact ? 470 : 600;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 34,
        background: "#fff",
        border: `1px solid ${palette.border}`,
        boxShadow: "0 42px 90px rgba(47,30,18,0.2)",
        overflow: "hidden",
        opacity: progress,
        transform: `translateY(${px((1 - progress) * 30)}) rotateX(${4 - progress * 4}deg)`,
      }}
    >
      <div
        style={{
          height: 72,
          background: palette.surface,
          borderBottom: `1px solid ${palette.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
        }}
      >
        <BrandMark scale={0.62} />
        <div style={{ display: "flex", gap: 10 }}>
          {["Stores", "Gears", "Cart"].map((item) => (
            <div
              key={item}
              style={{
                borderRadius: 999,
                border: `1px solid ${palette.border}`,
                padding: "9px 14px",
                fontSize: 13,
                fontWeight: 900,
                color: palette.text,
                background: palette.surfaceSoft,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: compact ? 24 : 32 }}>
        <div
          style={{
            borderRadius: 30,
            border: "1px solid #e5e7eb",
            background: palette.bg,
            padding: compact ? 22 : 30,
            display: "grid",
            gridTemplateColumns: "0.92fr 1.08fr",
            gap: 24,
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                border: `2px solid ${palette.muted}`,
                padding: "5px 10px",
                color: palette.muted,
                fontWeight: 950,
                fontSize: compact ? 25 : 34,
              }}
            >
              CR PH
            </div>
            <div
              style={{
                marginTop: 18,
                color: palette.slate,
                fontWeight: 950,
                fontSize: compact ? 34 : 50,
                lineHeight: 1.04,
                letterSpacing: -1.2,
              }}
            >
              Camera Rental Based on Philippine Market
            </div>
            <div style={{ marginTop: 16, color: "#64748b", fontWeight: 700, fontSize: compact ? 17 : 21, lineHeight: 1.35 }}>
              Browse trusted rental stores, compare available gears, and book with a fraud-aware flow.
            </div>
          </div>

          <div style={{ position: "relative", height: compact ? 245 : 330 }}>
            {cameraImages.map((src, index) => {
              const offsets = [
                { left: 108, top: 0, width: 280, height: 205 },
                { left: 0, top: 82, width: 300, height: 220 },
                { left: 320, top: 166, width: 150, height: 126 },
              ];
              const item = offsets[index];
              const local = Math.min(1, Math.max(0, progress + cardLift * 0.25 - index * 0.06));
              return (
                <Img
                  key={src}
                  src={src}
                  style={{
                    position: "absolute",
                    left: item.left * (compact ? 0.76 : 1),
                    top: item.top * (compact ? 0.76 : 1),
                    width: item.width * (compact ? 0.76 : 1),
                    height: item.height * (compact ? 0.76 : 1),
                    objectFit: "cover",
                    borderRadius: 28,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 24px 48px rgba(15,23,42,0.22)",
                    opacity: local,
                    transform: `translateY(${px((1 - local) * 34)}) rotate(${index === 1 ? -4 : index === 2 ? 5 : 2}deg)`,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {["All Gear", "Mirrorless", "DSLR", "Near Me"].map((chip, index) => (
            <div
              key={chip}
              style={{
                borderRadius: 999,
                background: index === 0 ? palette.text : palette.surface,
                color: index === 0 ? "#fff" : palette.text,
                border: `1px solid ${palette.border}`,
                padding: "11px 12px",
                textAlign: "center",
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PhonePreview: React.FC<{ progress: number }> = ({ progress }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scroll = interpolate(frame, [4.2 * fps, 9.5 * fps], [0, -126], {
    ...clamp,
    easing: easeInOut,
  });

  return (
    <div
      style={{
        width: 335,
        height: 672,
        borderRadius: 48,
        background: palette.slate,
        padding: 12,
        boxShadow: "0 42px 90px rgba(15,23,42,0.3)",
        opacity: progress,
        transform: `translateY(${px((1 - progress) * 36)}) rotate(${2 - progress * 2}deg)`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden",
          borderRadius: 38,
          background: palette.bg,
          position: "relative",
        }}
      >
        <div
          style={{
            height: 66,
            borderBottom: `1px solid ${palette.border}`,
            background: palette.surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px",
          }}
        >
          <BrandMark scale={0.42} />
          <div style={{ width: 38, height: 38, borderRadius: 999, background: palette.text, display: "grid", placeItems: "center", color: "#fff" }}>
            <Camera size={18} />
          </div>
        </div>

        <div style={{ padding: 16, transform: `translateY(${px(scroll)})` }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["Gear", "Stores", "Ratings"].map((chip, index) => (
              <div
                key={chip}
                style={{
                  borderRadius: 999,
                  background: index === 0 ? palette.text : "#fff",
                  color: index === 0 ? "#fff" : palette.text,
                  border: `1px solid ${palette.border}`,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {chip}
              </div>
            ))}
          </div>

          {[0, 1, 2].map((index) => (
            <div
              key={index}
              style={{
                borderRadius: 24,
                background: "#fff",
                border: `1px solid ${palette.border}`,
                overflow: "hidden",
                marginBottom: 14,
                boxShadow: "0 14px 28px rgba(47,30,18,0.08)",
              }}
            >
              <Img
                src={cameraImages[index]}
                style={{
                  width: "100%",
                  height: 132,
                  objectFit: "cover",
                }}
              />
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 950, color: palette.slate }}>{["Mirrorless Kit", "DSLR Body", "Prime Lens"][index]}</div>
                <div style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>Trusted store</span>
                  <span style={{ fontSize: 13, fontWeight: 950, color: palette.text }}>PHP {["950", "700", "450"][index]}/day</span>
                </div>
              </div>
            </div>
          ))}

          <div
            style={{
              borderRadius: 24,
              background: "#fff",
              border: `1px solid ${palette.border}`,
              padding: 16,
              boxShadow: "0 14px 28px rgba(47,30,18,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldCheck color={palette.green} size={24} />
              <div style={{ fontSize: 17, fontWeight: 950, color: palette.text }}>Fraud protection</div>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: palette.muted, lineHeight: 1.35 }}>
              Stores can flag risky renters and keep records cleaner.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FraudPanel: React.FC<{ progress: number; compact?: boolean }> = ({ progress, compact }) => {
  const rows = [
    { name: "ID verified", status: "Checked", color: palette.green },
    { name: "Rental history", status: "Reviewed", color: palette.blue },
    { name: "Fraud alerts", status: "Protected", color: palette.red },
  ];

  return (
    <div
      style={{
        borderRadius: compact ? 26 : 34,
        background: "#fff",
        border: `1px solid ${palette.border}`,
        padding: compact ? 22 : 30,
        boxShadow: "0 32px 70px rgba(47,30,18,0.16)",
        opacity: progress,
        transform: `translateY(${px((1 - progress) * 28)})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 62, height: 62, borderRadius: 22, background: palette.text, color: "#fff", display: "grid", placeItems: "center" }}>
          <ShieldCheck size={34} />
        </div>
        <div>
          <div style={{ fontSize: compact ? 24 : 34, fontWeight: 950, color: palette.text, lineHeight: 1 }}>Fraud-aware rental flow</div>
          <div style={{ marginTop: 6, fontSize: compact ? 15 : 19, fontWeight: 750, color: palette.muted }}>Built for stores and renters who need cleaner trust signals.</div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
        {rows.map((row) => (
          <div
            key={row.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              borderRadius: 18,
              background: palette.surfaceSoft,
              border: `1px solid ${palette.border}`,
              padding: compact ? "13px 14px" : "16px 18px",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10, color: palette.text, fontSize: compact ? 16 : 19, fontWeight: 900 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: row.color }} />
              {row.name}
            </span>
            <span style={{ color: row.color, fontSize: compact ? 14 : 17, fontWeight: 950 }}>{row.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const OwnerToolsPanel: React.FC<{ progress: number; compact?: boolean }> = ({ progress, compact }) => {
  return (
    <div
      style={{
        borderRadius: compact ? 26 : 34,
        background: palette.surfaceSoft,
        border: `1px solid ${palette.border}`,
        padding: compact ? 20 : 28,
        boxShadow: "0 32px 70px rgba(47,30,18,0.13)",
        opacity: progress,
        transform: `translateY(${px((1 - progress) * 28)})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
        <div>
          <div style={{ fontSize: compact ? 23 : 32, fontWeight: 950, color: palette.text }}>Store owner tools</div>
          <div style={{ marginTop: 6, fontSize: compact ? 15 : 18, fontWeight: 750, color: palette.muted }}>Inventory, bookings, payment references, and store QR in one place.</div>
        </div>
        <div style={{ width: 82, height: 82, borderRadius: 22, background: "#fff", border: `1px solid ${palette.border}`, display: "grid", placeItems: "center", flexShrink: 0 }}>
          <QrCode size={45} color={palette.text} />
        </div>
      </div>

      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { label: "Payment QR", icon: CreditCard },
          { label: "Branches", icon: MapPin },
          { label: "Store link", icon: ExternalLink },
          { label: "Reports", icon: ShieldCheck },
        ].map((item) => (
          <div key={item.label} style={{ borderRadius: 18, background: "#fff", border: `1px solid ${palette.border}`, padding: compact ? 13 : 17 }}>
            <item.icon size={compact ? 21 : 25} color={palette.accent} />
            <div style={{ marginTop: 9, fontSize: compact ? 15 : 18, fontWeight: 950, color: palette.text }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FinalCard: React.FC<{ progress: number; mobile: boolean; siteUrl: string }> = ({ progress, mobile, siteUrl }) => {
  return (
    <div
      style={{
        borderRadius: mobile ? 34 : 42,
        background: palette.text,
        color: palette.surfaceSoft,
        padding: mobile ? 40 : 54,
        boxShadow: "0 40px 90px rgba(47,30,18,0.25)",
        opacity: progress,
        transform: `translateY(${px((1 - progress) * 34)}) scale(${0.96 + progress * 0.04})`,
      }}
    >
      <BrandMark scale={mobile ? 0.78 : 0.9} />
      <div
        style={{
          marginTop: mobile ? 34 : 40,
          maxWidth: mobile ? 820 : 980,
          fontSize: mobile ? 65 : 76,
          fontWeight: 950,
          lineHeight: 0.95,
          letterSpacing: -2,
          color: palette.surfaceSoft,
        }}
      >
        Rent smarter. Manage cleaner. Protect every booking.
      </div>
      <div
        style={{
          marginTop: 26,
          display: "inline-flex",
          alignItems: "center",
          gap: 14,
          borderRadius: 999,
          background: palette.accent,
          color: palette.text,
          padding: mobile ? "18px 24px" : "18px 28px",
          fontSize: mobile ? 26 : 28,
          fontWeight: 950,
        }}
      >
        <ExternalLink size={mobile ? 27 : 30} />
        {siteUrl.replace("https://", "")}
      </div>
    </div>
  );
};

const DesktopIntro: React.FC<{ siteUrl: string }> = ({ siteUrl }) => {
  const { enter, exit, pulse } = useScene();
  const hero = enter(0.1, 1.1) * exit(3.0, 0.7);
  const customer = enter(3.1, 0.9) * exit(5.7, 0.7);
  const store = enter(5.9, 0.9) * exit(8.2, 0.7);
  const fraud = enter(8.1, 0.9) * exit(10.4, 0.7);
  const final = enter(10.2, 0.9);
  const deviceProgress = enter(0.7, 1.0) * exit(10.0, 0.6);

  return (
    <AbsoluteFill style={{ background: palette.bg, fontFamily: "Inter, Arial, sans-serif", overflow: "hidden" }}>
      <BackgroundGrid />
      <div style={{ position: "absolute", top: 48, left: 62, right: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <BrandMark />
        <div style={{ color: palette.muted, fontSize: 18, fontWeight: 900 }}>{siteUrl.replace("https://", "")}</div>
      </div>

      <div style={{ position: "absolute", left: 74, top: 178, width: 710, opacity: hero, transform: `translateY(${px((1 - hero) * 34)})` }}>
        <div style={{ display: "inline-flex", border: `2px solid ${palette.muted}`, color: palette.muted, padding: "7px 13px", fontSize: 34, fontWeight: 950 }}>
          CR PH
        </div>
        <div style={{ marginTop: 22, fontSize: 82, fontWeight: 950, color: palette.text, lineHeight: 0.95, letterSpacing: -2.4 }}>
          Camera rental based on the Philippine market.
        </div>
        <div style={{ marginTop: 26, color: palette.muted, fontSize: 29, lineHeight: 1.28, fontWeight: 750 }}>
          CamRent PH connects renters with trusted camera stores and gives shops cleaner tools for inventory, applications, payments, and fraud-aware screening.
        </div>
      </div>

      <div style={{ position: "absolute", right: 78, top: 160 }}>
        <BrowserPreview progress={deviceProgress} />
      </div>

      <div style={{ position: "absolute", left: 74, bottom: 70, width: 1120, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <StatPill label="For renters" value="Browse" color={palette.blue} progress={customer} />
        <StatPill label="For stores" value="Manage" color={palette.green} progress={store} />
        <StatPill label="Protection" value="Screen" color={palette.red} progress={fraud} />
      </div>

      <div style={{ position: "absolute", left: 96, top: 196, width: 650, display: "grid", gap: 16, opacity: customer }}>
        {customerFeatures.map((item, index) => (
          <FeatureCard key={item.label} icon={item.icon} label={item.label} helper="A smoother rental path for customers." accent={palette.blue} progress={Math.min(1, Math.max(0, customer - index * 0.08))} />
        ))}
      </div>

      <div style={{ position: "absolute", left: 96, top: 196, width: 650, display: "grid", gap: 16, opacity: store }}>
        {storeFeatures.map((item, index) => (
          <FeatureCard key={item.label} icon={item.icon} label={item.label} helper="A compact operations surface for stores." accent={palette.green} progress={Math.min(1, Math.max(0, store - index * 0.08))} />
        ))}
      </div>

      <div style={{ position: "absolute", left: 92, top: 196, width: 710 }}>
        <FraudPanel progress={fraud} />
      </div>

      <div style={{ position: "absolute", right: 130, bottom: 86, width: 520 }}>
        <OwnerToolsPanel progress={store * pulse(4.8, 2.2)} />
      </div>

      <div style={{ position: "absolute", inset: "120px 120px auto 120px" }}>
        <FinalCard progress={final} mobile={false} siteUrl={siteUrl} />
      </div>
    </AbsoluteFill>
  );
};

const MobileIntro: React.FC<{ siteUrl: string }> = ({ siteUrl }) => {
  const { enter, exit } = useScene();
  const hero = enter(0.1, 1.0) * exit(3.0, 0.7);
  const customer = enter(3.1, 0.9) * exit(5.7, 0.7);
  const store = enter(5.9, 0.9) * exit(8.2, 0.7);
  const fraud = enter(8.1, 0.9) * exit(10.4, 0.7);
  const final = enter(10.2, 0.9);
  const phone = enter(0.9, 0.9) * exit(10.0, 0.6);

  return (
    <AbsoluteFill style={{ background: palette.bg, fontFamily: "Inter, Arial, sans-serif", overflow: "hidden" }}>
      <BackgroundGrid />
      <div style={{ position: "absolute", top: 72, left: 64, right: 64 }}>
        <BrandMark scale={1.25} />
      </div>

      <div style={{ position: "absolute", top: 220, left: 66, right: 66, opacity: hero, transform: `translateY(${px((1 - hero) * 28)})` }}>
        <div style={{ display: "inline-flex", border: `2px solid ${palette.muted}`, color: palette.muted, padding: "9px 15px", fontSize: 42, fontWeight: 950 }}>
          CR PH
        </div>
        <div style={{ marginTop: 28, fontSize: 78, fontWeight: 950, color: palette.text, lineHeight: 0.98, letterSpacing: -2 }}>
          Camera rentals made cleaner for PH renters and stores.
        </div>
      </div>

      <div style={{ position: "absolute", left: 50, right: 50, top: 575, display: "flex", justifyContent: "center" }}>
        <PhonePreview progress={phone} />
      </div>

      <div style={{ position: "absolute", left: 58, right: 58, bottom: 112, display: "grid", gap: 16, opacity: customer }}>
        {customerFeatures.map((item, index) => (
          <FeatureCard key={item.label} icon={item.icon} label={item.label} helper="For customers renting camera gear." accent={palette.blue} progress={Math.min(1, Math.max(0, customer - index * 0.08))} />
        ))}
      </div>

      <div style={{ position: "absolute", left: 58, right: 58, bottom: 112, display: "grid", gap: 16, opacity: store }}>
        {storeFeatures.map((item, index) => (
          <FeatureCard key={item.label} icon={item.icon} label={item.label} helper="For stores managing rental operations." accent={palette.green} progress={Math.min(1, Math.max(0, store - index * 0.08))} />
        ))}
      </div>

      <div style={{ position: "absolute", left: 58, right: 58, bottom: 108 }}>
        <FraudPanel progress={fraud} compact />
      </div>

      <div style={{ position: "absolute", left: 58, right: 58, bottom: 112 }}>
        <FinalCard progress={final} mobile siteUrl={siteUrl} />
      </div>
    </AbsoluteFill>
  );
};

const BackgroundGrid = () => {
  return (
    <>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(226,219,209,0.34) 1px, transparent 1px), linear-gradient(180deg, rgba(226,219,209,0.34) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 32,
          border: `1px solid ${palette.border}`,
          borderRadius: 46,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -120,
          bottom: 110,
          width: 720,
          height: 220,
          transform: "rotate(-18deg)",
          background: "rgba(217,162,106,0.2)",
          border: "1px solid rgba(217,162,106,0.22)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -80,
          top: 130,
          width: 620,
          height: 180,
          transform: "rotate(-18deg)",
          background: "rgba(255,255,255,0.48)",
          border: "1px solid rgba(226,219,209,0.65)",
        }}
      />
    </>
  );
};

export const CamRentIntro: React.FC<CamRentIntroProps> = ({ layout, siteUrl }) => {
  return layout === "mobile" ? <MobileIntro siteUrl={siteUrl} /> : <DesktopIntro siteUrl={siteUrl} />;
};
