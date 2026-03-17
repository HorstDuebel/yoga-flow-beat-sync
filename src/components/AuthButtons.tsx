"use client";

import { signIn, signOut } from "next-auth/react";

function getCallbackUrl(): string {
  if (typeof window === "undefined") return "http://127.0.0.1:3000";
  const origin = window.location.origin;
  // localhost und 127.0.0.1 sind unterschiedliche Origins für Cookies
  if (origin.includes("localhost")) return "http://127.0.0.1:3000";
  return origin;
}

export function SignInButton() {
  return (
    <button
      onClick={() => signIn("spotify", { callbackUrl: getCallbackUrl() })}
      className="rounded-lg bg-primary px-8 py-3 font-medium text-background transition-colors hover:bg-primary/90"
    >
      Mit Spotify anmelden
    </button>
  );
}

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="text-sm text-text/60 underline hover:text-text"
    >
      Abmelden
    </button>
  );
}
