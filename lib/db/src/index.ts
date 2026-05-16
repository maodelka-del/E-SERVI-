import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "\n" +
    "================================================================\n" +
    "FATAL: DATABASE_URL environment variable is not set.\n" +
    "Please create a PostgreSQL database and set DATABASE_URL.\n" +
    "On Render: create a Postgres service and link it to this service.\n" +
    "================================================================\n"
  );
  process.exit(1);
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });

export * from "./schema";
