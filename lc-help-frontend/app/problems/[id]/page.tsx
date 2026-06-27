"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
  PlayCircle,
  Code2,
  BookOpen,
  Play,
  Send,
  Home,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import ArrayAnimator from "../../../components/ArrayAnimator";

export default function ProblemViewer({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [activeTab, setActiveTab] = useState<"problem" | "solution">("problem");
  const [userCode, setUserCode] = useState(
    `pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n    // Write your logic here\n    vec![]\n}`,
  );
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleCodeSubmit = async () => {
    setSubmitStatus("loading");
    setStatusMessage("Transmitting code to judge...");
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/solutions/submit",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problem_id: resolvedParams.id,
            language: "rust",
            code: userCode,
          }),
        },
      );
      if (response.ok) {
        setSubmitStatus("success");
        setStatusMessage("Code Accepted! Animation generated.");
      } else {
        setSubmitStatus("error");
        setStatusMessage("Compilation Error or Wrong Answer.");
      }
    } catch (err) {
      setSubmitStatus("error");
      setStatusMessage("Failed to connect to Rust backend.");
    }
    setTimeout(() => setSubmitStatus("idle"), 3000);
  };

  return (
    <main className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* LEFT PANEL */}
      <div className="w-1/3 h-full border-r border-gray-200 flex flex-col bg-white relative shadow-sm z-10">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-semibold"
          >
            <Home size={16} /> Hub
          </Link>
        </div>

        <div className="flex border-b border-gray-200 bg-white shrink-0">
          <button
            onClick={() => setActiveTab("problem")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "problem"
                ? "border-blue-600 text-blue-700 bg-blue-50/50"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <BookOpen size={18} /> Problem Concept
          </button>
          <button
            onClick={() => setActiveTab("solution")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "solution"
                ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <Code2 size={18} /> Code Editor
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-grow custom-scrollbar pb-32">
          <div className="mb-6">
            <span className="text-xs font-mono text-gray-400 mb-2 block">
              Problem #{resolvedParams.id}
            </span>
            <h1 className="text-2xl font-bold mb-3 text-gray-900">Two Sum</h1>
            <div className="flex gap-2 text-xs mb-6">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md font-medium">
                Easy
              </span>
              <span className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded-md">
                Array
              </span>
              <span className="bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded-md">
                Two Pointers
              </span>
            </div>
          </div>

          {activeTab === "problem" ? (
            <div className="prose prose-sm prose-gray max-w-none text-gray-600 leading-relaxed">
              <p>
                Given an array of integers{" "}
                <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded border border-gray-200">
                  nums
                </code>{" "}
                and an integer{" "}
                <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded border border-gray-200">
                  target
                </code>
                , return indices of the two numbers such that they add up to
                target.
              </p>
              <p className="mt-4">
                You may assume that each input would have exactly one solution,
                and you may not use the same element twice.
              </p>
              <p className="mt-4 text-blue-600 italic">
                Press play on the visualizer to see how the array is processed
                to find the target.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-fade-in h-full">
              <p className="text-sm text-gray-500">
                Write your solution below. When ready, submit to test against
                our backend test cases.
              </p>
              <div className="bg-[#1e1e1e] rounded-xl border border-gray-300 overflow-hidden shadow-xl flex-grow flex flex-col">
                <div className="bg-[#2d2d2d] px-4 py-2 flex gap-2 shrink-0 border-b border-[#404040]">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  className="w-full h-full min-h-[300px] p-4 text-[13px] font-mono leading-loose text-gray-300 bg-transparent resize-none focus:outline-none"
                  spellCheck="false"
                />
              </div>
            </div>
          )}
        </div>

        {activeTab === "solution" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex flex-col gap-3 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {submitStatus !== "idle" && (
              <div
                className={`text-xs font-semibold flex items-center gap-2 ${
                  submitStatus === "success"
                    ? "text-emerald-600"
                    : submitStatus === "error"
                      ? "text-red-600"
                      : "text-blue-600 animate-pulse"
                }`}
              >
                {submitStatus === "success" ? (
                  <CheckCircle2 size={14} />
                ) : submitStatus === "error" ? (
                  <AlertCircle size={14} />
                ) : null}
                {statusMessage}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors">
                <Play size={14} fill="currentColor" /> Run Code
              </button>
              <button
                onClick={handleCodeSubmit}
                disabled={submitStatus === "loading"}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Send size={14} />{" "}
                {submitStatus === "loading" ? "Judging..." : "Submit Code"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: The Visualizer Engine */}
      <div className="w-2/3 h-full flex flex-col relative bg-gray-50">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-md z-10">
          <PlayCircle
            size={16}
            className={
              activeTab === "problem" ? "text-blue-600" : "text-emerald-600"
            }
          />
          <span className="text-sm font-bold text-gray-700">
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
