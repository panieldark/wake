'use client'

import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ExerciseInstructionDialog } from './ExerciseInstructionDialog'

interface MentalArithmeticProps {
  onComplete: () => void
}

export default function MentalArithmetic({ onComplete }: MentalArithmeticProps) {
  const [currentProblem, setCurrentProblem] = useState<{ question: string; answer: number } | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [feedback, setFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showDialog, setShowDialog] = useState(true)
  const targetCorrect = 5
  const inputRef = useRef<HTMLInputElement>(null)

  const generateProblem = useCallback(() => {
    const operations = ['+', '-', '*']
    const operation = operations[Math.floor(Math.random() * operations.length)]
    let a, b, answer

    switch (operation) {
      case '+':
        a = Math.floor(Math.random() * 50) + 10
        b = Math.floor(Math.random() * 50) + 10
        answer = a + b
        break
      case '-':
        a = Math.floor(Math.random() * 50) + 30
        b = Math.floor(Math.random() * 30) + 10
        answer = a - b
        break
      case '*':
        a = Math.floor(Math.random() * 12) + 2
        b = Math.floor(Math.random() * 12) + 2
        answer = a * b
        break
      default:
        a = 0
        b = 0
        answer = 0
    }

    return { question: `${a} ${operation} ${b}`, answer }
  }, [])

  useEffect(() => {
    if (isActive && !currentProblem) {
      setCurrentProblem(generateProblem())
    }
  }, [isActive, currentProblem, generateProblem])

  useEffect(() => {
    if (correctCount >= targetCorrect && !showResults) {
      setShowResults(true)
      setIsActive(false)
      setTimeout(onComplete, 3000)
    }
  }, [correctCount, targetCorrect, showResults, onComplete])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProblem || !userAnswer) return

    const isCorrect = parseInt(userAnswer) === currentProblem.answer
    setTotalAttempts(totalAttempts + 1)

    if (isCorrect) {
      setCorrectCount(correctCount + 1)
      setFeedback({ message: 'Correct!', isCorrect: true })
    } else {
      setFeedback({ message: `Incorrect. The answer was ${currentProblem.answer}`, isCorrect: false })
    }

    setUserAnswer('')
    
    // Generate new problem after a delay to show feedback
    setTimeout(() => {
      setFeedback(null)
      if (correctCount + (isCorrect ? 1 : 0) < targetCorrect) {
        setCurrentProblem(generateProblem())
      }
      // Refocus input after feedback clears
      setTimeout(() => inputRef.current?.focus(), 50)
    }, 1000)
  }

  const handleStartFromDialog = () => {
    setShowDialog(false)
  }

  const handleRestart = () => {
    setCurrentProblem(null)
    setUserAnswer('')
    setCorrectCount(0)
    setTotalAttempts(0)
    setFeedback(null)
    setIsActive(false)
    setShowResults(false)
    setShowDialog(true)
  }

  return (
    <>
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
      
      <ExerciseInstructionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Mental Arithmetic Challenge"
        description="Solve 5 math problems correctly to complete the exercise!"
        instructions={
          <>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">🧮 How it Works</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Solve 5 problems correctly to complete the exercise</li>
                  <li>Problems include addition, subtraction, and multiplication</li>
                  <li>Type your answer and press Enter to submit</li>
                  <li>You'll get feedback after each answer</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2">💪 Tips for Speed</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Don't overthink - trust your first instinct</li>
                  <li>Use mental shortcuts (like 9×6 = 10×6 - 6)</li>
                  <li>Take your time - accuracy matters more than speed</li>
                  <li>Keep your fingers on the number keys</li>
                </ul>
              </div>
            </div>
          </>
        }
        onStart={handleStartFromDialog}
      />

      {!isActive && !showResults ? (
        <div className="max-w-2xl mx-auto px-8 py-16 space-y-8 animate-fade-in">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-light">Mental Arithmetic</h3>
            <p className="text-gray-600">Solve 5 problems correctly to complete the exercise</p>
          </div>
          <button
            onClick={() => setIsActive(true)}
            className="w-full max-w-xs mx-auto block py-3 bg-black text-white rounded-md hover:bg-gray-900 transition-colors"
          >
            Start
          </button>
        </div>
      ) : showResults ? (
        <div className="max-w-2xl mx-auto px-8 py-16 text-center space-y-4 animate-fade-in">
          <h3 className="text-2xl font-light">Exercise Complete!</h3>
          <p className="text-lg text-gray-600">
            You solved {correctCount} problems correctly
          </p>
          <p className="text-gray-600">
            Accuracy: {Math.round((correctCount / totalAttempts) * 100)}%
          </p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-8 py-16 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-lg text-gray-600">Progress: {correctCount} / {targetCorrect} correct</p>
            <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(correctCount / targetCorrect) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <p className="text-4xl font-mono mb-6">
                {currentProblem?.question} = ?
              </p>

              <input
                ref={inputRef}
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-32 px-4 py-3 text-2xl text-center font-mono border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full max-w-xs mx-auto block py-3 bg-black text-white rounded-md hover:bg-gray-900 transition-colors"
            >
              Submit
            </button>
          </form>

          {feedback && (
            <div className={`text-center p-4 rounded-lg animate-fade-in ${
              feedback.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <p className="font-semibold">{feedback.message}</p>
            </div>
          )}
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