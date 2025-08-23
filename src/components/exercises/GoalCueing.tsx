'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

interface GoalCueingProps {
  onComplete: () => void
}

export default function GoalCueing({ onComplete }: GoalCueingProps) {
  const [goal, setGoal] = useState('')
  const [submitted, setSubmitted] = useState(false)
  
  const handleSubmit = () => {
    if (goal.trim().length > 10) {
      setSubmitted(true)
      setTimeout(onComplete, 3000)
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8">
      <Card className="animate-slide-up">
        <CardHeader className="text-center">
          <CardTitle>Goal Crystallization</CardTitle>
          <CardDescription className="space-y-2 mt-4">
            <p>What will you feel good about completing in the next hour?</p>
            <p className="text-sm">
              Forget the activation effort. Looking back in one hour, what would make you satisfied?
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <div className="space-y-6">
              <Textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="In the next hour, I will..."
                className="min-h-[120px]"
                autoFocus
              />
              
              <Button
                onClick={handleSubmit}
                disabled={goal.trim().length < 10}
                className="w-full"
                size="lg"
              >
                Commit to Goal
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 space-y-6 animate-fade-in">
              <div className="p-6 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-2">Your commitment:</p>
                <p className="text-lg text-gray-900 italic">"{goal}"</p>
              </div>
              <div className="flex justify-center">
                <div className="text-5xl">🎯</div>
              </div>
              <p className="text-gray-600">Goal locked in. Let's make it happen.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}