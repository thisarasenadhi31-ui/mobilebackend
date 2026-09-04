/**
 * Result of a Supabase read, narrowed so pages can render a useful state
 * instead of crashing while the database schema is still being set up.
 */
export type QueryResult<T> =
  | { status: "ok"; rows: T[] }
  | { status: "missing-table"; table: string }
  | { status: "error"; message: string };

/** PostgREST code for "table is not in the schema cache", i.e. it doesn't exist. */
const MISSING_TABLE = "PGRST205";

export const isMissingTable = (code?: string) => code === MISSING_TABLE;
