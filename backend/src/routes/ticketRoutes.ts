import { Router } from "express";
import {
  sendAgentMessage,
  getTickets,
  getTicketById,
  getChatHistory,
  updateTicketStatus,
  updateTicketPriority,
} from "../controllers/ticketController.js";

const router = Router();

// agent endpoint - send message and get ai response
router.post("/agent", sendAgentMessage);

// tickets endpoints
router.get("/tickets", getTickets);
router.get("/tickets/:ticketId", getTicketById);
router.patch("/tickets/:ticketId/status", updateTicketStatus);
router.patch("/tickets/:ticketId/priority", updateTicketPriority);

// chat history endpoint
router.get("/chat-history/:ticketId", getChatHistory);

export default router;
