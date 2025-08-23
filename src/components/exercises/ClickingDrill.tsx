'use client'

import { useState, useEffect, useCallback } from 'react'

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
  
  if (!isActive && clickTimes.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-16 space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-light">Clicking Precision</h3>
          <p className="text-gray-600">Click the targets as quickly and accurately as possible.</p>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setIsActive(true)}
            className="px-8 py-3 bg-black text-white rounded-md hover:bg-gray-900 transition-colors"
          >
            Start
          </button>
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-8 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    )
  }
  
  if (!isActive && clickTimes.length > 0) {
    return (
      <div className="max-w-2xl mx-auto px-8 py-16 text-center space-y-4 animate-fade-in">
        <h3 className="text-2xl font-light">Average reaction time: {avgTime}ms</h3>
        <p className="text-gray-600">
          {avgTime < 500 ? 'Lightning fast!' : avgTime < 700 ? 'Great speed!' : 'Good job!'}
        </p>
      </div>
    )
  }
  
  return (
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
  )
}