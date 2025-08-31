import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";


export enum ChunkType{
  TEXT = 'text',
  LINK = 'link',
  SOURCE = 'socure'
}

export const streamAiResponse = async (
  openaiClient: OpenAI,
  onChunk: (type: ChunkType, value: string) => void,
  model: string,
  messages: ChatCompletionMessageParam[]
) => {
  const stream = await openaiClient.chat.completions.create({
    model,
    messages,
    stream: true,
  })

  let buffer = ""
  let insideSource = false
  let sourceBuffer = ""
  let insideLink = false
  let linkBuffer = ""

  for await (const part of stream) {
    const chunk = part.choices[0]?.delta?.content || ""
    if (!chunk) continue

    if (insideSource) {
      sourceBuffer += chunk
      if (sourceBuffer.includes("</sourceEnd>")) {
        const value = sourceBuffer.replace(/<\/?source(Start|End)>/g, "")
        onChunk(ChunkType.SOURCE, value.trim())
        sourceBuffer = ""
        insideSource = false
      }
      continue
    }

    if (insideLink) {
      linkBuffer += chunk
      if (linkBuffer.includes("</LinkEnd>")) {
        const value = linkBuffer.replace(/<\/?Link(Start|End)>/g, "")
        onChunk(ChunkType.LINK, value.trim())
        linkBuffer = ""
        insideLink = false
      }
      continue
    }

    buffer += chunk

    if (buffer.includes("<sourceStart>")) {
      const before = buffer.slice(0, buffer.indexOf("<sourceStart>"))
      if (before.trim()) onChunk(ChunkType.TEXT, before)
      sourceBuffer = buffer.slice(buffer.indexOf("<sourceStart>"))
      buffer = ""
      insideSource = true
      continue
    }

    if (buffer.includes("<LinkStart>")) {
      const before = buffer.slice(0, buffer.indexOf("<LinkStart>"))
      if (before.trim()) onChunk(ChunkType.TEXT, before)
      linkBuffer = buffer.slice(buffer.indexOf("<LinkStart>"))
      buffer = ""
      insideLink = true
      continue
    }

    const safeText = buffer.replace(/<[^>]*$/, "")
    if (safeText) {
      onChunk(ChunkType.TEXT, safeText)
      buffer = buffer.slice(safeText.length)
    }
  }

  if (buffer.trim()) onChunk(ChunkType.TEXT, buffer)

  return buffer
}


