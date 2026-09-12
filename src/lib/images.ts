/**
 * The hosts `next/image` is allowed to optimize.
 *
 * next.config.ts feeds this to `images.remotePatterns`, and the gallery uses
 * `isOptimizableImage` to decide whether a row's URL can go through the
 * optimizer — so the allowlist and the check against it cannot drift apart.
 *
 * `image_url` is arbitrary data from the database. An unconfigured host throws
 * a runtime error in development (crashing the whole page, not just the card)
 * and returns 400 from the optimizer in production, so anything unrecognised is
 * rendered unoptimized rather than allowed to fail.
 */
export type RemoteImagePattern = {
  protocol: "https";
  hostname: string;
  /** Supports a trailing `**` wildcard, matching next/image's own syntax. */
  pathname: string;
};

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

export const remoteImagePatterns: RemoteImagePattern[] = [
  // Placeholder art used by the rows in supabase/seed.sql.
  { protocol: "https", hostname: "placehold.co", pathname: "/**" },
];

if (supabaseHost) {
  // Gallery images and mobile uploads, restricted to public storage objects.
  remoteImagePatterns.push({
    protocol: "https",
    hostname: supabaseHost,
    pathname: "/storage/v1/object/public/**",
  });
}

function matchesPattern(pattern: RemoteImagePattern, url: URL): boolean {
  if (url.protocol !== `${pattern.protocol}:`) return false;
  if (url.hostname !== pattern.hostname) return false;
  return url.pathname.startsWith(pattern.pathname.replace(/\*\*$/, ""));
}

/** Whether `src` is a local path or matches a configured remote pattern. */
export function isOptimizableImage(src: string): boolean {
  if (src.startsWith("/") && !src.startsWith("//")) return true;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }

  return remoteImagePatterns.some((pattern) => matchesPattern(pattern, url));
}
