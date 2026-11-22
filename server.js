// config/db.js loads .env (dotenv) before anything reads process.env.
import app from "./app.js";
import sql, { initDb } from "./config/db.js";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

try {
  await initDb();
} catch (error) {
  console.error("Could not initialise the database:", error.message);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const shutdown = () => {
  server.close(async () => {
    await sql.end({ timeout: 5 });
    process.exit(0);
  });
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
