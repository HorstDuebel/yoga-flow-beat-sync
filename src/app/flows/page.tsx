import { auth } from "auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getFlows } from "@/lib/flows";

export default async function FlowsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = (session.user as { id?: string }).id ?? session.user.email ?? "";
  const flows = await getFlows(userId);

  return (
    <div className="min-h-screen bg-background px-4 pb-safe">
      <header className="flex items-center justify-between border-b border-text/10 py-4">
        <h1 className="text-xl font-semibold text-text">
          Meine Flows
        </h1>
        <Link
          href="/"
          className="text-sm font-medium text-primary"
        >
          Start
        </Link>
      </header>

      <main className="py-6">
        {flows.length === 0 ? (
          <p className="text-center text-text/70">
            Noch keine Flows. Erstelle einen im Editor.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {flows.map((flow) => (
              <li key={flow.id}>
                <Link
                  href={`/flow/${flow.id}`}
                  className="block rounded-xl border border-text/20 bg-background p-4 shadow-sm transition-colors active:bg-primary/5"
                >
                  <h2 className="font-semibold text-text">{flow.name}</h2>
                  <p className="mt-1 text-sm text-text/60">
                    {flow.slots.length} Übungen
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
