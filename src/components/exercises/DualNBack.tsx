'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

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
      }, 3500) // Slowed down from 2500ms to 3500ms
      return () => clearTimeout(timer)
    } else if (isActive && currentIndex >= sequence.length) {
      calculateScore()
    }
  }, [isActive, currentIndex, sequence.length])
  
  const speakLetter = (letter: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(letter)
      utterance.rate = 0.8
      utterance.volume = 0.7
      speechSynthesis.speak(utterance)
    }
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
  
  if (showInstructions) {
    return (
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
          <CardContent className="flex justify-center pt-6">
            <Button onClick={startExercise} size="lg">
              Start Exercise
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (showFeedback) {
    return (
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
    )
  }
  
  return (
    <div className="max-w-2xl mx-auto px-8 py-16 space-y-8">
      <div className="text-center">
        <p className="text-gray-600">Trial {currentIndex + 1} / {sequence.length}</p>
      </div>
      
      <div className="relative mx-auto" style={{ width: '300px', height: '300px' }}>
        <div className="grid grid-cols-3 gap-2 w-full h-full">
          {positions.map((pos) => (
            <div
              key={pos}
              className={`border-2 border-gray-200 rounded ${
                current && current.position === pos ? 'bg-black' : 'bg-white'
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
  )
}