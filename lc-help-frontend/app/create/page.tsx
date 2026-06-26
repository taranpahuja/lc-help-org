"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Code,
  Eye,
  Send,
  CheckCircle2,
  AlertCircle,
  Home,
} from "lucide-react";

interface CreatorStep {
  stepNumber: number;
  leftIdx: number;
  rightIdx: number;
  explanation: string;
}

export default function ProblemCreator() {
  const [title, setTitle] = useState("My Custom Array Problem");
  const [arrayInput, setArrayInput] = useState("2, 4, 6, 8, 10");

  const [steps, setSteps] = useState<CreatorStep[]>([]);
  const [currentLeft, setCurrentLeft] = useState<number>(0);
  const [currentRight, setCurrentRight] = useState<number>(4);
  const [currentExplanation, setCurrentExplanation] = useState("");

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [backendMessage, setBackendMessage] = useState("");

  const parsedArray = arrayInput
    .split(",")
    .map((num) => parseInt(num.trim(), 10))
    .filter((num) => !isNaN(num));

  const addStep = () => {
    if (!currentExplanation.trim()) {
      alert("Please provide an explanation for this step dry-run.");
      return;
    }

    const newStep: CreatorStep = {
      stepNumber: steps.length + 1,
      leftIdx: currentLeft,
      rightIdx: currentRight,
      explanation: currentExplanation,
    };

    setSteps([...steps, newStep]);
    setCurrentExplanation("");
  };

  const removeStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    const reindexed = updated.map((step, i) => ({
      ...step,
      stepNumber: i + 1,
    }));
    setSteps(reindexed);
  };

  const finalJsonPayload = {
    title,
    initial_state: {
      type: "array",
      values: parsedArray,
    },
    steps,
  };

  const submitToBackend = async () => {
    setStatus("loading");
    setBackendMessage("Transmitting to database...");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/problems/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(finalJsonPayload),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setBackendMessage(`Success! Sent to Mods. ID: ${data.problem_id}`);
      } else {
        setStatus("error");
        setBackendMessage(data.message || "Database rejected the entry.");
      }
    } catch (err) {
      setStatus("error");
      setBackendMessage("Connection failed. Is the Rust server running?");
    }
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
      {/* LEFT COLUMN: Input Form */}
      <div className="flex flex-col gap-6">
        {/* Header with Built-in Hub Button */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-100">
              <Code className="text-blue-500" size={22} /> Animation Studio
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Build the sequence for your custom problem.
            </p>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-neutral-100 transition-colors bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg"
          >
            <Home size={14} /> Hub
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Problem Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Starting Array (Comma Separated)
          </label>
          <input
            type="text"
            value={arrayInput}
            onChange={(e) => setArrayInput(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 font-mono text-sm text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="bg-neutral-950 p-5 rounded-xl border border-neutral-800 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider border-b border-neutral-800 pb-2">
            Record Timeline Step
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-neutral-400">
                Left Pointer (Index)
              </label>
              <input
                type="number"
                value={currentLeft}
                onChange={(e) => setCurrentLeft(parseInt(e.target.value) || 0)}
                className="bg-neutral-900 border border-neutral-800 rounded-md p-2 text-sm text-neutral-200 font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-neutral-400">
                Right Pointer (Index)
              </label>
              <input
                type="number"
                value={currentRight}
                onChange={(e) => setCurrentRight(parseInt(e.target.value) || 0)}
                className="bg-neutral-900 border border-neutral-800 rounded-md p-2 text-sm text-neutral-200 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-neutral-400">
              Visual Explanation for this step
            </label>
            <textarea
              rows={2}
              value={currentExplanation}
              onChange={(e) => setCurrentExplanation(e.target.value)}
              placeholder="e.g., Comparing these values..."
              className="bg-neutral-900 border border-neutral-800 rounded-md p-3 text-sm text-neutral-200 focus:outline-none"
            />
          </div>

          <button
            onClick={addStep}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-neutral-100 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={16} /> Add Frame to Animation
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Output Payload & Submission */}
      <div className="flex flex-col gap-6 border-t md:border-t-0 md:border-l border-neutral-800 pt-6 md:pt-0 md:pl-8">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-100">
            <Eye className="text-emerald-500" size={22} /> Review & Submit
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Verify your sequence before sending to mods.
          </p>
        </div>

        <div className="flex flex-col gap-3 flex-grow overflow-y-auto max-h-[300px] pr-2">
          {steps.length === 0 ? (
            <div className="text-center py-8 text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl h-full flex items-center justify-center">
              No frames recorded. Use the left panel.
            </div>
          ) : (
            steps.map((step, idx) => (
              <div
                key={idx}
                className="flex justify-between items-start bg-neutral-950 p-3 rounded-lg border border-neutral-800 gap-4"
              >
                <div className="text-xs flex flex-col gap-1">
                  <div className="font-bold text-blue-400">
                    Frame #{step.stepNumber}
                  </div>
                  <p className="text-neutral-300 italic">
                    "{step.explanation}"
                  </p>
                </div>
                <button
                  onClick={() => removeStep(idx)}
                  className="p-1 text-neutral-500 hover:text-rose-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex flex-col gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800 mt-auto">
          <button
            onClick={submitToBackend}
            disabled={status === "loading" || steps.length === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Send size={16} />
            {status === "loading"
              ? "Transmitting..."
              : "Push to Moderator Queue"}
          </button>

          {/* Dynamic feedback messages */}
          {status === "success" && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 p-2.5 rounded-lg">
              <CheckCircle2 size={14} /> {backendMessage}
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 p-2.5 rounded-lg">
              <AlertCircle size={14} /> {backendMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
