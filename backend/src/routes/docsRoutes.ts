import { Router } from "express";
import {
  updateDocs,
  getDocs,
  checkSection,
} from "../controllers/docsController.js";

const router = Router();

// get docs content
router.get("/", getDocs);

// check if section exists
router.get("/check", checkSection);

// update docs (add/remove section)
router.post("/update", updateDocs);

export default router;
