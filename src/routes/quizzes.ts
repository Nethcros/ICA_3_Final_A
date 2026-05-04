import { Router } from "express";
import {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizScores,
} from "../controllers/quizzes.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getQuizzes);
router.post("/", requireAuth, requireRole("teacher"), createQuiz);
router.get("/:quizId/scores", requireAuth, requireRole("teacher"), getQuizScores);
router.get("/:quizId", requireAuth, getQuizById);
router.put("/:quizId", requireAuth, requireRole("teacher"), updateQuiz);
router.delete("/:quizId", requireAuth, requireRole("teacher"), deleteQuiz);

export default router;
