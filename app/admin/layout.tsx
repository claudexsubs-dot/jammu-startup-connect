import { SubNav } from "@/components/sub-nav";
import { requireAdmin } from "@/lib/auth";

// Master admin pages. Every page also checks the role itself.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin("/admin");
  return (
    <>
      <div className="dashboard-head">
        <p className="eyebrow">Master admin</p>
      </div>
      <SubNav
        label="Admin sections"
        items={[
          { href: "/admin", label: "Overview" },
          { href: "/admin/centres", label: "Centres and staff" },
          { href: "/admin/users", label: "Users" },
          { href: "/admin/reports", label: "Reports" },
          { href: "/admin/taxonomy", label: "Stages, sectors and needs" },
          { href: "/admin/audit", label: "Audit history" },
        ]}
      />
      <div className="dashboard-body">{children}</div>
    </>
  );
}
