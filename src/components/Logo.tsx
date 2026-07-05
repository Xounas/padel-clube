import Link from "next/link";

/** Marca RaqueteClub — ícone (raquete + bola) + wordmark. */
export function Logo({
  size = 30,
  withText = true,
  href = "/",
}: {
  size?: number;
  withText?: boolean;
  href?: string | null;
}) {
  const mark = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="rqc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1570e6" />
            <stop offset="1" stopColor="#0a2540" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#rqc)" />
        {/* raquete */}
        <ellipse
          cx="20"
          cy="16.5"
          rx="8"
          ry="9.5"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.4"
        />
        <rect x="18.7" y="24.5" width="2.6" height="8.5" rx="1.3" fill="#ffffff" />
        {/* bola */}
        <circle cx="20" cy="16.5" r="3.1" fill="#16c07a" />
      </svg>
      {withText && (
        <span
          style={{
            fontWeight: 800,
            letterSpacing: "-0.02em",
            fontSize: size * 0.62,
            color: "var(--navy)",
          }}
        >
          Raquete<span style={{ color: "var(--primary)" }}>Club</span>
        </span>
      )}
    </span>
  );

  if (!href) return mark;
  return (
    <Link href={href} style={{ display: "inline-flex" }}>
      {mark}
    </Link>
  );
}
