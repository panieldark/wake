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
  const [clickCount, setClickCount] = useState(0)
  const [clickTimes, setClickTimes] = useState<number[]>([])
  const [lastTargetTime, setLastTargetTime] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [remainingTime, setRemainingTime] = useState(20000) // 20 seconds in ms
  const [isActive, setIsActive] = useState(false)
  const [showDialog, setShowDialog] = useState(true)
  const gameDuration = 20000 // 20 seconds

  const generateTarget = useCallback(() => {
    const margin = 50
    const x = Math.random() * (window.innerWidth - 2 * margin) + margin
    const y = Math.random() * (window.innerHeight - 200) + 100
    return { x, y, id: Date.now() }
  }, [])

  useEffect(() => {
    if (isActive && targets.length === 0) {
      const targetTime = Date.now()
      setTargets([generateTarget()])
      setLastTargetTime(targetTime)
      if (!startTime) {
        setStartTime(targetTime)
      }
    }
  }, [isActive, targets.length, generateTarget, startTime])

  useEffect(() => {
    if (isActive && startTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, gameDuration - elapsed)
        setRemainingTime(remaining)
        
        if (remaining === 0) {
          setIsActive(false)
          setTimeout(onComplete, 2000)
        }
      }, 10)
      return () => clearInterval(interval)
    }
  }, [isActive, startTime, gameDuration, onComplete])

  useEffect(() => {
    if (isActive && lastTargetTime) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now() - lastTargetTime)
      }, 10)
      return () => clearInterval(interval)
    }
  }, [isActive, lastTargetTime])

  const playSuccessSound = () => {
    const audio = new Audio('/sounds/ding.mp3')
    audio.volume = 0.5
    audio.play().catch(console.error)
  }

  const handleTargetClick = () => {
    playSuccessSound()
    
    const clickTime = Date.now()
    if (lastTargetTime) {
      const reactionTime = clickTime - lastTargetTime
      setClickTimes(prev => [...prev, reactionTime])
    }
    
    setClickCount(prev => prev + 1)
    const targetTime = Date.now()
    setTargets([generateTarget()])
    setLastTargetTime(targetTime)
    setCurrentTime(0)
  }

  const clicksPerSecond = clickCount > 0 && startTime
    ? (clickCount / ((gameDuration - remainingTime) / 1000)).toFixed(2)
    : '0.00'
  
  const avgReactionTime = clickTimes.length > 0
    ? Math.round(clickTimes.reduce((a, b) => a + b, 0) / clickTimes.length)
    : 0

  const handleStartFromDialog = () => {
    setShowDialog(false)
    setIsActive(true)
  }

  const handleRestart = () => {
    setTargets([])
    setClickCount(0)
    setClickTimes([])
    setLastTargetTime(null)
    setCurrentTime(0)
    setStartTime(null)
    setRemainingTime(gameDuration)
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
                  <li>You have 20 seconds to click as many targets as possible</li>
                  <li>Each target appears in a random position</li>
                  <li>Your clicks per second will be measured</li>
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

      {!isActive && clickCount > 0 ? (
        <div className="max-w-2xl mx-auto px-8 py-16 text-center space-y-4 animate-fade-in">
          <h3 className="text-2xl font-light">Total clicks: {clickCount}</h3>
          <div className="space-y-2">
            <p className="text-lg text-gray-600">Clicks per second: {clicksPerSecond}</p>
            <p className="text-lg text-gray-600">Average reaction time: {avgReactionTime}ms</p>
          </div>
          <p className="text-gray-600">
            {parseFloat(clicksPerSecond) > 2.5 ? 'Lightning fast!' : parseFloat(clicksPerSecond) > 1.5 ? 'Great speed!' : 'Good job!'}
          </p>
        </div>
      ) : isActive ? (
        <div className="fixed inset-0 bg-white">
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 text-center">
            <div className="text-4xl font-mono font-bold">{currentTime}ms</div>
            <div className="text-sm text-gray-500 mt-2">
              Clicks: {clickCount} | Time left: {(remainingTime / 1000).toFixed(1)}s
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