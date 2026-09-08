import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingTable, type QueryResult } from "@/lib/data/result";

export const NOTIFICATIONS_TABLE = "notifications";

export type Notification = {
  id: string;
  package: string;
  title: string;
  text: string;
  posted_at: number;
  timestamp: number;
  is_read: boolean;
  created_at: string;
};

export type SendNotificationPayload = {
  id: string;
  package: string;
  title: string;
  text: string;
  postedAt: number;
  timestamp: number;
};

const COLUMNS = "id, package, title, text, posted_at, timestamp, is_read, created_at";

/**
 * A row as it goes to Postgres. `is_read` is deliberately absent: on an upsert
 * PostgREST only overwrites the columns present in the payload, so leaving it
 * out lets a new row take the column default (false) while a re-posted
 * notification keeps whatever read state the console already gave it.
 */
function toRow(payload: SendNotificationPayload) {
  return {
    id: payload.id,
    package: payload.package,
    title: payload.title,
    text: payload.text,
    posted_at: payload.postedAt,
    timestamp: payload.timestamp,
  };
}

/**
 * Collapses repeats of the same notification id, newest `timestamp` winning.
 * Postgres rejects an upsert that touches the same row twice in one statement
 * ("cannot affect row a second time"), and a phone re-sending its tray does
 * exactly that — the whole batch would fail over one duplicate.
 */
function dedupeById(payloads: SendNotificationPayload[]): SendNotificationPayload[] {
  const newestById = new Map<string, SendNotificationPayload>();

  for (const payload of payloads) {
    const seen = newestById.get(payload.id);
    if (!seen || payload.timestamp >= seen.timestamp) {
      newestById.set(payload.id, payload);
    }
  }

  return [...newestById.values()];
}

export async function getNotifications(): Promise<QueryResult<Notification>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return isMissingTable(error.code)
      ? { status: "missing-table", table: NOTIFICATIONS_TABLE }
      : { status: "error", message: error.message };
  }

  return { status: "ok", rows: data ?? [] };
}

export async function createNotification(payload: SendNotificationPayload): Promise<QueryResult<Notification>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .upsert(toRow(payload), { onConflict: "id" })
    .select(COLUMNS);

  if (error) {
    return isMissingTable(error.code)
      ? { status: "missing-table", table: NOTIFICATIONS_TABLE }
      : { status: "error", message: error.message };
  }

  return { status: "ok", rows: data ?? [] };
}

export async function createNotificationsBatch(
  payloads: SendNotificationPayload[]
): Promise<QueryResult<Notification>> {
  const supabase = createAdminClient();
  const rows = dedupeById(payloads).map(toRow);

  const { data, error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .upsert(rows, { onConflict: "id" })
    .select(COLUMNS);

  if (error) {
    return isMissingTable(error.code)
      ? { status: "missing-table", table: NOTIFICATIONS_TABLE }
      : { status: "error", message: error.message };
  }

  return { status: "ok", rows: data ?? [] };
}
