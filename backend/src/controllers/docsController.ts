import { Request, Response } from "express";
import { promises as fs } from "fs";
import path from "path";
import ApiResponse from "../utils/apiResponse.js";

// path to docs file (relative to project root)
const DOCS_PATH = path.join(process.cwd(), "..", "src", "app", "(main)", "v2", "docs.md");

// default docs content marker for reset
const ESCALATION_WEBHOOK_SECTION = `
---

## Escalation Webhook Format

When a ticket is escalated to human support, the platform sends a webhook to notify the support team.

### Webhook Endpoint
\`\`\`
POST /webhooks/escalation
\`\`\`

### Payload Format
\`\`\`json
{
  "event": "ticket.escalated",
  "ticket_id": "TKT-XXXXX-XXXX",
  "merchant_id": "MERCH-001",
  "merchant_email": "merchant@example.com",
  "escalation_reason": "complexity_threshold_exceeded",
  "priority": "high",
  "timestamp": "2024-01-15T10:30:00Z",
  "context": {
    "previous_messages": 5,
    "tools_attempted": ["docs", "knowledge_base"],
    "confidence_score": 3
  }
}
\`\`\`

### Required Headers
\`\`\`
Content-Type: application/json
X-Webhook-Signature: sha256=xxxxx
X-Event-Type: ticket.escalated
\`\`\`

### Response Requirements
- Return \`200 OK\` within 5 seconds
- Include \`{"received": true}\` in response body

### Retry Policy
- 3 retries with exponential backoff
- Retries at: 1min, 5min, 30min

**Note**: This webhook is only triggered for tickets that exceed the complexity threshold (8.5+) or when users explicitly request human support.

`;

// section marker for identification
const SECTION_START_MARKER = "## Escalation Webhook Format";
const SECTION_END_MARKER = "---\n\n## "; // next section after

// update docs - add or remove section
export const updateDocs = async (req: Request, res: Response) => {
  try {
    const { operation, section, content, admin_id } = req.body;

    if (!operation || !["add", "remove", "reset"].includes(operation)) {
      return ApiResponse.error(res, "Invalid operation. Use 'add', 'remove', or 'reset'", 400);
    }

    console.log("[Docs] Update request:", { operation, section });

    // read current docs
    let docsContent: string;
    try {
      docsContent = await fs.readFile(DOCS_PATH, "utf-8");
    } catch (readError) {
      console.error("[Docs] Failed to read docs file:", readError);
      return ApiResponse.error(res, "Failed to read documentation file", 500);
    }

    let updatedContent = docsContent;
    let actionTaken = "";

    if (operation === "add") {
      // check if section already exists
      if (docsContent.includes(SECTION_START_MARKER)) {
        // section already exists, return success with message
        return ApiResponse.success(res, {
          message: "Documentation section already exists",
          action_taken: "Section already present - no changes needed",
          operation,
        });
      }

      // add escalation webhook section before "## Support Escalation Matrix"
      const insertPoint = docsContent.indexOf("## Support Escalation Matrix");
      if (insertPoint !== -1) {
        updatedContent =
          docsContent.slice(0, insertPoint) +
          ESCALATION_WEBHOOK_SECTION +
          "\n" +
          docsContent.slice(insertPoint);
        actionTaken = "Added Escalation Webhook Format section";
      } else {
        // append at end if marker not found
        updatedContent = docsContent + ESCALATION_WEBHOOK_SECTION;
        actionTaken = "Appended Escalation Webhook Format section";
      }
    } else if (operation === "remove" || operation === "reset") {
      // remove the escalation webhook section if it exists
      if (!docsContent.includes(SECTION_START_MARKER)) {
        return ApiResponse.success(res, {
          message: "Section not found, documentation is already in default state",
          action_taken: "no_change",
        });
      }

      // find and remove the section
      const sectionStart = docsContent.indexOf("---\n\n## Escalation Webhook Format");
      if (sectionStart !== -1) {
        // find the end of this section (next major section or end of file)
        const afterSection = docsContent.indexOf("\n---\n\n## ", sectionStart + 10);
        if (afterSection !== -1) {
          updatedContent =
            docsContent.slice(0, sectionStart) +
            docsContent.slice(afterSection);
        } else {
          // section is at end, just remove it
          updatedContent = docsContent.slice(0, sectionStart);
        }
        actionTaken = "Removed Escalation Webhook Format section";
      } else {
        // try alternative removal
        const altStart = docsContent.indexOf("## Escalation Webhook Format");
        if (altStart !== -1) {
          const nextSection = docsContent.indexOf("\n## ", altStart + 5);
          if (nextSection !== -1) {
            updatedContent =
              docsContent.slice(0, altStart) +
              docsContent.slice(nextSection + 1);
          }
          actionTaken = "Removed Escalation Webhook Format section (alt)";
        }
      }
    }

    // write updated content
    try {
      await fs.writeFile(DOCS_PATH, updatedContent, "utf-8");
      console.log("[Docs] Documentation updated successfully");
    } catch (writeError) {
      console.error("[Docs] Failed to write docs file:", writeError);
      return ApiResponse.error(res, "Failed to write documentation file", 500);
    }

    return ApiResponse.success(res, {
      message: `Documentation ${operation === "add" ? "updated" : "reset"} successfully`,
      action_taken: actionTaken,
      operation,
    });
  } catch (error) {
    console.error("[Docs] Error updating documentation:", error);
    return ApiResponse.error(res, "Failed to update documentation", 500);
  }
};

// get docs content
export const getDocs = async (req: Request, res: Response) => {
  try {
    const content = await fs.readFile(DOCS_PATH, "utf-8");
    return ApiResponse.success(res, { content });
  } catch (error) {
    console.error("[Docs] Error reading documentation:", error);
    return ApiResponse.error(res, "Failed to read documentation", 500);
  }
};

// check if section exists
export const checkSection = async (req: Request, res: Response) => {
  try {
    const { section } = req.query;
    const content = await fs.readFile(DOCS_PATH, "utf-8");

    const hasSection = content.includes(SECTION_START_MARKER);

    return ApiResponse.success(res, {
      section: section || "escalation_webhook",
      exists: hasSection,
    });
  } catch (error) {
    console.error("[Docs] Error checking section:", error);
    return ApiResponse.error(res, "Failed to check documentation section", 500);
  }
};
