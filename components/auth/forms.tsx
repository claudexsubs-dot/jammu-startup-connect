"use client";

import Link from "next/link";
import { login, register, registerInvitee, requestPasswordReset, updatePassword } from "@/app/actions/auth";
import { ActionForm, Checkbox, Field, Select, SubmitButton } from "@/components/form";
import { DISTRICTS } from "@/lib/options";

export function RegisterForm({ next }: { next?: string }) {
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  return (
    <ActionForm action={register} hideSuccessForm>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field name="fullName" label="Full name" required autoComplete="name" />
      <Field name="email" label="Email" type="email" required autoComplete="email" />
      <div className="grid-2">
        <Field name="password" label="Password" type="password" required autoComplete="new-password" hint="At least 8 characters." />
        <Select name="district" label="Your district" required options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
      </div>
      <div className="declaration">
        <Checkbox
          name="domicile"
          label="I'm domiciled in Jammu (the Jammu division of J&K), and I agree that incubation centres on UdyamSetu can see my startup profile."
          hint="A self-declaration: no documents needed. Your email and phone stay private unless you choose to share them."
        />
      </div>
      <SubmitButton pendingText="Creating account…">Create free account</SubmitButton>
      <p className="muted small" style={{ margin: 0 }}>
        Already registered? <Link href={loginHref}>Log in</Link>. Invited as centre staff or an expert? Use the link in your
        invitation.
      </p>
    </ActionForm>
  );
}

export function InviteeRegisterForm({ token, email }: { token: string; email?: string }) {
  return (
    <ActionForm action={registerInvitee.bind(null, token)} hideSuccessForm>
      <Field name="fullName" label="Full name" required autoComplete="name" />
      <Field name="email" label="Email" type="email" required autoComplete="email" defaultValue={email} hint="Use the address the invitation was sent to." />
      <Field name="password" label="Password" type="password" required autoComplete="new-password" hint="At least 8 characters." />
      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
    </ActionForm>
  );
}

export function LoginForm({ next }: { next?: string }) {
  return (
    <ActionForm action={login}>
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <Field name="email" label="Email" type="email" required autoComplete="email" />
      <Field name="password" label="Password" type="password" required autoComplete="current-password" />
      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
      <p className="muted small" style={{ margin: 0 }}>
        <Link href="/forgot-password">Forgot your password?</Link> · New founder?{" "}
        <Link href={next && next !== "/dashboard" ? `/register?next=${encodeURIComponent(next)}` : "/register"}>Create a free account</Link>
      </p>
    </ActionForm>
  );
}

export function ForgotPasswordForm() {
  return (
    <ActionForm action={requestPasswordReset} hideSuccessForm>
      <Field name="email" label="Email" type="email" required autoComplete="email" />
      <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
      <p className="muted">
        Remembered it? <Link href="/login">Log in</Link>
      </p>
    </ActionForm>
  );
}

export function ResetPasswordForm() {
  return (
    <ActionForm action={updatePassword}>
      <Field name="password" label="New password" type="password" required autoComplete="new-password" hint="At least 8 characters." />
      <Field name="confirm" label="Type it again" type="password" required autoComplete="new-password" />
      <SubmitButton pendingText="Saving…">Save new password</SubmitButton>
    </ActionForm>
  );
}
