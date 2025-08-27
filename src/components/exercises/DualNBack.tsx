"use client";

import { RotateCcw, Eye, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ExerciseInstructionDialog } from "./ExerciseInstructionDialog";

interface DualNBackProps {
  onComplete: () => void;
}

// Letters as defined in Jaeggi, 2003
const LETTERS = ["B", "C", "D", "G", "H", "K", "P", "Q", "T", "W"];

// Howl interface for TypeScript
interface HowlSprite {
  play: (sprite: string) => void;
  once: (event: string, callback: () => void) => void;
  stop: () => void;
  unload: () => void;
}

declare global {
  interface Window {
    Howl?: any;
    Howler?: any;
  }
}

export default function DualNBack({ onComplete }: DualNBackProps) {
  // Exact state variables from reference implementation
  const [N, _setN] = useState(2);
  const [N_plus] = useState(20);
  const [iFrequency] = useState(4000);
  const [myInterval, setMyInterval] = useState<NodeJS.Timeout | null>(null);
  const [timestep_start, setTimestep_start] = useState(0);
  const [vis_stack, setVis_stack] = useState<number[]>([]);
  const [letter_stack, setLetter_stack] = useState<number[]>([]);
  const [vis_clicks, setVis_clicks] = useState<number[]>([]);
  const [letter_clicks, setLetter_clicks] = useState<number[]>([]);
  const [_vis_delays, setVis_delays] = useState<number[]>([]);
  const [_letter_delays, setLetter_delays] = useState<number[]>([]);
  const [vis_wrong, setVis_wrong] = useState(0);
  const [vis_misses, setVis_misses] = useState(0);
  const [letter_wrong, setLetter_wrong] = useState(0);
  const [letter_misses, setLetter_misses] = useState(0);
  const [vis_hits, setVis_hits] = useState(0);
  const [letter_hits, setLetter_hits] = useState(0);
  const [d_prime, setD_prime] = useState(0);
  const [time, setTime] = useState(0);

  // UI state
  const [showDialog, setShowDialog] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const [demoComplete, setDemoComplete] = useState(false);
  const [demoAutoClick, setDemoAutoClick] = useState({
    visual: false,
    auditory: false,
  });

  // Button states for visual feedback
  const [visButtonPressed, setVisButtonPressed] = useState(false);
  const [letterButtonPressed, setLetterButtonPressed] = useState(false);

  // Box flash state
  const [flashingBox, setFlashingBox] = useState(-1);

  // Turn feedback state
  const [turnFeedback, setTurnFeedback] = useState<{
    visual: { correct: boolean; shouldHave: boolean; pressed: boolean } | null;
    auditory: {
      correct: boolean;
      shouldHave: boolean;
      pressed: boolean;
    } | null;
    turn: number;
  } | null>(null);
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);

  // Audio sprites reference
  const spritesRef = useRef<HowlSprite | null>(null);

  // Track countdown interval reference
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track button presses for current turn
  const currentTurnPresses = useRef<{ visual: boolean; auditory: boolean }>({
    visual: false,
    auditory: false,
  });

  // Initialize audio sprites (equivalent to primeAudioEngine from reference)
  const initializeAudio = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (typeof window !== "undefined" && window.Howl) {
        console.log("Loading audio engine...");
        const sprites = new window.Howl({
          src: ["/sounds/sprites.mp3", "/sounds/sprites.wav"],
          preload: true,
          html5: false,
          sprite: {
            B: [1000 - 100, 850],
            C: [2000 - 100, 850],
            D: [3000 - 100, 850],
            G: [4000 - 100, 850],
            H: [5000 - 100, 850],
            K: [6000 - 100, 850],
            P: [7000 - 100, 850],
            Q: [8000 - 100, 850],
            T: [9000 - 100, 850],
            W: [10000 - 100, 850],
          },
        });

        sprites.once("load", () => {
          console.log("Audio sprites loaded");
          spritesRef.current = sprites;
          resolve();
        });
      } else {
        // Fallback without audio
        console.warn("Howl not available, continuing without audio");
        resolve();
      }
    });
  }, []);

  // Generate random numbers in a range (from reference)
  const getRandomNumbers = useCallback(
    (start: number, stop: number, count: number): number[] => {
      const result: number[] = [];
      for (let i = 0; i < count; i++) {
        const randInt = Math.floor(Math.random() * (stop - start)) + start;
        result.push(randInt);
      }
      return result;
    },
    [],
  );

  // Build game sequence (exact copy from reference)
  const buildGameSequence = useCallback(() => {
    let next = -1;
    const visual_matches: number[] = [];
    const auditory_matches: number[] = [];

    // Choose four random timesteps in which there will be a visual match
    while (visual_matches.length < 4) {
      next = Math.floor(Math.random() * N_plus);
      if (visual_matches.indexOf(next + N) === -1) {
        visual_matches.push(next + N);
      }
    }

    // Choose four random timesteps in which there will be an auditory match
    while (auditory_matches.length < 4) {
      next = Math.floor(Math.random() * N_plus);
      if (
        auditory_matches.indexOf(next + N) === -1 &&
        visual_matches.indexOf(next + N) === -1
      ) {
        auditory_matches.push(next + N);
      }
    }

    // Choose two random timesteps in which there is a double match
    while (auditory_matches.length < 6) {
      next = Math.floor(Math.random() * N_plus);
      if (
        auditory_matches.indexOf(next + N) === -1 &&
        visual_matches.indexOf(next + N) === -1
      ) {
        auditory_matches.push(next + N);
        visual_matches.push(next + N);
      }
    }

    // Randomly assign first N rounds
    const visual_stack = getRandomNumbers(0, 8, N);
    const auditory_stack = getRandomNumbers(0, 10, N);

    // Add random positions to the stack until it's full
    while (visual_stack.length < N_plus + N) {
      if (visual_matches.indexOf(visual_stack.length) !== -1) {
        visual_stack.push(visual_stack[visual_stack.length - N]);
      } else {
        next = Math.floor(Math.random() * 7);
        if (next >= visual_stack[visual_stack.length - N]) {
          next += 1;
        }
        visual_stack.push(next);
      }
    }

    while (auditory_stack.length < N_plus + N) {
      if (auditory_matches.indexOf(auditory_stack.length) !== -1) {
        auditory_stack.push(auditory_stack[auditory_stack.length - N]);
      } else {
        next = Math.floor(Math.random() * 9);
        if (next >= auditory_stack[auditory_stack.length - N]) {
          next += 1;
        }
        auditory_stack.push(next);
      }
    }

    return [visual_stack, auditory_stack];
  }, [N, N_plus, getRandomNumbers]);

  // Play letter (from reference)
  const playLetter = useCallback((idx: number) => {
    if (spritesRef.current) {
      spritesRef.current.play(LETTERS[idx]);
    }
  }, []);

  // Evaluate turn feedback
  const evaluateTurn = useCallback(
    (
      currentTime: number,
      visualStack: number[],
      auditoryStack: number[],
      visualPressed: boolean,
      auditoryPressed: boolean,
    ) => {
      if (currentTime < N) {
        // No feedback for first N turns
        setTurnFeedback(null);
        return;
      }

      const visualMatch =
        visualStack[currentTime] === visualStack[currentTime - N];
      const auditoryMatch =
        auditoryStack[currentTime] === auditoryStack[currentTime - N];

      const visualCorrect = visualPressed === visualMatch;
      const auditoryCorrect = auditoryPressed === auditoryMatch;

      console.log(`=== TURN ${currentTime} FEEDBACK ===`);
      console.log(
        `Visual: pos ${visualStack[currentTime]} vs N-back pos ${visualStack[currentTime - N]} = ${visualMatch ? "MATCH" : "NO MATCH"}`,
      );
      console.log(
        `Visual button pressed: ${visualPressed}, should have pressed: ${visualMatch}, correct: ${visualCorrect}`,
      );
      console.log(
        `Auditory: ${LETTERS[auditoryStack[currentTime]]} vs N-back ${LETTERS[auditoryStack[currentTime - N]]} = ${auditoryMatch ? "MATCH" : "NO MATCH"}`,
      );
      console.log(
        `Auditory button pressed: ${auditoryPressed}, should have pressed: ${auditoryMatch}, correct: ${auditoryCorrect}`,
      );

      setTurnFeedback({
        visual: {
          correct: visualCorrect,
          shouldHave: visualMatch,
          pressed: visualPressed,
        },
        auditory: {
          correct: auditoryCorrect,
          shouldHave: auditoryMatch,
          pressed: auditoryPressed,
        },
        turn: currentTime,
      });

      // Keep feedback visible (don't clear automatically)
    },
    [N],
  );

  // Button press handlers (from reference)
  const eyeButtonPress = () => {
    const delay = Date.now() - timestep_start;
    setVis_delays((prev) => [...prev, delay]);
    setVis_clicks((prev) => {
      console.log("Visual button pressed, adding click for time:", time);
      return [...prev, time];
    });
    setVisButtonPressed(true);
    currentTurnPresses.current.visual = true;
    // Keep button pressed until next timestep (will be reset in doTimestepInterval)
  };

  const soundButtonPress = () => {
    const delay = Date.now() - timestep_start;
    setLetter_delays((prev) => [...prev, delay]);
    setLetter_clicks((prev) => {
      console.log("Auditory button pressed, adding click for time:", time);
      return [...prev, time];
    });
    setLetterButtonPressed(true);
    currentTurnPresses.current.auditory = true;
    // Keep button pressed until next timestep (will be reset in doTimestepInterval)
  };

  // Calculate score - pass stacks and clicks explicitly to avoid state sync issues
  const calculateScore = useCallback(
    (
      visualStack: number[] = vis_stack,
      auditoryStack: number[] = letter_stack,
      visualClicks: number[] = vis_clicks,
      auditoryClicks: number[] = letter_clicks,
    ) => {
      console.log("=== CALCULATE SCORE DEBUG ===");
      console.log("N:", N);
      console.log("vis_stack (param):", visualStack);
      console.log("letter_stack (param):", auditoryStack);
      console.log("vis_clicks (param):", visualClicks);
      console.log("letter_clicks (param):", auditoryClicks);
      console.log("vis_stack (state):", vis_stack);
      console.log("letter_stack (state):", letter_stack);
      console.log("vis_clicks (state):", vis_clicks);
      console.log("letter_clicks (state):", letter_clicks);

      // Guard against empty stacks
      if (visualStack.length === 0 || auditoryStack.length === 0) {
        console.log("Empty stacks, skipping score calculation");
        return;
      }

      // Guard against empty clicks arrays
      if (visualClicks.length === 0 && auditoryClicks.length === 0) {
        console.log(
          "WARNING: Both click arrays are empty! This might be the issue.",
        );
      }

      let vis_wrong_count = 0;
      let vis_misses_count = 0;
      let letter_wrong_count = 0;
      let letter_misses_count = 0;
      let vis_hits_count = 0;
      let letter_hits_count = 0;

      // EXACT logic from reference calculateScore() function
      for (let i = N; i < visualStack.length; i++) {
        if (visualStack[i] === visualStack[i - N]) {
          if (visualClicks.indexOf(i) > -1) {
            vis_hits_count += 1;
          } else {
            vis_misses_count += 1;
          }
        } else {
          if (visualClicks.indexOf(i) > -1) {
            vis_wrong_count += 1;
          }
        }
        if (auditoryStack[i] === auditoryStack[i - N]) {
          if (auditoryClicks.indexOf(i) > -1) {
            letter_hits_count += 1;
          } else {
            letter_misses_count += 1;
          }
        } else {
          if (auditoryClicks.indexOf(i) > -1) {
            letter_wrong_count += 1;
          }
        }
      }

      // EXACT calculation from reference - assumes 6 total matches (4 single + 2 double)
      const hit_rate = (vis_hits_count / 6.0 + letter_hits_count / 6.0) / 2.0;
      const false_alarm_rate =
        (vis_wrong_count / (visualStack.length - 6) +
          letter_wrong_count / (visualStack.length - 6)) /
        2.0;
      const d_prime_value = hit_rate - false_alarm_rate;

      console.log("Reference calculation:");
      console.log(
        "  vis_hits:",
        vis_hits_count,
        "letter_hits:",
        letter_hits_count,
      );
      console.log(
        "  vis_wrong:",
        vis_wrong_count,
        "letter_wrong:",
        letter_wrong_count,
      );
      console.log(
        "  vis_misses:",
        vis_misses_count,
        "letter_misses:",
        letter_misses_count,
      );
      console.log(
        "  hit_rate:",
        hit_rate,
        "false_alarm_rate:",
        false_alarm_rate,
      );
      console.log("  d_prime:", d_prime_value);

      setVis_wrong(vis_wrong_count);
      setVis_misses(vis_misses_count);
      setLetter_wrong(letter_wrong_count);
      setLetter_misses(letter_misses_count);
      setVis_hits(vis_hits_count);
      setLetter_hits(letter_hits_count);
      setD_prime(d_prime_value);

      // Only show feedback for real games, not demos
      console.log(
        "CALCULATE SCORE - setting states. demoMode:",
        demoMode,
        "demoComplete:",
        demoComplete,
      );
      if (!demoMode && !demoComplete) {
        setShowFeedback(true);
      }
      setGameActive(false);
    },
    [
      N,
      vis_stack,
      letter_stack,
      vis_clicks,
      letter_clicks,
      demoMode,
      demoComplete,
    ],
  );

  // Start game function
  const startGame = useCallback(async () => {
    console.log(`=== START GAME CALLED ===`);
    console.log(`N=${N}, demoMode=${demoMode}`);
    console.log(
      `Current game state - gameActive: ${gameActive}, countdown: ${countdown}`,
    );

    // Set initial states
    setGameActive(false);
    setShowFeedback(false);

    // Only initialize audio if not already loaded
    if (!spritesRef.current) {
      await initializeAudio();
    } else {
      console.log("Audio already loaded, skipping initialization");
    }

    const [visual_stack, auditory_stack] = buildGameSequence();
    console.log("=== GENERATED SEQUENCE ===");
    console.log("Visual stack:", visual_stack);
    console.log("Auditory stack:", auditory_stack);
    console.log("Visual matches should be at positions:");
    for (let i = N; i < visual_stack.length; i++) {
      if (visual_stack[i] === visual_stack[i - N]) {
        console.log(
          "  Position",
          i,
          ": box",
          visual_stack[i],
          "matches",
          i - N,
          "steps back",
        );
      }
    }
    console.log("Auditory matches should be at positions:");
    for (let i = N; i < auditory_stack.length; i++) {
      if (auditory_stack[i] === auditory_stack[i - N]) {
        console.log(
          "  Position",
          i,
          ": letter",
          LETTERS[auditory_stack[i]],
          "matches",
          i - N,
          "steps back",
        );
      }
    }
    console.log("========================");
    setVis_stack(visual_stack);
    setLetter_stack(auditory_stack);

    setVis_clicks([]);
    setLetter_clicks([]);
    setVis_delays([]);
    setLetter_delays([]);
    setTime(0);
    currentTurnPresses.current = { visual: false, auditory: false };

    if (demoMode) {
      // Demo mode: start immediately, no countdown
      console.log("DEMO MODE: Starting immediately without countdown");
      setCountdown(0);
      setGameActive(true);

      // Execute doTimestep function directly in interval, like the reference
      let currentTime = 0;
      let gameIntervalId: NodeJS.Timeout;

      const doTimestepInterval = () => {
        // First evaluate the previous turn if we had one
        if (currentTime > 0) {
          const prevTime = currentTime - 1;
          evaluateTurn(
            prevTime,
            visual_stack,
            auditory_stack,
            currentTurnPresses.current.visual,
            currentTurnPresses.current.auditory,
          );
        }

        if (currentTime < visual_stack.length) {
          const letter_idx = auditory_stack[currentTime];
          const box_idx = visual_stack[currentTime];
          console.log(`${currentTime}: ${LETTERS[letter_idx]} / ${box_idx}`);

          // Reset button states and turn presses at start of new timestep
          setVisButtonPressed(false);
          setLetterButtonPressed(false);
          currentTurnPresses.current = { visual: false, auditory: false };

          // Flash the box briefly (like reference implementation)
          setFlashingBox(box_idx);
          setTimeout(() => setFlashingBox(-1), 500); // Flash for 500ms

          setTimestep_start(Date.now());
          setTime(currentTime); // Update the time for UI display
          playLetter(letter_idx);

          // Demo mode: show which buttons should be pressed
          if (currentTime >= N) {
            const shouldClickVisual =
              visual_stack[currentTime] === visual_stack[currentTime - N];
            const shouldClickAuditory =
              auditory_stack[currentTime] === auditory_stack[currentTime - N];

            console.log("=== DEMO N-BACK CHECK ===");
            console.log("currentTime:", currentTime, "N:", N);
            console.log("Visual stack:", visual_stack);
            console.log("Auditory stack:", auditory_stack);
            console.log(
              "Visual comparison: pos",
              currentTime,
              "=",
              visual_stack[currentTime],
              "vs pos",
              currentTime - N,
              "=",
              visual_stack[currentTime - N],
              "→",
              shouldClickVisual,
            );
            console.log(
              "Auditory comparison: pos",
              currentTime,
              "=",
              LETTERS[auditory_stack[currentTime]],
              "vs pos",
              currentTime - N,
              "=",
              LETTERS[auditory_stack[currentTime - N]],
              "→",
              shouldClickAuditory,
            );

            // Immediately show which buttons should be pressed
            setDemoAutoClick({
              visual: shouldClickVisual,
              auditory: shouldClickAuditory,
            });

            if (shouldClickVisual) {
              setVisButtonPressed(true);
              setVis_clicks((prev) => [...prev, currentTime]);
            }

            if (shouldClickAuditory) {
              setLetterButtonPressed(true);
              setLetter_clicks((prev) => [...prev, currentTime]);
            }
          } else {
            // Reset demo indicators for early timesteps
            console.log(
              "Early timestep",
              currentTime,
              "< N =",
              N,
              "- no matches to check",
            );
            setDemoAutoClick({ visual: false, auditory: false });
          }

          currentTime += 1;
        } else {
          clearInterval(gameIntervalId);
          setMyInterval(null);

          // Demo is complete, show prompt to try for real
          console.log("DEMO COMPLETED - setting demoComplete to true");
          setGameActive(false);
          setDemoComplete(true);
          setDemoMode(false);
          setDemoAutoClick({ visual: false, auditory: false });
          // Explicitly prevent showing feedback
          setShowFeedback(false);
        }
      };

      // Start the first timestep immediately
      doTimestepInterval();

      // Then continue with the interval
      gameIntervalId = setInterval(doTimestepInterval, iFrequency);
      setMyInterval(gameIntervalId);
    } else {
      // Real game: start with countdown
      console.log("=== REAL GAME: Starting with countdown ===");
      console.log("About to setCountdown(3)");
      setCountdown(3);
      let countdownValue = 3;
      console.log("Countdown set, about to create interval");

      const countdownInterval = setInterval(() => {
        countdownValue -= 1;
        setCountdown(countdownValue);

        if (countdownValue <= 0) {
          clearInterval(countdownInterval);
          countdownIntervalRef.current = null;
          setCountdown(0);
          setGameActive(true);

          // Execute doTimestep function directly in interval, like the reference
          let currentTime = 0;
          let gameIntervalId: NodeJS.Timeout;

          const doTimestepInterval = () => {
            // First evaluate the previous turn if we had one
            if (currentTime > 0) {
              const prevTime = currentTime - 1;
              evaluateTurn(
                prevTime,
                visual_stack,
                auditory_stack,
                currentTurnPresses.current.visual,
                currentTurnPresses.current.auditory,
              );
            }

            if (currentTime < visual_stack.length) {
              const letter_idx = auditory_stack[currentTime];
              const box_idx = visual_stack[currentTime];
              console.log(
                `${currentTime}: ${LETTERS[letter_idx]} / ${box_idx}`,
              );

              // Reset button states and turn presses at start of new timestep
              setVisButtonPressed(false);
              setLetterButtonPressed(false);
              currentTurnPresses.current = { visual: false, auditory: false };

              // Flash the box briefly (like reference implementation)
              setFlashingBox(box_idx);
              setTimeout(() => setFlashingBox(-1), 500); // Flash for 500ms

              setTimestep_start(Date.now());
              setTime(currentTime); // Update the time for UI display
              playLetter(letter_idx);

              currentTime += 1;
            } else {
              // Evaluate the final turn before ending
              if (currentTime > 0) {
                const finalTime = currentTime - 1;
                evaluateTurn(
                  finalTime,
                  visual_stack,
                  auditory_stack,
                  currentTurnPresses.current.visual,
                  currentTurnPresses.current.auditory,
                );
              }

              clearInterval(gameIntervalId);
              setMyInterval(null);
              console.log("REGULAR GAME COMPLETED - showing score");
              // Use a timeout to ensure state has been updated, and pass the current clicks
              setTimeout(() => {
                setVis_clicks((currentVisClicks) => {
                  setLetter_clicks((currentLetterClicks) => {
                    calculateScore(
                      visual_stack,
                      auditory_stack,
                      currentVisClicks,
                      currentLetterClicks,
                    );
                    return currentLetterClicks;
                  });
                  return currentVisClicks;
                });
              }, 100);
            }
          };

          // Start the first timestep immediately after countdown
          doTimestepInterval();

          // Then continue with the interval
          gameIntervalId = setInterval(doTimestepInterval, iFrequency);
          setMyInterval(gameIntervalId);
        }
      }, 1000); // 1 second countdown intervals
      countdownIntervalRef.current = countdownInterval;
    }
  }, [
    N,
    buildGameSequence,
    initializeAudio,
    iFrequency,
    calculateScore,
    demoMode,
    playLetter,
    evaluateTurn,
    gameActive,
    countdown,
  ]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (myInterval) {
        clearInterval(myInterval);
      }
    };
  }, [myInterval]);

  // Separate cleanup for audio on component unmount
  useEffect(() => {
    return () => {
      // Stop and unload audio when component unmounts
      if (spritesRef.current) {
        spritesRef.current.stop();
        spritesRef.current.unload();
        spritesRef.current = null;
      }
      // Also stop all Howler sounds globally as a safety measure
      if (window.Howler) {
        window.Howler.stop();
      }
    };
  }, []); // Empty dependency array ensures this runs only on unmount

  const handleStartFromDialog = () => {
    setShowDialog(false);
    setCountdown(3); // Set countdown immediately to prevent flash
    startGame();
  };

  const handleRestart = () => {
    console.log("=== RESTART CLICKED ===");

    // Prevent double execution
    if (isRestarting) {
      console.log("Already restarting, ignoring");
      return;
    }

    setIsRestarting(true);
    console.log("Set isRestarting to true");

    // Clear all intervals and audio
    if (myInterval) {
      clearInterval(myInterval);
      setMyInterval(null);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (spritesRef.current) {
      spritesRef.current.stop();
    }
    if (window.Howler) {
      window.Howler.stop();
    }

    // Reset everything to initial state
    setVis_stack([]);
    setLetter_stack([]);
    setVis_clicks([]);
    setLetter_clicks([]);
    setVis_delays([]);
    setLetter_delays([]);
    setVis_wrong(0);
    setVis_misses(0);
    setLetter_wrong(0);
    setLetter_misses(0);
    setVis_hits(0);
    setLetter_hits(0);
    setD_prime(0);
    setTime(0);
    setTimestep_start(0);
    currentTurnPresses.current = { visual: false, auditory: false };
    setShowFeedback(false);
    setGameActive(false);
    setFlashingBox(-1);
    setVisButtonPressed(false);
    setLetterButtonPressed(false);
    setCountdown(0);
    setDemoMode(false);
    setDemoComplete(false);
    setDemoAutoClick({ visual: false, auditory: false });
    setTurnFeedback(null);
    setFeedbackEnabled(true);
    setShowDialog(false);

    // Start fresh game directly
    setTimeout(() => {
      console.log("=== STARTING FRESH GAME AFTER RESTART ===");
      setIsRestarting(false);
      startGame();
    }, 100);
  };

  // Box flashing is now handled by flashingBox state instead of currentBoxIndex

  // Load Howler.js script
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <>
      <ExerciseInstructionDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title={`Dual ${N}-Back Training`}
        description={`This exercise will challenge your working memory by requiring you to remember both visual positions and auditory letters from ${N} steps back.`}
        instructions={
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">👁️ Visual Task</h4>
                <p className="text-sm">
                  Watch squares light up in a 3×3 grid. Press the eye button
                  when the position matches {N} steps back.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2">🔊 Auditory Task</h4>
                <p className="text-sm">
                  Listen to spoken letters. Press the speaker button when the
                  letter matches {N} steps back.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg mt-4">
              <p className="text-sm">
                <strong>Remember:</strong> You're comparing the current stimulus
                with what appeared {N} steps ago. Both tasks run simultaneously,
                so stay focused!
              </p>
            </div>
          </>
        }
        onStart={handleStartFromDialog}
      />

      {/* Results/Completion Screen - handles both demo and real game */}
      {demoComplete || showFeedback ? (
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-8">
          <Card className="animate-slide-up">
            <CardContent className="text-center py-12">
              {demoComplete ? (
                // Demo completion screen
                <>
                  <div className="text-4xl mb-4">🎯</div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">
                    Demo Complete!
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    You've seen how the {N}-back task works. The green buttons
                    showed when you should press them because they match what
                    appeared {N} steps back.
                  </p>
                  <p className="text-md text-gray-600 mb-8">
                    Ready to try it yourself? You'll need to remember and
                    compare on your own this time.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={() => {
                        setDemoComplete(false);
                        setShowFeedback(false); // Ensure clean state
                        startGame();
                      }}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      🚀 Let's do this!
                    </Button>
                    <Button
                      onClick={() => {
                        setDemoComplete(false);
                        setShowFeedback(false); // Ensure clean state
                        setShowDialog(true);
                      }}
                      variant="outline"
                      size="lg"
                    >
                      📖 See instructions again
                    </Button>
                  </div>
                </>
              ) : (
                // Real game score screen
                <>
                  <div
                    className={`text-6xl font-bold mb-4 ${d_prime > 0.85 ? "text-green-600" : d_prime < 0.7 ? "text-red-600" : "text-gray-900"}`}
                  >
                    d' = {Math.round(d_prime * 100)}%
                  </div>
                  <p className="text-lg text-gray-600 mb-4">
                    {d_prime > 0.85
                      ? "Excellent performance!"
                      : d_prime < 0.7
                        ? "Keep practicing!"
                        : "Good job!"}
                  </p>
                  <div className="text-sm text-gray-500 space-y-1 mb-6">
                    <p>
                      Visual: {vis_hits} hits, {vis_misses} misses, {vis_wrong}{" "}
                      wrong
                    </p>
                    <p>
                      Auditory: {letter_hits} hits, {letter_misses} misses,{" "}
                      {letter_wrong} wrong
                    </p>
                  </div>
                  <Button onClick={onComplete} size="lg">
                    Continue
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      ) : countdown > 0 ? (
        // Countdown screen - FORCE NO SCROLL
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden bg-white select-none flex flex-col">
          {/* Title - compact */}
          <div className="flex-shrink-0 py-2 flex items-center justify-center text-xl font-sans">
            N = {N}
          </div>

          {/* Countdown display */}
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-3">
                {countdown}
              </div>
              <p className="text-lg text-gray-600">Get ready...</p>
            </div>
          </div>
        </div>
      ) : (
        // Game screen - FORCE NO SCROLL (mimicking reference .screen class)
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden bg-white select-none flex flex-col">
          {/* Demo Mode Info Bar - LARGER WITH PROPER SPACING */}
          {demoMode && (
            <div className="flex-shrink-0 bg-blue-50 border-b border-blue-200 p-4">
              <div className="text-center text-sm text-blue-800 font-semibold mb-6">
                📺 Demo Mode
              </div>

              {/* Combined Sequence Display - FIXED CENTER WITH NO LAYOUT SHIFTS */}
              <div
                className="relative overflow-hidden"
                style={{
                  height: "120px",
                  paddingTop: "30px",
                  paddingBottom: "30px",
                }}
              >
                {/* Current letter - always perfectly centered, never moves */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative" style={{ width: "70px" }}>
                    <div className="w-14 h-14 text-xl font-bold font-mono border-2 rounded-xl flex items-center justify-center shadow-lg mx-auto bg-blue-600 text-white border-blue-600 scale-110">
                      {LETTERS[letter_stack[time]]}
                    </div>
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-medium whitespace-nowrap">
                      Pos {vis_stack[time] + 1}
                    </div>
                  </div>
                </div>

                {/* Previous letters - positioned relative to the fixed center */}
                {letter_stack.slice(0, time).map((letterIdx, idx) => {
                  const isNBack = idx === time - N && time >= N;
                  const isRecentHistory =
                    idx < time && idx > time - N && time >= N;
                  const distanceFromCurrent = time - idx;

                  // First previous letter gets double spacing (180px), others get normal spacing (90px) from there
                  const spacing =
                    distanceFromCurrent === 1
                      ? 135
                      : 135 + (distanceFromCurrent - 1) * 90;

                  return (
                    <div
                      key={idx}
                      className="absolute top-1/2 transform -translate-y-1/2"
                      style={{
                        left: `calc(50% - ${spacing}px)`,
                        width: "70px",
                      }}
                    >
                      <div className="relative">
                        {isNBack && (
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-sm text-yellow-600 font-bold whitespace-nowrap">
                            {N}-back
                          </div>
                        )}
                        <div
                          className={`w-14 h-14 text-xl font-bold font-mono border-2 rounded-xl flex items-center justify-center shadow-sm mx-auto ${
                            isNBack
                              ? "bg-yellow-200 border-yellow-400 text-yellow-800"
                              : isRecentHistory
                                ? "bg-gray-100 border-gray-300"
                                : "bg-white border-gray-200 text-gray-400"
                          }`}
                        >
                          {LETTERS[letterIdx]}
                        </div>
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-medium whitespace-nowrap">
                          Pos {vis_stack[idx] + 1}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Title - MINIMAL */}
          <div className="flex-shrink-0 py-1 flex items-center justify-center text-lg font-sans">
            N = {N}{" "}
            {demoMode && (
              <span className="ml-2 text-sm text-blue-600">(Demo)</span>
            )}
          </div>

          {/* Main content area - TIGHT SPACING */}
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-2 gap-2">
            {/* Turn feedback display - ALWAYS takes up fixed space to prevent layout shift */}
            <div className="h-12 flex items-center justify-center w-full">
              {!demoMode && turnFeedback && gameActive && feedbackEnabled && (
                <div className="text-center bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 border shadow-sm">
                  <div className="flex gap-4 justify-center text-sm items-center">
                    {(() => {
                      // Calculate what was correct
                      const correct = [];
                      if (turnFeedback.visual?.shouldHave)
                        correct.push("Visual");
                      if (turnFeedback.auditory?.shouldHave)
                        correct.push("Verbal");
                      const correctText =
                        correct.length === 0
                          ? "Neither"
                          : correct.length === 2
                            ? "Both"
                            : correct[0];

                      // Calculate what the user input
                      const userInput = [];
                      if (turnFeedback.visual?.pressed)
                        userInput.push("Visual");
                      if (turnFeedback.auditory?.pressed)
                        userInput.push("Verbal");
                      const userInputText =
                        userInput.length === 0
                          ? "Neither"
                          : userInput.length === 2
                            ? "Both"
                            : userInput[0];

                      const isCorrect = userInputText === correctText;

                      return (
                        <>
                          <span className="font-medium text-gray-600">
                            Previous:
                          </span>
                          <span className="text-blue-600 font-semibold">
                            {correctText}
                          </span>
                          <span
                            className={`text-lg font-bold ${isCorrect ? "text-green-600" : "text-red-600"}`}
                          >
                            {isCorrect ? "✓" : "✗"}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Reserved space for demo button that's now moved to bottom right */}
            <div className="h-8"></div>

            {/* Demo "I understand" button */}
            {demoMode && gameActive && (
              <Button
                onClick={() => {
                  if (myInterval) {
                    clearInterval(myInterval);
                    setMyInterval(null);
                  }
                  setDemoMode(false);
                  setDemoAutoClick({ visual: false, auditory: false });
                  setGameActive(false);
                  setCountdown(3);
                  let countdownValue = 3;

                  const countdownInterval = setInterval(() => {
                    countdownValue -= 1;
                    setCountdown(countdownValue);

                    if (countdownValue <= 0) {
                      clearInterval(countdownInterval);
                      countdownIntervalRef.current = null;
                      setCountdown(0);
                      setGameActive(true);

                      // Start new game
                      const [visual_stack, auditory_stack] =
                        buildGameSequence();
                      setVis_stack(visual_stack);
                      setLetter_stack(auditory_stack);
                      setVis_clicks([]);
                      setLetter_clicks([]);
                      setTime(0);

                      let currentTime = 0;
                      const doTimestepInterval = () => {
                        if (currentTime < visual_stack.length) {
                          const letter_idx = auditory_stack[currentTime];
                          const box_idx = visual_stack[currentTime];

                          setVisButtonPressed(false);
                          setLetterButtonPressed(false);
                          setFlashingBox(box_idx);
                          setTimeout(() => setFlashingBox(-1), 500);
                          setTimestep_start(Date.now());
                          setTime(currentTime);
                          playLetter(letter_idx);
                          currentTime += 1;
                        } else {
                          clearInterval(gameIntervalId);
                          setMyInterval(null);
                          // This is always a real game (not demo) since we're in the "I understand it now" flow
                          // Use a timeout to ensure state has been updated
                          setTimeout(
                            () => calculateScore(visual_stack, auditory_stack),
                            100,
                          );
                        }
                      };

                      doTimestepInterval();
                      const gameIntervalId = setInterval(
                        doTimestepInterval,
                        iFrequency,
                      );
                      setMyInterval(gameIntervalId);
                    }
                  }, 1000);
                  countdownIntervalRef.current = countdownInterval;
                }}
                size="sm"
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 mb-2"
              >
                I understand it now
              </Button>
            )}

            {/* Grid container */}
            <div className="w-full max-w-xs aspect-square">
              <svg
                viewBox="0 0 300 300"
                className="w-full h-full"
                aria-label="Dual N-Back game grid"
              >
                {/* 8 boxes in 3x3 grid excluding center */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((boxIndex) => {
                  const positions = [
                    { x: 0, y: 0 },
                    { x: 100.5, y: 0 },
                    { x: 201, y: 0 },
                    { x: 0, y: 100.5 },
                    { x: 201, y: 100.5 },
                    { x: 0, y: 201 },
                    { x: 100.5, y: 201 },
                    { x: 201, y: 201 },
                  ];

                  let fillClass = "fill-blue-200";
                  let opacity = 1;

                  // Current flashing box
                  if (flashingBox === boxIndex) {
                    fillClass = "fill-blue-800";
                  }
                  // Demo mode: show history with opacity
                  else if (demoMode && time > 0) {
                    // Check if this box was active in recent history
                    for (let i = 1; i <= Math.min(N, time); i++) {
                      if (time - i >= 0 && vis_stack[time - i] === boxIndex) {
                        if (i === N) {
                          fillClass = "fill-yellow-300"; // N-back position
                        } else {
                          fillClass = "fill-gray-300"; // Recent history
                        }
                        opacity = 1 - i * 0.2; // Fade with distance
                        break;
                      }
                    }
                  }

                  return (
                    <rect
                      key={boxIndex}
                      className={`box transition-all duration-150 ${fillClass}`}
                      width="99"
                      height="99"
                      rx="5"
                      ry="5"
                      x={positions[boxIndex].x}
                      y={positions[boxIndex].y}
                      style={{ opacity }}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Game buttons - positioned below grid, not full width */}
            <div className="flex gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={demoMode ? undefined : eyeButtonPress}
                className={cn(
                  "flex-1 h-12 rounded-lg font-medium transition-all duration-150 flex items-center justify-center gap-2 text-sm relative",
                  // In demo mode, highlight based on whether this button should be pressed
                  demoMode && demoAutoClick.visual
                    ? "bg-green-500 text-white scale-105 shadow-lg"
                    : visButtonPressed && !demoMode
                      ? "bg-neutral-600 text-white scale-95"
                      : demoMode
                        ? "bg-gray-200 text-gray-600"
                        : "bg-gray-100 hover:bg-gray-200 hover:scale-98",
                )}
              >
                <span className="font-semibold">Visual</span>
                <Eye className="w-4 h-4" />
                {demoMode && demoAutoClick.visual && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded font-bold animate-pulse">
                    MATCH!
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={demoMode ? undefined : soundButtonPress}
                className={cn(
                  "flex-1 h-12 rounded-lg font-medium transition-all duration-150 flex items-center justify-center gap-2 text-sm relative",
                  // In demo mode, highlight based on whether this button should be pressed
                  demoMode && demoAutoClick.auditory
                    ? "bg-green-500 text-white scale-105 shadow-lg"
                    : letterButtonPressed && !demoMode
                      ? "bg-neutral-600 text-white scale-95"
                      : demoMode
                        ? "bg-gray-200 text-gray-600"
                        : "bg-gray-100 hover:bg-gray-200 hover:scale-98",
                )}
              >
                <span className="font-semibold">Verbal</span>
                <Volume2 className="w-4 h-4" />
                {demoMode && demoAutoClick.auditory && (
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded font-bold animate-pulse">
                    MATCH!
                  </div>
                )}
              </button>
            </div>

            {/* Demo mode correct answer display */}
            {demoMode && time >= N && (
              <div className="mt-3 text-center">
                <div className="text-sm text-gray-600 mb-1">
                  Correct answer:
                </div>
                <div className="text-lg font-bold">
                  {demoAutoClick.visual && demoAutoClick.auditory ? (
                    <span className="text-green-600">Both Visual + Verbal</span>
                  ) : demoAutoClick.visual ? (
                    <span className="text-blue-600">Visual</span>
                  ) : demoAutoClick.auditory ? (
                    <span className="text-purple-600">Verbal</span>
                  ) : (
                    <span className="text-gray-600">Neither</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50 flex flex-row gap-2">
        {/* Show demo button during active game */}
        {!demoMode &&
          gameActive &&
          !showFeedback &&
          countdown === 0 &&
          !showDialog && (
            <Button
              onClick={() => {
                setDemoMode(true);
                startGame();
              }}
              variant="outline"
              size="sm"
              className="bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg cursor-pointer"
            >
              Show Demo
            </Button>
          )}

        {/* Toggle feedback button during active game */}
        {!demoMode && gameActive && !showDialog && (
          <Button
            onClick={() => setFeedbackEnabled(!feedbackEnabled)}
            variant="outline"
            size="sm"
            className={`backdrop-blur-sm shadow-lg cursor-pointer ${
              feedbackEnabled
                ? "bg-blue-50/90 hover:bg-blue-100 text-blue-700 border-blue-200"
                : "bg-white/90 hover:bg-white"
            }`}
          >
            {feedbackEnabled ? "Feedback ON (toggle)" : "Feedback OFF (toggle)"}
          </Button>
        )}

        <Button
          onClick={handleRestart}
          variant="outline"
          size="sm"
          className="bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Restart Exercise
        </Button>
      </div>
    </>
  );
}
