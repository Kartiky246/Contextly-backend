import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";


export async function streamAiResponse(
  openaiClient: OpenAI,
  onChunk: (chunk: string) => void,
  model,
  messages: ChatCompletionMessageParam[]
) {
  const stream = await openaiClient.chat.completions.create({
    model,
    messages,
    stream: true,
  });

  for await (const part of stream) {
    const chunk = part.choices[0]?.delta?.content || "";
    if (chunk) {
      onChunk(chunk);
    }
  }
}