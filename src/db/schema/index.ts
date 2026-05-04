import {
  mysqlTable,
  serial,
  bigint,
  int,
  varchar,
  text,
  timestamp,
  unique,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["teacher", "student"]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizzes = mysqlTable("quizzes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const questions = mysqlTable("questions", {
  id: serial("id").primaryKey(),
  quizId: bigint("quiz_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  optionA: varchar("option_a", { length: 500 }).notNull(),
  optionB: varchar("option_b", { length: 500 }).notNull(),
  optionC: varchar("option_c", { length: 500 }).notNull(),
  optionD: varchar("option_d", { length: 500 }).notNull(),
  correctOption: mysqlEnum("correct_option", ["A", "B", "C", "D"]).notNull(),
});

export const assignments = mysqlTable(
  "assignments",
  {
    id: serial("id").primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    quizId: bigint("quiz_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  },
  (t) => [unique("uq_assignment").on(t.userId, t.quizId)],
);

export const submissions = mysqlTable("submissions", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  quizId: bigint("quiz_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  score: int("score").notNull().default(0),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const submissionAnswers = mysqlTable("submission_answers", {
  id: serial("id").primaryKey(),
  submissionId: bigint("submission_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  questionId: bigint("question_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  answer: varchar("answer", { length: 10 }).notNull(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  assignments: many(assignments),
  submissions: many(submissions),
}));

export const quizzesRelations = relations(quizzes, ({ many }) => ({
  questions: many(questions),
  assignments: many(assignments),
  submissions: many(submissions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  quiz: one(quizzes, { fields: [questions.quizId], references: [quizzes.id] }),
  submissionAnswers: many(submissionAnswers),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  user: one(users, { fields: [assignments.userId], references: [users.id] }),
  quiz: one(quizzes, { fields: [assignments.quizId], references: [quizzes.id] }),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
  quiz: one(quizzes, { fields: [submissions.quizId], references: [quizzes.id] }),
  answers: many(submissionAnswers),
}));

export const submissionAnswersRelations = relations(
  submissionAnswers,
  ({ one }) => ({
    submission: one(submissions, {
      fields: [submissionAnswers.submissionId],
      references: [submissions.id],
    }),
    question: one(questions, {
      fields: [submissionAnswers.questionId],
      references: [questions.id],
    }),
  }),
);
