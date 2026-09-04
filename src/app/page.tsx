import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { ArrowRightIcon, BellIcon, ImageIcon } from "@/components/icons";
import { getCounts } from "@/lib/data/stats";

export default function Home() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Manage the content the mobile app serves to its users."
      />

      {/* Counts need a round-trip to Supabase, so the shell renders first. */}
      <Suspense fallback={<SectionGrid>{[0, 1].map((i) => <CardSkeleton key={i} />)}</SectionGrid>}>
        <SectionCards />
      </Suspense>
    </div>
  );
}

function SectionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

async function SectionCards() {
  const { notifications, unread, gallery } = await getCounts();

  return (
    <SectionGrid>
      <SectionCard
        href="/notifications"
        icon={<BellIcon className="size-5" />}
        title="Notifications"
        description="Everything queued for or already delivered to the app."
        count={notifications}
        unit="notifications"
        badge={unread ? `${unread} unread` : null}
      />
      <SectionCard
        href="/gallery"
        icon={<ImageIcon className="size-5" />}
        title="Gallery"
        description="Images published to the app's photo gallery."
        count={gallery}
        unit="images"
      />
    </SectionGrid>
  );
}

function SectionCard({
  href,
  icon,
  title,
  description,
  count,
  unit,
  badge,
}: {
  href: "/notifications" | "/gallery";
  icon: React.ReactNode;
  title: string;
  description: string;
  count: number | null;
  unit: string;
  badge?: string | null;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      <div className="flex items-center justify-between">
        <span className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {icon}
        </span>
        {badge ? (
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="space-y-1">
        <h2 className="flex items-center gap-1.5 font-semibold">
          {title}
          <ArrowRightIcon className="size-4 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>

      <p className="mt-auto text-sm text-zinc-500 dark:text-zinc-400">
        {count === null ? (
          "Not set up yet"
        ) : (
          <>
            <span className="text-2xl font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
              {count}
            </span>{" "}
            {unit}
          </>
        )}
      </p>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="h-56 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
  );
}
