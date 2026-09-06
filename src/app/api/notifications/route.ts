import { NextRequest, NextResponse } from "next/server";
import { createNotification } from "@/lib/data/notifications";
import { validateNotificationPayload } from "@/lib/validation/notification";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateNotificationPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payload format",
          error: validation.errors.join("; "),
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const result = await createNotification(validation.payload);

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
