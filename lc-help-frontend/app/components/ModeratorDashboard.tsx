"use client";

import { useState, useEffect } from "react";
import { Shield, RefreshCw, CheckCircle, XCircle } from "lucide-react";

interface DatabaseProblem {
  id: number;
  title: String;
  initial_state: any;
  steps: any[];
}

export default function ModeratorDashboard() {
  const [submissions, setSubmissions] = useState<DatabaseProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/problems");
      if (!res.ok) throw new Error("Failed to fetch from backend");
      const data = await res.json();
      setSubmissions(data);
      setError("");
    } catch (err) {
      setError("Could not connect to database. Is the Rust server running?");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data as soon as the component loads
  useEffect(() => {
    fetchSubmissions();
  }, []);

  return (
    <div className="w-full bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
      <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-100">
            <Shield className="text-purple-500" size={22} /> Moderator Review
            Queue
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Pending user submissions awaiting approval.
          </p>
        </div>
        <button
          onClick={fetchSubmissions}
          className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg flex items-center gap-2 transition-colors text-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-neutral-500 animate-pulse text-sm">
          Loading database records...
        </div>
      ) : error ? (
        <div className="text-center py-12 text-rose-400 text-sm border border-rose-900/50 bg-rose-950/20 rounded-xl">
          {error}
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 text-sm border border-dashed border-neutral-800 rounded-xl">
          Queue is empty. No new problems to review.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {submissions.map((prob) => (
            <div
              key={prob.id}
              className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono text-purple-400 bg-purple-950/30 px-2 py-1 rounded border border-purple-900/50">
                    ID: {prob.id}
                  </span>
                  <h3 className="text-lg font-bold text-neutral-200 mt-2">
                    {prob.title}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Structure:{" "}
                    <span className="uppercase text-neutral-300">
                      {prob.initial_state.type}
                    </span>{" "}
                    | Frames:{" "}
                    <span className="text-neutral-300">
                      {prob.steps.length}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 border border-rose-900/50 rounded text-xs font-semibold transition-colors">
                    <XCircle size={14} /> Reject
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900/50 rounded text-xs font-semibold transition-colors">
                    <CheckCircle size={14} /> Approve
                  </button>
                </div>
              </div>

              {/* Raw Data Preview for the Moderator */}
              <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 overflow-x-auto">
                <pre className="text-[10px] text-neutral-400 font-mono">
                  {JSON.stringify(prob.initial_state, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
