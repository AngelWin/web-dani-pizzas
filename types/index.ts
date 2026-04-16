export type { Database } from "./database";
export * from "./domain";

export type ActionResult<T> = {
  data: T | null;
  error: string | null;
};
