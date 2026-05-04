import type { UserRole } from "./auth.js";

// ─── Inbound (what each route receives) ──────────────────────────────────────

/** POST /auth/login */
export interface LoginBody {
  email: string;
  password: string;
}

/** POST /quizzes */
export interface CreateQuizBody {
  title: string;
  description?: string;
  questions?: CreateQuestionInput[];
}

export type MultipleChoiceOption = "A" | "B" | "C" | "D";

export interface CreateQuestionInput {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: MultipleChoiceOption;
}

/** PUT /quizzes/:quizId */
export interface UpdateQuizBody {
  title?: string;
  description?: string;
}

/** POST /students/:studentId/quizzes/:quizId/submit */
export interface SubmitQuizBody {
  answers: SubmitAnswerInput[];
}

export interface SubmitAnswerInput {
  questionId: number;
  answer: MultipleChoiceOption;
}

/** POST /assignments */
export interface CreateAssignmentBody {
  studentId: number;
  quizId: number;
}

// ─── Outbound (what each route returns) ──────────────────────────────────────

/** POST /auth/login */
export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    role: UserRole;
  };
}

/**
 * Matches the frontend Score type exactly.
 * Used by: POST .../submit, GET /students/:id/scores, GET /quizzes/:id/scores
 */
export interface ScoreResponse {
  id: number;
  quizId: number;
  studentId: number;
  quizTitle: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  takenAt: string;
}

/** GET /students/:studentId/assignments, POST /assignments */
export interface AssignmentResponse {
  id: number;
  studentId: number;
  quizId: number;
  quizTitle: string;
  studentName: string;
  assignedAt: string;
}
