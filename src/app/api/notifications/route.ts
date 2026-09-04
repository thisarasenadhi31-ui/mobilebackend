import { NextRequest, NextResponse } from "next/server";
import { createNotification, type SendNotificationPayload } from "@/lib/data/notifications";

export const runtime = "nodejs";

function isValidNotificationPayload(data: unknown): data is SendNotificationPayload {
  if (!data || typeof data !== "object") return false;

  const payload = data as Record<string, unknown>;

  if (typeof payload.title !== "string" || payload.title.trim() === "") return false;
  if (payload.body !== undefined && payload.body !== null && typeof payload.body !== "string") return false;

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isValidNotificationPayload(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload format",
          error: "Payload must contain a non-empty title and optional body string",
        },
        { status: 400 }
      );
    }

    const result = await createNotification(body);

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
      message: "Notification created successfully",
      notification: result.rows[0] ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Notification creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create notification",
        error: message,
      },
      { status: 500 }
    );
  }
}
