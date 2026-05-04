import { Router } from "express";
import {
  getAllStudents,
  getStudentAssignments,
  getStudentScores,
  submitQuiz,
} from "../controllers/students.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole("teacher"), getAllStudents);
router.get("/:studentId/assignments", requireAuth, getStudentAssignments);
router.get("/:studentId/scores", requireAuth, getStudentScores);
router.post("/:studentId/quizzes/:quizId/submit", requireAuth, requireRole("student"), submitQuiz);

export default router;
