"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ExerciseInstructionDialog } from "./ExerciseInstructionDialog";

interface VisualSearchProps {
  onComplete: () => void;
}

type Shape = {
  name: string;
};

type Cell = {
  shape: Shape;
  filled: boolean;
  rotation: number;
} | null;

type Grid = Cell[];

export default function VisualSearch({ onComplete }: VisualSearchProps) {
  const [grid1, setGrid1] = useState<Grid>([]);
  const [grid2, setGrid2] = useState<Grid>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [level, setLevel] = useState(3);
  const [score, setScore] = useState(0);
  const [showDialog, setShowDialog] = useState(true);
  const maxLevel = 20; // Increased max level for more tokens
  const totalRounds = 12; // 12 rounds total

  const shapes = [
    { name: "circle" },
    { name: "square" },
    { name: "triangle" },
    { name: "diamond" },
    { name: "cross" },
  ];

  const playSuccessSound = () => {
    const audio = new Audio("/sounds/ding.mp3");
    audio.volume = 0.5;
    audio.play().catch(console.error);
  };

  const playErrorSound = () => {
    const audio = new Audio("/sounds/error.mp3");
    audio.volume = 0.5;
    audio.play().catch(console.error);
  };

  const generateGrid = useCallback((): Grid => {
    const newGrid: Grid = Array(25).fill(null); // 5x5 grid = 25 cells
    const positions = [...Array(25).keys()];

    // Place shapes based on current level
    for (let i = 0; i < level; i++) {
      const randomIndex = Math.floor(Math.random() * positions.length);
      const position = positions.splice(randomIndex, 1)[0];
      newGrid[position] = {
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        filled: Math.random() > 0.5,
        rotation: 0,
      };
    }

    return newGrid;
  }, [level]);

  const newRound = useCallback(() => {
    const newGrid1 = generateGrid();
    const newGrid2 = [...newGrid1];

    // Decide if the grids should match or not, randomly
    if (Math.random() >= 0.5) {
      // Choose a random non-null cell to modify
      const filledPositions = newGrid1.reduce<number[]>((acc, cell, index) => {
        if (cell) acc.push(index);
        return acc;
      }, []);

      if (filledPositions.length > 0) {
        const randomIndex =
          filledPositions[Math.floor(Math.random() * filledPositions.length)];
        if (newGrid2[randomIndex]) {
          const existing = newGrid2[randomIndex];
          if (existing) {
            newGrid2[randomIndex] = {
              ...existing,
              filled: !existing.filled,
              rotation: Math.floor(Math.random() * 4) * 90, // Random rotation: 0, 90, 180, or 270 degrees
            };
          }
        }
      }
    }

    setGrid1(newGrid1);
    setGrid2(newGrid2);
  }, [generateGrid]);

  const checkMatch = (isMatch: boolean) => {
    if (!gameStarted) return;

    // Check if grids actually match (using JSON comparison like the Svelte version)
    const actualMatch = JSON.stringify(grid1) !== JSON.stringify(grid2);

    if ((isMatch && !actualMatch) || (!isMatch && actualMatch)) {
      // Was correct
      playSuccessSound();
      setScore(score + 1);

      if (currentRound < totalRounds) {
        const nextRound = currentRound + 1;
        setCurrentRound(nextRound);
        // Level increases with each successful round: 3, 4, 5, etc.
        setLevel(Math.min(2 + nextRound, maxLevel)); // Round 1 = level 3, Round 2 = level 4, etc.
      } else {
        // All rounds completed!
        setGameStarted(false);
        setTimeout(onComplete, 500);
        return;
      }
    } else {
      // Was wrong - don't advance round or level, just retry
      playErrorSound();
      setScore(Math.max(0, score - 1));
    }

    // Always generate new round after a short delay
    setTimeout(() => {
      newRound();
    }, 100);
  };

  const startGame = useCallback(() => {
    setGameStarted(true);
    setCurrentRound(1);
    setLevel(3);
    setScore(0);
    newRound();
  }, [newRound]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only run once on mount
  useEffect(() => {
    if (!gameStarted && currentRound === 1 && score === 0) {
      startGame();
    }
  }, []); // Only run once on mount

  const renderShape = (cell: Cell) => {
    if (!cell) return null;

    // Smaller tokens - scale down as level increases for more challenge
    const size = Math.max(24, 36 - Math.floor(level / 3)); // Starts at 36px, goes down to 24px
    const color = "#1f2937"; // Dark gray for a more professional look
    const fill = cell.filled ? color : "transparent";
    const style = { transform: `rotate(${cell.rotation}deg)` };

    switch (cell.shape.name) {
      case "circle":
        return (
          <div
            className="rounded-full border-2 shadow-sm"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderColor: color,
              backgroundColor: fill,
              borderWidth: "2px",
              ...style,
            }}
          />
        );
      case "square":
        return (
          <div
            className="border-2 shadow-sm"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderColor: color,
              backgroundColor: fill,
              borderWidth: "2px",
              ...style,
            }}
          />
        );
      case "triangle":
        return (
          <div style={style}>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${size / 2}px solid transparent`,
                borderRight: `${size / 2}px solid transparent`,
                borderBottom: `${size}px solid ${cell.filled ? color : "transparent"}`,
                ...(cell.filled
                  ? {}
                  : {
                    borderBottomColor: "transparent",
                    borderBottomWidth: `${size - 4}px`,
                    borderLeftWidth: `${size / 2 - 2}px`,
                    borderRightWidth: `${size / 2 - 2}px`,
                    borderBottom: `${size - 4}px solid transparent`,
                    outline: `2px solid ${color}`,
                    outlineOffset: "-2px",
                  }),
              }}
            />
          </div>
        );
      case "diamond":
        return (
          <div
            className="border-2 shadow-sm"
            style={{
              width: `${size * 0.7}px`,
              height: `${size * 0.7}px`,
              borderColor: color,
              backgroundColor: fill,
              borderWidth: "2px",
              transform: `${style.transform} rotate(45deg)`,
            }}
          />
        );
      case "cross":
        return (
          <div style={style}>
            <div
              className="relative"
              style={{ width: `${size}px`, height: `${size}px` }}
            >
              <div
                className="absolute"
                style={{
                  width: `${size}px`,
                  height: `${size / 4}px`,
                  top: `${(size * 3) / 8}px`,
                  backgroundColor: cell.filled ? color : "transparent",
                  border: cell.filled ? "none" : `2px solid ${color}`,
                }}
              />
              <div
                className="absolute"
                style={{
                  width: `${size / 4}px`,
                  height: `${size}px`,
                  left: `${(size * 3) / 8}px`,
                  backgroundColor: cell.filled ? color : "transparent",
                  border: cell.filled ? "none" : `2px solid ${color}`,
                }}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleStartFromDialog = () => {
    setShowDialog(false);
    // Ensure game starts fresh
    setGameStarted(true);
    setCurrentRound(1);
    setLevel(3);
    setScore(0);
    newRound();
  };

  const handleRestart = () => {
    setGrid1([]);
    setGrid2([]);
    setGameStarted(false);
    setCurrentRound(1);
    setLevel(3);
    setScore(0);
    setShowDialog(true);
  };

  return (
    <>
      <ExerciseInstructionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Feature Match"
        instructions={
          <div className="p-6 bg-gray-50 rounded-lg">
            <p className="text-lg text-neutral-700 font-medium text-center mb-6">Compare the shapes between the two grids. At most, one shape may not match. Identify correctly.</p>

            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <img src="/instructions/match.png" alt="Match example" className="w-full max-w-xs mx-auto mb-2 rounded-lg" />
              </div>

              <div className="text-center">
                <img src="/instructions/mismatch.png" alt="Mismatch example" className="w-full max-w-xs mx-auto mb-2 rounded-lg" />
              </div>
            </div>
          </div>
        }
        onStart={handleStartFromDialog}
      />

      {!gameStarted && currentRound > totalRounds ? (
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8">
          <Card className="animate-slide-up">
            <CardContent className="text-center py-16">
              <div className="space-y-6">
                <div className="text-6xl">✨</div>
                <h3 className="text-3xl font-light">All Rounds Complete!</h3>
                <p className="text-lg text-gray-600">Final Score: {score}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
          <Card className="animate-slide-up">
            <CardHeader className="text-center">
              <CardTitle>Feature Match</CardTitle>
              <CardDescription>
                Round {currentRound} of {totalRounds} • Level {level} • Score{" "}
                {score}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center gap-8">
                {/* Grid 1 */}
                <div className="grid grid-cols-5 gap-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {grid1.map((cell, index) => (
                    <div
                      key={`grid1-${index}`}
                      className="w-12 h-12 flex items-center justify-center"
                    >
                      {renderShape(cell)}
                    </div>
                  ))}
                </div>

                {/* Grid 2 */}
                <div className="grid grid-cols-5 gap-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {grid2.map((cell, index) => (
                    <div
                      key={`grid2-${index}`}
                      className="w-12 h-12 flex items-center justify-center"
                    >
                      {renderShape(cell)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => checkMatch(true)}
                  disabled={!gameStarted}
                  size="lg"
                  className="min-w-[120px] bg-green-200/80 hover:bg-green-300/70 hover:scale-95 transition-all duration-150 text-gray-700"
                >
                  Match
                </Button>
                <Button
                  onClick={() => checkMatch(false)}
                  disabled={!gameStarted}
                  size="lg"
                  className="min-w-[120px] bg-red-200/90 hover:bg-red-300/80 hover:scale-95 transition-all duration-150 text-gray-700"
                >
                  Mismatch
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
