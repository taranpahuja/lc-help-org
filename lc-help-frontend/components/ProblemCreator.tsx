"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  Home,
  Network,
  Camera,
  Type,
  BookOpen,
  Code2,
  ListStart,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  GitCommit,
  Minus,
  SkipBack,
  MousePointer2,
  Hand,
} from "lucide-react";
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  MarkerType,
  Handle,
  Position,
  SelectionMode,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// 🎯 WASM ENGINE IMPORT
// 🎯 WASM ENGINE IMPORT
import initWasm, { execute_dry_run } from "../wasm/lc_animation_engine.js";

// --- CUSTOM NODES ---

const ArrayNode = ({ data, selected }: any) => (
  <div
    className={`flex flex-col cursor-move ${selected ? "ring-4 ring-blue-500 rounded-sm" : ""} bg-transparent transition-all`}
  >
    <div className="flex shadow-sm">
      {data.values.map((val: string, idx: number) => (
        <div key={idx} className="flex flex-col items-center">
          <span className="text-[12px] font-mono text-gray-600 mb-1">
            {idx}
          </span>
          <div
            className={`relative w-14 h-14 flex items-center justify-center border-y border-l ${idx === data.values.length - 1 ? "border-r" : ""} border-[#5fa4d4] bg-[#7ba8d2] text-sm font-mono font-bold text-gray-900`}
          >
            <Handle
              type="target"
              position={Position.Top}
              id={`top-${idx}`}
              className="!w-2 !h-2 !bg-blue-600 !border-2 !border-white !-mt-1 opacity-0 hover:opacity-100 transition-opacity"
            />
            {val}
            <Handle
              type="source"
              position={Position.Bottom}
              id={`bot-${idx}`}
              className="!w-2 !h-2 !bg-blue-600 !border-2 !border-white !-mb-1 opacity-0 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TextNode = ({ data, selected }: any) => (
  <div
    className={`p-3 min-w-[120px] bg-white border ${selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300"} shadow-sm text-gray-900 font-medium text-center cursor-move whitespace-pre-wrap`}
  >
    <Handle
      type="target"
      position={Position.Left}
      className="!w-2 !h-2 !bg-blue-600 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
    />
    {data.label}
    <Handle
      type="source"
      position={Position.Right}
      className="!w-2 !h-2 !bg-blue-600 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
    />
  </div>
);

const ArrowNode = ({ selected, data }: any) => {
  const rotation = data.rotation || 0;
  return (
    <div
      className={`p-2 flex items-center justify-center cursor-move ${selected ? "ring-2 ring-blue-400 rounded-lg bg-white/50" : ""}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
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
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
};

const nodeTypes = {
  arrayNode: ArrayNode,
  textNode: TextNode,
  arrowNode: ArrowNode,
};

interface CreatorStep {
  stepNumber: number;
  explanation: string;
  nodesSnapshot: Node[];
  edgesSnapshot: Edge[];
}

export default function ProblemCreator() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

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

  // UI States
  const [currentExplanation, setCurrentExplanation] = useState("");
  const [previewStepIndex, setPreviewStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [interactionTool, setInteractionTool] = useState<"pan" | "select">(
    "select",
  );
  const [edgeType, setEdgeType] = useState<"default" | "straight">("default");
  const [isAltPressed, setIsAltPressed] = useState(false);

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    id: string;
    top: number;
    left: number;
  } | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [backendMessage, setBackendMessage] = useState("");

  const activeSteps = activeTab === "problem" ? problemSteps : solutionSteps;
  const setActiveSteps =
    activeTab === "problem" ? setProblemSteps : setSolutionSteps;

  // 🎯 WASM ENGINE STATES
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [userScript, setUserScript] = useState("start_bfs(Node A);");
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  // 🎯 BOOT WASM ENGINE ON MOUNT
  useEffect(() => {
    async function loadEngine() {
      try {
        await initWasm();
        setIsEngineReady(true);
      } catch (err) {
        console.error("Failed to load Wasm Engine:", err);
      }
    }
    loadEngine();
  }, []);

  const getSpawnPosition = () => {
    if (!rfInstance || !reactFlowWrapper.current) return { x: 100, y: 100 };
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    return rfInstance.screenToFlowPosition({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") setIsAltPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Alt") setIsAltPressed(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

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

  const onNodeContextMenu = useCallback((event: any, node: Node) => {
    event.preventDefault();
    if (!reactFlowWrapper.current) return;
    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    setContextMenu({
      id: node.id,
      top: event.clientY - bounds.top,
      left: event.clientX - bounds.left,
    });
  }, []);

  const onPaneClick = useCallback(() => setContextMenu(null), []);
  const onNodesDelete = useCallback(() => setContextMenu(null), []);

  const toggleEdgeType = () => {
    const newType = edgeType === "default" ? "straight" : "default";
    setEdgeType(newType);
    setEdges((eds) => eds.map((e) => ({ ...e, type: newType })));
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
          cursor: "move",
        },
      },
    ]);
  };

  const addArray = () => {
    const input = window.prompt("Enter length of the array (e.g., 5):");
    const length = parseInt(input || "0", 10);
    if (isNaN(length) || length <= 0) return;

    const initialValues = Array.from({ length }, (_, i) => i.toString());
    const spawnPos = getSpawnPosition();

    setNodes((nds) => [
      ...nds,
      {
        id: `array-${nodeIdCounter.current++}`,
        type: "arrayNode",
        position: { x: spawnPos.x - (length * 56) / 2, y: spawnPos.y - 30 },
        data: { values: initialValues },
      },
    ]);
  };

  const addTextLabel = () => {
    const text = window.prompt("Enter text (e.g. 'left pointer'):");
    if (!text) return;
    setNodes((nds) => [
      ...nds,
      {
        id: `text-${nodeIdCounter.current++}`,
        type: "textNode",
        position: getSpawnPosition(),
        data: { label: text },
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
      },
    ]);
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
    setPreviewStepIndex(activeSteps.length);
  };

  // 🎯 WASM COMPILE TO TIMELINE
  const handleCompileScript = () => {
    if (!isEngineReady) return;

    try {
      const jsonResult = execute_dry_run(userScript);
      const generatedFrames = JSON.parse(jsonResult);

      const spawnPos = getSpawnPosition();

      const mappedSteps: CreatorStep[] = generatedFrames.map((frame: any) => ({
        stepNumber: frame.step + 1,
        explanation: frame.description,
        nodesSnapshot: frame.nodes.map((n: any, i: number) => ({
          id: n.id,
          position: { x: spawnPos.x + i * 80, y: spawnPos.y }, // Spread them out slightly
          data: { label: n.id },
          type: "textNode",
          style: {
            background:
              n.status === "visited"
                ? "#f0fdf4"
                : n.status === "queued"
                  ? "#eff6ff"
                  : "#ffffff",
            color:
              n.status === "visited"
                ? "#15803d"
                : n.status === "queued"
                  ? "#1d4ed8"
                  : "#111827",
            borderColor:
              n.status === "visited"
                ? "#bbf7d0"
                : n.status === "queued"
                  ? "#bfdbfe"
                  : "#e5e7eb",
            border: "2px solid",
            borderRadius: "8px",
            fontWeight: "bold",
            width: 60,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "move",
          },
        })),
        edgesSnapshot: [],
      }));

      setActiveSteps(mappedSteps);
      setPreviewStepIndex(0);
    } catch (err) {
      console.error("Compilation failed:", err);
      alert("Script compilation failed. Check console for details.");
    }
  };

  const removeStep = (index: number) => {
    setActiveSteps(
      activeSteps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, stepNumber: i + 1 })),
    );
    setPreviewStepIndex(0);
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

  const editingNode = nodes.find((n) => n.id === editingNodeId);

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col gap-10 p-6 lg:p-10 pb-32 max-w-screen-2xl mx-auto">
      <style>{`
        .preview-player .react-flow__handle { display: none !important; }
        .react-flow__nodesselection-rect { display: none !important; }
      `}</style>

      {/* OVERLAY: Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
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
                <Send size={16} /> Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: Edit Node Properties Modal */}
      {editingNodeId && editingNode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 w-[300px] flex flex-col gap-4 animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              Edit Properties
            </h3>

            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {editingNode.type === "arrayNode" ? (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Array Values
                  </p>
                  {editingNode.data.values.map((val: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <label className="text-sm font-mono text-gray-500 w-8">
                        [{idx}]
                      </label>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => {
                          const newVals = [
                            ...(editingNode.data.values as string[]),
                          ];
                          newVals[idx] = e.target.value;
                          setNodes((nds) =>
                            nds.map((n) =>
                              n.id === editingNodeId
                                ? { ...n, data: { ...n.data, values: newVals } }
                                : n,
                            ),
                          );
                        }}
                        className="flex-grow text-sm p-2 border border-gray-300 rounded bg-gray-50 focus:outline-none"
                      />
                    </div>
                  ))}
                </>
              ) : editingNode.type === "textNode" ? (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Text Box
                  </p>
                  <textarea
                    value={(editingNode.data.label as string) || ""}
                    onChange={(e) =>
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === editingNodeId
                            ? {
                                ...n,
                                data: { ...n.data, label: e.target.value },
                              }
                            : n,
                        ),
                      )
                    }
                    className="w-full text-sm p-2 border border-gray-300 rounded bg-gray-50 focus:outline-none"
                    rows={3}
                  />
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <button
                      onClick={() =>
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === editingNodeId
                              ? {
                                  ...n,
                                  style: {
                                    ...n.style,
                                    background: "#ffffff",
                                    color: "#111827",
                                    borderColor: "#e5e7eb",
                                  },
                                }
                              : n,
                          ),
                        )
                      }
                      className="w-full aspect-square rounded-md bg-white border-2 border-gray-200 hover:scale-110 transition-transform"
                    ></button>
                    <button
                      onClick={() =>
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === editingNodeId
                              ? {
                                  ...n,
                                  style: {
                                    ...n.style,
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    borderColor: "#bfdbfe",
                                  },
                                }
                              : n,
                          ),
                        )
                      }
                      className="w-full aspect-square rounded-md bg-blue-50 border-2 border-blue-200 hover:scale-110 transition-transform"
                    ></button>
                    <button
                      onClick={() =>
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === editingNodeId
                              ? {
                                  ...n,
                                  style: {
                                    ...n.style,
                                    background: "#f0fdf4",
                                    color: "#15803d",
                                    borderColor: "#bbf7d0",
                                  },
                                }
                              : n,
                          ),
                        )
                      }
                      className="w-full aspect-square rounded-md bg-green-50 border-2 border-green-200 hover:scale-110 transition-transform"
                    ></button>
                    <button
                      onClick={() =>
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === editingNodeId
                              ? {
                                  ...n,
                                  style: {
                                    ...n.style,
                                    background: "#fef2f2",
                                    color: "#b91c1c",
                                    borderColor: "#fecaca",
                                  },
                                }
                              : n,
                          ),
                        )
                      }
                      className="w-full aspect-square rounded-md bg-red-50 border-2 border-red-200 hover:scale-110 transition-transform"
                    ></button>
                  </div>
                </>
              ) : editingNode.type === "arrowNode" ? (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Rotation & Color
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={editingNode.data.rotation || 0}
                    onChange={(e) =>
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === editingNodeId
                            ? {
                                ...n,
                                data: {
                                  ...n.data,
                                  rotation: Number(e.target.value),
                                },
                              }
                            : n,
                        ),
                      )
                    }
                    className="w-full"
                  />
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {["#64748b", "#3b82f6", "#22c55e", "#ef4444"].map(
                      (color) => (
                        <button
                          key={color}
                          onClick={() =>
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === editingNodeId
                                  ? { ...n, data: { ...n.data, color } }
                                  : n,
                              ),
                            )
                          }
                          className="w-full aspect-square rounded-md shadow-sm border border-black/10 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        ></button>
                      ),
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Component Settings
                  </p>
                  <input
                    type="text"
                    value={(editingNode.data.label as string) || ""}
                    onChange={(e) =>
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === editingNodeId
                            ? {
                                ...n,
                                data: { ...n.data, label: e.target.value },
                              }
                            : n,
                        ),
                      )
                    }
                    className="w-full text-sm p-2 border border-gray-300 rounded bg-gray-50 focus:outline-none"
                  />
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <button
                      onClick={() =>
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === editingNodeId
                              ? {
                                  ...n,
                                  style: {
                                    ...n.style,
                                    background: "#ffffff",
                                    color: "#111827",
                                    borderColor: "#e5e7eb",
                                  },
                                }
                              : n,
                          ),
                        )
                      }
                      className="w-full aspect-square rounded-md bg-white border-2 border-gray-200 hover:scale-110 transition-transform"
                    ></button>
                    <button
                      onClick={() =>
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === editingNodeId
                              ? {
                                  ...n,
                                  style: {
                                    ...n.style,
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    borderColor: "#bfdbfe",
                                  },
                                }
                              : n,
                          ),
                        )
                      }
                      className="w-full aspect-square rounded-md bg-blue-50 border-2 border-blue-200 hover:scale-110 transition-transform"
                    ></button>
                    <button
                      onClick={() =>
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === editingNodeId
                              ? {
                                  ...n,
                                  style: {
                                    ...n.style,
                                    background: "#f0fdf4",
                                    color: "#15803d",
                                    borderColor: "#bbf7d0",
                                  },
                                }
                              : n,
                          ),
                        )
                      }
                      className="w-full aspect-square rounded-md bg-green-50 border-2 border-green-200 hover:scale-110 transition-transform"
                    ></button>
                    <button
                      onClick={() =>
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === editingNodeId
                              ? {
                                  ...n,
                                  style: {
                                    ...n.style,
                                    background: "#fef2f2",
                                    color: "#b91c1c",
                                    borderColor: "#fecaca",
                                  },
                                }
                              : n,
                          ),
                        )
                      }
                      className="w-full aspect-square rounded-md bg-red-50 border-2 border-red-200 hover:scale-110 transition-transform"
                    ></button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setEditingNodeId(null)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg mt-2 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: HEADER & INFO */}
      <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
              <Network className="text-blue-600" size={30} /> Algorithm Creator
              Studio
            </h2>
            <p className="text-base text-gray-500 mt-2">
              Hold{" "}
              <kbd className="bg-gray-100 border px-1.5 rounded text-gray-700">
                Alt
              </kbd>{" "}
              to disable snapping. Right-click elements to edit. Backspace to
              delete.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors bg-gray-50 border border-gray-200 px-5 py-2.5 rounded-lg"
          >
            <Home size={18} /> Hub
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Problem Title..."
            className="lg:w-1/3 bg-white border border-gray-300 rounded-xl p-4 text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write the problem description here..."
            className="lg:w-2/3 bg-white border border-gray-300 rounded-xl p-4 text-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
          />
        </div>

        {/* 🎯 WASM SCRIPT ENGINE TOGGLE */}
        <div className="flex justify-end mt-2">
          <button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Code2 size={18} />
            {showCodeEditor
              ? "Hide Script Engine"
              : "Open Script Engine (Wasm)"}
          </button>
        </div>

        {/* 🎯 WASM EDITOR PANEL */}
        {showCodeEditor && (
          <div className="flex flex-col gap-3 p-5 mt-2 bg-slate-100 rounded-2xl border border-slate-300 shadow-inner">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Algorithm Script Editor
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${isEngineReady ? "bg-emerald-200 text-emerald-800" : "bg-red-200 text-red-800"}`}
              >
                {isEngineReady ? "Engine Ready" : "Booting..."}
              </span>
            </div>
            <div className="flex flex-col lg:flex-row gap-4">
              <textarea
                value={userScript}
                onChange={(e) => setUserScript(e.target.value)}
                placeholder="Write traversal script here... e.g. start_bfs();"
                className="flex-grow h-40 p-4 bg-slate-900 text-emerald-400 font-mono rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm shadow-inner"
              />
              <button
                onClick={handleCompileScript}
                disabled={!isEngineReady}
                className="lg:w-48 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center text-center shadow-md"
              >
                Compile to Timeline
              </button>
            </div>
          </div>
        )}

        <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200 w-full lg:w-1/2">
          <button
            onClick={() => {
              setActiveTab("problem");
              setPreviewStepIndex(0);
              setIsPlaying(false);
            }}
            className={`flex-1 flex justify-center items-center gap-2 py-3 text-base font-semibold rounded-lg transition-all ${activeTab === "problem" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <BookOpen size={18} /> Concept Animation
          </button>
          <button
            onClick={() => {
              setActiveTab("solution");
              setPreviewStepIndex(0);
              setIsPlaying(false);
            }}
            className={`flex-1 flex justify-center items-center gap-2 py-3 text-base font-semibold rounded-lg transition-all ${activeTab === "solution" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Code2 size={18} /> Solution Animation
          </button>
        </div>
      </div>

      {/* SECTION 2: THE GIANT CANVAS */}
      <div className="w-full flex flex-col shadow-sm">
        {/* Main Canvas Space */}
        <div
          ref={reactFlowWrapper}
          className="w-full h-[70vh] min-h-[600px] bg-white rounded-t-2xl border border-gray-200 overflow-hidden relative"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onInit={setRfInstance}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            onNodeContextMenu={onNodeContextMenu}
            onNodesDelete={onNodesDelete}
            snapToGrid={!isAltPressed}
            snapGrid={[20, 20]}
            panOnDrag={interactionTool === "pan"}
            selectionOnDrag={interactionTool === "select"}
            selectionMode={SelectionMode.Partial}
            panOnScroll={true}
            fitView
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background color="#cbd5e1" gap={!isAltPressed ? 20 : 16} />
            <Controls className="bg-white shadow-xl border-2 border-gray-200 rounded-lg overflow-hidden [&>button]:!bg-white [&>button]:!text-gray-900 [&>button]:!border-b [&>button]:!border-gray-200 hover:[&>button]:!bg-gray-100 [&>button>svg]:fill-gray-700" />
          </ReactFlow>

          {/* Top Editing Toolbar */}
          <div className="absolute top-6 left-6 z-10 flex flex-wrap gap-3">
            <div className="flex bg-white rounded-xl border border-gray-200 shadow-md p-1">
              <button
                onClick={addNode}
                className="text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
              >
                <Plus size={16} /> Node
              </button>
              <button
                onClick={addArray}
                className="text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
              >
                <ListStart size={16} /> Array
              </button>
              <button
                onClick={addTextLabel}
                className="text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
              >
                <Type size={16} /> Text Box
              </button>
              <button
                onClick={addStandaloneArrow}
                className="text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
              >
                <ArrowRight size={16} /> Arrow
              </button>
            </div>

            <div className="flex bg-white rounded-xl border border-gray-200 shadow-md p-1">
              <button
                onClick={() => setInteractionTool("select")}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${interactionTool === "select" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <MousePointer2 size={16} /> Select
              </button>
              <button
                onClick={() => setInteractionTool("pan")}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${interactionTool === "pan" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <Hand size={16} /> Pan
              </button>
            </div>

            <div className="flex bg-white rounded-xl border border-gray-200 shadow-md p-1">
              <button
                onClick={toggleEdgeType}
                className="text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 flex items-center gap-2"
              >
                {edgeType === "default" ? (
                  <>
                    <GitCommit size={16} /> Curved Edge
                  </>
                ) : (
                  <>
                    <Minus size={16} /> Straight Edge
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right-Click Context Menu Overlay */}
          {contextMenu && (
            <div
              className="absolute z-50 bg-white border border-gray-200 shadow-xl rounded-lg py-2 min-w-[150px] animate-fade-in"
              style={{ top: contextMenu.top, left: contextMenu.left }}
            >
              <button
                onClick={() => {
                  setEditingNodeId(contextMenu.id);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-semibold"
              >
                Edit Properties...
              </button>
              <button
                onClick={() => {
                  setNodes((nds) => nds.filter((n) => n.id !== contextMenu.id));
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-semibold"
              >
                Delete Element
              </button>
            </div>
          )}
        </div>

        {/* The Action/Capture Bar Below Canvas */}
        <div className="bg-blue-50 p-6 rounded-b-2xl border-x border-b border-blue-200 flex items-center gap-4 shadow-sm">
          <Camera size={28} className="text-blue-500 shrink-0" />
          <input
            type="text"
            value={currentExplanation}
            onChange={(e) => setCurrentExplanation(e.target.value)}
            placeholder="Describe this animation frame (e.g. 'Pointer moves to index 2...')"
            className="flex-grow bg-white border-2 border-blue-200 rounded-xl p-4 text-lg font-extrabold text-black focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-sm placeholder:font-normal placeholder:text-gray-400"
          />
          <button
            onClick={captureFrame}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl flex items-center gap-2 whitespace-nowrap shadow-md transition-all"
          >
            <Camera size={20} /> Capture Frame
          </button>
        </div>
      </div>

      {/* SECTION 3: PREVIEW & TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 min-h-[600px] w-full">
        {/* Left: Preview Player */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-8 py-5">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Play size={20} className="text-blue-600" /> Preview & Playback
            </h3>
          </div>

          <div className="flex-grow relative bg-slate-900 w-full h-full min-h-[400px]">
            <ReactFlow
              nodes={
                activeSteps.length > 0
                  ? activeSteps[previewStepIndex].nodesSnapshot
                  : []
              }
              edges={
                activeSteps.length > 0
                  ? activeSteps[previewStepIndex].edgesSnapshot
                  : []
              }
              nodeTypes={nodeTypes}
              fitView
              panOnDrag={false}
              zoomOnScroll={false}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              colorMode="dark"
              className="preview-player"
            >
              <Background color="#475569" gap={16} />
            </ReactFlow>

            <div className="absolute bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 p-6 flex flex-col gap-4">
              <div className="text-base text-white text-center font-medium line-clamp-2 px-6">
                {activeSteps.length > 0
                  ? activeSteps[previewStepIndex].explanation
                  : "Add frames to preview animation."}
              </div>
              <div className="flex justify-center items-center gap-8">
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setPreviewStepIndex(0);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <SkipBack size={24} />
                </button>
                <button
                  onClick={() => setPreviewStepIndex((i) => Math.max(0, i - 1))}
                  className="text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-blue-500 hover:bg-blue-400 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105"
                >
                  {isPlaying ? (
                    <Pause size={24} fill="currentColor" />
                  ) : (
                    <Play size={24} fill="currentColor" className="ml-1" />
                  )}
                </button>
                <button
                  onClick={() =>
                    setPreviewStepIndex((i) =>
                      Math.min(activeSteps.length - 1, i + 1),
                    )
                  }
                  className="text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={28} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Captured Frames List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-5 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">
              Captured Frames ({activeSteps.length})
            </h3>

            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={
                status === "loading" ||
                (problemSteps.length === 0 && solutionSteps.length === 0)
              }
              className="px-6 py-2.5 bg-gray-900 hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Send size={16} /> Submit Sequence
            </button>
          </div>

          <div className="flex flex-col gap-4 flex-grow overflow-y-auto custom-scrollbar p-6 bg-gray-50/50">
            {activeSteps.length === 0 ? (
              <div className="text-center py-20 text-base text-gray-400 italic flex flex-col items-center gap-4">
                <Camera size={40} className="text-gray-300" />
                No frames recorded for this timeline yet.
              </div>
            ) : (
              activeSteps.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setPreviewStepIndex(idx);
                    setIsPlaying(false);
                  }}
                  className={`flex justify-between items-start p-5 rounded-xl border gap-4 cursor-pointer transition-all ${previewStepIndex === idx ? "bg-blue-50 border-blue-300 shadow-md ring-2 ring-blue-300" : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"}`}
                >
                  <div className="text-sm flex flex-col pl-2 w-full">
                    <span className="font-extrabold text-gray-800 text-base">
                      Frame {step.stepNumber}
                    </span>
                    <p className="text-gray-600 italic mt-1.5 leading-relaxed">
                      "{step.explanation}"
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStep(idx);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Status Indicators */}
          {(status === "success" || status === "error") && (
            <div className="p-5 border-t border-gray-200 bg-white">
              {status === "success" && (
                <div className="flex items-center gap-2 text-base text-emerald-700 bg-emerald-50 border border-emerald-200 p-4 rounded-xl font-medium">
                  <CheckCircle2 size={20} /> {backendMessage}
                </div>
              )}
              {status === "error" && (
                <div className="flex items-center gap-2 text-base text-red-700 bg-red-50 border border-red-200 p-4 rounded-xl font-medium">
                  <AlertCircle size={20} /> {backendMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
