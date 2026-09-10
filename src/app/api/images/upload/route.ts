import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.imageData || typeof body.imageData !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Missing or invalid imageData field",
        },
        { status: 400 }
      );
    }

    const imageData = body.imageData;
    const fileName = body.fileName || "image.jpg";
    const fileSize = body.fileSize || 0;

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("mobile_photos")
      .insert({
        photo_id: Math.floor(Math.random() * 1000000000),
        display_name: fileName,
        path: `/upload/${fileName}`,
        size: fileSize,
        date_added: Math.floor(Date.now() / 1000),
        date_modified: Math.floor(Date.now() / 1000),
        image_data: imageData,
      })
      .select("id, display_name, size");

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to store image",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully",
      imageId: data?.[0]?.id,
      fileName: data?.[0]?.display_name,
      size: data?.[0]?.size,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Image upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload image",
        error: message,
      },
      { status: 500 }
    );
  }
}
