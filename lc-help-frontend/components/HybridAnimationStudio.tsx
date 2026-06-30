"use client";

import { useState, useEffect } from "react";
// Import the Wasm initializer and the exported function from the Rust pkg
import initWasm, { execute_dry_run } from "../wasm/lc_animation_engine";

interface NodeState {
  id: string;
  status: string;
}

interface AnimationFrame {
  step: number;
  description: string;
  nodes: NodeState[];
  queue: string[];
}

export default function HybridAnimationStudio() {
  const [timeline, setTimeline] = useState<AnimationFrame[]>([]);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [userScript, setUserScript] = useState("start_bfs(Node A);");

  // 1. Boot up the Wasm module when the component mounts
  useEffect(() => {
    async function loadEngine() {
      try {
        await initWasm();
        setIsEngineReady(true);
      } catch (err) {
        console.error("Failed to load Rust Wasm Engine:", err);
      }
    }
    loadEngine();
  }, []);

  // 2. Execute the Rust code whenever the user clicks "Run"
  const handleCompile = () => {
    if (!isEngineReady) return;

    // Call the Rust function across the FFI boundary
    const jsonResult = execute_dry_run(userScript);

    // Parse the JSON string back into a JavaScript object
    const generatedTimeline = JSON.parse(jsonResult);
    setTimeline(generatedTimeline);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6 font-mono">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Wasm Animation Engine</h2>
        <span
          className={`px-3 py-1 rounded-full text-xs ${isEngineReady ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
        >
          {isEngineReady ? "Engine Ready" : "Booting..."}
        </span>
      </div>

      <div className="flex gap-4">
        <textarea
          value={userScript}
          onChange={(e) => setUserScript(e.target.value)}
          className="w-1/2 h-48 p-4 bg-neutral-900 border border-neutral-700 rounded-xl text-neutral-300 resize-none"
          placeholder="Write traversal script here..."
        />

        <div className="w-1/2 p-4 bg-neutral-900 border border-neutral-700 rounded-xl overflow-y-auto h-48 text-sm text-blue-400">
          <pre>{JSON.stringify(timeline, null, 2)}</pre>
        </div>
      </div>

      <button
        onClick={handleCompile}
        disabled={!isEngineReady}
        className="w-full py-3 bg-neutral-100 text-neutral-950 font-bold rounded-xl hover:bg-neutral-300 disabled:opacity-50 transition-colors"
      >
        Compile & Generate Timeline
      </button>

      {/* From here, you would map `timeline` to your Framer Motion or React Flow UI */}
    </div>
  );
}
