import type { FieldErrors } from "@/lib/validation";

export type FormState = {
  error?: string;
  details?: string[];
  success?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
  multi?: Record<string, string[]>;
};

export const initialFormState: FormState = {};

export function formValues(formData: FormData, skip: string[] = []): Record<string, string> {
  const values: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !key.startsWith("$") && !skip.includes(key)) values[key] = value;
  });
  return values;
}

export function multiValues(formData: FormData, names: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const name of names) result[name] = formData.getAll(name).filter((v): v is string => typeof v === "string");
  return result;
}

export function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}
