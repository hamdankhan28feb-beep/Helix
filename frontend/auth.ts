import Credentials from '@auth/express/providers/credentials';
import Google from '@auth/express/providers/google';
import type { ExpressAuthConfig } from '@auth/express';

const backendUrl = process.env.HELIX_API_URL || 'http://127.0.0.1:8000';
export const apiTokens = new Map<string, string>();

const providers: ExpressAuthConfig['providers'] = [
  Credentials({
    id: 'credentials',
    name: 'Crew ID',
    credentials: {
      crew_id: { label: 'Crew ID', type: 'text' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const crewId = String(credentials?.crew_id || '').trim();
      const password = String(credentials?.password || '');
      if (!crewId || password.length < 10) return null;
      const response = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crew_id: crewId, password }),
      }).catch(() => null);
      if (!response?.ok) return null;
      const result = (await response.json()) as {
        access_token: string;
        crew_id: string;
      };
      apiTokens.set(result.crew_id, result.access_token);
      return {
        id: result.crew_id,
        name: result.crew_id === 'commander' ? 'Commander Demo' : result.crew_id,
        crewId: result.crew_id,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }));
}

export const authConfig: ExpressAuthConfig = {
  secret: process.env.AUTH_SECRET || 'helix-local-development-secret-change-before-deploy',
  trustHost: true,
  session: { strategy: 'jwt' },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const detail = user as typeof user & { crewId?: string };
        token.crewId = detail.crewId || detail.id;
      }
      return token;
    },
    async session({ session, token }) {
      const detail = session as typeof session & { crewId?: string };
      detail.crewId = String(token.crewId || token.sub || '');
      return detail;
    },
  },
};

