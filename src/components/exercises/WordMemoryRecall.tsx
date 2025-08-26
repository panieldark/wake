"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WordMemoryRecallProps {
  onComplete: () => void;
  originalWords?: string[];
}

// Generate decoy words for recognition phase
const generateDecoyWords = (correctWords: string[]) => {
  const categories = {
    nature: [
      "desert",
      "glacier",
      "canyon",
      "prairie",
      "lagoon",
      "waterfall",
      "dawn",
      "fog",
      "thunder",
      "eclipse",
    ],
    objects: [
      "microscope",
      "tablet",
      "diamond",
      "window",
      "map",
      "flashlight",
      "piano",
      "phone",
      "journal",
      "clock",
    ],
    actions: [
      "search",
      "shout",
      "uncover",
      "examine",
      "build",
      "dream",
      "consider",
      "travel",
      "rejoice",
      "motivate",
    ],
    concepts: [
      "peace",
      "liberty",
      "knowledge",
      "bravery",
      "symmetry",
      "curiosity",
      "puzzle",
      "tranquility",
      "quest",
      "emotion",
    ],
  };

  const allDecoys = Object.values(categories).flat();
  const availableDecoys = allDecoys.filter(
    (word) => !correctWords.includes(word),
  );
  const shuffled = availableDecoys.sort(() => Math.random() - 0.5);

  // Return enough decoys to make 12 total words with 4-8 correct ones
  const numCorrect = Math.floor(Math.random() * 5) + 4; // 4-8 correct words
  const numDecoys = 12 - numCorrect;

  return {
    decoys: shuffled.slice(0, numDecoys),
    numCorrect,
  };
};

export default function WordMemoryRecall({
  onComplete,
  originalWords = [],
}: WordMemoryRecallProps) {
  const [recognitionWords, setRecognitionWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  // Generate recognition words when component mounts
  useEffect(() => {
    if (originalWords.length > 0 && recognitionWords.length === 0) {
      const { decoys, numCorrect } = generateDecoyWords(originalWords);
      const correctWordsToShow = originalWords.slice(0, numCorrect);
      const allWords = [...correctWordsToShow, ...decoys];
      setRecognitionWords(allWords.sort(() => Math.random() - 0.5));
    }
  }, [originalWords, recognitionWords.length]);

  const toggleWordSelection = (word: string) => {
    setSelectedWords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(word)) {
        newSet.delete(word);
      } else {
        newSet.add(word);
      }
      return newSet;
    });
  };

  const handleRecognitionSubmit = () => {
    setShowResults(true);

    // Show continue button after 4 seconds
    setTimeout(() => {
      setCanContinue(true);
    }, 4000);
  };

  const handleFinalContinue = () => {
    onComplete();
  };

  const handleRestart = () => {
    setSelectedWords(new Set());
    setShowResults(false);
    setCanContinue(false);
  };

  // If no original words provided, complete immediately
  useEffect(() => {
    if (!originalWords || originalWords.length === 0) {
      onComplete();
    }
  }, [originalWords, onComplete]);

  if (!originalWords || originalWords.length === 0) {
    return null;
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-8">
        <Card className="animate-slide-up">
          <CardHeader className="text-center">
            <CardTitle>Surprise Memory Test!</CardTitle>
            <CardDescription>
              Remember those words from earlier? Select only the words that were
              in the original list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recognitionWords.map((word, index) => {
                const isSelected = selectedWords.has(word);
                const isCorrect = originalWords.includes(word);
                const isIncorrect = showResults && isSelected && !isCorrect;
                const isMissed = showResults && !isSelected && isCorrect;

                return (
                  <div key={index} className="relative">
                    <button
                      type="button"
                      onClick={() => !showResults && toggleWordSelection(word)}
                      disabled={showResults}
                      className={cn(
                        "w-full p-3 rounded-lg font-medium transition-all duration-150",
                        showResults && isCorrect && isSelected
                          ? "bg-green-700/70 text-white cursor-default"
                          : showResults && isIncorrect
                            ? "bg-red-700/70 text-white cursor-default"
                            : showResults
                              ? "bg-gray-100 cursor-default"
                              : isSelected
                                ? "bg-neutral-600 text-white scale-95"
                                : "bg-gray-100 hover:bg-gray-200 hover:scale-98",
                      )}
                    >
                      {word}
                    </button>
                    {showResults && isMissed && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center">
                          !
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!showResults ? (
              <Button
                onClick={handleRecognitionSubmit}
                className="w-full"
                size="lg"
                disabled={selectedWords.size === 0}
              >
                Submit ({selectedWords.size} selected)
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-1">
                      ✓
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedWords.size > 0
                        ? Array.from(selectedWords).filter((word) =>
                            originalWords.includes(word),
                          ).length
                        : 0}
                    </div>
                    <div className="text-gray-600">Correct</div>
                  </div>
                  <div>
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-1">
                      ✗
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {selectedWords.size > 0
                        ? Array.from(selectedWords).filter(
                            (word) => !originalWords.includes(word),
                          ).length
                        : 0}
                    </div>
                    <div className="text-gray-600">Wrong</div>
                  </div>
                  <div>
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-1">
                      !
                    </div>
                    <div className="text-2xl font-bold text-amber-600">
                      {
                        originalWords.filter(
                          (word) =>
                            recognitionWords.includes(word) &&
                            !selectedWords.has(word),
                        ).length
                      }
                    </div>
                    <div className="text-gray-600">Missed</div>
                  </div>
                </div>

                {canContinue && (
                  <div className="flex justify-end">
                    <Button onClick={handleFinalContinue} size="sm">
                      Continue
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>

      <Button
        onClick={handleRestart}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-white/90 hover:bg-white shadow-lg"
      >
        <RotateCcw className="w-4 h-4 mr-1" />
        Reset Selection
      </Button>
    </>
  );
}
