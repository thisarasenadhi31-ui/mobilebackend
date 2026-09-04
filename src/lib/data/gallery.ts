import { createClient } from "@/lib/supabase/server";
import { isMissingTable, type QueryResult } from "@/lib/data/result";

export const GALLERY_TABLE = "gallery_items";

export type GalleryItem = {
  id: string;
  title: string;
  caption: string | null;
  image_url: string;
  created_at: string;
};

const COLUMNS = "id, title, caption, image_url, created_at";

export async function getGalleryItems(): Promise<QueryResult<GalleryItem>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(GALLERY_TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return isMissingTable(error.code)
      ? { status: "missing-table", table: GALLERY_TABLE }
      : { status: "error", message: error.message };
  }

  return { status: "ok", rows: data ?? [] };
}
