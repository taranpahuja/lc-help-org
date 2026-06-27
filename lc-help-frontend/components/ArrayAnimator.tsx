"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from "lucide-react";

// Define what a single step in our animation timeline looks like
interface AnimationStep {
  leftIdx: number;
  rightIdx: number;
  currentSum: number;
  status: "comparing" | "found" | "searching";
}

export default function ArrayAnimator() {
  // 1. Setup the target dataset (Sorted for the two-pointer approach)
  const nums = [2, 7, 11, 15];
  const target = 18;

  // 2. State management for playback
  const [timeline, setTimeline] = useState<AnimationStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // 3. Generate the timeline steps on mount (The "Recorder" Phase)
  useEffect(() => {
    const steps: AnimationStep[] = [];
    let left = 0;
    let right = nums.length - 1;

    while (left < right) {
      const sum = nums[left] + nums[right];

      if (sum === target) {
        steps.push({
          leftIdx: left,
          rightIdx: right,
          currentSum: sum,
          status: "found",
        });
        break;
      }

      steps.push({
        leftIdx: left,
        rightIdx: right,
        currentSum: sum,
        status: "comparing",
      });

      if (sum < target) {
        left++;
      } else {
        right--;
      }
    }

    setTimeline(steps);
  }, []);

  // 4. Handle automatic autoplay functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentStepIdx < timeline.length - 1) {
      interval = setInterval(() => {
        setCurrentStepIdx((prev) => prev + 1);
      }, 1500); // Move forward every 1.5 seconds
    } else {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStepIdx, timeline.length]);

  // Get current active step frame data safely
  const currentFrame = timeline[currentStepIdx] || {
    leftIdx: -1,
    rightIdx: -1,
    currentSum: 0,
    status: "searching",
  };

  return (
    <div className="flex flex-col items-center gap-12 w-full max-w-xl">
      {/* Dynamic Status Dashboard */}
      <div className="text-center bg-neutral-800/40 p-4 rounded-xl border border-neutral-800 w-full backdrop-blur">
        <div className="text-sm text-neutral-400 font-mono mb-1">
          Target: <span className="text-emerald-400 font-bold">{target}</span>
          {" | "} Current Sum:{" "}
          <span
            className={`${currentFrame.status === "found" ? "text-green-400" : "text-blue-400"} font-bold`}
          >
            {currentFrame.currentSum}
          </span>
        </div>
        <div className="text-base font-medium">
          {currentFrame.status === "comparing" &&
            `Comparing indices ${currentFrame.leftIdx} and ${currentFrame.rightIdx}...`}
          {currentFrame.status === "found" &&
            "🎉 Target Found! Solution Indices returned."}
        </div>
      </div>

      {/* Visual Array Structure */}
      <div className="flex gap-4 relative py-12 items-center justify-center">
        {nums.map((val, idx) => {
          const isLeft = idx === currentFrame.leftIdx;
          const isRight = idx === currentFrame.rightIdx;
          const isSelected = isLeft || isRight;

          return (
            <div key={idx} className="relative flex flex-col items-center">
              {/* Left Pointer Tag */}
              <AnimatePresence>
                {isLeft && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -top-8 text-xs text-blue-400 font-bold font-mono"
                  >
                    Left
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Core Array Block Element */}
              <motion.div
                animate={{
                  scale: isSelected ? 1.05 : 1,
                  borderColor:
                    currentFrame.status === "found" && isSelected
                      ? "#10b981"
                      : isSelected
                        ? "#3b82f6"
                        : "#404040",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`w-16 h-16 bg-neutral-900 border-2 rounded-xl flex items-center justify-center text-xl font-bold font-mono shadow-md text-neutral-200`}
              >
                {val}
              </motion.div>

              {/* Right Pointer Tag */}
              <AnimatePresence>
                {isRight && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -bottom-8 text-xs text-indigo-400 font-bold font-mono"
                  >
                    Right
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Index Subtext Label */}
              <span className="absolute -bottom-14 text-xs text-neutral-600 font-mono">
                i={idx}
              </span>
            </div>
          );
        })}
      </div>

      {/* Playback Control Bar */}
      <div className="flex items-center gap-6 bg-neutral-950 px-6 py-3 rounded-full border border-neutral-800 shadow-xl">
        <button
          disabled={currentStepIdx === 0}
          onClick={() => setCurrentStepIdx((prev) => prev - 1)}
          className="p-2 text-neutral-400 hover:text-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <SkipBack size={20} />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-3 bg-neutral-100 text-neutral-950 rounded-full hover:bg-neutral-300 transition-colors"
        >
          {isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" />
          )}
        </button>

        <button
          disabled={currentStepIdx === timeline.length - 1}
          onClick={() => setCurrentStepIdx((prev) => prev + 1)}
          className="p-2 text-neutral-400 hover:text-neutral-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <SkipForward size={20} />
        </button>

        <div className="h-4 w-[1px] bg-neutral-800" />

        <button
          onClick={() => {
            setIsPlaying(false);
            setCurrentStepIdx(0);
          }}
          className="p-2 text-neutral-400 hover:text-neutral-100 transition-colors"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
}
