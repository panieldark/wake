'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

interface VisualSearchProps {
  onComplete: () => void
}

type Shape = {
  type: 'circle' | 'square' | 'triangle'
  color: string
  size: number
  x: number
  y: number
}

export default function VisualSearch({ onComplete }: VisualSearchProps) {
  const [leftShapes, setLeftShapes] = useState<Shape[]>([])
  const [rightShapes, setRightShapes] = useState<Shape[]>([])
  const [hasDifference, setHasDifference] = useState(false)
  const [found, setFound] = useState(false)
  const [round, setRound] = useState(1)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [totalTime, setTotalTime] = useState(0)
  const [userAnswer, setUserAnswer] = useState<'same' | 'different' | null>(null)
  const totalRounds = 5
  
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']
  const shapeTypes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle']
  
  const generateShapes = useCallback(() => {
    const numShapes = 6 + Math.floor(Math.random() * 3) // 6-8 shapes
    const shapes: Shape[] = []
    
    for (let i = 0; i < numShapes; i++) {
      shapes.push({
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 30 + Math.random() * 30, // 30-60px
        x: Math.random() * 80 + 10, // 10-90%
        y: Math.random() * 80 + 10, // 10-90%
      })
    }
    
    return shapes
  }, [])
  
  const generateRound = useCallback(() => {
    const left = generateShapes()
    const shouldHaveDifference = Math.random() < 0.5
    let right: Shape[]
    
    if (shouldHaveDifference) {
      // Create one difference
      right = [...left]
      const changeIndex = Math.floor(Math.random() * right.length)
      const changeType = Math.random()
      
      if (changeType < 0.33) {
        // Change color
        right[changeIndex] = {
          ...right[changeIndex],
          color: colors.find(c => c !== right[changeIndex].color) || colors[0]
        }
      } else if (changeType < 0.66) {
        // Change shape
        right[changeIndex] = {
          ...right[changeIndex],
          type: shapeTypes.find(s => s !== right[changeIndex].type) || shapeTypes[0]
        }
      } else {
        // Remove shape
        right.splice(changeIndex, 1)
      }
    } else {
      // Exact same
      right = [...left]
    }
    
    setLeftShapes(left)
    setRightShapes(right)
    setHasDifference(shouldHaveDifference)
    setStartTime(Date.now())
    setUserAnswer(null)
    setFound(false)
  }, [generateShapes, colors, shapeTypes])
  
  useEffect(() => {
    generateRound()
  }, [generateRound, round])
  
  const handleAnswer = (answer: 'same' | 'different') => {
    if (found || !startTime) return
    
    const endTime = Date.now()
    const timeTaken = endTime - startTime
    const isCorrect = (answer === 'different' && hasDifference) || (answer === 'same' && !hasDifference)
    
    setUserAnswer(answer)
    setFound(true)
    
    if (isCorrect) {
      setTotalTime(totalTime + timeTaken)
    }
    
    setTimeout(() => {
      if (round < totalRounds) {
        setRound(round + 1)
      } else {
        setTimeout(onComplete, 2000)
      }
    }, 1500)
  }
  
  const renderShape = (shape: Shape) => {
    const style = {
      position: 'absolute' as const,
      left: `${shape.x}%`,
      top: `${shape.y}%`,
      width: `${shape.size}px`,
      height: `${shape.size}px`,
      transform: 'translate(-50%, -50%)',
    }
    
    switch (shape.type) {
      case 'circle':
        return <div style={{ ...style, backgroundColor: shape.color, borderRadius: '50%' }} />
      case 'square':
        return <div style={{ ...style, backgroundColor: shape.color }} />
      case 'triangle':
        return (
          <div style={{
            ...style,
            width: 0,
            height: 0,
            borderLeft: `${shape.size/2}px solid transparent`,
            borderRight: `${shape.size/2}px solid transparent`,
            borderBottom: `${shape.size}px solid ${shape.color}`,
          }} />
        )
    }
  }
  
  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
      <Card className="animate-slide-up">
        <CardHeader className="text-center">
          <CardTitle>Spot the Difference</CardTitle>
          <CardDescription>
            Round {round} of {totalRounds}
            {totalTime > 0 && round > 1 && ` • Average: ${Math.round(totalTime / (round - 1))}ms`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative bg-gray-50 rounded-lg" style={{ height: '400px' }}>
              {leftShapes.map((shape, index) => (
                <div key={index}>{renderShape(shape)}</div>
              ))}
            </div>
            <div className="relative bg-gray-50 rounded-lg" style={{ height: '400px' }}>
              {rightShapes.map((shape, index) => (
                <div key={index}>{renderShape(shape)}</div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => handleAnswer('same')}
              disabled={found}
              variant={userAnswer === 'same' ? (!hasDifference ? 'default' : 'destructive') : 'secondary'}
              size="lg"
            >
              They're the same
            </Button>
            <Button
              onClick={() => handleAnswer('different')}
              disabled={found}
              variant={userAnswer === 'different' ? (hasDifference ? 'default' : 'destructive') : 'secondary'}
              size="lg"
            >
              There's a difference
            </Button>
          </div>
          
          {found && (
            <div className="text-center animate-fade-in">
              <p className="text-lg">
                {userAnswer === (hasDifference ? 'different' : 'same') 
                  ? '✓ Correct!' 
                  : '✗ Incorrect'}
              </p>
            </div>
          )}
          
          {found && round === totalRounds && (
            <div className="text-center animate-fade-in">
              <p className="text-lg">Average time: {Math.round(totalTime / totalRounds)}ms</p>
              <p className="text-gray-600">
                {totalTime / totalRounds < 2000 ? 'Excellent visual scanning!' : 'Good focus!'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}