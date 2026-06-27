import Link from "next/link";
import { Code2, PenTool, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center flex flex-col gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
          lc<span className="text-blue-600">.help</span>.org
        </h1>
        <p className="text-gray-500 max-w-md mx-auto">
          A community-driven platform for visual algorithm learning. Built
          entirely on donations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mt-8">
        <Link
          href="/create"
          className="group bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-3"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
            <PenTool size={24} />
          </div>
          <h2 className="font-bold text-lg text-gray-800">Creator Studio</h2>
          <p className="text-sm text-gray-500">
            Build custom drag-and-drop animation sequences.
          </p>
        </Link>

        <Link
          href="/mod"
          className="group bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-3"
        >
          <div className="p-3 bg-purple-50 text-purple-600 rounded-full group-hover:scale-110 transition-transform">
            <ShieldCheck size={24} />
          </div>
          <h2 className="font-bold text-lg text-gray-800">Mod Dashboard</h2>
          <p className="text-sm text-gray-500">
            Review, approve, and manage community submissions.
          </p>
        </Link>

        <Link
          href="/problems/1"
          className="group bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center gap-3"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full group-hover:scale-110 transition-transform">
            <Code2 size={24} />
          </div>
          <h2 className="font-bold text-lg text-gray-800">Problem Viewer</h2>
          <p className="text-sm text-gray-500">
            Test the interactive split-screen solving environment.
          </p>
        </Link>
      </div>
    </main>
  );
}
