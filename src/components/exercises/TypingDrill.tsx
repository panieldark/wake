'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'

interface TypingDrillProps {
  onComplete: () => void
}

const sentences = [
  // Classic pangrams
  "The quick brown fox jumps over the lazy dog",
  "Pack my box with five dozen liquor jugs",
  "Sphinx of black quartz judge my vow",
  "The five boxing wizards jump quickly",
  "How vexingly quick daft zebras jump",

  // Programming related
  "Function returns undefined when parameters are missing",
  "Async await makes JavaScript promises much easier to handle",
  "Console log debugging helps identify runtime errors quickly",
  "Import export statements organize modular code effectively",

  // Business/productivity
  "Schedule meetings efficiently to maximize productive work time",
  "Email responses should be clear concise and actionable",
  "Project deadlines require careful planning and resource allocation",
  "Remote collaboration tools enable distributed team success",

  // Science/tech
  "Machine learning algorithms process vast datasets automatically",
  "Quantum computing promises exponential performance improvements",
  "Renewable energy systems reduce environmental carbon emissions",
  "Database optimization improves application response times significantly",

  // Mixed variety
  "Creative writing requires imagination patience and persistent practice",
  "Mountain hiking builds endurance while offering scenic rewards",
  "Jazz music improvisation combines technical skill with artistic expression",
  "Garden cultivation teaches sustainability through seasonal cycles",
  "Digital photography captures moments with precision and artistry"
]

export default function TypingDrill({ onComplete }: TypingDrillProps) {
  const [selectedSentences] = useState(() => {
    // Randomly select and shuffle 5 sentences from the pool
    const shuffled = [...sentences].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 5)
  })
  const [currentSentenceIndex, setSentenceIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [startTime, setStartTime] = useState<number | null>(null)
  const [wpm, setWpm] = useState<number | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [errors, setErrors] = useState<number[]>([])
  const [showStretchPrompt, setShowStretchPrompt] = useState(false)
  const [stretchTimer, setStretchTimer] = useState(10)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentSentence = selectedSentences[currentSentenceIndex]

  const stretchPrompts = [
    "Stretch your wrists",
    "Stretch your hands",
    "Stretch your fingers", 
    "Stretch your neck",
    "Fix your posture"
  ]

  const currentStretch = stretchPrompts[currentSentenceIndex % stretchPrompts.length]

  useEffect(() => {
    if (!showStretchPrompt) {
      inputRef.current?.focus()
    }
  }, [currentSentenceIndex, showStretchPrompt])

  useEffect(() => {
    if (showStretchPrompt && stretchTimer > 0) {
      const timer = setTimeout(() => setStretchTimer(stretchTimer - 1), 1000)
      return () => clearTimeout(timer)
    } else if (showStretchPrompt && stretchTimer === 0) {
      setShowStretchPrompt(false)
      setStretchTimer(10)
    }
  }, [showStretchPrompt, stretchTimer])

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

      if (currentSentenceIndex < selectedSentences.length - 1) {
        setTimeout(() => {
          setShowStretchPrompt(true)
          setStretchTimer(10)
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

  if (showStretchPrompt) {
    return (
      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8">
        <Card className="animate-slide-up">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {currentStretch}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">

            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-700">{stretchTimer}</span>
              </div>
              <p className="text-sm text-gray-500">
                Next sentence starts in {stretchTimer} seconds
              </p>
            </div>

            <Button
              onClick={() => {
                setShowStretchPrompt(false)
                setStretchTimer(10)
              }}
              variant="secondary"
            >
              Skip Stretch
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-8 py-8">
      <Card className="animate-slide-up">
        <CardHeader className="text-center">
          <CardTitle>Type the sentence</CardTitle>
          <CardDescription>
            Sentence {currentSentenceIndex + 1} of {selectedSentences.length}
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