import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getProblems, getProblemBySlug, searchProblems } from "../controllers/problemController.js";

const router = express.Router();

// Public routes - no auth required to view problems
router.get("/", getProblems);
router.get("/search", searchProblems);
router.get("/:slug", getProblemBySlug);

export default router;

