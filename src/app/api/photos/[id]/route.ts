import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, props: { params: Params }) {
  const { id } = await props.params;

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { success: false, message: "Photo ID is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("mobile_photos")
      .select("id, display_name, image_data")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Photo not found" },
        { status: 404 }
      );
    }

    // Decode base64 image data
    const imageBuffer = Buffer.from(data.image_data, "base64");

    // Determine content type based on file extension
    const ext = data.display_name.toLowerCase().split(".").pop() || "jpg";
    const contentTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    const contentType = contentTypeMap[ext] || "image/jpeg";

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": imageBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${data.display_name}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Photo retrieval error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to retrieve photo", error: message },
      { status: 500 }
    );
  }
}
