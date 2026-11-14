import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  CREW_FIXTURE,
  HAZARDS_FIXTURE,
  INDICATORS_FIXTURE,
  ONE_THING_FIXTURE,
  REGIONS_FIXTURE,
  RUNWAY_FIXTURE,
} from './src/data/fixtures';
import { StatusLevel } from './src/types/helix';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

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
      googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
    });
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

  app.post(['/api/measure', '/measure'], (req, res) => {
    const { indicatorId, value } = req.body as {
      indicatorId: string;
      value: number;
    };

    const indicator = state.indicators.find((i) => i.id === indicatorId);
    let newStatus: StatusLevel = 'nominal';
    let feedback: 'Looks normal' | 'Recheck in 10 min' | 'Contact flight surgeon' =
      'Looks normal';

    if (indicator && typeof value === 'number' && !Number.isNaN(value)) {
      indicator.value = value;
      const { min, max } = indicator.referenceRange;
      const span = Math.max(0.5, max - min);

      if (value < min - span * 0.45 || value > max + span * 0.55) {
        newStatus = 'escalate';
        feedback = 'Contact flight surgeon';
      } else if (value < min || value > max) {
        newStatus = 'caution';
        feedback = 'Recheck in 10 min';
      } else if (Math.abs(value - indicator.baseline) > span * 0.35) {
        newStatus = 'watch';
        feedback = 'Looks normal';
      }

      indicator.status = newStatus;
      indicator.series = [
        ...indicator.series.slice(0, -1),
        { day: 'Today', value },
      ];

      const region = state.regions.find((r) => r.id === indicator.regionId);
      if (region) {
        region.status = newStatus;
        region.runwayDays =
          newStatus === 'nominal'
            ? null
            : newStatus === 'watch'
            ? 16
            : newStatus === 'caution'
            ? 8
            : 3;
      }
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

  app.post(['/api/packet', '/packet'], (req, res) => {
    const body = req.body as { id?: string; notes?: string };
    res.json({
      id: body.id || `PKT-${Date.now()}`,
      status: 'sending',
      queuedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      notes: body.notes || '',
    });
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
