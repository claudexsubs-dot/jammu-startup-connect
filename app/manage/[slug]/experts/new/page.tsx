import type { Metadata } from "next";
import Link from "next/link";
import { createExpert } from "@/app/actions/experts";
import { ExpertForm } from "@/components/experts/expert-form";
import { requireCentreStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Add a mentor or expert" };

export default async function NewExpertPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { centre } = await requireCentreStaff(slug, `/manage/${slug}/experts/new`);
  return (
    <section className="narrow">
      <p className="breadcrumbs">
        <Link href={`/manage/${slug}/experts`}>Mentors and experts</Link>
      </p>
      <h2>Add a mentor or expert</h2>
      {centre.status !== "active" ? (
        <p className="alert alert-error">The centre is suspended, so new profiles can&apos;t be added.</p>
      ) : (
        <ExpertForm action={createExpert.bind(null, centre.id, slug)} expert={null} submitLabel="Add and continue" />
      )}
    </section>
  );
}
