import fs from "node:fs";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

// SSL is on by default (hosted Postgres such as Supabase needs it).
// Set DB_SSL=false for a local / Docker Postgres without TLS.
const ssl = process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false };

// postgres() connects lazily, so importing this module never opens a connection.
let sql = postgres(process.env.DATABASE_URL, { ssl, onnotice: () => {} });

// Tests swap in a stub with setSql(); `export { sql as default }` is a live binding.
export function setSql(newSql) {
  sql = newSql;
}

const schemaPath = new URL("../db/schema.sql", import.meta.url);

// Creates the tables if they do not exist (same file docker-compose uses as init script).
export async function initDb() {
  await sql.unsafe(fs.readFileSync(schemaPath, "utf8"));
}

export { sql as default };
