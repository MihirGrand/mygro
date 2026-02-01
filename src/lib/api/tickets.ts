import { config } from "~/lib/config";
import { getUser } from "~/hooks/useUser";

// action types for agent capabilities
export type ActionType =
  | "escalate"
  | "update_docs"
  | "create_github_issue"
  | "resend_webhook"
  | "rotate_api_keys"
  | "generic";

// action card from webhook response
export interface ActionCard {
  id: string;
  type: "action_button" | "link";
  label: string;
  style?: "primary" | "secondary" | "destructive";
  url?: string;
  action_payload?: {
    action_type?: ActionType;
    webhook_to_call: string;
    params: Record<string, unknown>;
  };
}

// agent reasoning for explainability
export interface AgentReasoning {
  issue_type?: "migration_issue" | "platform_bug" | "documentation_gap" | "merchant_config" | "unknown";
  root_cause?: string;
  assumptions?: string[];
  uncertainties?: string[];
}

// chat history item stored in backend
export interface TicketHistoryItem {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  cards?: ActionCard[];
  tools_used?: string[];
  actions_taken?: string[];
  reasoning?: AgentReasoning;
  confidence_score?: number;
  complexity_score?: number;
  is_human?: boolean;
}

// merchant info for admin view
export interface MerchantInfo {
  id: string;
  name: string;
  email: string;
}

// ticket from backend
export interface Ticket {
  _id: string;
  ticket_id: string;
  merchant_id: string;
  merchant?: MerchantInfo;
  assigned_agent_id?: string;
  status: "open" | "in_progress" | "escalated" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  title?: string;
  is_escalated?: boolean;
  escalated_at?: string;
  chat_history: TicketHistoryItem[];
  created_at: string;
  updated_at: string;
}

// webhook response structure
export interface TicketResponse {
  ticket_id: string;
  agent_message: string | null;
  cards: ActionCard[];
  tools_used?: string[];
  is_escalated?: boolean;
}

// webhook request payload
export interface SendMessagePayload {
  _id: string | null;
  merchant_id: string;
  message: {
    content: string;
  };
}

// send message to agent via express backend
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

  const response = await fetch(config.api.agent, {
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
  return data.data as TicketResponse;
}

// fetch user's tickets from express backend
export async function fetchUserTickets(): Promise<Ticket[]> {
  const user = getUser();

  if (!user?.id) {
    return [];
  }

  try {
    const response = await fetch(`${config.api.tickets}?merchant_id=${user.id}`);

    if (!response.ok) {
      console.error("Failed to fetch tickets:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.data?.tickets || [];
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return [];
  }
}

// fetch single ticket with chat history from express backend
export async function fetchTicketById(ticketId: string): Promise<Ticket | null> {
  const user = getUser();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${config.api.tickets}/${ticketId}?merchant_id=${user.id}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch ticket: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data?.ticket || null;
}

// update ticket status
export async function updateTicketStatus(
  ticketId: string,
  status: "open" | "in_progress" | "escalated" | "resolved" | "closed"
): Promise<void> {
  const response = await fetch(`${config.api.tickets}/${ticketId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update ticket status: ${response.statusText}`);
  }
}

// update ticket priority
export async function updateTicketPriority(
  ticketId: string,
  priority: "low" | "medium" | "high" | "urgent"
): Promise<void> {
  const response = await fetch(`${config.api.tickets}/${ticketId}/priority`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ priority }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update ticket priority: ${response.statusText}`);
  }
}

// fetch chat history for a ticket
export async function fetchChatHistory(ticketId: string): Promise<TicketHistoryItem[]> {
  const response = await fetch(`${config.api.chatHistory}/${ticketId}`);

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Failed to fetch chat history: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data?.messages || [];
}

// escalate ticket to human agent
export async function escalateTicket(ticketId: string): Promise<{
  is_escalated: boolean;
  system_message: string;
}> {
  const user = getUser();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(config.api.admin.escalate(ticketId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ merchant_id: user.id }),
  });

  if (!response.ok) {
    throw new Error(`Failed to escalate ticket: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

// admin: fetch assigned (escalated) tickets
export async function fetchAssignedTickets(): Promise<Ticket[]> {
  const user = getUser();

  if (!user?.id || user.role !== "admin") {
    return [];
  }

  try {
    const response = await fetch(`${config.api.admin.assignedTickets}?admin_id=${user.id}`);

    if (!response.ok) {
      console.error("Failed to fetch assigned tickets:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.data?.tickets || [];
  } catch (error) {
    console.error("Error fetching assigned tickets:", error);
    return [];
  }
}

// admin: fetch messages for polling
export async function fetchTicketMessagesAdmin(
  ticketId: string,
  since?: string
): Promise<TicketHistoryItem[]> {
  const url = since
    ? `${config.api.admin.ticketMessages(ticketId)}?since=${encodeURIComponent(since)}`
    : config.api.admin.ticketMessages(ticketId);

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new Error(`Failed to fetch messages: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data?.messages || [];
}

// admin: send message (no ai webhook)
export async function sendAdminMessage(
  ticketId: string,
  content: string
): Promise<{ content: string; timestamp: string; is_human: boolean }> {
  const user = getUser();

  if (!user?.id || user.role !== "admin") {
    throw new Error("Not authorized as admin");
  }

  const response = await fetch(config.api.admin.sendMessage(ticketId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      admin_id: user.id,
      content,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

// admin: resolve ticket
export async function resolveTicketAdmin(ticketId: string): Promise<void> {
  const user = getUser();

  if (!user?.id || user.role !== "admin") {
    throw new Error("Not authorized as admin");
  }

  const response = await fetch(config.api.admin.resolve(ticketId), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ admin_id: user.id }),
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve ticket: ${response.statusText}`);
  }
}
