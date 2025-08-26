"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ExerciseInstructionDialog } from "./ExerciseInstructionDialog";

interface GoalCueingProps {
  onComplete: () => void;
}

export default function GoalCueing({ onComplete }: GoalCueingProps) {
  const [goal, setGoal] = useState("In the next hour, I will ");
  const [submitted, setSubmitted] = useState(false);
  const [showDialog, setShowDialog] = useState(true);
  const startingText = "In the next hour, I will ";

  const handleGoalChange = (value: string) => {
    // Ensure the starting text is always present and cannot be deleted
    if (value.startsWith(startingText)) {
      setGoal(value);
    } else if (value.length < startingText.length) {
      // If user tries to delete part of the starting text, restore it
      setGoal(startingText);
    } else {
      // If user typed before the starting text, prepend the starting text
      setGoal(startingText + value.replace(startingText, ''));
    }
  };

  const handleSubmit = () => {
    if (goal.trim().length > startingText.length + 5) {
      setSubmitted(true);
      setTimeout(onComplete, 3000);
    }
  };

  const handleStartFromDialog = () => {
    setShowDialog(false);
  };

  const handleRestart = () => {
    setGoal(startingText);
    setSubmitted(false);
    setShowDialog(true);
  };

  return (
    <>
      <ExerciseInstructionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Goal Crystallization"
        description="Clarify your immediate goals to boost focus and motivation."
        instructions={
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">🎯 Purpose</h4>
              <p className="text-sm">
                This exercise helps you identify what you truly want to
                accomplish in the next hour. By focusing on the satisfaction of
                completion rather than the effort required, you can overcome
                procrastination and build momentum.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold mb-2">💡 How to Approach This</h4>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>
                  Think about what would make you feel satisfied in 1 hour
                </li>
                <li>Focus on the end result, not the process</li>
                <li>Be specific and realistic</li>
                <li>Choose something meaningful to you right now</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-sm">
                <strong>Remember:</strong> The goal is to create clarity and
                commitment. Your answer should excite you enough to overcome
                inertia.
              </p>
            </div>
          </div>
        }
        onStart={handleStartFromDialog}
      />

      <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8">
        <Card className="animate-slide-up">
          <CardHeader className="text-center">
            <CardTitle>Goal Crystallization</CardTitle>
            <CardDescription className="space-y-2 mt-4">
              <p>What will you feel good about completing in the next hour?</p>
              <p className="text-sm">
                Forget the activation effort. Looking back in one hour, what
                would make you satisfied?
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <div className="space-y-6">
                <Textarea
                  value={goal}
                  onChange={(e) => handleGoalChange(e.target.value)}
                  className="min-h-[120px]"
                  autoFocus
                  onKeyDown={(e) => {
                    // Prevent deleting the starting text with backspace
                    if (e.key === 'Backspace') {
                      const cursorPos = (e.target as HTMLTextAreaElement).selectionStart;
                      if (cursorPos <= startingText.length) {
                        e.preventDefault();
                      }
                    }
                  }}
                />

                <Button
                  onClick={handleSubmit}
                  disabled={goal.trim().length < startingText.length + 5}
                  className="w-full"
                  size="lg"
                >
                  Commit to Goal
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 space-y-6 animate-fade-in">
                <div className="p-6 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    Your commitment:
                  </p>
                  <p className="text-lg text-gray-900 italic">"{goal}"</p>
                </div>
                <div className="flex justify-center">
                  <div className="text-5xl">🎯</div>
                </div>
                <p className="text-gray-600">
                  Goal locked in. Let's make it happen.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
  );
}
