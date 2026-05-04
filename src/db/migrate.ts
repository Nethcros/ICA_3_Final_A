import "dotenv/config";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import logger from "../lib/logger.js";

async function runMigrations(): Promise<void> {
  const connection = await mysql.createConnection({
    host: process.env["DB_HOST"] ?? "localhost",
    port: Number(process.env["DB_PORT"] ?? 3306),
    user: process.env["DB_USER"],
    password: process.env["DB_PASSWORD"],
    database: process.env["DB_NAME"],
  });

  const db = drizzle(connection);

  logger.info("Running migrations...");
  await migrate(db, { migrationsFolder: "./migrations" });
  logger.info("Migrations complete.");

  await connection.end();
}

runMigrations().catch((err: unknown) => {
  logger.error("Migration failed", { error: err });
  process.exit(1);
});
