'use client'

import { useState } from 'react'
import BreathingExercise from './exercises/BreathingExercise'
import ClickingDrill from './exercises/ClickingDrill'
import DualNBack from './exercises/DualNBack'
import GoalCueing from './exercises/GoalCueing'
import MentalArithmetic from './exercises/MentalArithmetic'
import TypingDrill from './exercises/TypingDrill'
import VisualSearch from './exercises/VisualSearch'
import WordMemory from './exercises/WordMemory'
import WordMemoryRecall from './exercises/WordMemoryRecall'

interface WakeFlowProps {
  onComplete: () => void
}

const exercises = [
  { name: 'Dual N-Back', component: DualNBack },
  { name: 'Clicking Drill', component: ClickingDrill, skippable: true },
  { name: 'Typing Drill', component: TypingDrill },
  { name: 'Word Memory', component: WordMemory },
  { name: 'Visual Search', component: VisualSearch },
  { name: 'Mental Arithmetic', component: MentalArithmetic },
  { name: 'Word Memory Recall', component: WordMemoryRecall, hidden: true },
  { name: 'Goal Cueing', component: GoalCueing },
  { name: 'Breathing', component: BreathingExercise },
]

export default function WakeFlow({ onComplete }: WakeFlowProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [wordMemoryWords, setWordMemoryWords] = useState<string[]>([])

  const handleNext = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    handleNext()
  }

  const jumpToExercise = (index: number) => {
    setCurrentExerciseIndex(index)
  }

  const CurrentExercise = exercises[currentExerciseIndex].component
  const isSkippable = exercises[currentExerciseIndex].skippable

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg z-10 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-4">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500">
                Step {exercises.slice(0, currentExerciseIndex + 1).filter(e => !e.hidden).length} of {exercises.filter(e => !e.hidden).length}
              </span>
              <h2 className="text-lg font-semibold text-gray-900">{exercises[currentExerciseIndex].name}</h2>
            </div>
            <div className="hidden sm:block flex-1 max-w-sm">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gray-600 to-gray-900 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(exercises.slice(0, currentExerciseIndex + 1).filter(e => !e.hidden).length / exercises.filter(e => !e.hidden).length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 pt-24 pb-8">
        {exercises[currentExerciseIndex].name === 'Word Memory' ? (
          <CurrentExercise 
            onComplete={(words?: string[]) => {
              if (words) setWordMemoryWords(words)
              handleNext()
            }} 
            onSkip={isSkippable ? handleSkip : undefined} 
          />
        ) : exercises[currentExerciseIndex].name === 'Word Memory Recall' ? (
          <WordMemoryRecall 
            onComplete={handleNext} 
            originalWords={wordMemoryWords}
          />
        ) : (
          <CurrentExercise 
            onComplete={handleNext} 
            onSkip={isSkippable ? handleSkip : undefined} 
          />
        )}
      </div>

      {/* Debug Table of Contents */}
      <div className="fixed bottom-4 left-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-20 max-w-xs">
        <p className="text-xs font-medium text-gray-500 mb-2">Jump to Exercise</p>
        <div className="grid grid-cols-2 gap-1">
          {exercises.map((exercise, index) => (
            !exercise.hidden && (
              <button
                key={index}
                onClick={() => jumpToExercise(index)}
                className={`text-xs px-2 py-1 rounded text-left hover:bg-gray-100 ${currentExerciseIndex === index ? 'bg-blue-100 text-blue-800' : 'text-gray-600'
                  }`}
              >
                {index + 1}. {exercise.name}
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  )
}