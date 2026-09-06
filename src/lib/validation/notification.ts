import type { SendNotificationPayload } from "@/lib/data/notifications";

export type ValidationResult =
  | { valid: true; payload: SendNotificationPayload }
  | { valid: false; errors: string[] };

const STRING_FIELDS = ["id", "package", "title", "text"] as const;
const NUMBER_FIELDS = ["postedAt", "timestamp"] as const;

/**
 * Validates one notification payload, reporting every field that failed rather
 * than just the first. Callers surface `errors` so clients can see which field
 * is wrong instead of guessing at a generic "invalid payload".
 */
export function validateNotificationPayload(data: unknown): ValidationResult {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, errors: [`expected a JSON object, received ${describe(data)}`] };
  }

  const payload = data as Record<string, unknown>;
  const errors: string[] = [];

  for (const field of STRING_FIELDS) {
    const value = payload[field];
    if (typeof value !== "string") {
      errors.push(`'${field}' must be a string, received ${describe(value)}`);
    } else if (value.trim() === "") {
      errors.push(`'${field}' must not be empty`);
    }
  }

  for (const field of NUMBER_FIELDS) {
    const value = payload[field];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      errors.push(`'${field}' must be a number, received ${describe(value)}`);
    } else if (value < 0) {
      errors.push(`'${field}' must not be negative`);
    }
  }

  return errors.length === 0
    ? { valid: true, payload: payload as SendNotificationPayload }
    : { valid: false, errors };
}

function describe(value: unknown): string {
  if (value === undefined) return "nothing";
  if (value === null) return "null";
  if (Array.isArray(value)) return "an array";
  return `the ${typeof value} ${JSON.stringify(value)}`;
}
