import { NextRequest, NextResponse } from "next/server";
import { createNotificationsBatch, type SendNotificationPayload } from "@/lib/data/notifications";

export const runtime = "nodejs";

function isValidNotificationPayload(data: unknown): data is SendNotificationPayload {
  if (!data || typeof data !== "object") return false;

  const payload = data as Record<string, unknown>;

  if (typeof payload.id !== "string" || payload.id.trim() === "") return false;
  if (typeof payload.package !== "string" || payload.package.trim() === "") return false;
  if (typeof payload.title !== "string" || payload.title.trim() === "") return false;
  if (typeof payload.text !== "string" || payload.text.trim() === "") return false;
  if (typeof payload.postedAt !== "number" || payload.postedAt < 0) return false;
  if (typeof payload.timestamp !== "number" || payload.timestamp < 0) return false;

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || !Array.isArray(body.notifications)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid batch payload format",
          error: "Payload must contain a 'notifications' array",
        },
        { status: 400 }
      );
    }

    const notifications = body.notifications as unknown[];

    if (notifications.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Empty batch",
          error: "Notifications array cannot be empty",
        },
        { status: 400 }
      );
    }

    const invalidNotifications = notifications.filter((n) => !isValidNotificationPayload(n));
    if (invalidNotifications.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid notification format in batch (${invalidNotifications.length} of ${notifications.length})`,
          error: "All notifications must contain id, package, title, text (all strings), and postedAt, timestamp (both numbers)",
        },
        { status: 400 }
      );
    }

    const result = await createNotificationsBatch(notifications as SendNotificationPayload[]);

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
      message: `${result.rows.length} notifications created successfully`,
      count: result.rows.length,
      notifications: result.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Batch notification creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create notifications batch",
        error: message,
      },
      { status: 500 }
    );
  }
}
