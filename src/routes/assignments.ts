import { Router } from "express";
import { createAssignment } from "../controllers/assignments.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, requireRole("teacher"), createAssignment);

export default router;
