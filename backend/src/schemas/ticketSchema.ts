import { z } from "zod";

export const createTicketMessageSchema = z.object({
  _id: z.string().nullable().optional(),
  merchant_id: z.string().min(1, "merchant_id is required"),
  message: z.object({
    content: z.string().min(1, "message content is required"),
  }),
});

export const getTicketsSchema = z.object({
  merchant_id: z.string().min(1, "merchant_id is required"),
});

export const getTicketByIdSchema = z.object({
  ticketId: z.string().min(1, "ticketId is required"),
  merchant_id: z.string().min(1, "merchant_id is required"),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});

export const updateTicketPrioritySchema = z.object({
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export type CreateTicketMessageInput = z.infer<typeof createTicketMessageSchema>;
export type GetTicketsInput = z.infer<typeof getTicketsSchema>;
export type GetTicketByIdInput = z.infer<typeof getTicketByIdSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type UpdateTicketPriorityInput = z.infer<typeof updateTicketPrioritySchema>;
