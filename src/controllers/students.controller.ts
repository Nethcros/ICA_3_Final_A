import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import db from "../db/index.js";
import {
  users,
  quizzes,
  assignments,
  submissions,
  submissionAnswers,
} from "../db/schema/index.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  SubmitQuizBody,
  SubmitAnswerInput,
  ScoreResponse,
  AssignmentResponse,
  MultipleChoiceOption,
} from "../types/api.js";

// ─── Param helper ─────────────────────────────────────────────────────────────

function parseNumericParam(
  value: string | string[] | undefined,
  name: string,
): number {
  const str = Array.isArray(value) ? value[0] : value;
  if (!str) throw new AppError(400, `Missing ${name}`);
  const n = Number(str);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(400, `Invalid ${name}`);
  return n;
}

// ─── Body parser ──────────────────────────────────────────────────────────────

function isMultipleChoiceOption(s: string): s is MultipleChoiceOption {
  return s === "A" || s === "B" || s === "C" || s === "D";
}

function parseSubmitBody(raw: unknown): SubmitQuizBody {
  if (typeof raw !== "object" || raw === null)
    throw new AppError(400, "Request body must be a JSON object");

  const b = raw as Record<string, unknown>;
  const rawAnswers = b["answers"];

  if (!Array.isArray(rawAnswers))
    throw new AppError(400, "answers must be an array");

  const seen = new Set<number>();
  const answers: SubmitAnswerInput[] = rawAnswers.map((item: unknown, i) => {
    if (typeof item !== "object" || item === null)
      throw new AppError(400, `answers[${i}] must be an object`);

    const a = item as Record<string, unknown>;
    const questionId = a["questionId"];
    const answer = a["answer"];

    if (typeof questionId !== "number" || !Number.isInteger(questionId) || questionId <= 0)
      throw new AppError(400, `answers[${i}].questionId must be a positive integer`);
    if (typeof answer !== "string" || answer.trim() === "")
      throw new AppError(400, `answers[${i}].answer must be a non-empty string`);

    const normalized = answer.trim().toUpperCase();
    if (!isMultipleChoiceOption(normalized))
      throw new AppError(400, `answers[${i}].answer must be A, B, C, or D`);

    if (seen.has(questionId))
      throw new AppError(400, `answers[${i}].questionId ${questionId} appears more than once`);
    seen.add(questionId);

    return { questionId, answer: normalized };
  });

  return { answers };
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function getAllStudents(_req: Request, res: Response): Promise<void> {
  const result = await db.query.users.findMany({
    where: eq(users.role, "student"),
    columns: { id: true, name: true, email: true, role: true },
  });
  res.json(result);
}

export async function getStudentAssignments(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = parseNumericParam(req.params["studentId"], "studentId");

  const requester = req.user;
  if (!requester) throw new AppError(401, "Not authenticated");
  if (requester.role === "student" && requester.id !== studentId)
    throw new AppError(403, "Access denied");

  const student = await db.query.users.findFirst({
    where: eq(users.id, studentId),
    columns: { id: true, name: true },
  });
  if (!student) throw new AppError(404, "Student not found");

  const rows = await db.query.assignments.findMany({
    where: eq(assignments.userId, studentId),
    columns: { id: true, userId: true, quizId: true, assignedAt: true },
    with: { quiz: { columns: { title: true } } },
  });

  const response: AssignmentResponse[] = rows.map((r) => ({
    id: r.id,
    studentId: r.userId,
    quizId: r.quizId,
    quizTitle: r.quiz.title,
    studentName: student.name,
    assignedAt: r.assignedAt.toISOString(),
  }));

  res.json(response);
}

export async function getStudentScores(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId = parseNumericParam(req.params["studentId"], "studentId");

  const requester = req.user;
  if (!requester) throw new AppError(401, "Not authenticated");
  if (requester.role === "student" && requester.id !== studentId)
    throw new AppError(403, "Access denied");

  const student = await db.query.users.findFirst({
    where: eq(users.id, studentId),
    columns: { id: true, name: true, role: true },
  });
  if (!student) throw new AppError(404, "Student not found");

  const rows = await db.query.submissions.findMany({
    where: eq(submissions.userId, studentId),
    columns: { id: true, score: true, submittedAt: true, quizId: true, userId: true },
    with: {
      quiz: {
        columns: { title: true },
        with: { questions: { columns: { id: true } } },
      },
    },
  });

  const response: ScoreResponse[] = rows.map((r) => ({
    id: r.id,
    quizId: r.quizId,
    studentId: r.userId,
    quizTitle: r.quiz.title,
    studentName: student.name,
    score: r.score,
    totalQuestions: r.quiz.questions.length,
    takenAt: r.submittedAt.toISOString(),
  }));

  res.json(response);
}

export async function submitQuiz(req: Request, res: Response): Promise<void> {
  const studentId = parseNumericParam(req.params["studentId"], "studentId");
  const quizId = parseNumericParam(req.params["quizId"], "quizId");

  const requester = req.user;
  if (!requester) throw new AppError(401, "Not authenticated");
  if (requester.id !== studentId)
    throw new AppError(403, "Students can only submit quizzes for themselves");

  const student = await db.query.users.findFirst({
    where: eq(users.id, studentId),
    columns: { id: true, name: true, role: true },
  });
  if (!student) throw new AppError(404, "Student not found");
  if (student.role !== "student")
    throw new AppError(403, "Only students can submit quizzes");

  const quiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizId),
    with: { questions: true },
  });
  if (!quiz) throw new AppError(404, "Quiz not found");

  const assigned = await db.query.assignments.findFirst({
    where: and(eq(assignments.userId, studentId), eq(assignments.quizId, quizId)),
    columns: { id: true },
  });
  if (!assigned) throw new AppError(403, "This quiz has not been assigned to you");

  const { answers } = parseSubmitBody(req.body as unknown);

  const quizQuestionIds = new Set(quiz.questions.map((q) => q.id));
  for (const a of answers) {
    if (!quizQuestionIds.has(a.questionId))
      throw new AppError(400, `Question ${a.questionId} does not belong to this quiz`);
  }

  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));

  let score = 0;
  for (const q of quiz.questions) {
    const given = answerMap.get(q.id);
    if (given !== undefined && given === q.correctOption) score++;
  }

  const { submissionId, takenAt } = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(submissions)
      .values({ userId: studentId, quizId, score })
      .$returningId();

    const row = inserted[0];
    if (!row) throw new AppError(500, "Failed to record submission");

    if (answers.length > 0) {
      await tx.insert(submissionAnswers).values(
        answers.map((a) => ({
          submissionId: row.id,
          questionId: a.questionId,
          answer: a.answer,
        })),
      );
    }

    return { submissionId: row.id, takenAt: new Date() };
  });

  const response: ScoreResponse = {
    id: submissionId,
    quizId,
    studentId,
    quizTitle: quiz.title,
    studentName: student.name,
    score,
    totalQuestions: quiz.questions.length,
    takenAt: takenAt.toISOString(),
  };

  res.status(201).json(response);
}
