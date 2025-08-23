'use client'

import { useState, useEffect, useCallback } from 'react'

interface MentalArithmeticProps {
  onComplete: () => void
}

export default function MentalArithmetic({ onComplete }: MentalArithmeticProps) {
  const [problems, setProblems] = useState<{ question: string; answer: number }[]>([])
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(15)
  const [isActive, setIsActive] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
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
    if (!isActive && problems.length === 0) {
      const newProblems = Array.from({ length: 20 }, () => generateProblem())
      setProblems(newProblems)
    }
  }, [isActive, problems.length, generateProblem])
  
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (isActive && timeLeft === 0) {
      setShowResults(true)
      setIsActive(false)
      setTimeout(onComplete, 3000)
    }
  }, [isActive, timeLeft, onComplete])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (parseInt(userAnswer) === problems[currentProblemIndex].answer) {
      setScore(score + 1)
    }
    
    setUserAnswer('')
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1)
    }
  }
  
  if (!isActive && !showResults) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-16 space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-light">Mental Arithmetic</h3>
          <p className="text-gray-600">Solve as many problems as you can in 15 seconds!</p>
        </div>
        <button
          onClick={() => setIsActive(true)}
          className="w-full max-w-xs mx-auto block py-3 bg-black text-white rounded-md hover:bg-gray-900 transition-colors"
        >
          Start
        </button>
      </div>
    )
  }
  
  if (showResults) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-16 text-center space-y-4 animate-fade-in">
        <h3 className="text-2xl font-light">Score: {score} correct</h3>
        <p className="text-gray-600">
          {score >= 10 ? 'Outstanding!' : score >= 7 ? 'Great job!' : 'Good effort!'}
        </p>
      </div>
    )
  }
  
  return (
    <div className="max-w-2xl mx-auto px-8 py-16 space-y-8">
      <div className="text-center space-y-2">
        <p className="text-3xl font-mono font-bold">{timeLeft}s</p>
        <p className="text-gray-600">Score: {score}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <p className="text-4xl font-mono mb-6">
            {problems[currentProblemIndex]?.question} = ?
          </p>
          
          <input
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
          Next
        </button>
      </form>
    </div>
  )
}