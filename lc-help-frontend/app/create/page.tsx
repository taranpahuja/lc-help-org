import ProblemCreator from "../../components/ProblemCreator";

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 pt-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <ProblemCreator />
      </div>
    </main>
  );
}
