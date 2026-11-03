const NOTICES: Record<string, string> = {
  created: "Your startup profile was created. It's a private draft until you publish it.",
  saved: "Your changes were saved.",
  deleted: "The startup was deleted.",
  "password-updated": "Your password was changed.",
};

export function Notice({ code }: { code?: string }) {
  const text = code ? NOTICES[code] : undefined;
  if (!text) return null;
  return (
    <p className="alert alert-success" role="status">
      {text}
    </p>
  );
}
