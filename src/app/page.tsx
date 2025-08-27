"use client";

import { useState, useEffect } from "react";
import HomePage from "@/components/HomePage";
import WakeFlow from "@/components/WakeFlow";
import { preloadImages } from "@/lib/utils";

export default function Home() {
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    // Preload all instruction images
    const instructionImages = [
      "/instructions/dualnback.png",
      "/instructions/match.png",
      "/instructions/mismatch.png",
    ];
    
    preloadImages(instructionImages);
  }, []);

  return (
    <main className="min-h-screen">
      {!isStarted ? (
        <HomePage onStart={() => setIsStarted(true)} />
      ) : (
        <WakeFlow onComplete={() => setIsStarted(false)} />
      )}
    </main>
  );
}
