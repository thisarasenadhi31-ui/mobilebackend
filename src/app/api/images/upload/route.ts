import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const VALID_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/bmp",
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function validateBase64(base64String: string): boolean {
  try {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64String)) return false;
    if (base64String.length % 4 !== 0) return false;

    // Verify can decode and has content
    const decoded = Buffer.from(base64String, "base64");
    return decoded.length > 0;
  } catch {
    return false;
  }
}

function validateMimeType(mimeType: string): boolean {
  return VALID_MIME_TYPES.includes(mimeType.toLowerCase());
}

function decodeBase64ToBinary(base64String: string): Buffer {
  return Buffer.from(base64String, "base64");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate all 6 required fields
    if (!body.filename || typeof body.filename !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Missing or invalid filename field",
        },
        { status: 400 }
      );
    }

    if (!body.filepath || typeof body.filepath !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Missing or invalid filepath field",
        },
        { status: 400 }
      );
    }

    if (typeof body.filesize !== "number" || body.filesize < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid filesize field - must be a positive number",
        },
        { status: 400 }
      );
    }

    if (!body.imageData || typeof body.imageData !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Missing or invalid imageData field",
        },
        { status: 400 }
      );
    }

    if (!body.mimeType || typeof body.mimeType !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Missing or invalid mimeType field",
        },
        { status: 400 }
      );
    }

    if (typeof body.timestamp !== "number" || body.timestamp <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid timestamp field - must be a positive number in milliseconds",
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!validateMimeType(body.mimeType)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid MIME type. Supported types: ${VALID_MIME_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (body.filesize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `File size exceeds maximum limit of 50MB. Received: ${(body.filesize / 1024 / 1024).toFixed(2)}MB`,
        },
        { status: 400 }
      );
    }

    // Validate Base64 encoding
    if (!validateBase64(body.imageData)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Base64 encoding in imageData",
        },
        { status: 400 }
      );
    }

    // Decode Base64 to binary
    let binaryData: Buffer;
    try {
      binaryData = decodeBase64ToBinary(body.imageData);
    } catch (decodeError) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to decode Base64 imageData",
        },
        { status: 400 }
      );
    }

    // Verify decoded size matches declared size
    const decodedSize = binaryData.length;
    if (Math.abs(decodedSize - body.filesize) > 100) {
      return NextResponse.json(
        {
          success: false,
          message: `File size mismatch: declared ${body.filesize} bytes, actual ${decodedSize} bytes`,
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Generate unique file path
    const fileExtension = body.filename.split(".").pop() || "jpg";
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
    const storagePath = `mobile-uploads/${uniqueFileName}`;

    // Upload binary image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("mobile-images")
      .upload(storagePath, binaryData, {
        contentType: body.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to upload image to storage",
          error: uploadError.message,
        },
        { status: 500 }
      );
    }

    // Store metadata in database
    const now = Math.floor(Date.now() / 1000);
    const { data, error: dbError } = await supabase
      .from("mobile_photos")
      .insert({
        filename: body.filename,
        filepath: body.filepath,
        filesize: body.filesize,
        mimeType: body.mimeType,
        storage_path: storagePath,
        timestamp: body.timestamp,
        date_added: now,
        date_modified: now,
      } as any)
      .select("id, filename, filesize, mimeType, timestamp");

    if (dbError) {
      console.error("Database error:", dbError);
      // Attempt cleanup from storage if database insert fails
      await supabase.storage.from("mobile-images").remove([storagePath]);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to store image metadata",
          error: dbError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Image uploaded successfully",
        imageId: data?.[0]?.id,
        filename: data?.[0]?.filename,
        filesize: data?.[0]?.filesize,
        mimeType: data?.[0]?.mimeType,
        timestamp: data?.[0]?.timestamp,
        storageUrl: `${process.env.SUPABASE_URL}/storage/v1/object/public/mobile-images/${storagePath}`,
      },
      { status: 201 }
    );
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
