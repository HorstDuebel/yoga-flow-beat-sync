import NextAuth, { type NextAuthConfig } from "next-auth";
import Spotify from "next-auth/providers/spotify";

const clientId = process.env.SPOTIFY_CLIENT_ID ?? "";
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? "";

async function refreshAccessToken(
  token: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const refreshToken = token.refreshToken as string | undefined;
  if (!refreshToken) return token;

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    console.error("[Auth] Token-Refresh fehlgeschlagen:", await res.text());
    return token;
  }

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  return {
    ...token,
    accessToken: data.access_token ?? token.accessToken,
    accessTokenExpires: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}

if (!clientId || !clientSecret || clientId.includes("@")) {
  console.error(
    "[Auth] SPOTIFY_CLIENT_ID muss der 32-Zeichen-Hex aus developer.spotify.com/dashboard sein (nicht E-Mail!). " +
      "App → Settings → Client ID kopieren."
  );
}

export const authConfig = {
  basePath: "/api/auth",
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  debug: true,
  logger: {
    error(error: Error) {
      console.error("\n========== AUTH FEHLER (siehe unten) ==========");
      console.error("Name:", error.name, "| Message:", error.message);
      if (error.stack) console.error(error.stack);
      if (error.cause && typeof error.cause === "object" && "err" in error.cause) {
        const err = (error.cause as { err?: Error }).err;
        if (err instanceof Error) console.error("Ursache:", err.message, "\n", err.stack);
      }
      if (error.cause) console.error("Cause:", JSON.stringify(error.cause, null, 2));
      console.error("================================================\n");
    },
  },
  providers: [
    Spotify({
      clientId,
      clientSecret,
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: {
          scope: "user-read-email user-read-private user-top-read playlist-read-private",
        },
      },
    }),
  ],
  callbacks: {
    async jwt(params: {
      token: Record<string, unknown>;
      account?: { access_token?: string; refresh_token?: string; expires_at?: number } | null;
    }) {
      const { token, account } = params;
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000;
        return token;
      }
      const expiresAt = token.accessTokenExpires as number | undefined;
      if (expiresAt && Date.now() < expiresAt - 60_000) {
        return token;
      }
      try {
        return await refreshAccessToken(token);
      } catch (e) {
        console.error("[Auth] Token-Refresh Exception:", e);
        return token;
      }
    },
    async session(params: { session: { user?: unknown }; token: Record<string, unknown> }) {
      const { session, token } = params;
      if (session?.user && token.accessToken) {
        (session as { accessToken?: string }).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(
  authConfig as unknown as NextAuthConfig
);
