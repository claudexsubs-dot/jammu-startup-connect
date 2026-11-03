import type { FieldErrors } from "@/lib/validation";

export type FormState = {
  error?: string;
  success?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
};

export const initialFormState: FormState = {};

export function formValues(formData: FormData, skip: string[] = []): Record<string, string> {
  const values: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !key.startsWith("$") && !skip.includes(key)) values[key] = value;
  });
  return values;
}
