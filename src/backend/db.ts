/**
 * Type-only copy of the Db interface from siklo-backend-ts/src/db.ts.
 *
 * prediction.ts (copied unchanged from the backend) imports this type. The
 * web build only calls compute() and flagMessages(), which never touch a
 * database, so no SQLite code is shipped to the browser.
 */
export interface Db {
  exec(sql: string): void;
  /** Returns number of rows changed (for DELETE/UPDATE checks). */
  run(sql: string, ...params: unknown[]): number;
  get<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T | undefined;
  all<T = Record<string, unknown>>(sql: string, ...params: unknown[]): T[];
}
