import OpenAI from "openai"
import { ChatCompletionMessageParam } from "openai/resources/chat/completions"

export enum ChunkType {
  TEXT = "text",
  LINK = "link",
  SOURCE = "source",
}

const URL_VALID_CHARS = /^[a-zA-Z0-9:/?#@!$&'()*+,;=%._~-]+$/
const TRAILING_PUNCTUATION = [")", "]", "}", ".", ",", "!", "?", "\"", "'"]

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
  let linkBuffer = ""
  let inLink = false

  const flushLink = () => {
    if (!linkBuffer) return

    let cleanUrl = linkBuffer
    let trailing = ""

    while (
      cleanUrl.length > 0 &&
      TRAILING_PUNCTUATION.includes(cleanUrl.slice(-1))
    ) {
      trailing = cleanUrl.slice(-1) + trailing
      cleanUrl = cleanUrl.slice(0, -1)
    }

    if (cleanUrl) {
      onChunk(ChunkType.LINK, cleanUrl)
    }
    if (trailing) {
      onChunk(ChunkType.TEXT, trailing)
    }

    linkBuffer = ""
    inLink = false
  }

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || ""

    if (inLink) {
      if (URL_VALID_CHARS.test(token)) {
        linkBuffer += token
      } else {
        flushLink()

        if (token) onChunk(ChunkType.TEXT, token)
      }
    } else {
      buffer += token

      const urlStart = buffer.search(/https?:\/\//)
      if (urlStart !== -1) {
        const before = buffer.slice(0, urlStart)
        if (before) onChunk(ChunkType.TEXT, before)

        linkBuffer = buffer.slice(urlStart)
        buffer = ""
        inLink = true
      } else {
        const lastSpace = buffer.lastIndexOf(" ")
        if (lastSpace > -1) {
          const flushed = buffer.slice(0, lastSpace + 1)
          onChunk(ChunkType.TEXT, flushed)
          buffer = buffer.slice(lastSpace + 1)
        }
      }
    }
  }

  if (inLink && linkBuffer) {
    flushLink()
  }
  if (buffer.trim()) {
    onChunk(ChunkType.TEXT, buffer)
  }
}
