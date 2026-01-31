import { config } from "~/lib/config";
import { getUser } from "~/hooks/useUser";

// action card from webhook response
export interface ActionCard {
  id: string;
  type: "action_button" | "link";
  label: string;
  style?: "primary" | "secondary" | "destructive";
  url?: string;
  action_payload?: {
    webhook_to_call: string;
    params: Record<string, string>;
  };
}

// chat history item stored in backend
export interface TicketHistoryItem {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  cards?: ActionCard[];
}

// ticket from backend
export interface Ticket {
  _id: string;
  ticket_id: string;
  merchant_id: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  title?: string;
  chat_history: TicketHistoryItem[];
  created_at: string;
  updated_at: string;
}

// webhook response structure
export interface TicketResponse {
  ticket_id: string;
  agent_message: string;
  cards: ActionCard[];
}

// webhook request payload
export interface SendMessagePayload {
  _id: string | null;
  merchant_id: string;
  message: {
    content: string;
  };
}

// send message to ticket webhook
export async function sendTicketMessage(
  ticketId: string | null,
  content: string
): Promise<TicketResponse> {
  const user = getUser();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const payload: SendMessagePayload = {
    _id: ticketId,
    merchant_id: user.id,
    message: {
      content,
    },
  };

  const response = await fetch(config.webhooks.ticket, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  const data = await response.json();
  return data as TicketResponse;
}

// fetch user's tickets from api
export async function fetchUserTickets(): Promise<Ticket[]> {
  const user = getUser();

  if (!user?.id) {
    return [];
  }

  try {
    const response = await fetch(`/api/tickets?merchant_id=${user.id}`);

    if (!response.ok) {
      console.error("Failed to fetch tickets:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.tickets || [];
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }
}

// fetch single ticket with chat history
export async function fetchTicketById(ticketId: string): Promise<Ticket | null> {
  const user = getUser();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`/api/tickets/${ticketId}?merchant_id=${user.id}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch ticket: ${response.statusText}`);
  }

  const data = await response.json();
  return data.ticket || null;
}
