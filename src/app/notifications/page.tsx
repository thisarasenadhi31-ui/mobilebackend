import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { MissingTableNotice, Notice } from "@/components/notice";
import { getNotifications, type Notification } from "@/lib/data/notifications";
import { formatDate, timeAgo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Every notification queued for or delivered to the mobile app.",
};

export default async function NotificationsPage() {
  const result = await getNotifications();
  const unread =
    result.status === "ok" ? result.rows.filter((n) => !n.is_read).length : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notifications"
        description="Every notification queued for or delivered to the mobile app."
        action={
          unread > 0 ? (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              {unread} unread
            </span>
          ) : null
        }
      />

      {result.status === "missing-table" ? (
        <MissingTableNotice table={result.table} />
      ) : result.status === "error" ? (
        <Notice tone="danger" title="Couldn't load notifications">
          {result.message}
        </Notice>
      ) : result.rows.length === 0 ? (
        <Notice title="No notifications yet">
          Rows added to the <code>notifications</code> table show up here.
        </Notice>
      ) : (
        <ol className="space-y-3">
          {result.rows.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} />
          ))}
        </ol>
      )}
    </div>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  const { title, body, is_read, created_at } = notification;

  return (
    <li className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <span
        className={`mt-1.5 size-2 shrink-0 rounded-full ${
          is_read ? "bg-transparent" : "bg-blue-500"
        }`}
        aria-hidden
      />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2
            className={`text-sm ${
              is_read ? "font-medium text-zinc-700 dark:text-zinc-300" : "font-semibold"
            }`}
          >
            {title}
            {is_read ? null : <span className="sr-only"> (unread)</span>}
          </h2>
          <time
            dateTime={created_at}
            title={formatDate(created_at)}
            className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400"
          >
            {timeAgo(created_at)}
          </time>
        </div>

        {body ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
        ) : null}
      </div>
    </li>
  );
}
