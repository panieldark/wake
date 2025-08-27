"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { ExerciseInstructionDialog } from "./ExerciseInstructionDialog";

interface ClickingDrillProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export default function ClickingDrill({
  onComplete,
  onSkip: _onSkip,
}: ClickingDrillProps) {
  const [targets, setTargets] = useState<
    { x: number; y: number; id: number }[]
  >([]);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimes, setClickTimes] = useState<number[]>([]);
  const [lastTargetTime, setLastTargetTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(20000); // 20 seconds in ms
  const [isActive, setIsActive] = useState(false);
  const [showDialog, setShowDialog] = useState(true);
  const [hitTargets, setHitTargets] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const gameDuration = 20000; // 20 seconds

  const generateTarget = useCallback(() => {
    // More restrictive margins to avoid UI conflicts
    const margin = 80;
    const bottomMargin = 200; // Extra space for bottom buttons
    const topMargin = 200; // Extra space for top UI

    const maxWidth = window.innerWidth - 2 * margin;
    const maxHeight = window.innerHeight - bottomMargin - topMargin;

    const x = Math.random() * maxWidth + margin;
    const y = Math.random() * maxHeight + topMargin;

    return { x, y, id: Date.now() };
  }, []);

  useEffect(() => {
    if (isActive && targets.length === 0) {
      const targetTime = Date.now();
      setTargets([generateTarget()]);
      setLastTargetTime(targetTime);
      if (!startTime) {
        setStartTime(targetTime);
      }
    }
  }, [isActive, targets.length, generateTarget, startTime]);

  useEffect(() => {
    if (isActive && startTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, gameDuration - elapsed);
        setRemainingTime(remaining);

        if (remaining === 0) {
          setIsActive(false);
          setTimeout(onComplete, 2000);
        }
      }, 10);
      return () => clearInterval(interval);
    }
  }, [isActive, startTime, onComplete]);

  useEffect(() => {
    if (isActive && lastTargetTime) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now() - lastTargetTime);
      }, 10);
      return () => clearInterval(interval);
    }
  }, [isActive, lastTargetTime]);

  const playSuccessSound = () => {
    const audio = new Audio("/sounds/ding.mp3");
    audio.volume = 0.5;
    audio.play().catch(console.error);
  };

  const handleTargetClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    _targetId: number,
  ) => {
    playSuccessSound();

    // Get click position relative to viewport
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Add hit target for green fade animation
    const hitId = Date.now();
    setHitTargets((prev) => [...prev, { id: hitId, x, y }]);

    // Remove hit target after animation
    setTimeout(() => {
      setHitTargets((prev) => prev.filter((h) => h.id !== hitId));
    }, 300);

    const clickTime = Date.now();
    if (lastTargetTime) {
      const reactionTime = clickTime - lastTargetTime;
      setClickTimes((prev) => [...prev, reactionTime]);
    }

    setClickCount((prev) => prev + 1);
    const targetTime = Date.now();
    setTargets([generateTarget()]);
    setLastTargetTime(targetTime);
    setCurrentTime(0);
  };

  const clicksPerSecond =
    clickCount > 0 && startTime
      ? (clickCount / ((gameDuration - remainingTime) / 1000)).toFixed(2)
      : "0.00";

  const avgReactionTime =
    clickTimes.length > 0
      ? Math.round(clickTimes.reduce((a, b) => a + b, 0) / clickTimes.length)
      : 0;

  const handleStartFromDialog = () => {
    setShowDialog(false);
    setIsActive(true);
  };

  const handleRestart = () => {
    setTargets([]);
    setClickCount(0);
    setClickTimes([]);
    setLastTargetTime(null);
    setCurrentTime(0);
    setStartTime(null);
    setRemainingTime(gameDuration);
    setIsActive(false);
    setShowDialog(true);
    setHitTargets([]);
  };

  return (
    <>
      <ExerciseInstructionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Clicking Precision Drill"
        instructions={
          <div className="p-8 bg-gradient-to-br from-orange-50 to-red-100 rounded-xl border border-orange-200 shadow-sm">
            <p className="text-xl font-semibold text-gray-800 text-center">Click the targets as fast as you can</p>
          </div>
        }
        onStart={handleStartFromDialog}
      />

      {!isActive && clickCount > 0 ? (
        <div className="max-w-2xl mx-auto px-8 py-16 text-center space-y-4 animate-fade-in">
          <h3 className="text-2xl font-light">Total clicks: {clickCount}</h3>
          <div className="space-y-2">
            <p className="text-lg text-gray-600">
              Clicks per second: {clicksPerSecond}
            </p>
            <p className="text-lg text-gray-600">
              Average reaction time: {avgReactionTime}ms
            </p>
          </div>
          <p className="text-gray-600">
            {parseFloat(clicksPerSecond) > 2.5
              ? "Lightning fast!"
              : parseFloat(clicksPerSecond) > 1.5
                ? "Great speed!"
                : "Good job!"}
          </p>
        </div>
      ) : isActive ? (
        <div className="fixed inset-0 bg-white">
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 text-center">
            <div className="text-4xl font-mono font-bold">{currentTime}ms</div>
            <div className="text-sm text-gray-500 mt-2 tabular-nums">
              Clicks: {clickCount} | Time left:{" "}
              {(remainingTime / 1000).toFixed(1)}s
            </div>
          </div>

          {targets.map((target) => (
            <motion.button
              key={target.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{
                type: "spring",
                stiffness: 975.5,
                damping: 96.4,
                mass: 5.4,
              }}
              onClick={(e) => handleTargetClick(e, target.id)}
              className="absolute w-8 h-8 bg-gray-900 rounded-full shadow-lg z-40"
              style={{
                left: `${target.x - 16}px`,
                top: `${target.y - 16}px`,
              }}
            />
          ))}

          {/* Hit feedback dots */}
          <AnimatePresence>
            {hitTargets.map((hitTarget) => (
              <motion.div
                key={hitTarget.id}
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute w-8 h-8 bg-green-500 rounded-full pointer-events-none"
                style={{
                  left: hitTarget.x - 16,
                  top: hitTarget.y - 16,
                }}
              />
            ))}
          </AnimatePresence>
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
