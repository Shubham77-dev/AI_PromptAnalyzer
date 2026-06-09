/** Fixed locale + UTC — avoids SSR/client hydration mismatches from system locale. */
const STABLE_DATE_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
};

const STABLE_DATETIME_OPTS: Intl.DateTimeFormatOptions = {
  ...STABLE_DATE_OPTS,
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
};

export function formatDateStable(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", STABLE_DATE_OPTS).format(date);
}

export function formatDateTimeStable(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", STABLE_DATETIME_OPTS).format(date);
}

export function formatTimeAgo(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDateStable(date);
}
