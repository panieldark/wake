'use client'

import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ExerciseInstructionDialog } from './ExerciseInstructionDialog'

interface ClickingDrillProps {
  onComplete: () => void
  onSkip?: () => void
}

export default function ClickingDrill({ onComplete, onSkip }: ClickingDrillProps) {
  const [targets, setTargets] = useState<{ x: number; y: number; id: number }[]>([])
  const [clickTimes, setClickTimes] = useState<number[]>([])
  const [lastClickTime, setLastClickTime] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [showDialog, setShowDialog] = useState(true)
  const targetCount = 10

  const generateTarget = useCallback(() => {
    const margin = 50
    const x = Math.random() * (window.innerWidth - 2 * margin) + margin
    const y = Math.random() * (window.innerHeight - 200) + 100
    return { x, y, id: Date.now() }
  }, [])

  useEffect(() => {
    if (isActive && targets.length === 0) {
      setTargets([generateTarget()])
      setLastClickTime(Date.now())
    }
  }, [isActive, targets.length, generateTarget])

  useEffect(() => {
    if (isActive && lastClickTime) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now() - lastClickTime)
      }, 10)
      return () => clearInterval(interval)
    }
  }, [isActive, lastClickTime])

  const playSuccessSound = () => {
    const audio = new Audio('/sounds/ding.mp3')
    audio.volume = 0.5
    audio.play().catch(console.error)
  }

  const handleTargetClick = () => {
    playSuccessSound()

    const clickTime = Date.now()
    if (lastClickTime) {
      setClickTimes([...clickTimes, clickTime - lastClickTime])
    }

    if (clickTimes.length + 1 >= targetCount) {
      setIsActive(false)
      setTimeout(onComplete, 2000)
    } else {
      setTargets([generateTarget()])
      setLastClickTime(clickTime)
    }
  }

  const avgTime = clickTimes.length > 0
    ? Math.round(clickTimes.reduce((a, b) => a + b, 0) / clickTimes.length)
    : 0

  const handleStartFromDialog = () => {
    setShowDialog(false)
    setIsActive(true)
  }

  const handleRestart = () => {
    setTargets([])
    setClickTimes([])
    setLastClickTime(null)
    setCurrentTime(0)
    setIsActive(false)
    setShowDialog(true)
  }

  return (
    <>
      <ExerciseInstructionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Clicking Precision Drill"
        description="Test and improve your mouse accuracy and reaction time by clicking targets as quickly as possible."
        instructions={
          <>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">🎯 How to Play</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Click on the appearing targets as fast as you can</li>
                  <li>{targetCount} targets will appear one at a time</li>
                  <li>Each target appears in a random position</li>
                  <li>Your average click time will be measured</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2">💡 Tips</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Focus on accuracy over speed</li>
                  <li>Keep your mouse hand relaxed</li>
                  <li>Try to anticipate where targets might appear</li>
                  <li>Practice smooth, controlled movements</li>
                </ul>
              </div>
            </div>
          </>
        }
        onStart={handleStartFromDialog}
      />

      {!isActive && clickTimes.length > 0 ? (
        <div className="max-w-2xl mx-auto px-8 py-16 text-center space-y-4 animate-fade-in">
          <h3 className="text-2xl font-light">Average reaction time: {avgTime}ms</h3>
          <p className="text-gray-600">
            {avgTime < 500 ? 'Lightning fast!' : avgTime < 700 ? 'Great speed!' : 'Good job!'}
          </p>
        </div>
      ) : isActive ? (
        <div className="fixed inset-0 bg-white">
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 text-center">
            <div className="text-4xl font-mono font-bold">{currentTime}ms</div>
            <div className="text-sm text-gray-500 mt-2">
              {clickTimes.length + 1} / {targetCount}
            </div>
          </div>

          {targets.map((target) => (
            <button
              key={target.id}
              onClick={handleTargetClick}
              className="absolute w-8 h-8 bg-black rounded-full hover:scale-110 transition-transform"
              style={{
                left: `${target.x - 16}px`,
                top: `${target.y - 16}px`,
              }}
            />
          ))}
        </div>
      ) : null}

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