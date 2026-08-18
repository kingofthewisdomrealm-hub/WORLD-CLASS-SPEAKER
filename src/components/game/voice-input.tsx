'use client'

import { Mic, Square } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SpeechRecognitionResultLike {
  0: { transcript: string }
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null
}

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const [isListening, setIsListening] = useState(false)

  function handleToggle() {
    if (disabled) return
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const Ctor = getSpeechRecognition()
    if (!Ctor) return
    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      let finalText = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        finalText += event.results[index][0].transcript
      }
      if (finalText.trim()) onTranscript(finalText.trim())
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleToggle}
      disabled={disabled}
      aria-pressed={isListening}
      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
      className={cn(
        'border-amber-400/30 text-amber-100',
        isListening && 'animate-pulse border-red-400/50 bg-red-500/10 text-red-100'
      )}
    >
      {isListening ? <Square /> : <Mic />}
      {isListening ? 'Stop' : 'Speak'}
    </Button>
  )
}
