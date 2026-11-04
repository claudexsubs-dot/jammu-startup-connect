import { messageForCode } from "@/lib/errors";

const NOTICES: Record<string, string> = {
  saved: "Your changes were saved.",
  created: "Created.",
  deleted: "Deleted.",
  "password-updated": "Your password was changed.",
  "profile-started": "Your venture profile was created as a draft. Keep going to complete it.",
  submitted: "Your application was submitted. The centre will review it and you'll see updates here.",
  "draft-deleted": "The draft application was deleted.",
  "response-sent": "Your reply was sent to the centre.",
  "status-updated": "The application status was updated and the founder was notified.",
  "message-sent": "Message sent.",
  archived: "Conversation archived.",
  unarchived: "Conversation moved back to your inbox.",
  reported: "Thanks. Your report was sent to the platform administrator.",
  "booking-requested": "Your request was sent. It stays pending until the expert confirms it.",
  "booking-updated": "The booking was updated and the founder was notified.",
  "booking-cancelled": "The request was cancelled.",
  "proposal-accepted": "You accepted the new time. The expert will confirm the session.",
  "invite-accepted": "Invitation accepted. Welcome aboard.",
  "staff-revoked": "Staff access was removed.",
  "invitation-revoked": "The invitation was withdrawn.",
  "slot-added": "Availability added.",
  "slot-removed": "The slot was removed.",
  "user-updated": "The account was updated.",
  "report-updated": "The report was updated.",
  "expert-activated": "The profile is active and visible to founders.",
  "expert-deactivated": "The profile is inactive. Founders can't see it or send new requests.",
  "centre-status": "The centre's status was changed and its staff were notified.",
  "staff-invited": "Invitation created.",
  "taxonomy-saved": "Saved. The change shows across the platform straight away.",
  "message-hidden": "The message was hidden from both sides of the conversation.",
};

export function Notice({ code, error }: { code?: string; error?: string }) {
  const errorText = messageForCode(error) ?? (error ? "Something went wrong. Please try again." : undefined);
  if (errorText) {
    return (
      <p className="alert alert-error" role="alert">
        {errorText}
      </p>
    );
  }
  const text = code ? NOTICES[code] : undefined;
  if (!text) return null;
  return (
    <p className="alert alert-success" role="status">
      {text}
    </p>
  );
}
