export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    </div>
  );
}
