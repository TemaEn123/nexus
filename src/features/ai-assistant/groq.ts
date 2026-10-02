import { createGroq, type GroqLanguageModelChatOptions } from "@ai-sdk/groq";

/** Как М5.6 на hardening-production: Groq, не Vercel AI Gateway. */
export const GROQ_MODEL = "openai/gpt-oss-20b";

export const GROQ_UNAVAILABLE_MESSAGE =
  "AI is not configured. Add GROQ_API_KEY.";

const groqReasoning = {
  reasoningEffort: "low",
} satisfies GroqLanguageModelChatOptions;

export const groqProviderOptions = { groq: groqReasoning };

export function groqApiKey() {
  return process.env.GROQ_API_KEY?.trim() || undefined;
}

export function groqModel(apiKey: string) {
  return createGroq({ apiKey })(GROQ_MODEL);
}
