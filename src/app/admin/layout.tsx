import { requireAdmin } from "@/lib/auth";
import { TopNav } from "@/components/SideNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  return (
    <>
      <TopNav
        nome={profile.nome || "Admin"}
        items={[
          { href: "/admin/dashboard", label: "Painel" },
          { href: "/admin/financeiro", label: "Financeiro" },
          { href: "/admin/grupos", label: "Grupos" },
          { href: "/admin/cotas", label: "Cotas" },
          { href: "/admin/cobrancas", label: "Cobranças" },
          { href: "/admin/inadimplencia", label: "Inadimplência" },
          { href: "/admin/contemplacao", label: "Contemplação" },
        ]}
      />
      <main className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        {children}
      </main>
    </>
  );
}
