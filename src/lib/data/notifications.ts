import { createClient } from "@/lib/supabase/server";
import { isMissingTable, type QueryResult } from "@/lib/data/result";

export const NOTIFICATIONS_TABLE = "notifications";

export type Notification = {
  id: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

const COLUMNS = "id, title, body, is_read, created_at";

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
