'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ExerciseInstructionDialog } from './ExerciseInstructionDialog'

interface BreathingExerciseProps {
  onComplete: () => void
}

const phases = [
  { text: 'Breathe in', duration: 4000 },
  { text: 'Hold', duration: 4000 },
  { text: 'Breathe out', duration: 4000 },
  { text: 'Hold', duration: 4000 },
]

export default function BreathingExercise({ onComplete }: BreathingExerciseProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [cycles, setCycles] = useState(0)
  const [phaseStartTime, setPhaseStartTime] = useState<number>(0)
  const [progress, setProgress] = useState(0)
  const [showDialog, setShowDialog] = useState(true)
  const totalCycles = 4 // Increased from 3 to 4 for a bit longer

  useEffect(() => {
    if (!isActive) return

    const currentPhase = phases[currentPhaseIndex]

    const animate = () => {
      const elapsed = Date.now() - phaseStartTime
      const newProgress = Math.min((elapsed / currentPhase.duration) * 100, 100)

      setProgress(newProgress)

      if (newProgress >= 100) {
        const nextPhaseIndex = (currentPhaseIndex + 1) % phases.length
        setCurrentPhaseIndex(nextPhaseIndex)
        setPhaseStartTime(Date.now())

        if (nextPhaseIndex === 0) {
          const newCycles = cycles + 1
          setCycles(newCycles)

          if (newCycles >= totalCycles) {
            setIsActive(false)
            setTimeout(onComplete, 2000)
          }
        }
      }
    }

    const animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [isActive, currentPhaseIndex, cycles, phaseStartTime, onComplete])

  const startExercise = () => {
    setIsActive(true)
    setPhaseStartTime(Date.now())
  }

  const handleStartFromDialog = () => {
    setShowDialog(false)
  }

  const handleRestart = () => {
    setIsActive(false)
    setCurrentPhaseIndex(0)
    setCycles(0)
    setPhaseStartTime(0)
    setProgress(0)
    setShowDialog(true)
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
                <h4 className="font-semibold mb-2">🫁 The 4-4-4-4 Pattern</h4>
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

      {!isActive && cycles === 0 ? (
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8">
          <Card className="animate-slide-up">
            <CardHeader className="text-center">
              <CardTitle>Mindful Breathing</CardTitle>
              <CardDescription className="space-y-2 mt-4">
                <p>Close your eyes and follow the breathing cues.</p>
                <p className="text-sm">
                  4 cycles to integrate everything and prepare for deep work.
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pt-6">
              <Button onClick={startExercise} size="lg">
                Begin Breathing Exercise
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : !isActive && cycles >= totalCycles ? (
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8">
          <Card className="animate-slide-up">
            <CardContent className="text-center py-16">
              <div className="space-y-6">
                <div className="text-6xl">✨</div>
                <h3 className="text-3xl font-light">You're ready.</h3>
                <p className="text-lg text-gray-600">Mind sharp. Body calm. Time to create.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : isActive ? (
        (() => {
          const currentPhase = phases[currentPhaseIndex]
          const isBreathingIn = currentPhaseIndex === 0
          const isBreathingOut = currentPhaseIndex === 2

          // Calculate scale for breathing effect
          const baseScale = 0.8
          const maxScale = 1.2
          let scale = baseScale

          if (isBreathingIn) {
            scale = baseScale + (progress / 100) * (maxScale - baseScale)
          } else if (isBreathingOut) {
            scale = maxScale - (progress / 100) * (maxScale - baseScale)
          } else {
            scale = isBreathingIn ? maxScale : baseScale
          }

          return (
            <div
              className="fixed inset-0 flex items-center justify-center transition-all duration-500"
              style={{
                backgroundColor: `rgba(${isBreathingIn ? '59, 130, 246' : '156, 163, 175'}, ${0.05 + (scale - baseScale) * 0.1})`,
              }}
            >
              <div className="text-center space-y-12 relative z-10">
                <div className="relative">
                  <div
                    className="w-64 h-64 mx-auto rounded-full border-4 transition-all duration-100"
                    style={{
                      transform: `scale(${scale})`,
                      borderColor: isBreathingIn ? '#3B82F6' : '#6B7280',
                      backgroundColor: `rgba(${isBreathingIn ? '59, 130, 246' : '107, 114, 128'}, 0.1)`,
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-light mb-2">{currentPhase.text}</p>
                        <p className="text-sm text-gray-500">
                          Cycle {cycles + 1} / {totalCycles}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar at the bottom of the circle */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mt-8 w-64">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()
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