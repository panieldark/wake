'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

interface WordMemoryProps {
  onComplete: () => void
}

// Generate random words from different categories to ensure variety
const generateRandomWords = () => {
  const categories = {
    nature: ['ocean', 'mountain', 'forest', 'valley', 'meadow', 'river', 'sunset', 'breeze', 'storm', 'rainbow'],
    objects: ['telescope', 'laptop', 'crystal', 'mirror', 'compass', 'lantern', 'guitar', 'camera', 'notebook', 'watch'],
    actions: ['journey', 'whisper', 'discover', 'explore', 'create', 'imagine', 'reflect', 'wander', 'celebrate', 'inspire'],
    concepts: ['harmony', 'freedom', 'wisdom', 'courage', 'balance', 'wonder', 'mystery', 'serenity', 'adventure', 'passion']
  }
  
  const allWords = Object.values(categories).flat()
  const shuffled = allWords.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 10)
}

export default function WordMemory({ onComplete }: WordMemoryProps) {
  const [phase, setPhase] = useState<'memorize' | 'recall'>('memorize')
  const [timeLeft, setTimeLeft] = useState(15)
  const [userInput, setUserInput] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [wordList] = useState(() => generateRandomWords())
  
  useEffect(() => {
    if (phase === 'memorize' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (phase === 'memorize' && timeLeft === 0) {
      setPhase('recall')
    }
  }, [phase, timeLeft])
  
  const handleSubmit = () => {
    const userWords = userInput.toLowerCase().split(/[\s,]+/).filter(w => w.length > 0)
    const correctWords = userWords.filter(word => wordList.includes(word))
    setScore(correctWords.length)
    setTimeout(onComplete, 2000)
  }
  
  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-8 py-8">
      <Card className="animate-slide-up">
        {phase === 'memorize' ? (
          <>
            <CardHeader className="text-center">
              <CardTitle>Memorize these words</CardTitle>
              <CardDescription>
                <span className="text-2xl font-semibold text-gray-900">{timeLeft}</span>
                <span className="text-sm ml-2">seconds remaining</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-8">
                {wordList.map((word, index) => (
                  <div 
                    key={index} 
                    className="text-center p-4 bg-gray-50 rounded-lg font-medium text-lg hover:bg-gray-100 transition-colors"
                  >
                    {word}
                  </div>
                ))}
              </div>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle>
                {score === null ? 'Recall the words' : `You remembered ${score} words!`}
              </CardTitle>
              {score === null && (
                <CardDescription>Type as many as you can remember</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {score === null ? (
                <>
                  <Textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type the words here, separated by spaces or commas..."
                    className="min-h-[150px]"
                    autoFocus
                  />
                  <Button
                    onClick={handleSubmit}
                    className="w-full"
                    size="lg"
                  >
                    Submit
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">
                    {score >= 7 ? '🎉' : score >= 5 ? '👏' : '💪'}
                  </div>
                  <p className="text-lg text-gray-600">
                    {score >= 7 ? 'Excellent memory!' : score >= 5 ? 'Good job!' : 'Nice try!'}
                  </p>
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}