import type { UIMessage } from 'ai'
import type { InterviewMessage } from '@/lib/types'

export function messageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => ('text' in part ? part.text : ''))
    .join('\n')
    .trim()
}

export function toUiMessages(messages: InterviewMessage[]): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: [{ type: 'text', text: message.text }],
  }))
}

export function fromUiMessages(messages: UIMessage[]): InterviewMessage[] {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      id: message.id,
      role: message.role as 'user' | 'assistant',
      text: messageText(message),
      createdAt: new Date().toISOString(),
    }))
    .filter((message) => message.text.length > 0)
}
