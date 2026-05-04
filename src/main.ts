import "dotenv/config";
import express from "express";
import cors from "cors";
import logger from "./lib/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.js";
import quizzesRouter from "./routes/quizzes.js";
import studentsRouter from "./routes/students.js";
import assignmentsRouter from "./routes/assignments.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5309",
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/quizzes", quizzesRouter);
app.use("/students", studentsRouter);
app.use("/assignments", assignmentsRouter);

app.use(errorHandler);

const port = process.env.PORT ? Number(process.env.PORT) : 7000;

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
