"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { readCentreForm, readCentreSource, saveCentreLinks } from "@/lib/centre-form";
import { errorCode, friendlyError } from "@/lib/errors";
import { toFieldErrors } from "@/lib/validation";
import { formValues, type FormState } from "./types";

// Centre staff (and the master admin) edit a centre's public profile.
export async function updateCentreProfile(centreId: string, returnPath: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const { parsed, multi } = readCentreForm(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values, multi };
  const { stage_ids, sector_ids, service_ids, ...fields } = parsed.data;
  const source = readCentreSource(formData);
  if (source.error) return { fieldErrors: source.error, values, multi };

  const { supabase } = await requireUser(returnPath);
  const { data, error } = await supabase.from("incubation_centers").update({ ...fields, ...source.fields }).eq("id", centreId).select("slug").maybeSingle();
  if (error || !data) {
    if (!data || errorCode(error) === "not_allowed") await supabase.rpc("log_access_denied", { p_path: returnPath });
    return { error: friendlyError(error) ?? "You don't have permission to edit this centre.", values, multi };
  }
  const linkError = await saveCentreLinks(supabase, centreId, { stage_ids, sector_ids, service_ids });
  if (linkError) return { error: friendlyError(linkError) ?? undefined, values, multi };

  revalidatePath(returnPath);
  revalidatePath(`/centres/${data.slug}`);
  revalidatePath("/centres");
  return { success: "The centre profile was saved." };
}
