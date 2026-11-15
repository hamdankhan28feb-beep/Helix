import 'dotenv/config';
import express from 'express';
import { ExpressAuth, getSession } from '@auth/express';
import type { Request } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiTokens, authConfig } from './auth';
import {
  CREW_FIXTURE,
  HAZARDS_FIXTURE,
  INDICATORS_FIXTURE,
  ONE_THING_FIXTURE,
  REGIONS_FIXTURE,
  RUNWAY_FIXTURE,
} from './src/data/fixtures';
import { StatusLevel } from './src/types/helix';
import { calculateIndicatorStatus } from './src/lib/evaluator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use('/auth', ExpressAuth(authConfig));

  const PORT = 3000;
  const backendUrl = process.env.HELIX_API_URL || 'http://127.0.0.1:8000';

  async function backendFetch(req: Request, route: string, init: RequestInit = {}) {
    const session = await getSession(req, authConfig).catch(() => null);
    const crewId = (session as (typeof session & { crewId?: string }) | null)?.crewId;
    const apiAccessToken = crewId ? apiTokens.get(crewId) : undefined;
    const headers = new Headers(init.headers);
    if (apiAccessToken) headers.set('Authorization', `Bearer ${apiAccessToken}`);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return fetch(`${backendUrl}${route}`, { ...init, headers });
  }

  // In-memory session state mirrored from NASA HRP-grounded fixtures
  const state = {
    regions: structuredClone(REGIONS_FIXTURE),
    indicators: structuredClone(INDICATORS_FIXTURE),
    runway: structuredClone(RUNWAY_FIXTURE),
    oneThing: structuredClone(ONE_THING_FIXTURE),
    crew: structuredClone(CREW_FIXTURE),
  };

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'helix-cockpit' });
  });

  app.get('/api/auth/config', (_req, res) => {
    res.json({
      googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.AUTH_SECRET),
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    });
  });

  app.post('/api/auth/google/config', (req, res) => {
    const { clientId, clientSecret } = req.body as { clientId?: string; clientSecret?: string };
    if (clientId) process.env.GOOGLE_CLIENT_ID = clientId;
    if (clientSecret) process.env.GOOGLE_CLIENT_SECRET = clientSecret;
    res.json({
      ok: true,
      googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.AUTH_SECRET),
      googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    });
  });

  app.post('/api/auth/google/verify', async (req, res) => {
    const { credential, email, name } = req.body as {
      credential?: string;
      email?: string;
      name?: string;
    };

    let resolvedName = name || 'Google Astronaut';
    let resolvedEmail = email || 'astronaut@google.com';

    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          resolvedEmail = payload.email || resolvedEmail;
          resolvedName = payload.name || resolvedName;
        }
      } catch {
        // Fall back to provided name/email
      }
    }

    const crewId = resolvedEmail.split('@')[0].toUpperCase().replace(/\./g, '_');
    const backendRes = await fetch(`${backendUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, email: resolvedEmail, name: resolvedName }),
    }).catch(() => null);

    if (backendRes?.ok) {
      const data = (await backendRes.json()) as { access_token: string; crew_id: string };
      apiTokens.set(data.crew_id, data.access_token);
    }

    res.json({
      ok: true,
      crewId,
      name: resolvedName,
      email: resolvedEmail,
    });
  });

  app.get('/api/auth/session', async (req, res) => {
    const session = await getSession(req, authConfig).catch(() => null);
    res.json(session || null);
  });

  app.get('/api/demo/dashboard', async (req, res) => {
    const profileId = String(req.query.profile || 'commander');
    const day = Number(req.query.day || 63);
    const stressors = Array.isArray(req.query.stressor)
      ? req.query.stressor.map(String)
      : req.query.stressor ? [String(req.query.stressor)] : [];
    try {
      const query = new URLSearchParams({ day: String(day) });
      stressors.forEach((value) => query.append('stressor', value));
      const response = await backendFetch(req, `/assessment/${encodeURIComponent(profileId)}?${query}`);
      if (!response.ok) throw new Error(`Backend returned ${response.status}`);
      const assessment = await response.json() as any;
      assessment.stressors = stressors;
      const streamResponse = await backendFetch(req, `/stream/${encodeURIComponent(profileId)}?${query}`);
      const stream = streamResponse.ok ? await streamResponse.json() as any : null;
      res.json({ assessment, stream });
    } catch {
      res.status(503).json({ error: 'Mission backend unavailable; use the local synthetic fixtures.' });
    }
  });

  app.get('/api/demo/packet/:profileId', async (req, res) => {
    try {
      const query = new URLSearchParams({ day: String(req.query.day || 63) });
      const response = await backendFetch(req, `/packet/${encodeURIComponent(req.params.profileId)}?${query}`);
      res.status(response.status).json(await response.json());
    } catch {
      res.status(503).json({ error: 'Mission backend unavailable; packet remains stored on this device.' });
    }
  });

  app.get(['/api/twin', '/twin'], (_req, res) => {
    res.json({
      regions: state.regions,
      hazards: HAZARDS_FIXTURE,
      crew: state.crew,
    });
  });

  app.get(['/api/indicators', '/indicators'], (_req, res) => {
    res.json(state.indicators);
  });

  app.get(['/api/runway', '/runway'], (_req, res) => {
    res.json(state.runway);
  });

  app.get(['/api/one-thing', '/one-thing'], (_req, res) => {
    res.json(state.oneThing);
  });

  app.post(['/api/measure', '/measure'], async (req, res) => {
    const { indicatorId, value } = req.body as {
      indicatorId: string;
      value: number;
    };

    const indicator = state.indicators.find((i) => i.id === indicatorId);
    const evaluation = typeof value === 'number' && !Number.isNaN(value)
      ? calculateIndicatorStatus(indicatorId, value)
      : { status: (indicator?.status || 'nominal') as StatusLevel, feedback: 'Recorded for review' as const };
    const newStatus: StatusLevel = evaluation.status;
    const feedback = evaluation.feedback;
    if (indicator && typeof value === 'number' && !Number.isNaN(value)) {
      const response = await backendFetch(req, '/measurements', {
        method: 'POST',
        body: JSON.stringify({ indicator_id: indicatorId, value: String(value), unit: indicator.unit }),
      }).catch(() => null);
      if (!response?.ok) {
        res.status(503).json({ error: 'Measurement remains local; demo sync service is unavailable.' });
        return;
      }
      indicator.value = value;
      indicator.series = [
        ...indicator.series.slice(0, -1),
        { day: 'Today', value },
      ];
    }

    res.json({
      feedback,
      newStatus,
      updatedIndicatorId: indicatorId,
    });
  });

  app.post(['/api/coach', '/coach'], (req, res) => {
    const { regionId } = req.body as { regionId?: string };
    const region = state.regions.find((r) => r.id === regionId);
    res.json({
      message: region
        ? `${region.name}: ${region.simpleSpaceflightEffect}`
        : 'Steady self-checks keep small drifts easy to correct before they affect mission tasks.',
    });
  });

  app.post(['/api/packet', '/packet'], async (req, res) => {
    const body = req.body as { id?: string; notes?: string };
    const generated = await backendFetch(req, '/packet/commander?day=63', {
      method: 'POST', body: JSON.stringify({ id: body.id, notes: body.notes || '' }),
    }).catch(() => null);
    if (!generated?.ok) {
      res.status(503).json({ error: 'Packet is still stored locally; demo sync service is unavailable.' });
      return;
    }
    const packet = generated?.ok ? await generated.json().catch(() => null) : null;
    res.json({ id: packet?.id || body.id || `PKT-${Date.now()}`, status: 'queued', queuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), notes: body.notes || '', synthetic: Boolean(packet?.synthetic), disclaimer: packet?.disclaimer, syncNotice: 'Stored in the demo sync service; not transmitted to NASA or a flight surgeon.' });
  });

  app.get(['/api/stream', '/stream'], (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendTick = () => {
      const hr = state.indicators.find((i) => i.id === 'resting_hr');
      const jitter = Math.round((Math.random() - 0.5) * 2);
      const payload = {
        timestamp: new Date().toISOString(),
        indicatorId: 'resting_hr',
        value: hr ? Math.max(50, Math.min(82, hr.value + jitter)) : 66,
      };
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    const timer = setInterval(sendTick, 8000);
    req.on('close', () => {
      clearInterval(timer);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HELIX cockpit server listening on http://localhost:${PORT}`);
  });
}

startServer();
