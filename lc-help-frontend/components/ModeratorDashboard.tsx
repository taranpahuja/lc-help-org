"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  RefreshCw,
  CheckCircle,
  XCircle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Code2,
} from "lucide-react";
import { ReactFlow, Background, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface DatabaseProblem {
  id: number;
  title: string;
  initial_state: {
    type: string;
    description?: string;
    nodes: Node[];
    edges: Edge[];
  };
  steps:
    | {
        problem?: any[];
        solution?: any[];
      }
    | any[]; // Handles both new dual-timeline payload and old payload
}

export default function ModeratorDashboard() {
  const [submissions, setSubmissions] = useState<DatabaseProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Animation Player State
  const [viewingProblemId, setViewingProblemId] = useState<number | null>(null);
  const [playbackTab, setPlaybackTab] = useState<"problem" | "solution">(
    "problem",
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/problems");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubmissions(data);
      setError("");
    } catch (err) {
      setError("Could not connect to Rust backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const getActiveTimeline = (prob: DatabaseProblem) => {
    if (Array.isArray(prob.steps)) return prob.steps;
    if (playbackTab === "problem") return prob.steps.problem || [];
    return prob.steps.solution || [];
  };

  const currentProb = submissions.find((p) => p.id === viewingProblemId);
  const timeline = currentProb ? getActiveTimeline(currentProb) : [];
  const activeFrame = timeline[currentStepIndex];

  // Derive Nodes to render (Prioritize active frame snapshot, fallback to initial state)
  const displayNodes =
    activeFrame?.nodesSnapshot || currentProb?.initial_state.nodes || [];
  const displayEdges =
    activeFrame?.edgesSnapshot || currentProb?.initial_state.edges || [];

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <Shield className="text-purple-600" size={22} /> Moderator Review
            Queue
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Review visualizer animations and descriptions before approval.
          </p>
        </div>
        <button
          onClick={fetchSubmissions}
          className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors text-sm font-semibold"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 animate-pulse text-sm">
          Loading database records...
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600 text-sm border border-red-200 bg-red-50 rounded-xl font-medium">
          {error}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm border border-dashed border-gray-300 rounded-xl bg-gray-50">
          Queue is empty. No new problems to review.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submissions List */}
          <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {submissions.map((prob) => (
              <div
                key={prob.id}
                className={`border rounded-xl p-5 flex flex-col gap-4 transition-all cursor-pointer ${viewingProblemId === prob.id ? "border-purple-400 bg-purple-50/30 shadow-md ring-2 ring-purple-100" : "border-gray-200 bg-white hover:border-gray-300"}`}
                onClick={() => {
                  setViewingProblemId(prob.id);
                  setCurrentStepIndex(0);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono text-purple-700 bg-purple-100 px-2 py-1 rounded border border-purple-200 font-bold">
                      ID: {prob.id}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-3">
                      {prob.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {prob.initial_state.description ||
                        "No description provided."}
                    </p>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors shadow-sm">
                    <PlayCircle size={14} /> Review
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Inline Animation Player */}
          {currentProb ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl flex flex-col overflow-hidden h-[600px]">
              {/* Player Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <h3 className="font-bold text-gray-900">{currentProb.title}</h3>
                <p className="text-xs text-gray-600 mt-2">
                  {currentProb.initial_state.description}
                </p>

                {/* Tabs for new format */}
                {!Array.isArray(currentProb.steps) && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setPlaybackTab("problem");
                        setCurrentStepIndex(0);
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded border ${playbackTab === "problem" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
                    >
                      <BookOpen size={12} className="inline mr-1" /> Problem
                      Anim
                    </button>
                    <button
                      onClick={() => {
                        setPlaybackTab("solution");
                        setCurrentStepIndex(0);
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded border ${playbackTab === "solution" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}
                    >
                      <Code2 size={12} className="inline mr-1" /> Solution Anim
                    </button>
                  </div>
                )}
              </div>

              {/* The Canvas Viewer */}
              <div className="flex-grow relative bg-white">
                <ReactFlow
                  nodes={displayNodes}
                  edges={displayEdges}
                  fitView
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                >
                  <Background color="#cbd5e1" gap={16} />
                </ReactFlow>

                {/* Explanation Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 p-3 rounded-lg shadow-lg text-sm text-gray-800 text-center font-medium">
                  {activeFrame?.explanation ||
                    "Starting State (No explanation)"}
                </div>
              </div>

              {/* Player Controls & Mod Actions */}
              <div className="bg-white border-t border-gray-200 p-4 flex justify-between items-center">
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-bold transition-colors">
                    <XCircle size={14} /> Reject
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-bold transition-colors">
                    <CheckCircle size={14} /> Approve
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setCurrentStepIndex((i) => Math.max(0, i - 1))
                    }
                    disabled={currentStepIndex === 0}
                    className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-gray-600 font-mono">
                    Frame {timeline.length > 0 ? currentStepIndex + 1 : 0} /{" "}
                    {timeline.length}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentStepIndex((i) =>
                        Math.min(timeline.length - 1, i + 1),
                      )
                    }
                    disabled={
                      currentStepIndex >= timeline.length - 1 ||
                      timeline.length === 0
                    }
                    className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-center h-[600px] text-gray-400 text-sm">
              Select a problem from the queue to review its animation.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
