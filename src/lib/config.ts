// central config for webhook urls and api endpoints

export const config = {
  webhooks: {
    // use our own api proxy to avoid cors issues
    ticket: "/api/agent/send",

    // action webhooks (can be extended as needed)
    actions: {
      rotateKeys: "/api/actions/rotate-keys",
      escalate: "/api/ticket/escalate",
      increaseRateLimit: "/api/actions/increase-rate-limit",
      resendWebhooks: "/api/actions/resend-webhooks",
    },
  },

  // external webhook url (used server-side only)
  externalWebhooks: {
    ticket: process.env.WEBHOOK_TICKET_URL || "https://abstruse.app.n8n.cloud/webhook-test/ticket",
  },

  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  },

  docs: {
    url: "/api/docs",
  },
} as const;

export type Config = typeof config;
