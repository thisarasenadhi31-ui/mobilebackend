import { createClient } from "@/lib/supabase/server";
import { isMissingTable, type QueryResult } from "@/lib/data/result";

export const MOBILE_PHOTOS_TABLE = "mobile_photos";

export type MobilePhoto = {
  id: string;
  photo_id: number;
  display_name: string;
  path: string;
  size: number;
  date_added: number;
  date_modified: number;
  synced_at: string;
};

export type SyncPhotosPayload = {
  photos: Array<{
    id: number;
    displayName: string;
    dateAdded: number;
    dateModified: number;
    path: string;
    size: number;
  }>;
  timestamp: number;
  photoCount: number;
};

const COLUMNS = "id, photo_id, display_name, path, size, date_added, date_modified, synced_at";

export async function getMobilePhotos(): Promise<QueryResult<MobilePhoto>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(MOBILE_PHOTOS_TABLE)
    .select(COLUMNS)
    .order("synced_at", { ascending: false })
    .limit(100);

  if (error) {
    return isMissingTable(error.code)
      ? { status: "missing-table", table: MOBILE_PHOTOS_TABLE }
      : { status: "error", message: error.message };
  }

  return { status: "ok", rows: data ?? [] };
}

export async function syncPhotosToDatabase(payload: SyncPhotosPayload): Promise<QueryResult<MobilePhoto>> {
  const supabase = await createClient();

  const photosToSync = payload.photos.map((photo) => ({
    photo_id: photo.id,
    display_name: photo.displayName,
    path: photo.path,
    size: photo.size,
    date_added: photo.dateAdded,
    date_modified: photo.dateModified,
  }));

  const { data, error } = await supabase
    .from(MOBILE_PHOTOS_TABLE)
    .upsert(photosToSync, { onConflict: "photo_id" })
    .select(COLUMNS);

  if (error) {
    return isMissingTable(error.code)
      ? { status: "missing-table", table: MOBILE_PHOTOS_TABLE }
      : { status: "error", message: error.message };
  }

  return { status: "ok", rows: data ?? [] };
}
