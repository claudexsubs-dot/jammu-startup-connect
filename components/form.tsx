"use client";

import { createContext, useActionState, useContext } from "react";
import { useFormStatus } from "react-dom";
import { initialFormState, type FormState } from "@/app/actions/types";

const FormStateContext = createContext<FormState>(initialFormState);

function useFieldState(state?: FormState) {
  const fromContext = useContext(FormStateContext);
  return state ?? fromContext;
}

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

// A form wired to a server action. Fields inside it show that action's errors.
export function ActionForm({
  action,
  children,
  className = "stack",
  hideSuccessForm = false,
  id,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  hideSuccessForm?: boolean;
  id?: string;
}) {
  const [state, formAction] = useActionState(action, initialFormState);
  if (hideSuccessForm && state.success) return <FormMessage state={state} />;
  return (
    <FormStateContext.Provider value={state}>
      <form action={formAction} className={className} noValidate id={id}>
        <FormMessage state={state} />
        {children}
      </form>
    </FormStateContext.Provider>
  );
}

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  small = false,
  name,
  value,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger";
  small?: boolean;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`btn btn-${variant}${small ? " btn-small" : ""}`} disabled={pending} aria-busy={pending} name={name} value={value}>
      {pending ? (pendingText ?? "Saving…") : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <div className="alert alert-error" role="alert">
        <p>{state.error}</p>
        {state.details?.length ? (
          <ul>
            {state.details.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
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
  state?: FormState;
  hint?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  max?: string;
  min?: string;
  step?: string;
};

function describedBy(name: string, hint?: string, error?: string) {
  return [hint ? `${name}-hint` : null, error ? `${name}-error` : null].filter(Boolean).join(" ") || undefined;
}

function Label({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={name}>
      {label}
      {required ? null : <span className="optional"> (optional)</span>}
    </label>
  );
}

function Hint({ name, hint }: { name: string; hint?: string }) {
  return hint ? (
    <p className="hint" id={`${name}-hint`}>
      {hint}
    </p>
  ) : null;
}

function ErrorText({ name, error }: { name: string; error?: string }) {
  return error ? (
    <p className="field-error" id={`${name}-error`}>
      {error}
    </p>
  ) : null;
}

export function Field({ name, label, state: stateProp, hint, defaultValue, required, type = "text", autoComplete, placeholder, inputMode, max, min, step }: FieldProps) {
  const state = useFieldState(stateProp);
  const error = state.fieldErrors?.[name];
  const value = state.values?.[name] ?? (defaultValue === null || defaultValue === undefined ? "" : String(defaultValue));
  return (
    <div className="field">
      <Label name={name} label={label} required={required} />
      <Hint name={name} hint={hint} />
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
        min={min}
        step={step}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
      />
      <ErrorText name={name} error={error} />
    </div>
  );
}

export function TextArea({ name, label, state: stateProp, hint, defaultValue, required, rows = 4 }: Omit<FieldProps, "type"> & { rows?: number }) {
  const state = useFieldState(stateProp);
  const error = state.fieldErrors?.[name];
  const value = state.values?.[name] ?? defaultValue ?? "";
  return (
    <div className="field">
      <Label name={name} label={label} required={required} />
      <Hint name={name} hint={hint} />
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={String(value)}
        key={String(value)}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
      />
      <ErrorText name={name} error={error} />
    </div>
  );
}

export function Select({
  name,
  label,
  state: stateProp,
  options,
  defaultValue,
  required,
  placeholder = "Choose…",
  hint,
}: {
  name: string;
  label: string;
  state?: FormState;
  options: { value: string; label: string }[];
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string | null;
  hint?: string;
}) {
  const state = useFieldState(stateProp);
  const error = state.fieldErrors?.[name];
  const value = state.values?.[name] ?? (defaultValue === null || defaultValue === undefined ? "" : String(defaultValue));
  return (
    <div className="field">
      <Label name={name} label={label} required={required} />
      <Hint name={name} hint={hint} />
      <select
        id={name}
        name={name}
        defaultValue={value}
        key={value}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
      >
        {placeholder === null ? null : <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ErrorText name={name} error={error} />
    </div>
  );
}

export function Checkbox({
  name,
  label,
  state: stateProp,
  defaultChecked,
  hint,
}: {
  name: string;
  label: React.ReactNode;
  state?: FormState;
  defaultChecked?: boolean;
  hint?: string;
}) {
  const state = useFieldState(stateProp);
  const error = state.fieldErrors?.[name];
  const checked = state.values ? state.values[name] === "on" : Boolean(defaultChecked);
  return (
    <div className="field">
      <div className="field-checkbox">
        <input
          id={name}
          name={name}
          type="checkbox"
          defaultChecked={checked}
          key={String(checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(name, hint, error)}
        />
        <label htmlFor={name}>{label}</label>
      </div>
      <Hint name={name} hint={hint} />
      <ErrorText name={name} error={error} />
    </div>
  );
}

// A set of checkboxes that submits every ticked value under one name.
export function CheckboxGroup({
  name,
  legend,
  options,
  defaultValues = [],
  state: stateProp,
  hint,
  required,
}: {
  name: string;
  legend: string;
  options: { value: string; label: string; description?: string | null }[];
  defaultValues?: string[];
  state?: FormState;
  hint?: string;
  required?: boolean;
}) {
  const state = useFieldState(stateProp);
  const error = state.fieldErrors?.[name];
  const selected = state.multi?.[name] ?? defaultValues;
  return (
    <fieldset className="checkbox-group" aria-describedby={describedBy(name, hint, error)}>
      <legend>
        {legend}
        {required ? null : <span className="optional"> (optional)</span>}
      </legend>
      <Hint name={name} hint={hint} />
      <div className="checkbox-grid">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          return (
            <div className="field-checkbox" key={option.value}>
              <input id={id} type="checkbox" name={name} value={option.value} defaultChecked={selected.includes(option.value)} key={`${id}-${selected.join(",")}`} />
              <label htmlFor={id}>
                {option.label}
                {option.description ? <span className="hint-inline"> {option.description}</span> : null}
              </label>
            </div>
          );
        })}
      </div>
      <ErrorText name={name} error={error} />
    </fieldset>
  );
}

export function RadioGroup({
  name,
  legend,
  options,
  defaultValue,
  state: stateProp,
  hint,
}: {
  name: string;
  legend: string;
  options: { value: string; label: string; description?: string }[];
  defaultValue?: string | null;
  state?: FormState;
  hint?: string;
}) {
  const state = useFieldState(stateProp);
  const error = state.fieldErrors?.[name];
  const value = state.values?.[name] ?? defaultValue ?? "";
  return (
    <fieldset className="checkbox-group" aria-describedby={describedBy(name, hint, error)}>
      <legend>{legend}</legend>
      <Hint name={name} hint={hint} />
      {options.map((option) => {
        const id = `${name}-${option.value}`;
        return (
          <div className="field-checkbox" key={option.value}>
            <input id={id} type="radio" name={name} value={option.value} defaultChecked={value === option.value} key={`${id}-${value}`} />
            <label htmlFor={id}>
              {option.label}
              {option.description ? <span className="hint-inline"> {option.description}</span> : null}
            </label>
          </div>
        );
      })}
      <ErrorText name={name} error={error} />
    </fieldset>
  );
}
