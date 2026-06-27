"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Eye,
  Send,
  CheckCircle2,
  AlertCircle,
  Home,
  Network,
  Camera,
  Palette,
  Type,
  BookOpen,
  Code2,
  ListStart,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize,
  Minimize,
  Grid,
  ArrowRight,
  GitCommit,
  Minus,
} from "lucide-react";
import {
  ReactFlow,
  ReactFlowProvider, // NEW: Required for camera tracking
  useReactFlow, // NEW: Hook to get camera position
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  MarkerType,
  Handle,
  Position,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// --- CUSTOM NODES ---

const ArrayNode = ({ data, selected }: any) => (
  <div
    className={`flex flex-col ${selected ? "ring-2 ring-blue-500 rounded-sm" : ""} bg-white transition-all`}
  >
    <div className="flex shadow-sm">
      {data.values.map((val: string, idx: number) => (
        <div key={idx} className="flex flex-col items-center">
          <span className="text-[11px] font-mono text-gray-500 mb-1">
            {idx}
          </span>
          <div
            className={`relative w-14 h-14 flex items-center justify-center border-y border-l last:border-r border-blue-300 bg-blue-50 text-sm font-mono font-bold text-gray-800`}
          >
            <Handle
              type="target"
              position={Position.Top}
              id={`top-${idx}`}
              className="!w-2 !h-2 !bg-blue-500 !border-none !-mt-1"
            />
            {val}
            <Handle
              type="source"
              position={Position.Bottom}
              id={`bot-${idx}`}
              className="!w-2 !h-2 !bg-blue-500 !border-none !-mb-1"
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ArrowNode = ({ selected, data }: any) => {
  const rotation = data.rotation || 0;
  return (
    <div
      className={`p-2 flex items-center justify-center ${selected ? "ring-2 ring-blue-400 rounded-lg bg-white/50" : ""}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke={data.color || "#64748b"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="2" x2="12" y2="22"></line>
        <polyline points="19 15 12 22 5 15"></polyline>
      </svg>
    </div>
  );
};

const nodeTypes = { arrayNode: ArrayNode, arrowNode: ArrowNode };

interface CreatorStep {
  stepNumber: number;
  explanation: string;
  nodesSnapshot: Node[];
  edgesSnapshot: Edge[];
}

// --- THE MAIN EDITOR CONTENT ---
function CreatorContent() {
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState("Find the Target Element");
  const [description, setDescription] = useState(
    "Use binary search to find the target. Return the index if found.",
  );

  const [activeTab, setActiveTab] = useState<"problem" | "solution">("problem");
  const [problemSteps, setProblemSteps] = useState<CreatorStep[]>([]);
  const [solutionSteps, setSolutionSteps] = useState<CreatorStep[]>([]);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const nodeIdCounter = useRef(0);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [currentExplanation, setCurrentExplanation] = useState("");

  // UI Features States
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewStepIndex, setPreviewStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [edgeType, setEdgeType] = useState<"default" | "straight">("default");

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [backendMessage, setBackendMessage] = useState("");

  const activeSteps = activeTab === "problem" ? problemSteps : solutionSteps;
  const setActiveSteps =
    activeTab === "problem" ? setProblemSteps : setSolutionSteps;

  // Camera Helper: Gets the exact center of the current view
  const getSpawnPosition = () => {
    if (!reactFlowWrapper.current) return { x: 100, y: 100 };
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    return screenToFlowPosition({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && activeSteps.length > 0) {
      interval = setInterval(() => {
        setPreviewStepIndex((prev) => {
          if (prev >= activeSteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeSteps.length]);

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
            type: edgeType,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
            style: { stroke: "#94a3b8", strokeWidth: 2 },
          },
          eds,
        ),
      ),
    [edgeType],
  );

  const onNodeClick = useCallback(
    (_: any, node: Node) => setSelectedNodeId(node.id),
    [],
  );
  const onPaneClick = useCallback(() => setSelectedNodeId(null), []);

  // Smart Deletion: Cleans up child array blocks if the parent tray is deleted
  const onNodesDelete = useCallback((deleted: Node[]) => {
    const deletedIds = deleted.map((n) => n.id);
    setNodes((nds) =>
      nds.filter((n) => !n.parentNode || !deletedIds.includes(n.parentNode)),
    );
  }, []);

  const toggleEdgeType = () => {
    const newType = edgeType === "default" ? "straight" : "default";
    setEdgeType(newType);
    setEdges((eds) => eds.map((e) => ({ ...e, type: newType }))); // Update existing lines instantly
  };

  const addNode = () => {
    setNodes((nds) => [
      ...nds,
      {
        id: `node-${nodeIdCounter.current++}`,
        position: getSpawnPosition(),
        data: { label: `${nodeIdCounter.current}` },
        style: {
          background: "#ffffff",
          color: "#111827",
          border: "2px solid #e5e7eb",
          borderRadius: "8px",
          fontWeight: "bold",
          width: 60,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
    ]);
  };

  const addArray = () => {
    const input = window.prompt("Enter length of the array (e.g., 5):");
    const length = parseInt(input || "0", 10);
    if (isNaN(length) || length <= 0) return;

    const initialValues = Array.from({ length }, (_, i) => i.toString());
    const parentId = `group-${nodeIdCounter.current++}`;
    const spawnPos = getSpawnPosition();

    const parentNode: Node = {
      id: parentId,
      position: { x: spawnPos.x - (length * 68) / 2, y: spawnPos.y - 30 },
      data: { label: "" },
      style: {
        width: length * 68 + 8,
        height: 76,
        background: "#f8fafc",
        border: "2px dashed #cbd5e1",
        borderRadius: "12px",
      },
      type: "group",
    };

    const childNodes: Node[] = initialValues.map((val, idx) => ({
      id: `node-${nodeIdCounter.current++}`,
      position: { x: 8 + idx * 68, y: 8 },
      parentNode: parentId,
      extent: "parent",
      draggable: false,
      data: { label: val },
      style: {
        background: "#ffffff",
        color: "#111827",
        border: "2px solid #e5e7eb",
        borderRadius: "8px",
        fontWeight: "bold",
        width: 60,
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    }));

    setNodes((nds) => [...nds, parentNode, ...childNodes]);
  };

  const addTextLabel = () => {
    const text = window.prompt("Enter text (e.g. 'left pointer'):");
    if (!text) return;
    setNodes((nds) => [
      ...nds,
      {
        id: `text-${nodeIdCounter.current++}`,
        position: getSpawnPosition(),
        data: { label: text },
        style: {
          background: "transparent",
          color: "#1d4ed8",
          border: "none",
          fontWeight: "bold",
          fontSize: "16px",
          padding: "4px",
          boxShadow: "none",
        },
      },
    ]);
  };

  const addStandaloneArrow = () => {
    setNodes((nds) => [
      ...nds,
      {
        id: `arrow-${nodeIdCounter.current++}`,
        type: "arrowNode",
        position: getSpawnPosition(),
        data: { rotation: 0, color: "#3b82f6" },
        style: { background: "transparent", border: "none", boxShadow: "none" },
      },
    ]);
  };

  const updateSelectedNode = (updates: Partial<Node>) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNodeId
          ? {
              ...n,
              ...updates,
              data: { ...n.data, ...(updates.data || {}) },
              style: { ...n.style, ...(updates.style || {}) },
            }
          : n,
      ),
    );
  };

  const captureFrame = () => {
    if (!currentExplanation.trim()) {
      alert("Please write an explanation for this animation frame.");
      return;
    }
    const newStep: CreatorStep = {
      stepNumber: activeSteps.length + 1,
      explanation: currentExplanation,
      nodesSnapshot: JSON.parse(JSON.stringify(nodes)),
      edgesSnapshot: JSON.parse(JSON.stringify(edges)),
    };
    setActiveSteps([...activeSteps, newStep]);
    setCurrentExplanation("");
  };

  const removeStep = (index: number) => {
    setActiveSteps(
      activeSteps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, stepNumber: i + 1 })),
    );
  };

  const confirmAndSubmit = async () => {
    setShowSubmitModal(false);
    setStatus("loading");
    setBackendMessage("Transmitting to database...");

    const finalJsonPayload = {
      title,
      initial_state: {
        type: "graph_or_tree",
        description,
        nodes: nodes,
        edges: edges,
      },
      steps: { problem: problemSteps, solution: solutionSteps },
    };

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

  const displayNodes =
    isPreviewMode && activeSteps.length > 0
      ? activeSteps[previewStepIndex].nodesSnapshot
      : nodes;
  const displayEdges =
    isPreviewMode && activeSteps.length > 0
      ? activeSteps[previewStepIndex].edgesSnapshot
      : edges;
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div
      className={`w-full grid grid-cols-1 xl:grid-cols-5 gap-8 p-6 bg-white shadow-sm relative ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : "rounded-2xl border border-gray-200"}`}
    >
      {showSubmitModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm rounded-2xl">
          <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 max-w-sm w-full flex flex-col gap-4 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900">
              Ready to submit?
            </h3>
            <p className="text-sm text-gray-600">
              Have you previewed your animation? Once submitted, it will go to
              the moderators for review.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Back to Editing
              </button>
              <button
                onClick={confirmAndSubmit}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex justify-center items-center gap-2 transition-colors"
              >
                <Send size={16} /> Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT AREA: Canvas */}
      <div
        className={`flex flex-col gap-5 ${isFullscreen ? "xl:col-span-4 h-full" : "xl:col-span-3"}`}
      >
        {!isFullscreen && (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                  <Network className="text-blue-600" size={22} /> Animation
                  Studio
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Design your problem description and interactive visualizer.
                </p>
              </div>
              <Link
                href="/"
                className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg"
              >
                <Home size={14} /> Hub
              </Link>
            </div>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Problem Title..."
                className="bg-white border border-gray-300 rounded-lg p-3 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
              />
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write the problem description here..."
                className="bg-white border border-gray-300 rounded-lg p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm resize-none"
              />
            </div>

            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => {
                  setActiveTab("problem");
                  setIsPreviewMode(false);
                }}
                className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === "problem" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
              >
                <BookOpen size={16} /> Problem Concept
              </button>
              <button
                onClick={() => {
                  setActiveTab("solution");
                  setIsPreviewMode(false);
                }}
                className={`flex-1 flex justify-center items-center gap-2 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === "solution" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500"}`}
              >
                <Code2 size={16} /> Code Solution
              </button>
            </div>
          </>
        )}

        {/* --- REACT FLOW CANVAS --- */}
        <div
          ref={reactFlowWrapper}
          className={`w-full rounded-xl border overflow-hidden relative shadow-inner ${isPreviewMode ? "bg-slate-900 border-slate-800" : "bg-gray-50 border-gray-200"} ${isFullscreen ? "flex-grow" : "h-[400px]"}`}
        >
          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            nodeTypes={nodeTypes}
            onNodesChange={!isPreviewMode ? onNodesChange : undefined}
            onEdgesChange={!isPreviewMode ? onEdgesChange : undefined}
            onConnect={!isPreviewMode ? onConnect : undefined}
            onNodeClick={!isPreviewMode ? onNodeClick : undefined}
            onPaneClick={!isPreviewMode ? onPaneClick : undefined}
            onNodesDelete={onNodesDelete}
            nodesDraggable={!isPreviewMode}
            nodesConnectable={!isPreviewMode}
            elementsSelectable={!isPreviewMode}
            snapToGrid={snapToGrid}
            snapGrid={[20, 20]}
            fitView
            colorMode={isPreviewMode ? "dark" : "light"}
          >
            <Background
              color={isPreviewMode ? "#475569" : "#cbd5e1"}
              gap={snapToGrid ? 20 : 16}
            />
            {!isPreviewMode && <Controls />}
          </ReactFlow>

          {/* EDIT MODE: Toolbar */}
          {!isPreviewMode && (
            <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 max-w-[70%]">
              <button
                onClick={addNode}
                className="bg-white text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-1"
              >
                <Plus size={14} /> Node
              </button>
              <button
                onClick={addArray}
                className="bg-white text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-1"
              >
                <ListStart size={14} /> Array
              </button>
              <button
                onClick={addTextLabel}
                className="bg-white text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-1"
              >
                <Type size={14} /> Text
              </button>
              <button
                onClick={addStandaloneArrow}
                className="bg-white text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-1"
              >
                <ArrowRight size={14} /> Arrow
              </button>

              <div className="w-[1px] h-6 bg-gray-300 mx-1 my-auto"></div>

              <button
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border flex items-center gap-1 transition-colors ${snapToGrid ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
              >
                <Grid size={14} /> Snap
              </button>
              <button
                onClick={toggleEdgeType}
                className="bg-white text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-1"
              >
                {edgeType === "default" ? (
                  <>
                    <GitCommit size={14} /> Curved
                  </>
                ) : (
                  <>
                    <Minus size={14} /> Straight
                  </>
                )}
              </button>
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="absolute bottom-4 left-4 z-10 bg-white text-gray-700 p-2 rounded-lg shadow-md border border-gray-200 hover:bg-gray-50"
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>

          {/* PREVIEW MODE: Explanation Overlay & Playback Controls */}
          {isPreviewMode && (
            <>
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => {
                    setIsPreviewMode(false);
                    setIsPlaying(false);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1"
                >
                  <X size={14} /> Exit Preview
                </button>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-sm border border-slate-700 p-4 rounded-xl shadow-2xl flex flex-col gap-3 min-w-[300px]">
                <div className="text-sm text-white text-center font-medium">
                  {activeSteps.length > 0
                    ? activeSteps[previewStepIndex].explanation
                    : "Timeline is empty."}
                </div>
                <div className="flex justify-center items-center gap-4">
                  <button
                    onClick={() =>
                      setPreviewStepIndex((i) => Math.max(0, i - 1))
                    }
                    className="text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-blue-500 hover:bg-blue-400 text-white p-3 rounded-full shadow-md"
                  >
                    {isPlaying ? (
                      <Pause size={18} fill="currentColor" />
                    ) : (
                      <Play size={18} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      setPreviewStepIndex((i) =>
                        Math.min(activeSteps.length - 1, i + 1),
                      )
                    }
                    className="text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Floating Node Editor Toolbar */}
          {!isPreviewMode && selectedNode && selectedNode.type !== "group" && (
            <div className="absolute top-4 right-4 z-10 bg-white p-3 rounded-xl shadow-lg border border-gray-200 flex flex-col gap-3 w-48 animate-fade-in max-h-[350px] overflow-y-auto custom-scrollbar">
              {selectedNode.type === "arrayNode" ? (
                <>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Edit Array Values
                  </span>
                  <div className="flex flex-col gap-2">
                    {selectedNode.data.values.map(
                      (val: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <label className="text-[10px] font-mono text-gray-500 w-5">
                            [{idx}]
                          </label>
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => {
                              const newVals = [
                                ...(selectedNode.data.values as string[]),
                              ];
                              newVals[idx] = e.target.value;
                              updateSelectedNode({
                                data: { ...selectedNode.data, values: newVals },
                              });
                            }}
                            className="w-full text-xs p-1.5 border border-gray-300 rounded bg-gray-50 focus:outline-none"
                          />
                        </div>
                      ),
                    )}
                  </div>
                </>
              ) : selectedNode.type === "arrowNode" ? (
                <>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Edit Arrow
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-500">
                      Rotation Degrees
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={selectedNode.data.rotation || 0}
                      onChange={(e) =>
                        updateSelectedNode({
                          data: {
                            ...selectedNode.data,
                            rotation: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    <button
                      onClick={() =>
                        updateSelectedNode({
                          data: { ...selectedNode.data, color: "#64748b" },
                        })
                      }
                      className="w-full aspect-square rounded-md bg-slate-500"
                    ></button>
                    <button
                      onClick={() =>
                        updateSelectedNode({
                          data: { ...selectedNode.data, color: "#3b82f6" },
                        })
                      }
                      className="w-full aspect-square rounded-md bg-blue-500"
                    ></button>
                    <button
                      onClick={() =>
                        updateSelectedNode({
                          data: { ...selectedNode.data, color: "#22c55e" },
                        })
                      }
                      className="w-full aspect-square rounded-md bg-green-500"
                    ></button>
                    <button
                      onClick={() =>
                        updateSelectedNode({
                          data: { ...selectedNode.data, color: "#ef4444" },
                        })
                      }
                      className="w-full aspect-square rounded-md bg-red-500"
                    ></button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Edit Component
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={(selectedNode.data.label as string) || ""}
                      onChange={(e) =>
                        updateSelectedNode({ data: { label: e.target.value } })
                      }
                      className="w-full text-xs p-1.5 border border-gray-300 rounded bg-gray-50 focus:outline-none"
                      placeholder="Label text..."
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      onClick={() =>
                        updateSelectedNode({
                          style: {
                            background: "#ffffff",
                            color: "#111827",
                            borderColor: "#e5e7eb",
                          },
                        })
                      }
                      className="w-full aspect-square rounded-md bg-white border-2 border-gray-200"
                    ></button>
                    <button
                      onClick={() =>
                        updateSelectedNode({
                          style: {
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            borderColor: "#bfdbfe",
                          },
                        })
                      }
                      className="w-full aspect-square rounded-md bg-blue-50 border-2 border-blue-200"
                    ></button>
                    <button
                      onClick={() =>
                        updateSelectedNode({
                          style: {
                            background: "#f0fdf4",
                            color: "#15803d",
                            borderColor: "#bbf7d0",
                          },
                        })
                      }
                      className="w-full aspect-square rounded-md bg-green-50 border-2 border-green-200"
                    ></button>
                    <button
                      onClick={() =>
                        updateSelectedNode({
                          style: {
                            background: "#fef2f2",
                            color: "#b91c1c",
                            borderColor: "#fecaca",
                          },
                        })
                      }
                      className="w-full aspect-square rounded-md bg-red-50 border-2 border-red-200"
                    ></button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Capture Frame Form */}
        <div
          className={`bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3 transition-opacity ${isFullscreen ? "absolute bottom-6 left-1/2 -translate-x-1/2 w-[80%] max-w-4xl shadow-2xl z-40 bg-white/90 backdrop-blur-md" : "flex-col"}`}
          style={{
            opacity: isPreviewMode ? 0 : 1,
            pointerEvents: isPreviewMode ? "none" : "auto",
          }}
        >
          {!isFullscreen && (
            <label className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
              Describe this Animation Frame
            </label>
          )}
          <div className="flex gap-3 w-full">
            <input
              type="text"
              value={currentExplanation}
              onChange={(e) => setCurrentExplanation(e.target.value)}
              placeholder="e.g., The left pointer shifts to index 2..."
              className="flex-grow bg-white border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            />
            <button
              onClick={captureFrame}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg flex items-center gap-2 shadow-sm"
            >
              <Camera size={16} /> Capture
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT AREA: Timeline & Submission (Hidden in Fullscreen) */}
      {!isFullscreen && (
        <div className="xl:col-span-2 flex flex-col gap-6 border-t xl:border-t-0 xl:border-l border-gray-200 pt-6 xl:pt-0 xl:pl-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <Eye
                  className={
                    activeTab === "problem"
                      ? "text-blue-600"
                      : "text-emerald-600"
                  }
                  size={22}
                />
                {activeTab === "problem"
                  ? "Concept Timeline"
                  : "Solution Timeline"}
              </h2>
            </div>
            <button
              onClick={() => {
                setIsPreviewMode(!isPreviewMode);
                setPreviewStepIndex(0);
                setIsPlaying(false);
              }}
              disabled={activeSteps.length === 0}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${isPreviewMode ? "bg-gray-900 text-white border-gray-900 shadow-md" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 disabled:opacity-50"}`}
            >
              {isPreviewMode ? "Exit Preview" : "Preview Animation"}
            </button>
          </div>

          <div className="flex flex-col gap-3 flex-grow overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {activeSteps.length === 0 ? (
              <div className="text-center py-12 text-xs text-gray-400 border border-dashed border-gray-300 rounded-xl h-full flex flex-col items-center justify-center gap-2 bg-gray-50">
                <Camera size={24} className="text-gray-300" />
                <span>
                  Timeline is empty.
                  <br />
                  Arrange elements and click "Capture".
                </span>
              </div>
            ) : (
              activeSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`flex justify-between items-start p-4 rounded-xl border gap-4 shadow-sm relative overflow-hidden transition-all ${isPreviewMode && previewStepIndex === idx ? "bg-blue-50 border-blue-200 ring-1 ring-blue-300" : "bg-white border-gray-200"}`}
                >
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${activeTab === "problem" ? "bg-blue-500" : "bg-emerald-500"}`}
                  />
                  <div className="text-xs flex flex-col gap-2 pl-2 w-full">
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-bold px-2 py-0.5 rounded border ${activeTab === "problem" ? "text-blue-700 bg-blue-50 border-blue-100" : "text-emerald-700 bg-emerald-50 border-emerald-100"}`}
                      >
                        Frame {step.stepNumber}
                      </span>
                    </div>
                    <p className="text-gray-700 italic text-[13px] leading-relaxed">
                      "{step.explanation}"
                    </p>
                  </div>
                  {!isPreviewMode && (
                    <button
                      onClick={() => removeStep(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-3 bg-gray-50 p-5 rounded-xl border border-gray-200 mt-auto">
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={
                status === "loading" ||
                (problemSteps.length === 0 && solutionSteps.length === 0)
              }
              className="w-full py-3.5 bg-gray-900 hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Send size={16} />{" "}
              {status === "loading"
                ? "Transmitting..."
                : "Push to Moderator Queue"}
            </button>
            {status === "success" && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg font-medium">
                <CheckCircle2 size={16} /> {backendMessage}
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg font-medium">
                <AlertCircle size={16} /> {backendMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// WRAPPER: Exposes the ReactFlowProvider so we can use useReactFlow() inside CreatorContent
export default function ProblemCreatorWrapper() {
  return (
    <ReactFlowProvider>
      <CreatorContent />
    </ReactFlowProvider>
  );
}
