const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const TIME_ZONE = "Asia/Kolkata";

export function formatInr(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : inr.format(value);
}

// A calendar date such as 2026-11-04.
export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = value.length === 10 ? new Date(`${value}T00:00:00+05:30`) : new Date(value);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });
}

export function formatTimeRange(start: string, end: string) {
  const day = new Date(start).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: TIME_ZONE });
  const time = (value: string) => new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });
  return `${day}, ${time(start)} – ${time(end)}`;
}

// "In 3 hours", "Tomorrow" style reminders for upcoming sessions.
export function timeUntil(value: string, now = new Date()) {
  const ms = new Date(value).getTime() - now.getTime();
  if (ms <= 0) return "Started";
  const hours = Math.round(ms / 3_600_000);
  if (hours < 1) return "In less than an hour";
  if (hours < 24) return `In ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Tomorrow" : `In ${days} days`;
}

// Turns a datetime-local input value (India time) into an ISO timestamp.
export function istLocalToIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+05:30`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function initials(name: string | null | undefined) {
  return (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

// The calendar day (India time) a moment falls on, as YYYY-MM-DD.
export function istDayKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: TIME_ZONE });
}

// "Today, 3:00 pm", "Tomorrow, 10:00 am" or "Thu 6 Nov, 10:00 am".
export function formatSlotShort(value: string, now = new Date()) {
  const key = istDayKey(value);
  const today = istDayKey(now);
  const tomorrow = istDayKey(new Date(now.getTime() + 86_400_000));
  const day =
    key === today
      ? "Today"
      : key === tomorrow
        ? "Tomorrow"
        : new Date(value).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: TIME_ZONE });
  return `${day}, ${formatTime(value)}`;
}
