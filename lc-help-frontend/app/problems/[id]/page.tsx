"use client";

import { useState, use } from "react";
import Link from "next/link";
import { PlayCircle, Code2, BookOpen, Play, Send, Home } from "lucide-react";
import ArrayAnimator from "../../components/ArrayAnimator";

export default function ProblemViewer({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap the dynamic URL parameter promise
  const resolvedParams = use(params);

  const [activeTab, setActiveTab] = useState<"problem" | "solution">("problem");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCodeSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      alert(
        "Code submitted to backend judge! (Animation will generate based on results)",
      );
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <main className="flex h-screen bg-neutral-950 text-neutral-50 font-sans overflow-hidden">
      {/* LEFT PANEL: Context, Theory, and Code */}
      <div className="w-1/3 h-full border-r border-neutral-800 flex flex-col bg-neutral-900/50 relative">
        {/* Navigation Bar: Back to Hub */}
        <div className="bg-neutral-950 px-4 py-3 border-b border-neutral-800 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-neutral-400 hover:text-neutral-100 transition-colors text-sm font-semibold"
          >
            <Home size={16} /> Hub
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950 shrink-0">
          <button
            onClick={() => setActiveTab("problem")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "problem"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <BookOpen size={18} /> Problem Concept
          </button>
          <button
            onClick={() => setActiveTab("solution")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "solution"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Code2 size={18} /> Code Editor
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div className="p-8 overflow-y-auto flex-grow custom-scrollbar pb-24">
          <div className="mb-6">
            <span className="text-xs font-mono text-neutral-500 mb-2 block">
              Problem #{resolvedParams.id}
            </span>
            <h1 className="text-2xl font-bold mb-3">Two Sum</h1>
            <div className="flex gap-2 text-xs mb-6">
              <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900 px-2 py-1 rounded">
                Easy
              </span>
              <span className="bg-neutral-800 px-2 py-1 rounded">Array</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">
                Two Pointers
              </span>
            </div>
          </div>

          {activeTab === "problem" ? (
            <div className="prose prose-invert text-neutral-300 text-sm leading-relaxed">
              <p>
                Given an array of integers <code>nums</code> and an integer{" "}
                <code>target</code>, return indices of the two numbers such that
                they add up to target.
              </p>
              <p className="mt-4">
                You may assume that each input would have exactly one solution,
                and you may not use the same element twice.
              </p>
              <p className="mt-4 text-blue-300 italic">
                Press play on the visualizer to see how the array is processed
                to find the target.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-fade-in h-full">
              <p className="text-sm text-neutral-400">
                Write your solution below. When ready, submit to test against
                our backend test cases.
              </p>

              <div className="bg-[#1e1e1e] rounded-xl border border-neutral-800 overflow-hidden shadow-2xl flex-grow flex flex-col">
                <div className="bg-neutral-900 px-4 py-2 border-b border-neutral-800 flex gap-2 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <textarea
                  className="w-full h-full min-h-[300px] p-4 text-[13px] font-mono leading-loose text-neutral-300 bg-transparent resize-none focus:outline-none"
                  defaultValue={`pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n    // Write your logic here\n    vec![]\n}`}
                  spellCheck="false"
                />
              </div>
            </div>
          )}
        </div>

        {/* The Execution Action Bar */}
        {activeTab === "solution" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-neutral-950 border-t border-neutral-800 flex justify-end gap-3 z-20">
            <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors">
              <Play size={14} fill="currentColor" /> Run Code
            </button>
            <button
              onClick={handleCodeSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-50 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors"
            >
              <Send size={14} /> {isSubmitting ? "Judging..." : "Submit"}
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: The Visualizer Engine */}
      <div className="w-2/3 h-full flex flex-col relative bg-neutral-950">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-full shadow-lg z-10">
          <PlayCircle
            size={16}
            className={
              activeTab === "problem" ? "text-blue-500" : "text-emerald-500"
            }
          />
          <span className="text-sm font-bold text-neutral-300">
            {activeTab === "problem"
              ? "Concept Explanation Dry-Run"
              : "Algorithm Execution Dry-Run"}
          </span>
        </div>

        <div className="flex-grow flex items-center justify-center p-8">
          <ArrayAnimator />
        </div>
      </div>
    </main>
  );
}
