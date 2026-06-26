import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
        lc.help.org
      </h1>
      <div className="flex gap-4">
        <Link
          href="/create"
          className="px-6 py-3 bg-blue-600 rounded-lg font-bold hover:bg-blue-700"
        >
          Creator Studio
        </Link>
        <Link
          href="/mod"
          className="px-6 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700"
        >
          Mod Dashboard
        </Link>
        <Link
          href="/problems/1"
          className="px-6 py-3 bg-emerald-600 rounded-lg font-bold hover:bg-emerald-700"
        >
          View Demo Problem
        </Link>
      </div>
    </main>
  );
}
