import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { createLocalD1Database } from "./local-d1";

export function getD1() {
  const globals = globalThis as typeof globalThis & {
    __AIRBNB_DB__?: D1Database;
    __AIRBNB_LOCAL_DB__?: D1Database;
  };
  const binding = globals.__AIRBNB_DB__;
  if (binding) return binding;

  globals.__AIRBNB_LOCAL_DB__ ??= createLocalD1Database();
  return globals.__AIRBNB_LOCAL_DB__;
}

export function getDb() {
  return drizzle(getD1(), { schema });
}
