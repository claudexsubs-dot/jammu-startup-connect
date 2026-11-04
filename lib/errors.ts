// Friendly wording for the error codes raised by the database functions.
const MESSAGES: Record<string, string> = {
  not_signed_in: "Please log in first.",
  account_suspended: "Your account is suspended, so you can't make changes. Contact the platform administrator.",
  not_allowed: "You don't have permission to do that.",
  not_found: "We couldn't find that. It may have been removed.",
  no_startup: "Create your venture profile first.",
  centre_not_found: "This centre is no longer listed.",
  centre_suspended: "This centre is suspended right now, so it can't take new applications or messages.",
  not_accepting: "This centre isn't accepting applications at the moment.",
  not_editable: "This application has already been submitted, so it can't be edited.",
  already_submitted: "This application has already been submitted.",
  profile_incomplete: "Your venture profile is missing some required details.",
  response_required: "Write a reply before sending.",
  invalid_transition: "That change isn't possible from the current status.",
  note_required: "Tell the founder what information you need.",
  message_required: "Write a message before sending.",
  founder_needs_application: "You can message a centre once you've submitted an application to it.",
  reason_required: "Tell us briefly what happened (at least 5 characters).",
  already_staff: "That person is already on this centre's staff.",
  expert_already_linked: "This expert profile is already linked to an account.",
  invitation_invalid: "This invitation has expired or was withdrawn. Ask for a new one.",
  invitation_wrong_account: "This invitation was sent to a different email address. Log in with the invited email.",
  slot_unavailable: "That time is no longer available. Please choose another slot.",
  slot_in_past: "Choose a time in the future.",
  slot_has_booking: "This slot has a live booking request. Decline or cancel it first.",
  expert_unavailable: "This expert isn't taking requests right now.",
  policy_admitted_only: "This expert only works with startups admitted to their centre.",
  policy_pre_admission: "This expert offers pre-admission support only, and your startup is already admitted to their centre.",
  format_not_offered: "This expert doesn't offer that session format.",
  payment_instructions_required: "Write the payment instructions before sending.",
  meeting_link_required: "Add the meeting link for this online session.",
  meeting_location_required: "Add the meeting place for this in-person session.",
  session_not_started: "You can mark the outcome once the session time has started.",
  invalid_action: "That action isn't available.",
  cannot_suspend_self: "You can't suspend your own account.",
  admin_only_fields: "Only the platform administrator can change that.",
  expert_link_requires_invitation: "Experts are linked to accounts through an invitation.",
  staff_only_fields: "Only centre staff can change that.",
  expert_in_use: "This person has bookings on record, so their profile can't be deleted. Deactivate it instead.",
  centre_in_use: "This centre has applications, bookings or conversations on record, so it can't be deleted. Remove it from the platform (archive) instead.",
  in_use_startup: "Your startup has applications, bookings or conversations, so it can't be deleted. Those records are kept for the centres involved.",
};

type DbError = { message?: string; code?: string; details?: string | null } | null | undefined;

export function errorCode(error: DbError) {
  if (!error) return null;
  const message = error.message ?? "";
  if (MESSAGES[message]) return message;
  if (error.code === "23505") return "duplicate";
  if (error.code === "23P01") return "overlap";
  if (error.code === "23503") return "in_use";
  if (error.code === "23514") return "invalid_value";
  if (error.code === "42501") return "not_allowed";
  return "unknown";
}

export function friendlyError(error: DbError, fallback = "Something went wrong. Please try again.") {
  const code = errorCode(error);
  if (!code) return null;
  if (MESSAGES[code]) return MESSAGES[code];
  if (code === "duplicate") return "That already exists.";
  if (code === "overlap") return "That time overlaps another slot for this expert.";
  if (code === "in_use") return "This is still in use elsewhere, so it can't be removed. Deactivate it instead.";
  if (code === "invalid_value") return "One of the values isn't valid. Check the form and try again.";
  return fallback;
}

export function messageForCode(code: string | undefined) {
  return code ? MESSAGES[code] : undefined;
}
