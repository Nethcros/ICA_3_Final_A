import "dotenv/config";
import bcrypt from "bcryptjs";
import db from "./index.js";
import { users } from "./schema/index.js";
import logger from "../lib/logger.js";

async function seed(): Promise<void> {
  logger.info("Seeding database...");

  const teacherHash = await bcrypt.hash("password123", 10);
  const studentHash = await bcrypt.hash("password123", 10);

  await db.insert(users).values([
    {
      name: "Teacher User",
      email: "teacher@test.com",
      passwordHash: teacherHash,
      role: "teacher",
    },
    {
      name: "Student User",
      email: "student@test.com",
      passwordHash: studentHash,
      role: "student",
    },
  ]);

  logger.info("Seeding complete.");
  logger.info("Test credentials — teacher: teacher@test.com / password123");
  logger.info("Test credentials — student: student@test.com / password123");
}

seed().catch((err: unknown) => {
  logger.error("Seed failed", { error: err });
  process.exit(1);
});
