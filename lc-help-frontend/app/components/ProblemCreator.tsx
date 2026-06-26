use client";

import { useState, useCallback, useRef } from "react";
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
  Network,
  Camera,
} from "lucide-react";
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css"; // Required React Flow styles

interface CreatorStep {
  stepNumber: number;
  explanation: string;
  nodesSnapshot: Node[];
  edgesSnapshot: Edge[];
}

export default function ProblemCreator() {
  const [title, setTitle] = useState("Custom Graph / Tree Problem");

  // React Flow State (The Live Canvas)
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const nodeIdCounter = useRef(0);

  // Timeline State
  const [steps, setSteps] = useState<CreatorStep[]>([]);
  const [currentExplanation, setCurrentExplanation] = useState("");

  // Submission State
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [backendMessage, setBackendMessage] = useState("");

  // --- REACT FLOW HANDLERS ---
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect: OnConnect = useCallback(
    (connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: "#3b82f6", strokeWidth: 2 },
          },
          eds,
        ),
      ),
    [],
  );

  // --- CANVAS TOOLS ---
  const addNode = () => {
    const newId = `node-${nodeIdCounter.current}`;
    nodeIdCounter.current += 1;

    const newNode: Node = {
      id: newId,
      position: { x: Math.random() * 200 + 50, y: Math.random() * 100 + 50 },
      data: { label: `Node ${nodeIdCounter.current}` },
      style: {
        background: "#171717",
        color: "#e5e5e5",
        border: "1px solid #404040",
        borderRadius: "8px",
        fontWeight: "bold",
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  // --- TIMELINE LOGIC ---
  const captureFrame = () => {
    if (!currentExplanation.trim()) {
      alert("Please write an explanation for what is happening in this frame.");
      return;
    }

    const newStep: CreatorStep = {
      stepNumber: steps.length + 1,
      explanation: currentExplanation,
      // Deep copy the nodes and edges so they represent a frozen snapshot in time
      nodesSnapshot: JSON.parse(JSON.stringify(nodes)),
      edgesSnapshot: JSON.parse(JSON.stringify(edges)),
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

  // --- BACKEND SUBMISSION ---
  // The first frame captured is considered the "initial state" by default if we want to preview it,
  // or we can save the very first configuration. We will save the current canvas state as initial.
  const finalJsonPayload = {
    title,
    initial_state: {
      type: "graph_or_tree",
      nodes: steps.length > 0 ? steps[0].nodesSnapshot : nodes,
      edges: steps.length > 0 ? steps[0].edgesSnapshot : edges,
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
          headers: { "Content-Type": "application/json" },
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
    <div className="w-full grid grid-cols-1 xl:grid-cols-5 gap-8 p-6 bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">
      {/* LEFT AREA: Interactive Canvas (Spans 3 Columns) */}
      <div className="xl:col-span-3 flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-100">
              <Network className="text-blue-500" size={22} /> Visual
              Drag-and-Drop Studio
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Add nodes, connect them, and capture frames.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-neutral-100 transition-colors bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg"
          >
            <Home size={14} /> Hub
          </Link>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Problem Title..."
          className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
        />

        {/* --- REACT FLOW CANVAS --- */}
        <div className="h-[400px] w-full bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            colorMode="dark"
          >
            <Background color="#333" gap={16} />
            <Controls />
          </ReactFlow>

          {/* Floating Canvas Toolbar */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <button
              onClick={addNode}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-100 px-3 py-1.5 rounded text-xs font-bold shadow-lg border border-neutral-700 transition-colors flex items-center gap-1"
            >
              <Plus size={14} /> Add Element
            </button>
          </div>
        </div>

        {/* Capture Frame Controls */}
        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex flex-col gap-3">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Frame Explanation
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={currentExplanation}
              onChange={(e) => setCurrentExplanation(e.target.value)}
              placeholder="e.g., Dragged Node 1 to the right to balance the tree..."
              className="flex-grow bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 focus:outline-none"
            />
            <button
              onClick={captureFrame}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-neutral-100 font-bold text-sm rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Camera size={16} /> Snapshot Frame
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT AREA: Timeline & Submission (Spans 2 Columns) */}
      <div className="xl:col-span-2 flex flex-col gap-6 border-t xl:border-t-0 xl:border-l border-neutral-800 pt-6 xl:pt-0 xl:pl-8">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-100">
            <Eye className="text-emerald-500" size={22} /> Animation Timeline
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Your captured frames are listed here.
          </p>
        </div>

        {/* Timeline Stack */}
        <div className="flex flex-col gap-3 flex-grow overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
          {steps.length === 0 ? (
            <div className="text-center py-12 text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl h-full flex flex-col items-center justify-center gap-2 bg-neutral-950/50">
              <Camera size={24} className="text-neutral-700" />
              <span>
                Canvas is unrecorded.
                <br />
                Arrange nodes and click "Snapshot Frame".
              </span>
            </div>
          ) : (
            steps.map((step, idx) => (
              <div
                key={idx}
                className="flex justify-between items-start bg-neutral-950 p-4 rounded-xl border border-neutral-800 gap-4 shadow-sm relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                <div className="text-xs flex flex-col gap-2 pl-2 w-full">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded border border-blue-900/50">
                      Frame {step.stepNumber}
                    </span>
                    <span className="text-neutral-500 font-mono">
                      {step.nodesSnapshot.length} Nodes |{" "}
                      {step.edgesSnapshot.length} Edges
                    </span>
                  </div>
                  <p className="text-neutral-300 italic text-[13px] leading-relaxed">
                    "{step.explanation}"
                  </p>
                </div>
                <button
                  onClick={() => removeStep(idx)}
                  className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Database Submission Button */}
        <div className="flex flex-col gap-3 bg-neutral-950 p-5 rounded-xl border border-neutral-800 mt-auto">
          <button
            onClick={submitToBackend}
            disabled={status === "loading" || steps.length === 0}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <Send size={16} />
            {status === "loading"
              ? "Transmitting..."
              : "Push to Moderator Queue"}
          </button>

          {/* Feedback Badges */}
          {status === "success" && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 p-3 rounded-lg font-medium">
              <CheckCircle2 size={16} /> {backendMessage}
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/50 p-3 rounded-lg font-medium">
              <AlertCircle size={16} /> {backendMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
