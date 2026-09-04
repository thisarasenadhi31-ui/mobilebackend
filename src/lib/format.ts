const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const ABSOLUTE = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60_000],
  ["month", 30 * 24 * 60 * 60_000],
  ["day", 24 * 60 * 60_000],
  ["hour", 60 * 60_000],
  ["minute", 60_000],
];

/** "3 hours ago". Rendered on the server, so it is a snapshot of request time. */
export function timeAgo(iso: string) {
  const elapsed = Date.now() - new Date(iso).getTime();

  for (const [unit, ms] of UNITS) {
    if (Math.abs(elapsed) >= ms) {
      return RELATIVE.format(-Math.round(elapsed / ms), unit);
    }
  }
  return "just now";
}

/** Fixed UTC timestamp, so server and client markup always agree. */
export const formatDate = (iso: string) => `${ABSOLUTE.format(new Date(iso))} UTC`;
