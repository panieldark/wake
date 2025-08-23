'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

interface TypingDrillProps {
  onComplete: () => void
}

const sentences = [
  "The quick brown fox jumps over the lazy dog",
  "Pack my box with five dozen liquor jugs",
  "How vexingly quick daft zebras jump",
  "The five boxing wizards jump quickly",
  "Sphinx of black quartz judge my vow"
]

export default function TypingDrill({ onComplete }: TypingDrillProps) {
  const [currentSentenceIndex, setSentenceIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [startTime, setStartTime] = useState<number | null>(null)
  const [wpm, setWpm] = useState<number | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [errors, setErrors] = useState<number[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  
  const currentSentence = sentences[currentSentenceIndex]
  
  useEffect(() => {
    inputRef.current?.focus()
  }, [currentSentenceIndex])
  
  const handleInputChange = (value: string) => {
    if (!startTime && value.length === 1) {
      setStartTime(Date.now())
    }
    
    setUserInput(value)
    
    const newErrors: number[] = []
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== currentSentence[i]) {
        newErrors.push(i)
      }
    }
    setErrors(newErrors)
    
    if (value === currentSentence) {
      const endTime = Date.now()
      const timeInMinutes = (endTime - startTime!) / 60000
      const wordsTyped = currentSentence.split(' ').length
      const calculatedWpm = Math.round(wordsTyped / timeInMinutes)
      const calculatedAccuracy = Math.round(((currentSentence.length - errors.length) / currentSentence.length) * 100)
      
      setWpm(calculatedWpm)
      setAccuracy(calculatedAccuracy)
      
      if (currentSentenceIndex < sentences.length - 1) {
        setTimeout(() => {
          setSentenceIndex(currentSentenceIndex + 1)
          setUserInput('')
          setStartTime(null)
          setErrors([])
          setWpm(null)
          setAccuracy(null)
        }, 2000)
      } else {
        setTimeout(onComplete, 2000)
      }
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-8 py-8">
      <Card className="animate-slide-up">
        <CardHeader className="text-center">
          <CardTitle>Type the sentence</CardTitle>
          <CardDescription>
            Sentence {currentSentenceIndex + 1} of {sentences.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-gray-50 rounded-lg">
            <div className="text-xl leading-relaxed font-mono">
              {currentSentence.split('').map((char, index) => (
                <span
                  key={index}
                  className={
                    index < userInput.length
                      ? errors.includes(index)
                        ? 'bg-red-200 text-red-900'
                        : 'bg-green-100 text-green-900'
                      : 'text-gray-700'
                  }
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
          
          <Input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => handleInputChange(e.target.value)}
            className="text-lg font-mono h-14"
            placeholder="Start typing..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          
          {wpm && accuracy && (
            <div className="text-center py-4 space-y-2 animate-fade-in">
              <div className="flex justify-center gap-8">
                <div>
                  <p className="text-3xl font-bold text-gray-900">{wpm}</p>
                  <p className="text-sm text-gray-600">WPM</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">{accuracy}%</p>
                  <p className="text-sm text-gray-600">Accuracy</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}