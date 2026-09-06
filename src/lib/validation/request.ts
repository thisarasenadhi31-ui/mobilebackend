export type JsonBodyResult =
  | { ok: true; data: unknown }
  | { ok: false; message: string; error: string };

const MAX_ECHO_LENGTH = 200;

/**
 * Reads a request body as JSON, distinguishing "nothing was sent" and "this
 * isn't JSON" from "this parsed but is the wrong shape". Route handlers used to
 * call request.json() directly, which threw on both of the first two and
 * surfaced them as a 500 — they are client mistakes, so they belong in a 400
 * that says what arrived.
 */
export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  const contentType = request.headers.get("content-type") ?? "none";

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return {
      ok: false,
      message: "Could not read request body",
      error: `The body stream could not be read (Content-Type: ${contentType})`,
    };
  }

  if (raw.trim() === "") {
    return {
      ok: false,
      message: "Empty request body",
      error:
        `No body was sent (Content-Type: ${contentType}). ` +
        `In Postman: Body tab -> raw -> JSON, then paste the payload.`,
    };
  }

  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown parse error";
    return {
      ok: false,
      message: "Malformed JSON body",
      error: `${reason}. Received: ${truncate(raw)}`,
    };
  }
}

/** Top-level keys of a parsed body, for echoing back when the shape is wrong. */
export function topLevelKeys(data: unknown): string[] {
  return data && typeof data === "object" && !Array.isArray(data) ? Object.keys(data) : [];
}

function truncate(value: string): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > MAX_ECHO_LENGTH
    ? `${collapsed.slice(0, MAX_ECHO_LENGTH)}...`
    : collapsed;
}
