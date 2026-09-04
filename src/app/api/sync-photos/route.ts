import { NextRequest, NextResponse } from "next/server";
import { syncPhotosToDatabase, type SyncPhotosPayload } from "@/lib/data/photos";

export const runtime = "nodejs";

function isValidSyncPayload(data: unknown): data is SyncPhotosPayload {
  if (!data || typeof data !== "object") return false;

  const payload = data as Record<string, unknown>;

  if (!Array.isArray(payload.photos)) return false;
  if (typeof payload.timestamp !== "number") return false;
  if (typeof payload.photoCount !== "number") return false;

  return payload.photos.every((photo) =>
    typeof photo === "object" &&
    photo !== null &&
    typeof (photo as Record<string, unknown>).id === "number" &&
    typeof (photo as Record<string, unknown>).displayName === "string" &&
    typeof (photo as Record<string, unknown>).dateAdded === "number" &&
    typeof (photo as Record<string, unknown>).dateModified === "number" &&
    typeof (photo as Record<string, unknown>).path === "string" &&
    typeof (photo as Record<string, unknown>).size === "number"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isValidSyncPayload(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload format",
          error: "Payload must contain photos array, timestamp, and photoCount",
        },
        { status: 400 }
      );
    }

    const result = await syncPhotosToDatabase(body);

    if (result.status === "error") {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 500 }
      );
    }

    if (result.status === "missing-table") {
      return NextResponse.json(
        {
          success: false,
          message: `Database table '${result.table}' does not exist. Run migrations.`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${body.photoCount} photo(s)`,
      syncedCount: result.rows?.length ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Photo sync error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to sync photos",
        error: message,
      },
      { status: 500 }
    );
  }
}
