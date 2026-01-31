// express backend api url
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const config = {
  api: {
    baseUrl: API_BASE_URL,

    // agent endpoint on express backend
    agent: `${API_BASE_URL}/api/agent`,

    // ticket endpoints on express backend
    tickets: `${API_BASE_URL}/api/tickets`,

    // chat history endpoint on express backend
    chatHistory: `${API_BASE_URL}/api/chat-history`,
  },

  // action webhooks (will be handled by express backend)
  actions: {
    rotateKeys: `${API_BASE_URL}/api/actions/rotate-keys`,
    escalate: `${API_BASE_URL}/api/actions/escalate`,
    increaseRateLimit: `${API_BASE_URL}/api/actions/increase-rate-limit`,
    resendWebhooks: `${API_BASE_URL}/api/actions/resend-webhooks`,
  },

  docs: {
    url: "/api/docs",
  },
} as const;

export type Config = typeof config;
