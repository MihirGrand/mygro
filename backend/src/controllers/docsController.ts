import { Request, Response } from "express";
import { promises as fs } from "fs";
import path from "path";
import ApiResponse from "../utils/apiResponse.js";

// path to docs file (relative to project root)
const DOCS_PATH = path.join(process.cwd(), "..", "src", "app", "(main)", "v2", "docs.md");

// marker to identify the added section
const SECTION_MARKER_START = "<!-- MygroAgent_ESCALATION_SECTION_START -->";
const SECTION_MARKER_END = "<!-- MygroAgent_ESCALATION_SECTION_END -->";

// default docs content marker for reset
const ESCALATION_WEBHOOK_SECTION = `
${SECTION_MARKER_START}
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

${SECTION_MARKER_END}
`;

// legacy section marker for identification (fallback)
const SECTION_START_MARKER = "## Escalation Webhook Format";

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
      // check if section already exists (by marker or content)
      if (docsContent.includes(SECTION_MARKER_START) || docsContent.includes(SECTION_START_MARKER)) {
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
      // try removing by markers first (clean removal)
      if (docsContent.includes(SECTION_MARKER_START) && docsContent.includes(SECTION_MARKER_END)) {
        const startIdx = docsContent.indexOf(SECTION_MARKER_START);
        const endIdx = docsContent.indexOf(SECTION_MARKER_END) + SECTION_MARKER_END.length;
        // also remove any trailing newlines
        let endWithNewlines = endIdx;
        while (endWithNewlines < docsContent.length && docsContent[endWithNewlines] === '\n') {
          endWithNewlines++;
        }
        updatedContent = docsContent.slice(0, startIdx) + docsContent.slice(endWithNewlines);
        actionTaken = "Removed Escalation Webhook Format section";
      }
      // fallback: try to find by section header
      else if (docsContent.includes(SECTION_START_MARKER)) {
        const headerIdx = docsContent.indexOf(SECTION_START_MARKER);
        // find the "---" before the section header
        let sectionStart = docsContent.lastIndexOf("---", headerIdx);
        if (sectionStart === -1) sectionStart = headerIdx;

        // find next section (## followed by text)
        const afterHeader = headerIdx + SECTION_START_MARKER.length;
        const nextSectionMatch = docsContent.slice(afterHeader).search(/\n## [A-Z]/);

        if (nextSectionMatch !== -1) {
          const sectionEnd = afterHeader + nextSectionMatch;
          updatedContent = docsContent.slice(0, sectionStart) + docsContent.slice(sectionEnd);
        } else {
          // section is at end, remove from start marker to end
          updatedContent = docsContent.slice(0, sectionStart).trimEnd() + "\n";
        }
        actionTaken = "Removed Escalation Webhook Format section (legacy)";
      } else {
        return ApiResponse.success(res, {
          message: "Section not found, documentation is already in default state",
          action_taken: "no_change",
        });
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
