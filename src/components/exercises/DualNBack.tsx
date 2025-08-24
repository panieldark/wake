'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ExerciseInstructionDialog } from './ExerciseInstructionDialog'

interface DualNBackProps {
  onComplete: () => void
}

const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8]
const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export default function DualNBack({ onComplete }: DualNBackProps) {
  const [n] = useState(2)
  const [sequence, setSequence] = useState<{ position: number; letter: string }[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userResponses, setUserResponses] = useState<{ position: boolean; letter: boolean }[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [showDialog, setShowDialog] = useState(true)

  const generateSequence = useCallback(() => {
    const seq: { position: number; letter: string }[] = []
    const trials = 20

    for (let i = 0; i < trials; i++) {
      const positionMatch = i >= n && Math.random() < 0.3
      const letterMatch = i >= n && Math.random() < 0.3

      const position = positionMatch ? seq[i - n].position : positions[Math.floor(Math.random() * positions.length)]
      const letter = letterMatch ? seq[i - n].letter : letters[Math.floor(Math.random() * letters.length)]

      seq.push({ position, letter })
    }

    return seq
  }, [n])

  useEffect(() => {
    if (isActive && currentIndex < sequence.length) {
      // Play the letter audio when showing the position
      if (sequence[currentIndex]) {
        speakLetter(sequence[currentIndex].letter)
      }

      const timer = setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
      }, 4000) // Slowed down to 4000ms (4 seconds)
      return () => clearTimeout(timer)
    } else if (isActive && currentIndex >= sequence.length) {
      calculateScore()
    }
  }, [isActive, currentIndex, sequence.length])

  const speakLetter = (letter: string) => {
    console.log('Attempting to speak letter:', letter)

    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported')
      return
    }

    // Cancel any ongoing speech
    speechSynthesis.cancel()

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(letter.toLowerCase())
      utterance.rate = 0.7
      utterance.volume = 1.0
      utterance.pitch = 0.8

      utterance.onstart = () => console.log('Speech started for:', letter)
      utterance.onend = () => console.log('Speech ended for:', letter)
      utterance.onerror = (event) => console.error('Speech error:', event)

      // Get available voices
      const voices = speechSynthesis.getVoices()
      console.log('Total voices available:', voices.length)

      if (voices.length > 0) {
        // Try to find a male voice
        const maleVoice = voices.find(voice =>
          voice.name.toLowerCase().includes('male') ||
          voice.name.toLowerCase().includes('david') ||
          voice.name.toLowerCase().includes('alex') ||
          voice.name.toLowerCase().includes('daniel') ||
          voice.name.toLowerCase().includes('aaron') ||
          voice.name.includes('Google US English')
        ) || voices.find(voice => voice.lang.startsWith('en-US'))

        if (maleVoice) {
          utterance.voice = maleVoice
          console.log('Using voice:', maleVoice.name, maleVoice.lang)
        } else {
          console.log('Using default voice')
        }
      }

      console.log('Speaking with voice:', utterance.voice?.name || 'default')
      speechSynthesis.speak(utterance)
    }

    // Small delay to ensure previous speech is cancelled
    setTimeout(() => {
      if (speechSynthesis.getVoices().length === 0) {
        console.log('Waiting for voices to load...')
        speechSynthesis.addEventListener('voiceschanged', speak, { once: true })
        // Fallback timeout in case voiceschanged never fires
        setTimeout(speak, 1000)
      } else {
        speak()
      }
    }, 100)
  }

  const startExercise = () => {
    const newSequence = generateSequence()
    setSequence(newSequence)
    setCurrentIndex(0)
    setUserResponses([])
    setIsActive(true)
    setShowInstructions(false)
  }

  const handleResponse = (type: 'position' | 'letter') => {
    if (currentIndex < n) return

    const newResponses = [...userResponses]
    if (!newResponses[currentIndex]) {
      newResponses[currentIndex] = { position: false, letter: false }
    }
    newResponses[currentIndex][type] = true
    setUserResponses(newResponses)
  }

  const calculateScore = () => {
    let correct = 0
    let total = 0

    sequence.forEach((item, index) => {
      if (index >= n) {
        total += 2
        const positionMatch = item.position === sequence[index - n].position
        const letterMatch = item.letter === sequence[index - n].letter
        const userResponse = userResponses[index] || { position: false, letter: false }

        if (positionMatch === userResponse.position) correct++
        if (letterMatch === userResponse.letter) correct++
      }
    })

    setScore(Math.round((correct / total) * 100))
    setShowFeedback(true)
    setTimeout(onComplete, 3000)
  }

  const current = sequence[currentIndex]

  const handleStartFromDialog = () => {
    setShowDialog(false)
  }

  const handleRestart = () => {
    setSequence([])
    setCurrentIndex(0)
    setUserResponses([])
    setShowFeedback(false)
    setScore(0)
    setIsActive(false)
    setShowInstructions(true)
    setShowDialog(true)
  }

  return (
    <>
      <ExerciseInstructionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title={`Dual ${n}-Back Training`}
        description={`This exercise will challenge your working memory by requiring you to remember both visual positions and auditory letters from ${n} steps back.`}
        instructions={
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">👁️ Visual Task</h4>
                <p className="text-sm">
                  Watch squares light up in a 3×3 grid. Press <kbd className="px-2 py-1 bg-white rounded text-xs">A</kbd> when
                  the position matches {n} steps back.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2">🔊 Auditory Task</h4>
                <p className="text-sm">
                  Listen to spoken letters. Press <kbd className="px-2 py-1 bg-white rounded text-xs">L</kbd> when
                  the letter matches {n} steps back.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg mt-4">
              <p className="text-sm">
                <strong>Remember:</strong> You're comparing the current stimulus with what appeared {n} steps ago.
                Both tasks run simultaneously, so stay focused!
              </p>
            </div>
          </>
        }
        onStart={handleStartFromDialog}
      />

      {showInstructions ? (
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8">
          <Card className="animate-slide-up">
            <CardHeader className="text-center">
              <CardTitle>Dual {n}-Back</CardTitle>
              <CardDescription className="space-y-2 mt-4">
                <p>Watch the position of the square and listen to the spoken letter.</p>
                <p>Press <kbd>A</kbd> if the position matches {n} steps back.</p>
                <p>Press <kbd>L</kbd> if the letter matches {n} steps back.</p>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <Button
                onClick={() => speakLetter('A')}
                variant="secondary"
                size="sm"
              >
                Test Audio (A)
              </Button>
              <Button onClick={startExercise} size="lg">
                Start Exercise
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : showFeedback ? (
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8">
          <Card className="animate-slide-up">
            <CardContent className="text-center py-12">
              <div className="text-6xl font-bold text-gray-900 mb-4">{score}%</div>
              <p className="text-lg text-gray-600">
                {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good job!' : 'Keep practicing!'}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-8 py-16 space-y-8">
          <div className="text-center">
            <p className="text-gray-600">Trial {currentIndex + 1} / {sequence.length}</p>
          </div>

          <div className="relative mx-auto" style={{ width: '300px', height: '300px' }}>
            <div className="grid grid-cols-3 gap-2 w-full h-full">
              {positions.map((pos) => (
                <div
                  key={pos}
                  className={`border-2 border-gray-200 rounded ${current && current.position === pos ? 'bg-black' : 'bg-white'
                    }`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleResponse('position')}
              disabled={currentIndex < n}
              className="px-6 py-3 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Position Match (A)
            </button>
            <button
              onClick={() => handleResponse('letter')}
              disabled={currentIndex < n}
              className="px-6 py-3 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Letter Match (L)
            </button>
          </div>
        </div>
      )}

      <Button
        onClick={handleRestart}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-white/90 hover:bg-white shadow-lg"
      >
        <RotateCcw className="w-4 h-4 mr-1" />
        Restart Exercise
      </Button>
    </>
  )
}