"use client";

import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExerciseInstructionDialog } from "./ExerciseInstructionDialog";

interface MentalArithmeticProps {
  onComplete: () => void;
}

export default function MentalArithmetic({
  onComplete,
}: MentalArithmeticProps) {
  const [currentProblem, setCurrentProblem] = useState<{
    question: string;
    answer: number;
  } | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [feedback, setFeedback] = useState<{
    message: string;
    isCorrect: boolean;
  } | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showDialog, setShowDialog] = useState(true);
  const difficulty = [9]; // 1-10 scale, fixed at 9
  const targetCorrect = 5;
  const inputRef = useRef<HTMLInputElement>(null);

  const generateProblem = useCallback(() => {
    const difficultyLevel = difficulty[0];
    const operations = ["+", "-", "*"];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let a: number, b: number, answer: number;

    // Scale difficulty from 1-10 to appropriate ranges
    const difficultyMultiplier = difficultyLevel / 5; // 0.2 to 2.0

    switch (operation) {
      case "+": {
        // Ensure result is at least 10: minimum values increased
        const addRange = Math.floor(30 * difficultyMultiplier) + 10; // 10-64 range
        a = Math.floor(Math.random() * addRange) + 8;
        b = Math.floor(Math.random() * addRange) + 8;
        answer = a + b;
        break;
      }
      case "-": {
        // Already produces double-digit results, but increase minimum slightly
        const subRangeA = Math.floor(40 * difficultyMultiplier) + 30; // 30-102 range
        const subRangeB = Math.floor(20 * difficultyMultiplier) + 5; // 5-41 range
        a = Math.floor(Math.random() * subRangeA) + 25;
        b = Math.floor(Math.random() * Math.min(subRangeB, a - 15)) + 1; // Ensure result >= 10
        answer = a - b;
        break;
      }
      case "*": {
        // Ensure result is at least 10: use larger minimum values
        const mulRange = Math.floor(10 * difficultyMultiplier) + 3; // 3-21 range
        a = Math.floor(Math.random() * mulRange) + 4;
        b = Math.floor(Math.random() * mulRange) + 3;
        answer = a * b;
        break;
      }
      default:
        a = 0;
        b = 0;
        answer = 0;
    }

    return { question: `${a} ${operation} ${b}`, answer };
  }, []);

  useEffect(() => {
    if (isActive && !currentProblem) {
      setCurrentProblem(generateProblem());
    }
  }, [isActive, currentProblem, generateProblem]);

  useEffect(() => {
    if (correctCount >= targetCorrect && !showResults) {
      setShowResults(true);
      setIsActive(false);
      setTimeout(onComplete, 3000);
    }
  }, [correctCount, showResults, onComplete]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProblem || !userAnswer) return;

    const isCorrect = parseInt(userAnswer, 10) === currentProblem.answer;
    setTotalAttempts(totalAttempts + 1);

    if (isCorrect) {
      setCorrectCount(correctCount + 1);
      setFeedback({ message: "Correct!", isCorrect: true });
    } else {
      setFeedback({
        message: `Incorrect. The answer was ${currentProblem.answer}`,
        isCorrect: false,
      });
    }

    setUserAnswer("");

    // Generate new problem after a delay to show feedback
    setTimeout(() => {
      setFeedback(null);
      if (correctCount + (isCorrect ? 1 : 0) < targetCorrect) {
        setCurrentProblem(generateProblem());
      }
      // Refocus input after feedback clears
      setTimeout(() => inputRef.current?.focus(), 50);
    }, 1000);
  };

  const handleStartFromDialog = () => {
    setShowDialog(false);
    setIsActive(true);
    // Focus input after a short delay to ensure DOM is ready
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleRestart = () => {
    setCurrentProblem(null);
    setUserAnswer("");
    setCorrectCount(0);
    setTotalAttempts(0);
    setFeedback(null);
    setIsActive(false);
    setShowResults(false);
    setShowDialog(true);
  };

  return (
    <>
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>

      <ExerciseInstructionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Mental Arithmetic"
        description="Warm your brain up with some mental math. No calculator!"
        instructions={null}
        onStart={handleStartFromDialog}
        disableClickAnywhere={false}
      />

      {showResults ? (
        <div className="max-w-2xl mx-auto px-8 py-16 text-center space-y-4 animate-fade-in">
          <h3 className="text-2xl font-light">Exercise Complete!</h3>
          <p className="text-lg text-gray-600">
            You solved {correctCount} problems correctly
          </p>
          <p className="text-gray-600">
            Accuracy: {Math.round((correctCount / totalAttempts) * 100)}%
          </p>
        </div>
      ) : isActive ? (
        <div className="max-w-2xl mx-auto px-8 py-16 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-lg text-gray-600">
              Progress: {correctCount} / {targetCorrect} correct
            </p>
            <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(correctCount / targetCorrect) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <p className="text-4xl font-mono mb-6">
                {currentProblem?.question} = ?
              </p>

              <input
                ref={inputRef}
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-32 px-4 py-3 text-2xl text-center font-mono border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <button
              type="submit"
              className="w-full max-w-xs mx-auto block py-3 bg-black text-white rounded-md hover:bg-gray-900 transition-colors"
            >
              Submit
            </button>
          </form>

          {feedback && (
            <div
              className={`text-center p-4 rounded-lg animate-fade-in ${
                feedback.isCorrect
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              <p className="font-semibold">{feedback.message}</p>
            </div>
          )}
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
  );
}
