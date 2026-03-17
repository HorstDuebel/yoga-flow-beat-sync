import Link from "next/link";
import { auth } from "auth";
import { SignInButton, SignOutButton } from "@/components/AuthButtons";
import { MobileRedirect } from "@/components/MobileRedirect";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {session && <MobileRedirect isLoggedIn={!!session} />}
      <main className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-text">
          KundaFlow-Beat-Sync
        </h1>
        <p className="text-text/80">
          Yoga-Flows mit Beat-Sync und Spotify
        </p>

        {session ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-text/70">
              Angemeldet als {session.user?.name ?? session.user?.email}
            </p>
            <div className="flex gap-4">
              <Link
                href="/editor"
                className="rounded-lg bg-primary px-6 py-3 font-medium text-background transition-colors hover:bg-primary/90"
              >
                Editor
              </Link>
              <Link
                href="/flows"
                className="rounded-lg border border-primary/50 px-6 py-3 font-medium text-primary transition-colors hover:bg-primary/10"
              >
                Flow starten
              </Link>
            </div>
            <SignOutButton />
          </div>
        ) : (
          <SignInButton />
        )}
      </main>
    </div>
  );
}
