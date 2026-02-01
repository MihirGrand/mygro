import { Router } from "express";
import authRoutes from "./authRoutes.js";
import ticketRoutes from "./ticketRoutes.js";
import adminRoutes from "./adminRoutes.js";
import logsRoutes from "./logsRoutes.js";
import docsRoutes from "./docsRoutes.js";
import githubRoutes from "./githubRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/logs", logsRoutes);
router.use("/docs", docsRoutes);
router.use("/github", githubRoutes);
router.use(ticketRoutes);

export default router;
