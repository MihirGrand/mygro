import { Request, Response } from "express";
import prisma from "../config/database.js";
import ApiResponse from "../utils/apiResponse.js";

// get all escalated tickets (for admin)
export const getAssignedTickets = async (req: Request, res: Response) => {
  try {
    const { admin_id } = req.query;

    if (!admin_id || typeof admin_id !== "string") {
      return ApiResponse.error(res, "admin_id is required", 400);
    }

    // verify user is admin
    const admin = await prisma.user.findUnique({
      where: { id: admin_id },
    });

    if (!admin || admin.role !== "admin") {
      return ApiResponse.unauthorized(res, "Not authorized as admin");
    }

    // get all escalated tickets
    const tickets = await prisma.ticket.findMany({
      where: {
        isEscalated: true,
      },
      include: {
        chatHistory: true,
        merchant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const normalizedTickets = tickets.map((ticket) => ({
      _id: ticket.id,
      ticket_id: ticket.ticketId,
      merchant_id: ticket.merchantId,
      merchant: ticket.merchant,
      assigned_agent_id: ticket.assignedAgentId,
      status: ticket.status,
      priority: ticket.priority,
      title: ticket.title || "Support Request",
      is_escalated: ticket.isEscalated,
      escalated_at: ticket.escalatedAt,
      chat_history: (ticket.chatHistory?.messages || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        cards: msg.cards || [],
        tools_used: msg.toolsUsed || [],
        is_human: msg.isHuman || false,
      })),
      created_at: ticket.createdAt,
      updated_at: ticket.updatedAt,
    }));

    return ApiResponse.success(res, { tickets: normalizedTickets });
  } catch (error) {
    console.error("[Admin] Error fetching assigned tickets:", error);
    return ApiResponse.error(res, "Failed to fetch assigned tickets", 500);
  }
};

// get messages for a ticket (for polling)
export const getTicketMessages = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { since } = req.query;

    const chatHistory = await prisma.chatHistory.findUnique({
      where: { sessionId: ticketId },
    });

    if (!chatHistory) {
      return ApiResponse.notFound(res, "Chat history not found");
    }

    let messages = (chatHistory.messages || []).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      cards: msg.cards || [],
      tools_used: msg.toolsUsed || [],
      is_human: msg.isHuman || false,
    }));

    // filter messages since timestamp if provided
    if (since && typeof since === "string") {
      const sinceTime = new Date(since).getTime();
      messages = messages.filter(
        (msg: any) => new Date(msg.timestamp).getTime() > sinceTime
      );
    }

    return ApiResponse.success(res, { messages });
  } catch (error) {
    console.error("[Admin] Error fetching ticket messages:", error);
    return ApiResponse.error(res, "Failed to fetch messages", 500);
  }
};

// send message as admin (no ai webhook triggered)
export const sendAdminMessage = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { admin_id, content } = req.body;

    if (!admin_id || !content) {
      return ApiResponse.error(res, "admin_id and content are required", 400);
    }

    // verify user is admin
    const admin = await prisma.user.findUnique({
      where: { id: admin_id },
    });

    if (!admin || admin.role !== "admin") {
      return ApiResponse.unauthorized(res, "Not authorized as admin");
    }

    // verify ticket exists and is escalated
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { chatHistory: true },
    });

    if (!ticket) {
      return ApiResponse.notFound(res, "Ticket not found");
    }

    // if ticket was resolved, reopen it
    const shouldReopen = ticket.status === "resolved";

    // add admin message to chat history
    const adminMessageData = {
      role: "assistant",
      content: content,
      timestamp: new Date(),
      cards: null,
      toolsUsed: [],
      isHuman: true,
    };

    await prisma.chatHistory.update({
      where: { sessionId: ticketId },
      data: {
        messages: {
          push: adminMessageData,
        },
      },
    });

    // update ticket (reopen if it was resolved)
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        updatedAt: new Date(),
        assignedAgentId: admin_id,
        status: "in_progress",
        isEscalated: true,
      },
    });

    return ApiResponse.success(res, {
      message: "Message sent successfully",
      content: content,
      timestamp: adminMessageData.timestamp,
      is_human: true,
    });
  } catch (error) {
    console.error("[Admin] Error sending message:", error);
    return ApiResponse.error(res, "Failed to send message", 500);
  }
};

// escalate ticket to human agent
export const escalateTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { merchant_id } = req.body;

    if (!merchant_id) {
      return ApiResponse.error(res, "merchant_id is required", 400);
    }

    // verify ticket belongs to merchant
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        merchantId: merchant_id,
      },
    });

    if (!ticket) {
      return ApiResponse.notFound(res, "Ticket not found");
    }

    // update ticket to escalated
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        isEscalated: true,
        escalatedAt: new Date(),
        status: "escalated",
      },
    });

    // add system message to chat history
    const systemMessage = {
      role: "assistant",
      content:
        "You've been connected to a human agent. They will respond to you shortly. Please provide any additional details about your issue.",
      timestamp: new Date(),
      cards: null,
      toolsUsed: [],
      isHuman: true,
    };

    await prisma.chatHistory.update({
      where: { sessionId: ticketId },
      data: {
        messages: {
          push: systemMessage,
        },
      },
    });

    return ApiResponse.success(res, {
      _id: updatedTicket.id,
      is_escalated: updatedTicket.isEscalated,
      escalated_at: updatedTicket.escalatedAt,
      status: updatedTicket.status,
      system_message: systemMessage.content,
    });
  } catch (error) {
    console.error("[Admin] Error escalating ticket:", error);
    return ApiResponse.error(res, "Failed to escalate ticket", 500);
  }
};

// resolve escalated ticket
export const resolveTicket = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { admin_id } = req.body;

    if (!admin_id) {
      return ApiResponse.error(res, "admin_id is required", 400);
    }

    // verify user is admin
    const admin = await prisma.user.findUnique({
      where: { id: admin_id },
    });

    if (!admin || admin.role !== "admin") {
      return ApiResponse.unauthorized(res, "Not authorized as admin");
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return ApiResponse.notFound(res, "Ticket not found");
    }

    // update ticket to resolved
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "resolved",
        isEscalated: false,
      },
    });

    // add resolution message
    const resolutionMessage = {
      role: "assistant",
      content:
        "This ticket has been marked as resolved by the support agent. If you need further assistance, please feel free to start a new conversation.",
      timestamp: new Date(),
      cards: null,
      toolsUsed: [],
      isHuman: true,
    };

    await prisma.chatHistory.update({
      where: { sessionId: ticketId },
      data: {
        messages: {
          push: resolutionMessage,
        },
      },
    });

    return ApiResponse.success(res, {
      _id: updatedTicket.id,
      status: updatedTicket.status,
      is_escalated: updatedTicket.isEscalated,
    });
  } catch (error) {
    console.error("[Admin] Error resolving ticket:", error);
    return ApiResponse.error(res, "Failed to resolve ticket", 500);
  }
};
