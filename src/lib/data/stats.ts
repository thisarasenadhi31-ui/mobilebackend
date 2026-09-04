import { createClient } from "@/lib/supabase/server";
import { NOTIFICATIONS_TABLE } from "@/lib/data/notifications";
import { GALLERY_TABLE } from "@/lib/data/gallery";

/** `null` means the count is unavailable (table missing, or the query failed). */
export type Counts = {
  notifications: number | null;
  unread: number | null;
  gallery: number | null;
};

export async function getCounts(): Promise<Counts> {
  const supabase = await createClient();

  const countRows = async (table: string, unreadOnly = false) => {
    const query = supabase.from(table).select("id", { count: "exact", head: true });
    const { count, error } = await (unreadOnly ? query.eq("is_read", false) : query);

    // A HEAD request has no response body, so a missing table surfaces as a
    // null count rather than an error. An existing empty table counts 0.
    return error ? null : count;
  };

  const [notifications, unread, gallery] = await Promise.all([
    countRows(NOTIFICATIONS_TABLE),
    countRows(NOTIFICATIONS_TABLE, true),
    countRows(GALLERY_TABLE),
  ]);

  return { notifications, unread, gallery };
}
