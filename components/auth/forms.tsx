"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, requestPasswordReset, updatePassword } from "@/app/actions/auth";
import { initialFormState } from "@/app/actions/types";
import { Field, FormMessage, SubmitButton } from "@/components/form";

export function RegisterForm() {
  const [state, action] = useActionState(register, initialFormState);
  if (state.success) return <FormMessage state={state} />;
  return (
    <form action={action} className="stack" noValidate>
      <FormMessage state={state} />
      <Field name="fullName" label="Full name" state={state} required autoComplete="name" />
      <Field name="email" label="Email" type="email" state={state} required autoComplete="email" />
      <Field name="password" label="Password" type="password" state={state} required autoComplete="new-password" hint="At least 8 characters." />
      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
      <p className="muted">
        Already registered? <Link href="/login">Log in</Link>
      </p>
    </form>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, initialFormState);
  return (
    <form action={action} className="stack" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <Field name="email" label="Email" type="email" state={state} required autoComplete="email" />
      <Field name="password" label="Password" type="password" state={state} required autoComplete="current-password" />
      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
      <p className="muted">
        <Link href="/forgot-password">Forgot your password?</Link> · New here? <Link href="/register">Create an account</Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, initialFormState);
  if (state.success) return <FormMessage state={state} />;
  return (
    <form action={action} className="stack" noValidate>
      <FormMessage state={state} />
      <Field name="email" label="Email" type="email" state={state} required autoComplete="email" />
      <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
      <p className="muted">
        Remembered it? <Link href="/login">Log in</Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, initialFormState);
  return (
    <form action={action} className="stack" noValidate>
      <FormMessage state={state} />
      <Field name="password" label="New password" type="password" state={state} required autoComplete="new-password" hint="At least 8 characters." />
      <Field name="confirm" label="Type it again" type="password" state={state} required autoComplete="new-password" />
      <SubmitButton pendingText="Saving…">Save new password</SubmitButton>
    </form>
  );
}
