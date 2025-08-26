'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ExerciseInstructionDialog } from './ExerciseInstructionDialog'

interface BreathingExerciseProps {
  onComplete: () => void
}

export default function BreathingExercise({ onComplete }: BreathingExerciseProps) {
  const [showDialog, setShowDialog] = useState(true)
  const [isActive, setIsActive] = useState(false)
  
  // Simple state tracking
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0)
  const [showWorkCountdown, setShowWorkCountdown] = useState(false)
  const [workSecondsLeft, setWorkSecondsLeft] = useState(120)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [currentTime, setCurrentTimeNow] = useState(Date.now())

  const TOTAL_SESSION_TIME = 64 // 4 cycles * 16 seconds
  const CYCLE_TIME = 16 // 4 seconds each phase
  
  // Calculate current state from elapsed time
  const currentCycle = Math.floor(totalSecondsElapsed / CYCLE_TIME) + 1
  const timeInCurrentCycle = totalSecondsElapsed % CYCLE_TIME
  const currentPhase = Math.floor(timeInCurrentCycle / 4) // 0=in, 1=hold, 2=out, 3=hold
  const secondsInCurrentPhase = timeInCurrentCycle % 4
  const secondsLeft = 4 - secondsInCurrentPhase

  const phaseNames = ['Breathe in', 'Hold', 'Breathe out', 'Hold']
  const phaseColors = ['#3B82F6', '#6B7280', '#22C55E', '#6B7280'] // blue, gray, green, gray
  const phaseBackgroundColors = [
    'rgba(59, 130, 246, 0.1)', 
    'rgba(107, 114, 128, 0.1)', 
    'rgba(34, 197, 94, 0.1)', 
    'rgba(107, 114, 128, 0.1)'
  ]

  // Update current time using requestAnimationFrame for smooth 60+ FPS
  useEffect(() => {
    if (!isActive || !sessionStartTime) return
    
    let animationFrameId: number
    const updateTime = () => {
      setCurrentTimeNow(Date.now())
      animationFrameId = requestAnimationFrame(updateTime)
    }
    animationFrameId = requestAnimationFrame(updateTime)
    
    return () => cancelAnimationFrame(animationFrameId)
  }, [isActive, sessionStartTime])

  // Main timer - just counts seconds
  useEffect(() => {
    if (!isActive) return

    const timer = setInterval(() => {
      setTotalSecondsElapsed(prev => {
        const next = prev + 1
        
        // Check if we've completed all cycles
        if (next >= TOTAL_SESSION_TIME) {
          setIsActive(false)
          setTimeout(() => setShowWorkCountdown(true), 1000)
          return prev
        }
        
        return next
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive])

  // Work countdown timer
  useEffect(() => {
    if (!showWorkCountdown) return
    const timer = setInterval(() => {
      setWorkSecondsLeft(prev => {
        if (prev > 1) return prev - 1
        onComplete()
        return 0
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [showWorkCountdown, onComplete])

  const startExercise = () => {
    setIsActive(true)
    setTotalSecondsElapsed(0)
    setSessionStartTime(Date.now())
  }

  const handleStartFromDialog = () => {
    setShowDialog(false)
    startExercise()
  }

  const handleRestart = () => {
    setIsActive(false)
    setTotalSecondsElapsed(0)
    setShowWorkCountdown(false)
    setWorkSecondsLeft(120)
    setSessionStartTime(null)
    setShowDialog(true)
  }

  // Calculate smooth, continuous animation values using real-time, not discrete seconds
  const baseScale = 0.8
  const maxScale = 1.3
  
  // Use real-time elapsed milliseconds for smooth animation
  const realTimeElapsed = sessionStartTime ? (currentTime - sessionStartTime) / 1000 : 0
  const realTimeInCycle = realTimeElapsed % CYCLE_TIME
  const realCurrentPhase = Math.floor(realTimeInCycle / 4)
  const realTimeInPhase = realTimeInCycle % 4
  
  // Create a smooth wave that goes: expand -> hold -> contract -> hold
  // Using easing functions to create natural acceleration/deceleration
  let scale = baseScale
  let colorProgress = 0
  
  if (realCurrentPhase === 0) { // Breathe in: 0-4 seconds
    const phaseProgress = realTimeInPhase / 4
    // Ease out for natural deceleration as we approach the hold
    const easedProgress = 1 - Math.pow(1 - phaseProgress, 2)
    scale = baseScale + (easedProgress * (maxScale - baseScale))
    colorProgress = easedProgress * 0.33 // Blue to gray transition
  } else if (realCurrentPhase === 1) { // Hold after breathe in: 4-8 seconds  
    scale = maxScale
    const phaseProgress = realTimeInPhase / 4
    colorProgress = 0.33 + (phaseProgress * 0.33) // Gray to green transition
  } else if (realCurrentPhase === 2) { // Breathe out: 8-12 seconds
    const phaseProgress = realTimeInPhase / 4
    // Ease in for natural acceleration from the hold
    const easedProgress = Math.pow(phaseProgress, 2)
    scale = maxScale - (easedProgress * (maxScale - baseScale))
    colorProgress = 0.66 + (easedProgress * 0.34) // Green to final gray transition
  } else { // Hold after breathe out: 12-16 seconds
    scale = baseScale
    colorProgress = 1 // Full cycle complete, back to starting color
  }
  
  // Smooth color interpolation between phases
  const interpolateColor = (color1: string, color2: string, progress: number) => {
    // Simple RGB interpolation - convert hex to rgb, interpolate, convert back
    const hex1 = color1.replace('#', '')
    const hex2 = color2.replace('#', '')
    const r1 = parseInt(hex1.substring(0, 2), 16)
    const g1 = parseInt(hex1.substring(2, 4), 16) 
    const b1 = parseInt(hex1.substring(4, 6), 16)
    const r2 = parseInt(hex2.substring(0, 2), 16)
    const g2 = parseInt(hex2.substring(2, 4), 16)
    const b2 = parseInt(hex2.substring(4, 6), 16)
    
    const r = Math.round(r1 + (r2 - r1) * progress)
    const g = Math.round(g1 + (g2 - g1) * progress)
    const b = Math.round(b1 + (b2 - b1) * progress)
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }
  
  // Calculate current color based on cycle progress
  const colors = ['#3B82F6', '#6B7280', '#22C55E', '#6B7280'] // blue, gray, green, gray
  let currentColor = colors[0]
  
  if (colorProgress < 0.33) {
    currentColor = interpolateColor(colors[0], colors[1], colorProgress / 0.33)
  } else if (colorProgress < 0.66) {
    currentColor = interpolateColor(colors[1], colors[2], (colorProgress - 0.33) / 0.33)
  } else {
    currentColor = interpolateColor(colors[2], colors[3], (colorProgress - 0.66) / 0.34)
  }

  return (
    <>
      <ExerciseInstructionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Box Breathing Exercise"
        description="A calming breathing technique to reduce stress and improve focus."
        instructions={
          <>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">🫁 Box Breathing Pattern</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Breathe IN for 4 seconds</li>
                  <li>HOLD for 4 seconds</li>
                  <li>Breathe OUT for 4 seconds</li>
                  <li>HOLD for 4 seconds</li>
                </ul>
                <p className="text-sm mt-2">Repeat this cycle 4 times.</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2">🎯 Benefits</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Activates your parasympathetic nervous system</li>
                  <li>Reduces stress and anxiety</li>
                  <li>Improves concentration and mental clarity</li>
                  <li>Helps transition into focused work</li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm">
                  <strong>Pro tip:</strong> Follow the on-screen visual cues. The circle will expand and contract
                  to guide your breathing rhythm.
                </p>
              </div>
            </div>
          </>
        }
        onStart={handleStartFromDialog}
      />

      {showWorkCountdown ? (
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8">
          <Card className="animate-slide-up">
            <CardContent className="text-center py-16">
              <div className="space-y-6">
                <h3 className="text-3xl font-light">Time to work</h3>
                <p className="text-lg text-gray-600">
                  Leave this tab behind and just get started on what you would want to get done.
                </p>
                <div className="mt-8">
                  <div className="w-32 h-32 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-700 tabular-nums">
                      {Math.floor(workSecondsLeft / 60)}:{String(workSecondsLeft % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    This timer will complete automatically
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : isActive ? (
        <div
          className="fixed inset-0 flex items-center justify-center transition-all ease-linear"
          style={{
            backgroundColor: `${phaseBackgroundColors[currentPhase]}`,
            transitionDuration: '4s',
          }}
        >
          <div className="text-center relative z-10">
            <div className="relative">
              {/* Outer circle that scales smoothly */}
              <div
                className="w-96 h-96 mx-auto rounded-full border-4"
                style={{
                  transform: `scale(${scale})`,
                  borderColor: currentColor,
                  backgroundColor: `${currentColor}15`, // 15 = ~8% opacity in hex
                  transition: 'none', // Remove all CSS transitions for manual control
                }}
              />
              
              {/* Inner content that stays fixed size */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-4xl font-light mb-2 text-gray-700">{phaseNames[currentPhase]}</p>
                  <div className="text-6xl font-bold tabular-nums mb-2" style={{ color: phaseColors[currentPhase] }}>
                    {secondsLeft}
                  </div>
                  <p className="text-sm text-gray-500">
                    Cycle {Math.min(currentCycle, 4)} / 4
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Overall session progress bar */}
          <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 w-80">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-400"
                style={{ 
                  width: sessionStartTime ? `${Math.min(100, ((currentTime - sessionStartTime) / 1000 / TOTAL_SESSION_TIME) * 100)}%` : '0%'
                }}
              />
            </div>
          </div>
        </div>
      ) : !showDialog && !showWorkCountdown ? (
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8">
          <Card className="animate-slide-up">
            <CardContent className="text-center py-16">
              <div className="space-y-6">
                <div className="text-6xl">✨</div>
                <h3 className="text-3xl font-light">Ready to breathe?</h3>
                <Button onClick={startExercise} size="lg">
                  Begin Breathing Exercise
                </Button>
              </div>
            </CardContent>
          </Card>
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