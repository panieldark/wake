'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ExerciseInstructionDialog } from './ExerciseInstructionDialog'

interface WordMemoryProps {
  onComplete: (words?: string[]) => void
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
  return shuffled.slice(0, 12)
}

// Generate decoy words for recognition phase
const generateDecoyWords = (correctWords: string[]) => {
  const categories = {
    nature: ['desert', 'glacier', 'canyon', 'prairie', 'lagoon', 'waterfall', 'dawn', 'fog', 'thunder', 'eclipse'],
    objects: ['microscope', 'tablet', 'diamond', 'window', 'map', 'flashlight', 'piano', 'phone', 'journal', 'clock'],
    actions: ['search', 'shout', 'uncover', 'examine', 'build', 'dream', 'consider', 'travel', 'rejoice', 'motivate'],
    concepts: ['peace', 'liberty', 'knowledge', 'bravery', 'symmetry', 'curiosity', 'puzzle', 'tranquility', 'quest', 'emotion']
  }

  const allDecoys = Object.values(categories).flat()
  const availableDecoys = allDecoys.filter(word => !correctWords.includes(word))
  const shuffled = availableDecoys.sort(() => Math.random() - 0.5)

  // Return enough decoys to make 12 total words with 4-8 correct ones
  const numCorrect = Math.floor(Math.random() * 5) + 4 // 4-8 correct words
  const numDecoys = 12 - numCorrect

  return {
    decoys: shuffled.slice(0, numDecoys),
    numCorrect
  }
}

type RecalledWord = {
  word: string
  isCorrect: boolean
  timestamp: number
}

