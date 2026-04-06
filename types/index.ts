export type { Database } from "./database";

export type ActionResult<T> = {
  data: T | null;
  error: string | null;
};
