import type { Metadata } from "next";
import { addTaxonomy, updateTaxonomy, type TaxonomyKind } from "@/app/actions/admin";
import { ActionForm, Checkbox, Field, SubmitButton } from "@/components/form";
import { requireAdmin } from "@/lib/auth";
import { loadTaxonomy } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Stages, sectors and needs" };

type Item = { id: number; name: string; description?: string | null; sort_order: number; is_active: boolean };

function TaxonomySection({ kind, title, intro, items, hasDescription }: { kind: TaxonomyKind; title: string; intro: string; items: Item[]; hasDescription: boolean }) {
  return (
    <section className="card stack" aria-labelledby={`tx-${kind}`}>
      <h2 id={`tx-${kind}`} className="h3">
        {title}
      </h2>
      <p className="muted small">{intro}</p>
      <ul className="plain stack-tight">
        {items.map((item) => (
          <li key={item.id}>
            <details>
              <summary>
                {item.name} {item.is_active ? null : <span className="badge badge-quiet">Hidden</span>}
              </summary>
              <ActionForm action={updateTaxonomy.bind(null, kind, item.id)} id={`edit-${kind}-${item.id}`}>
                <Field name="name" label="Name" defaultValue={item.name} required />
                {hasDescription ? <Field name="description" label="Description" defaultValue={item.description} /> : null}
                <Field name="sort_order" label="Order" type="number" min="0" max="999" defaultValue={item.sort_order} required />
                <Checkbox name="is_active" label="Show as a choice" defaultChecked={item.is_active} />
                <SubmitButton small>Save</SubmitButton>
              </ActionForm>
            </details>
          </li>
        ))}
      </ul>
      <details>
        <summary>Add to {title.toLowerCase()}</summary>
        <ActionForm action={addTaxonomy.bind(null, kind)}>
          <Field name="name" label="Name" required />
          {hasDescription ? <Field name="description" label="Description" /> : null}
          <Field name="sort_order" label="Order" type="number" min="0" max="999" defaultValue={100} required />
          <SubmitButton small>Add</SubmitButton>
        </ActionForm>
      </details>
    </section>
  );
}

export default async function AdminTaxonomyPage() {
  const { supabase } = await requireAdmin("/admin/taxonomy");
  const taxonomy = await loadTaxonomy(supabase, { includeInactive: true });
  return (
    <>
      <h1>Stages, sectors and support needs</h1>
      <p className="muted">
        These lists power the founder profile, centre profiles, directory filters and recommendations. Hiding an item keeps it on existing
        profiles but removes it from new choices. Items in use can&apos;t be deleted.
      </p>
      <div className="stack">
        <TaxonomySection kind="stages" title="Stages" intro="The stages a founder can choose." items={taxonomy.stages} hasDescription />
        <TaxonomySection kind="sectors" title="Sectors" intro="Industry sectors for startups and centre expertise." items={taxonomy.sectors} hasDescription={false} />
        <TaxonomySection kind="needs" title="Support needs" intro="What founders need and what centres offer." items={taxonomy.needs} hasDescription />
      </div>
    </>
  );
}
