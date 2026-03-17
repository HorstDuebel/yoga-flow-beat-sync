import NextAuth, { type NextAuthConfig } from "next-auth";
import Spotify from "next-auth/providers/spotify";

const clientId = process.env.SPOTIFY_CLIENT_ID ?? "";
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? "";

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
    async jwt(params: Parameters<NonNullable<NextAuthConfig["callbacks"]>["jwt"]>[0]) {
      const { token, account } = params;
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session(params: Parameters<NonNullable<NextAuthConfig["callbacks"]>["session"]>[0]) {
      const { session, token } = params;
      if (session.user) {
        (session as { accessToken?: string }).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