export default function WordMemory({ onComplete }: WordMemoryProps) {
  const [phase, setPhase] = useState<'memorize' | 'recognition' | 'braindump' | 'review' | 'results'>('memorize')
  const [timeLeft, setTimeLeft] = useState(20)
  const [userInput, setUserInput] = useState('')
  const [recalledWords, setRecalledWords] = useState<RecalledWord[]>([])
  const [wordList] = useState(() => generateRandomWords())
  const [showDialog, setShowDialog] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [recognitionWords, setRecognitionWords] = useState<string[]>([])
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set())
  const [recognitionResults, setRecognitionResults] = useState<{ correct: number, incorrect: number } | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [canContinue, setCanContinue] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [showingWords, setShowingWords] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle initial countdown (3-2-1)
  useEffect(() => {
    if (isActive && phase === 'memorize' && !showingWords) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        return () => clearTimeout(timer)
      } else {
        setShowingWords(true)
      }
    }
  }, [isActive, phase, countdown, showingWords])

  // Handle memorization timer (20 seconds)
  useEffect(() => {
    if (isActive && phase === 'memorize' && showingWords && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (isActive && phase === 'memorize' && timeLeft === 0) {
      setPhase('recognition')
    }
  }, [isActive, phase, showingWords, timeLeft])

  // Generate recognition words when entering recognition phase
  useEffect(() => {
    if (phase === 'recognition' && recognitionWords.length === 0) {
      const { decoys, numCorrect } = generateDecoyWords(wordList)
      
      // Favor words from the end of the list (recency effect bias)
      // Take more words from the second half, fewer from the first half
      const firstHalfSize = Math.floor(wordList.length / 2)
      const secondHalfSize = wordList.length - firstHalfSize
      
      // Take 30% from first half, 70% from second half
      const fromFirstHalf = Math.max(1, Math.floor(numCorrect * 0.3))
      const fromSecondHalf = numCorrect - fromFirstHalf
      
      const firstHalf = wordList.slice(0, firstHalfSize)
      const secondHalf = wordList.slice(firstHalfSize)
      
      // Randomly select from each half
      const selectedFromFirst = firstHalf.sort(() => Math.random() - 0.5).slice(0, Math.min(fromFirstHalf, firstHalf.length))
      const selectedFromSecond = secondHalf.sort(() => Math.random() - 0.5).slice(0, Math.min(fromSecondHalf, secondHalf.length))
      
      const correctWordsToShow = [...selectedFromFirst, ...selectedFromSecond]
      const allWords = [...correctWordsToShow, ...decoys]
      setRecognitionWords(allWords.sort(() => Math.random() - 0.5))
    }
  }, [phase, wordList, recognitionWords.length])

  const handleWordInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const word = userInput.trim().toLowerCase()

      if (word && !recalledWords.some(r => r.word === word)) {
        const isCorrect = wordList.includes(word)
        setRecalledWords(prev => [...prev, {
          word,
          isCorrect,
          timestamp: Date.now()
        }])
        setUserInput('')

        // Play a subtle sound or trigger haptic feedback here
        if (isCorrect) {
          // Success feedback
          inputRef.current?.classList.add('animate-pulse-green')
          setTimeout(() => inputRef.current?.classList.remove('animate-pulse-green'), 1000)
        } else {
          // Error feedback
          inputRef.current?.classList.add('animate-pulse-red')
          setTimeout(() => inputRef.current?.classList.remove('animate-pulse-red'), 1000)
        }
      }
    }
  }

  const handleRecognitionComplete = () => {
    setPhase('braindump')
  }

  const handleBraindumpComplete = () => {
    setPhase('review')
  }

  const toggleWordSelection = (word: string) => {
    setSelectedWords(prev => {
      const newSet = new Set(prev)
      if (newSet.has(word)) {
        newSet.delete(word)
      } else {
        newSet.add(word)
      }
      return newSet
    })
  }

  const handleRecognitionSubmit = () => {
    let correct = 0
    let incorrect = 0

    selectedWords.forEach(word => {
      if (wordList.includes(word)) {
        correct++
      } else {
        incorrect++
      }
    })

    // Also count words they should have selected but didn't
    wordList.forEach(word => {
      if (recognitionWords.includes(word) && !selectedWords.has(word)) {
        incorrect++
      }
    })

    setRecognitionResults({ correct, incorrect })
    setShowResults(true)

    // Show continue button after 4 seconds to go to braindump
    setTimeout(() => {
      setCanContinue(true)
    }, 4000)
  }

  const handleReviewComplete = () => {
    onComplete(wordList)
  }

  const handleStartFromDialog = () => {
    setShowDialog(false)
    setIsActive(true)
  }

  const handleRestart = () => {
    setPhase('memorize')
    setTimeLeft(20)
    setUserInput('')
    setRecalledWords([])
    setIsActive(false)
    setRecognitionWords([])
    setSelectedWords(new Set())
    setRecognitionResults(null)
    setShowResults(false)
    setCanContinue(false)
    setCountdown(3)
    setShowingWords(false)
    setShowDialog(true)
  }

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        
        .animate-pulse-green {
          animation: pulse-green 1s ease-out;
        }
        
        .animate-pulse-red {
          animation: pulse-red 1s ease-out;
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        
        
      `}</style>

      <ExerciseInstructionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Word Memory Challenge"
        description="Memorize these 12 words"
        instructions={
          <>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                {/* <h4 className="font-semibold mb-2">🧠 How it Works</h4> */}
                <ul className="text-sm space-y-1 list-inside">
                  {/* <li><strong>Memorize</strong> 12 words in 20 seconds</li> */}
                  <li><strong>Recall:</strong> Braindump all words you remember</li>
                  <li><strong>Recognition:</strong> Select ONLY the original words from a mixed list (includes decoys)</li>
                </ul>
              </div>
            </div>
          </>
        }
        onStart={handleStartFromDialog}
      />

      {isActive ? (
        <>
          <div className="max-w-4xl mx-auto px-6 sm:px-8 py-8">
            <Card className="animate-slide-up">
              {phase === 'memorize' ? (
                <>
                  <CardHeader className="text-center">
                    <CardTitle>Memorize these words</CardTitle>
                    <CardDescription>
                      {showingWords ? (
                        <>
                          <span className="text-2xl font-semibold text-gray-900">{timeLeft}</span>
                          <span className="text-sm ml-2">seconds remaining</span>
                        </>
                      ) : (
                        <span className="text-sm">Get ready...</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!showingWords ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="text-6xl font-bold text-gray-400 animate-pulse">
                          {countdown}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3 py-8 justify-items-center max-w-2xl mx-auto">
                        {wordList.map((word, index) => (
                          <motion.div
                            key={`word-${index}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.6,
                              ease: "easeOut",
                              delay: index * 0.05
                            }}
                            className="text-center p-3 bg-gray-50 rounded-lg font-medium text-base min-w-[120px]"
                          >
                            {word}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </>
              ) : phase === 'braindump' ? (
                <>
                  <CardHeader className="text-center">
                    <CardTitle>Recall</CardTitle>
                    <CardDescription>Type all the words you remember</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Input
                        ref={inputRef}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleWordInput}
                        placeholder="Type a word and press space..."
                        className="text-lg"
                        autoFocus
                      />

                      <div className="flex flex-wrap gap-2 min-h-[100px] p-4 bg-gray-50 rounded-lg">
                        {recalledWords.map((item, index) => (
                          <div
                            key={index}
                            className={cn(
                              "px-3 py-1 rounded-full text-sm font-medium animate-slide-up inline-block h-fit",
                              item.isCorrect
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            )}
                          >
                            {item.word}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleBraindumpComplete}
                      className="w-full"
                      size="lg"
                    >
                      Reveal Original Words
                    </Button>
                  </CardContent>
                </>
              ) : phase === 'review' ? (
                <>
                  <CardHeader className="text-center">
                    <CardTitle>Original Words</CardTitle>
                    <CardDescription>Here are the words you were asked to recall</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-4 gap-3 py-8 justify-items-center max-w-2xl mx-auto">
                      {wordList.map((word, index) => {
                        const wasRecalled = recalledWords.some(r => r.word === word && r.isCorrect)
                        return (
                          <div
                            key={index}
                            className={cn(
                              "text-center p-3 rounded-lg font-medium text-base min-w-[120px] border relative",
                              wasRecalled 
                                ? "bg-green-50 border-green-300" 
                                : "bg-gray-50 border-gray-200"
                            )}
                          >
                            {word}
                            {wasRecalled && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">✓</span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="text-center text-sm text-gray-600">
                      You correctly recalled {recalledWords.filter(r => r.isCorrect).length} out of {wordList.length} words
                    </div>

                    <Button
                      onClick={handleReviewComplete}
                      className="w-full"
                      size="lg"
                    >
                      Complete Exercise
                    </Button>
                  </CardContent>
                </>
              ) : phase === 'recognition' ? (
                <>
                  <CardHeader className="text-center">
                    <CardTitle>Recognition</CardTitle>
                    <CardDescription>Select only the words that were in the original list. Some words below are decoys!</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {recognitionWords.map((word, index) => {
                        const isSelected = selectedWords.has(word)
                        const isCorrect = wordList.includes(word)
                        const isIncorrect = showResults && isSelected && !isCorrect
                        const isMissed = showResults && !isSelected && isCorrect

                        return (
                          <div key={index} className="relative">
                            <button
                              onClick={() => !showResults && toggleWordSelection(word)}
                              disabled={showResults}
                              className={cn(
                                "w-full p-3 rounded-lg font-medium transition-all duration-150",
                                showResults && isCorrect && isSelected
                                  ? "bg-green-700/70 text-white cursor-default"
                                  : showResults && isIncorrect
                                    ? "bg-red-700/70 text-white cursor-default"
                                    : showResults
                                      ? "bg-gray-100 cursor-default"
                                      : isSelected
                                        ? "bg-neutral-600 text-white scale-95"
                                        : "bg-gray-100 hover:bg-gray-200 hover:scale-98"
                              )}
                            >
                              {word}
                            </button>
                            {showResults && isMissed && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center">
                                  !
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {!showResults ? (
                      <Button
                        onClick={handleRecognitionSubmit}
                        className="w-full"
                        size="lg"
                        disabled={selectedWords.size === 0}
                      >
                        Submit ({selectedWords.size} selected)
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                          <div>
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-1">✓</div>
                            <div className="text-2xl font-bold text-green-600">
                              {selectedWords.size > 0 ? Array.from(selectedWords).filter(word => wordList.includes(word)).length : 0}
                            </div>
                            <div className="text-gray-600">Correct</div>
                          </div>
                          <div>
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-1">✗</div>
                            <div className="text-2xl font-bold text-red-600">
                              {selectedWords.size > 0 ? Array.from(selectedWords).filter(word => !wordList.includes(word)).length : 0}
                            </div>
                            <div className="text-gray-600">Wrong</div>
                          </div>
                          <div>
                            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-1">!</div>
                            <div className="text-2xl font-bold text-amber-600">
                              {wordList.filter(word => recognitionWords.includes(word) && !selectedWords.has(word)).length}
                            </div>
                            <div className="text-gray-600">Missed</div>
                          </div>
                        </div>

                        {canContinue && (
                          <div className="flex justify-end">
                            <Button onClick={handleRecognitionComplete} size="sm">
                              Continue to Recall
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </>
              ) : null}
            </Card>
          </div>
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
      ) : null}
    </>
  )
}