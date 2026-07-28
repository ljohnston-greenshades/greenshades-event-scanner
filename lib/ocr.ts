import Anthropic from "@anthropic-ai/sdk";
import { Contact, emptyContact, OcrResult } from "./types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

// We constrain the model to a single tool whose input schema is the contact
// shape, then force that tool with tool_choice. This guarantees structured
// output that parses cleanly, and is well-typed across SDK versions.
const EXTRACT_TOOL: Anthropic.Tool = {
  name: "record_contact",
  description: "Record the contact details read from the badge.",
  input_schema: {
    type: "object",
    properties: {
      firstName: { type: "string" },
      lastName: { type: "string" },
      company: { type: "string" },
      jobTitle: { type: "string" },
      email: { type: "string" },
      phone: { type: "string" },
    },
    required: [
      "firstName",
      "lastName",
      "company",
      "jobTitle",
      "email",
      "phone",
    ],
  },
};

const SYSTEM_PROMPT = [
  "You extract contact details from a photo of a trade-show or conference badge.",
  "Return each field exactly as printed. If a field is not visible on the badge,",
  "return an empty string for it — never guess or invent a value.",
  "Do not include titles like 'Mr.' in the name. Normalize obvious OCR artifacts",
  "(stray line breaks, doubled spaces) but do not correct spelling of names or",
  "companies.",
].join(" ");

type MediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

/**
 * Read a badge image and return structured contact fields.
 *
 * The image is held only in memory for the duration of this call — it is never
 * written to disk or persisted anywhere. If ANTHROPIC_API_KEY is not set, a
 * mock result is returned so the UI works end-to-end in a preview deploy.
 */
export async function extractContactFromImage(
  base64Data: string,
  mediaType: MediaType,
): Promise<OcrResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      mocked: true,
      contact: {
        ...emptyContact(),
        firstName: "Jane",
        lastName: "Sample",
        company: "Acme Manufacturing",
        jobTitle: "VP of People",
      },
    };
  }

  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: EXTRACT_TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Data },
          },
          {
            type: "text",
            text: "Extract the contact details from this badge.",
          },
        ],
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  const parsed = (
    toolUse && "input" in toolUse ? toolUse.input : {}
  ) as Partial<Contact>;

  const contact: Contact = {
    ...emptyContact(),
    firstName: parsed.firstName ?? "",
    lastName: parsed.lastName ?? "",
    company: parsed.company ?? "",
    jobTitle: parsed.jobTitle ?? "",
    email: parsed.email ?? "",
    phone: parsed.phone ?? "",
  };

  return { contact, mocked: false };
}
