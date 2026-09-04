import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .insert({
      id: payload.id,
      package: payload.package,
      title: payload.title,
      text: payload.text,
      posted_at: payload.postedAt,
      timestamp: payload.timestamp,
      is_read: false,
    })
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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .insert(
      payloads.map((payload) => ({
        id: payload.id,
        package: payload.package,
        title: payload.title,
        text: payload.text,
        posted_at: payload.postedAt,
        timestamp: payload.timestamp,
        is_read: false,
      }))
    )
    .select(COLUMNS);

  if (error) {
    return isMissingTable(error.code)
      ? { status: "missing-table", table: NOTIFICATIONS_TABLE }
      : { status: "error", message: error.message };
  }

  return { status: "ok", rows: data ?? [] };
}
