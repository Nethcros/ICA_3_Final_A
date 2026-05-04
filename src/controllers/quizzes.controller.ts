import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import db from "../db/index.js";
import { quizzes, questions, submissions } from "../db/schema/index.js";
import { AppError } from "../middleware/errorHandler.js";
import type {
  CreateQuizBody,
  CreateQuestionInput,
  UpdateQuizBody,
  ScoreResponse,
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

// ─── Body parsers ─────────────────────────────────────────────────────────────

const VALID_OPTIONS: ReadonlySet<string> = new Set(["A", "B", "C", "D"]);

function parseQuestionInput(q: unknown, i: number): CreateQuestionInput {
  if (typeof q !== "object" || q === null)
    throw new AppError(400, `questions[${i}] must be an object`);

  const obj = q as Record<string, unknown>;

  const questionText = obj["questionText"];
  const optionA = obj["optionA"];
  const optionB = obj["optionB"];
  const optionC = obj["optionC"];
  const optionD = obj["optionD"];
  const correctOption = obj["correctOption"];

  if (typeof questionText !== "string" || questionText.trim() === "")
    throw new AppError(400, `questions[${i}].questionText is required`);
  if (typeof optionA !== "string" || optionA.trim() === "")
    throw new AppError(400, `questions[${i}].optionA is required`);
  if (typeof optionB !== "string" || optionB.trim() === "")
    throw new AppError(400, `questions[${i}].optionB is required`);
  if (typeof optionC !== "string" || optionC.trim() === "")
    throw new AppError(400, `questions[${i}].optionC is required`);
  if (typeof optionD !== "string" || optionD.trim() === "")
    throw new AppError(400, `questions[${i}].optionD is required`);
  if (typeof correctOption !== "string" || !VALID_OPTIONS.has(correctOption))
    throw new AppError(400, `questions[${i}].correctOption must be A, B, C, or D`);

  return {
    questionText: questionText.trim(),
    optionA: optionA.trim(),
    optionB: optionB.trim(),
    optionC: optionC.trim(),
    optionD: optionD.trim(),
    correctOption: correctOption as MultipleChoiceOption,
  };
}

function parseCreateQuizBody(raw: unknown): CreateQuizBody {
  if (typeof raw !== "object" || raw === null)
    throw new AppError(400, "Request body must be a JSON object");

  const b = raw as Record<string, unknown>;
  const rawTitle = b["title"];

  if (typeof rawTitle !== "string" || rawTitle.trim() === "")
    throw new AppError(400, "title is required");

  const rawQuestions = b["questions"];
  if (rawQuestions !== undefined && !Array.isArray(rawQuestions))
    throw new AppError(400, "questions must be an array");

  const questionInputs: CreateQuestionInput[] = Array.isArray(rawQuestions)
    ? rawQuestions.map((q: unknown, i) => parseQuestionInput(q, i))
    : [];

  return {
    title: rawTitle.trim(),
    description:
      typeof b["description"] === "string" ? b["description"] : undefined,
    questions: questionInputs,
  };
}

function parseUpdateQuizBody(raw: unknown): UpdateQuizBody {
  if (typeof raw !== "object" || raw === null)
    throw new AppError(400, "Request body must be a JSON object");

  const b = raw as Record<string, unknown>;
  const result: UpdateQuizBody = {};

  const rawTitle = b["title"];
  const rawDesc = b["description"];

  if (typeof rawTitle === "string" && rawTitle.trim() !== "")
    result.title = rawTitle.trim();
  if (typeof rawDesc === "string") result.description = rawDesc;

  if (result.title === undefined && result.description === undefined)
    throw new AppError(400, "Provide at least one of: title, description");

  return result;
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function getQuizzes(req: Request, res: Response): Promise<void> {
  if (req.user?.role === "teacher") {
    const result = await db.query.quizzes.findMany({
      with: { questions: true },
    });
    res.json(result);
    return;
  }

  const result = await db.query.quizzes.findMany({
    with: { questions: { columns: { correctOption: false } } },
  });
  res.json(result);
}

export async function getQuizById(req: Request, res: Response): Promise<void> {
  const quizId = parseNumericParam(req.params["quizId"], "quizId");

  if (req.user?.role === "teacher") {
    const quiz = await db.query.quizzes.findFirst({
      where: eq(quizzes.id, quizId),
      with: { questions: true },
    });
    if (!quiz) throw new AppError(404, "Quiz not found");
    res.json(quiz);
    return;
  }

  const quiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizId),
    with: { questions: { columns: { correctOption: false } } },
  });
  if (!quiz) throw new AppError(404, "Quiz not found");
  res.json(quiz);
}

export async function createQuiz(req: Request, res: Response): Promise<void> {
  const body = parseCreateQuizBody(req.body as unknown);

  const quizId = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(quizzes)
      .values({ title: body.title, description: body.description ?? null })
      .$returningId();

    const row = inserted[0];
    if (!row) throw new AppError(500, "Failed to create quiz");

    if (body.questions && body.questions.length > 0) {
      await tx.insert(questions).values(
        body.questions.map((q) => ({ quizId: row.id, ...q })),
      );
    }

    return row.id;
  });

  const quiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizId),
    with: { questions: true },
  });

  res.status(201).json(quiz);
}

export async function updateQuiz(req: Request, res: Response): Promise<void> {
  const quizId = parseNumericParam(req.params["quizId"], "quizId");
  const body = parseUpdateQuizBody(req.body as unknown);

  const existing = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizId),
  });
  if (!existing) throw new AppError(404, "Quiz not found");

  await db
    .update(quizzes)
    .set({
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
    })
    .where(eq(quizzes.id, quizId));

  const updated = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizId),
    with: { questions: true },
  });

  res.json(updated);
}

export async function deleteQuiz(req: Request, res: Response): Promise<void> {
  const quizId = parseNumericParam(req.params["quizId"], "quizId");

  const existing = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizId),
  });
  if (!existing) throw new AppError(404, "Quiz not found");

  await db.delete(quizzes).where(eq(quizzes.id, quizId));

  res.status(204).send();
}

export async function getQuizScores(
  req: Request,
  res: Response,
): Promise<void> {
  const quizId = parseNumericParam(req.params["quizId"], "quizId");

  const quiz = await db.query.quizzes.findFirst({
    where: eq(quizzes.id, quizId),
    with: { questions: { columns: { id: true } } },
  });
  if (!quiz) throw new AppError(404, "Quiz not found");

  const rows = await db.query.submissions.findMany({
    where: eq(submissions.quizId, quizId),
    columns: { id: true, score: true, submittedAt: true, quizId: true, userId: true },
    with: { user: { columns: { name: true } } },
  });

  const response: ScoreResponse[] = rows.map((r) => ({
    id: r.id,
    quizId: r.quizId,
    studentId: r.userId,
    quizTitle: quiz.title,
    studentName: r.user.name,
    score: r.score,
    totalQuestions: quiz.questions.length,
    takenAt: r.submittedAt.toISOString(),
  }));

  res.json(response);
}
