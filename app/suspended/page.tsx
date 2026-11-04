import type { Metadata } from "next";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Account suspended" };

export default async function SuspendedPage() {
  const { profile } = await getViewer();
  return (
    <section className="narrow">
      <h1>Your account is suspended</h1>
      <p>
        The platform administrator has suspended this account, so you can&apos;t use UdyamSetu right now. Your past
        applications and messages are kept.
      </p>
      {profile?.suspension_reason ? (
        <p className="alert alert-info">
          <strong>Reason given:</strong> {profile.suspension_reason}
        </p>
      ) : null}
    </section>
  );
}
