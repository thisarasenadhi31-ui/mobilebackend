import { NextRequest, NextResponse } from "next/server";
import { createNotificationsBatch, type SendNotificationPayload } from "@/lib/data/notifications";
import { validateNotificationPayload } from "@/lib/validation/notification";
import { readJsonBody, topLevelKeys } from "@/lib/validation/request";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    if (!body.ok) {
      return NextResponse.json(
        { success: false, message: body.message, error: body.error },
        { status: 400 }
      );
    }

    const parsed = body.data as Record<string, unknown> | null;

    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.notifications)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid batch payload format",
          error: "Payload must contain a 'notifications' array",
          receivedKeys: topLevelKeys(body.data),
        },
        { status: 400 }
      );
    }

    const notifications = parsed.notifications as unknown[];

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

    const valid: SendNotificationPayload[] = [];
    const errors: string[] = [];

    notifications.forEach((notification, index) => {
      const validation = validateNotificationPayload(notification);
      if (validation.valid) {
        valid.push(validation.payload);
      } else {
        errors.push(...validation.errors.map((error) => `notifications[${index}]: ${error}`));
      }
    });

    if (errors.length > 0) {
      const invalidCount = notifications.length - valid.length;
      return NextResponse.json(
        {
          success: false,
          message: `Invalid notification format in batch (${invalidCount} of ${notifications.length})`,
          error: errors.join("; "),
          errors,
        },
        { status: 400 }
      );
    }

    const result = await createNotificationsBatch(valid);

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
