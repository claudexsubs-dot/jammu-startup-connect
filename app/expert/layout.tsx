import { SubNav } from "@/components/sub-nav";
import { denyAccess, requireUser } from "@/lib/auth";

// Pages for mentors and experts who have linked their own account to a centre's expert profile.
export default async function ExpertLayout({ children }: { children: React.ReactNode }) {
  const { experts } = await requireUser("/expert");
  if (!experts.length) return denyAccess("/expert");
  return (
    <>
      <div className="dashboard-head">
        <p className="eyebrow">Mentor and expert workspace</p>
      </div>
      <SubNav
        label="Expert sections"
        items={[{ href: "/expert", label: "Requests and sessions" }, ...experts.map((e) => ({ href: `/expert/${e.id}`, label: experts.length > 1 ? `${e.center_name}: profile and availability` : "Profile and availability" }))]}
      />
      <div className="dashboard-body">{children}</div>
    </>
  );
}
