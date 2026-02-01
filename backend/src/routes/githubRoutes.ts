import { Router } from "express";
import {
  createIssue,
  getIssueStatus,
} from "../controllers/githubController.js";

const router = Router();

// create github issue
router.post("/issue", createIssue);

// get issue status
router.get("/issue/:issueId", getIssueStatus);

export default router;
