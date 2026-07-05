import { requireProfile } from "@/lib/auth";
import { TopNav } from "@/components/SideNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  return (
    <>
      <TopNav
        nome={profile.nome || profile.email || "Membro"}
        items={[
          { href: "/app/minhas-cotas", label: "Minhas cotas" },
          { href: "/app/aderir", label: "Entrar num grupo" },
          { href: "/app/perfil", label: "Meu cadastro" },
        ]}
      />
      <main className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        {children}
      </main>
    </>
  );
}
