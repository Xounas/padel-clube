"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopNav({
  items,
  nome,
}: {
  items: { href: string; label: string }[];
  nome: string;
}) {
  const path = usePathname();
  return (
    <nav className="nav">
      <div
        className="container spread"
        style={{ height: 58, flexWrap: "wrap" }}
      >
        <div className="row" style={{ gap: 4 }}>
          <Link href="/" className="brand" style={{ marginRight: 12 }}>
            Padel<span> Clube</span>
          </Link>
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={path.startsWith(it.href) ? "active" : ""}
            >
              {it.label}
            </Link>
          ))}
        </div>
        <div className="row">
          <span className="muted small">{nome}</span>
          <form action="/auth/signout" method="post">
            <button className="btn btn-ghost small" type="submit">
              Sair
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
