import { Router } from "express";
import {
  getAssignedTickets,
  sendAdminMessage,
  escalateTicket,
  resolveTicket,
  getTicketMessages,
} from "../controllers/adminController.js";

const router = Router();

// get all escalated tickets assigned to admin
router.get("/assigned-tickets", getAssignedTickets);

// get messages for a ticket (for polling)
router.get("/tickets/:ticketId/messages", getTicketMessages);

// send message as admin (no ai webhook)
router.post("/tickets/:ticketId/message", sendAdminMessage);

// escalate ticket to human
router.post("/tickets/:ticketId/escalate", escalateTicket);

// resolve escalated ticket
router.patch("/tickets/:ticketId/resolve", resolveTicket);

export default router;
