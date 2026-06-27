import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ModeratorDashboard from "../../components/ModeratorDashboard"; // Fixed Path!

export default function ModPage() {
  return (
    <main className="min-h-screen bg-neutral-950 p-8 pt-12">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Navigation Button */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-neutral-100 transition-colors bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-lg w-fit"
          >
            <ArrowLeft size={16} /> Back to Hub
          </Link>
        </div>

        <ModeratorDashboard />
      </div>
    </main>
  );
}
