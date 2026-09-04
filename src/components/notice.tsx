const TONES = {
  muted:
    "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
  warning:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  danger:
    "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
} as const;

export function Notice({
  tone = "muted",
  title,
  children,
}: {
  tone?: keyof typeof TONES;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-6 ${TONES[tone]}`}>
      <p className="font-medium">{title}</p>
      {children ? <div className="mt-2 text-sm">{children}</div> : null}
    </div>
  );
}

/**
 * Shown when a table hasn't been created yet, so the page explains the next
 * step instead of rendering a bare error.
 */
export function MissingTableNotice({ table }: { table: string }) {
  return (
    <Notice tone="warning" title={`The "${table}" table doesn't exist yet`}>
      <p>
        Run{" "}
        <code className="rounded bg-black/10 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/10">
          supabase/schema.sql
        </code>{" "}
        in the Supabase SQL editor to create it, then reload this page.
      </p>
    </Notice>
  );
}
