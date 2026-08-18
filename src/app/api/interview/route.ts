import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai'
import { AI_MODEL, INTERVIEWER_INSTRUCTIONS } from '@/lib/ai/prompts'
import { hasAiKey } from '@/lib/ai/has-key'
import { nextFallbackQuestion } from '@/lib/questions'

export const maxDuration = 30

function streamHostLine(text: string) {
  const id = 'host-line'
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute({ writer }) {
        writer.write({ type: 'text-start', id })
        writer.write({ type: 'text-delta', id, delta: text })
        writer.write({ type: 'text-end', id })
      },
    }),
  })
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()
  const userTurnCount = messages.filter((message) => message.role === 'user').length

  if (!hasAiKey())
    return streamHostLine(nextFallbackQuestion({ userTurnCount }))

  try {
    const result = streamText({
      model: AI_MODEL,
      instructions: INTERVIEWER_INSTRUCTIONS,
      messages: await convertToModelMessages(messages),
    })

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    })
  } catch {
    return streamHostLine(nextFallbackQuestion({ userTurnCount }))
  }
}
