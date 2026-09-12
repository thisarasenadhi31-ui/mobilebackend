import { createClient } from "@/lib/supabase/server";
import { isMissingTable, type QueryResult } from "@/lib/data/result";

export const MOBILE_IMAGES_TABLE = "mobile_images";

/** Public bucket holding the bytes; the table stores only the object path. */
export const MOBILE_IMAGES_BUCKET = "mobile-images";

export type MobileImage = {
  id: string;
  filename: string;
  filepath: string;
  filesize: number;
  mime_type: string;
  storage_path: string;
  timestamp: number;
  created_at: string;
  /** Resolved from storage_path — not columns. */
  url: string;
  downloadUrl: string;
};

const COLUMNS =
  "id, filename, filepath, filesize, mime_type, storage_path, timestamp, created_at";

/** Images sent to POST /api/images/upload, newest first. */
export async function getMobileImages(): Promise<QueryResult<MobileImage>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(MOBILE_IMAGES_TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return isMissingTable(error.code)
      ? { status: "missing-table", table: MOBILE_IMAGES_TABLE }
      : { status: "error", message: error.message };
  }

  const storage = supabase.storage.from(MOBILE_IMAGES_BUCKET);
  const rows = (data ?? []).map((row) => ({
    ...row,
    url: storage.getPublicUrl(row.storage_path).data.publicUrl,
    // `download` makes storage send Content-Disposition: attachment. The <a
    // download> attribute alone is ignored cross-origin, so the header is what
    // actually saves the file instead of navigating to it.
    downloadUrl: storage.getPublicUrl(row.storage_path, {
      download: row.filename,
    }).data.publicUrl,
  }));

  return { status: "ok", rows };
}
