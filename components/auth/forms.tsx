"use client";

import Link from "next/link";
import { login, register, registerInvitee, requestPasswordReset, updatePassword } from "@/app/actions/auth";
import { ActionForm, Checkbox, Field, Select, SubmitButton } from "@/components/form";
import { DISTRICTS } from "@/lib/options";

export function RegisterForm() {
  return (
    <ActionForm action={register} hideSuccessForm>
      <Field name="fullName" label="Full name" required autoComplete="name" />
      <Field name="email" label="Email" type="email" required autoComplete="email" />
      <Field name="password" label="Password" type="password" required autoComplete="new-password" hint="At least 8 characters." />
      <div className="grid-2">
        <Field name="phone" label="Phone" type="tel" autoComplete="tel" inputMode="tel" hint="Kept private unless you choose to share it." />
        <Select name="district" label="District" required options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
      </div>
      <Field name="city" label="City or town" autoComplete="address-level2" />
      <fieldset>
        <legend>Declaration</legend>
        <Checkbox
          name="domicile"
          label="I declare that I am domiciled in Jammu (the Jammu division of Jammu and Kashmir)."
          hint="This is a self-declaration. We don't ask for documents now. Proof may be requested later by a funding body, outside UdyamSetu."
        />
        <Checkbox
          name="consent"
          label="I agree that incubation centres on UdyamSetu can see my startup profile. My email and phone stay private unless I choose to share them."
        />
      </fieldset>
      <SubmitButton pendingText="Creating account…">Create founder account</SubmitButton>
      <p className="muted">
        Already registered? <Link href="/login">Log in</Link>. Invited as centre staff or an expert? Use the link in your
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
      <p className="muted">
        <Link href="/forgot-password">Forgot your password?</Link> · New founder? <Link href="/register">Create an account</Link>
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
