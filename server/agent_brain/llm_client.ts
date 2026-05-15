import OpenAI from "openai";

export function getClient() {
  const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.GEMINI_API_KEY;

  if (!deepseekKey) {
    throw new Error("No API Key found. Required DEEPSEEK_API_KEY (or set GEMINI_API_KEY to DeepSeek key).");
  }

  return new OpenAI({
    apiKey: deepseekKey,
    baseURL: "https://api.deepseek.com/v1"
  });
}

export async function chatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  tools?: OpenAI.Chat.Completions.ChatCompletionTool[],
  tool_choice?: "auto" | "none"
) {
  const openai = getClient();
  const completion = await openai.chat.completions.create({
    messages,
    model: "deepseek-chat",
    tools,
    tool_choice
  });
  return completion;
}
