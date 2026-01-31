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

// webhook request payload
export interface TicketMessagePayload {
  _id: string | null;
  merchant_id: string;
  message: {
    content: string;
  };
}

// webhook response structure
export interface AgentResponse {
  ticket_id: string;
  agent_message: string;
  cards: ActionCard[];
}

// reasoning step for chain of thought display
export interface ReasoningStep {
  id: string;
  label: string;
  status: "pending" | "active" | "complete" | "error";
}

// chat message for UI
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  cards?: ActionCard[];
  ticketId?: string;
  reasoning?: ReasoningStep[];
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

// chat history item stored in backend
export interface TicketHistoryItem {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  cards?: ActionCard[];
}
