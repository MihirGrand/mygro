import { Router } from "express";
import authRoutes from "./authRoutes.js";
import ticketRoutes from "./ticketRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use(ticketRoutes);

export default router;
