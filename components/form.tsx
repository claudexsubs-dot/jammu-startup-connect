"use client";

import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions/types";

export function SubmitButton({ children, pendingText, variant = "primary" }: { children: React.ReactNode; pendingText?: string; variant?: "primary" | "secondary" | "danger" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn btn-${variant}`} disabled={pending} aria-busy={pending}>
      {pending ? (pendingText ?? "Saving…") : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p className="alert alert-error" role="alert">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="alert alert-success" role="status">
        {state.success}
      </p>
    );
  }
  return null;
}

type FieldProps = {
  name: string;
  label: string;
  state: FormState;
  hint?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  max?: string;
};

export function Field({ name, label, state, hint, defaultValue, required, type = "text", autoComplete, placeholder, inputMode, max }: FieldProps) {
  const error = state.fieldErrors?.[name];
  const value = state.values?.[name] ?? (defaultValue === null || defaultValue === undefined ? "" : String(defaultValue));
  const describedBy = [hint ? `${name}-hint` : null, error ? `${name}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required ? null : <span className="optional"> (optional)</span>}
      </label>
      {hint ? (
        <p className="hint" id={`${name}-hint`}>
          {hint}
        </p>
      ) : null}
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={type === "password" ? undefined : value}
        key={type === "password" ? undefined : value}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        max={max}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {error ? (
        <p className="field-error" id={`${name}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextArea({ name, label, state, hint, defaultValue, required, rows = 4 }: Omit<FieldProps, "type"> & { rows?: number }) {
  const error = state.fieldErrors?.[name];
  const value = state.values?.[name] ?? defaultValue ?? "";
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required ? null : <span className="optional"> (optional)</span>}
      </label>
      {hint ? (
        <p className="hint" id={`${name}-hint`}>
          {hint}
        </p>
      ) : null}
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={String(value)}
        key={String(value)}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
      />
      {error ? (
        <p className="field-error" id={`${name}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Select({
  name,
  label,
  state,
  options,
  defaultValue,
  required,
  placeholder = "Choose…",
  hint,
}: {
  name: string;
  label: string;
  state: FormState;
  options: { value: string; label: string }[];
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  const error = state.fieldErrors?.[name];
  const value = state.values?.[name] ?? (defaultValue === null || defaultValue === undefined ? "" : String(defaultValue));
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required ? null : <span className="optional"> (optional)</span>}
      </label>
      {hint ? (
        <p className="hint" id={`${name}-hint`}>
          {hint}
        </p>
      ) : null}
      <select
        id={name}
        name={name}
        defaultValue={value}
        key={value}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="field-error" id={`${name}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({ name, label, state, defaultChecked, hint }: { name: string; label: string; state: FormState; defaultChecked?: boolean; hint?: string }) {
  const checked = state.values ? state.values[name] === "on" : Boolean(defaultChecked);
  return (
    <div className="field field-checkbox">
      <input id={name} name={name} type="checkbox" defaultChecked={checked} key={String(checked)} />
      <label htmlFor={name}>
        {label}
        {hint ? <span className="hint-inline"> {hint}</span> : null}
      </label>
    </div>
  );
}
