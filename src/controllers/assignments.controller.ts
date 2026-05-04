import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import type { QueryError } from "mysql2";
import db from "../db/index.js";
import { users, quizzes, assignments } from "../db/schema/index.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  CreateAssignmentBody,
  CreateAssignmentResponse,
} from "../types/api.js";

// ─── Body parser ──────────────────────────────────────────────────────────────

function parseCreateAssignmentBody(raw: unknown): CreateAssignmentBody {
  if (typeof raw !== "object" || raw === null)
    throw new AppError(400, "Request body must be a JSON object");

  const b = raw as Record<string, unknown>;
  const studentId = b["studentId"];
  const quizId = b["quizId"];

  if (typeof studentId !== "number" || !Number.isInteger(studentId) || studentId <= 0)
    throw new AppError(400, "studentId must be a positive integer");
  if (typeof quizId !== "number" || !Number.isInteger(quizId) || quizId <= 0)
    throw new AppError(400, "quizId must be a positive integer");

  return { studentId, quizId };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function createAssignment(
  req: Request,
  res: Response,
): Promise<void> {
  const body = parseCreateAssignmentBody(req.body as unknown);

  // Confirm the target user exists and is actually a student
  const student = await db.query.users.findFirst({
    where: and(eq(users.id, body.studentId), eq(users.role, "student")),
    columns: { id: true },
  });
  if (!student) throw new AppError(404, "Student not found");

  const quiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, body.quizId),
    columns: { id: true },
  });
  if (!quiz) throw new AppError(404, "Quiz not found");

  try {
    const inserted = await db
      .insert(assignments)
      .values({ userId: body.studentId, quizId: body.quizId })
      .$returningId();

    const row = inserted[0];
    if (!row) throw new AppError(500, "Failed to create assignment");

    const response: CreateAssignmentResponse = {
      id: row.id,
      studentId: body.studentId,
      quizId: body.quizId,
    };

    res.status(201).json(response);
  } catch (err) {
    if ((err as QueryError).code === "ER_DUP_ENTRY")
      throw new AppError(409, "Quiz is already assigned to this student");
    throw err;
  }
}
