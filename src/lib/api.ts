import {
  CREW_FIXTURE,
  HAZARDS_FIXTURE,
  INDICATORS_FIXTURE,
  INITIAL_RINGS_FIXTURE,
  ONE_THING_FIXTURE,
  REGIONS_FIXTURE,
  RUNWAY_FIXTURE,
} from '../data/fixtures';
import {
  BodyRegion,
  CrewMember,
  HealthRingsState,
  Indicator,
  OneThingAction,
  PacketState,
  RunwayItem,
  StatusLevel,
} from '../types/helix';

const STORAGE_KEYS = {
  profile: 'helix_profile_v1',
  regions: 'helix_regions_v1',
  indicators: 'helix_indicators_v1',
  rings: 'helix_rings_v1',
  packet: 'helix_packet_v1',
  oneThing: 'helix_onething_v1',
  accessibility: 'helix_a11y_v1',
};

export interface TwinPayload {
  regions: BodyRegion[];
  hazards: typeof HAZARDS_FIXTURE;
  crew: CrewMember[];
}

async function fetchWithFallback<T>(
  url: string,
  fallback: () => T,
  options?: RequestInit
): Promise<{ data: T; fromCache: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1600);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as T;
    return { data, fromCache: false };
  } catch {
    return { data: fallback(), fromCache: true };
  }
}

export async function getAuthConfig(): Promise<{ googleConfigured: boolean }> {
  const { data } = await fetchWithFallback('/api/auth/config', () => ({
    googleConfigured: false,
  }));
  return data;
}

export async function fetchTwin(): Promise<TwinPayload> {
  const { data } = await fetchWithFallback('/api/twin', () => {
    const saved = localStorage.getItem(STORAGE_KEYS.regions);
    const regions = saved ? (JSON.parse(saved) as BodyRegion[]) : REGIONS_FIXTURE;
    return {
      regions,
      hazards: HAZARDS_FIXTURE,
      crew: CREW_FIXTURE,
    };
  });
  return data;
}

export async function fetchIndicators(): Promise<Indicator[]> {
  const { data } = await fetchWithFallback('/api/indicators', () => {
    const saved = localStorage.getItem(STORAGE_KEYS.indicators);
    return saved ? (JSON.parse(saved) as Indicator[]) : INDICATORS_FIXTURE;
  });
  return data;
}

export async function fetchRunway(): Promise<RunwayItem[]> {
  const { data } = await fetchWithFallback('/api/runway', () => RUNWAY_FIXTURE);
  return data;
}

export async function fetchOneThing(): Promise<OneThingAction> {
  const { data } = await fetchWithFallback('/api/one-thing', () => {
    const saved = localStorage.getItem(STORAGE_KEYS.oneThing);
    return saved ? (JSON.parse(saved) as OneThingAction) : ONE_THING_FIXTURE;
  });
  return data;
}

export async function submitMeasurement(payload: {
  indicatorId: string;
  value: number;
  note?: string;
}): Promise<{
  feedback: 'Looks normal' | 'Recheck in 10 min' | 'Contact flight surgeon';
  newStatus: StatusLevel;
  updatedIndicatorId: string;
}> {
  const { data } = await fetchWithFallback(
    '/api/measure',
    () => {
      const savedInd = localStorage.getItem(STORAGE_KEYS.indicators);
      const indicators: Indicator[] = savedInd
        ? JSON.parse(savedInd)
        : INDICATORS_FIXTURE;
      const target = indicators.find((i) => i.id === payload.indicatorId);
      let newStatus: StatusLevel = 'nominal';
      let feedback: 'Looks normal' | 'Recheck in 10 min' | 'Contact flight surgeon' =
        'Looks normal';

      if (target) {
        const { min, max } = target.referenceRange;
        const span = Math.max(0.5, max - min);
        if (payload.value < min - span * 0.45 || payload.value > max + span * 0.55) {
          newStatus = 'escalate';
          feedback = 'Contact flight surgeon';
        } else if (payload.value < min || payload.value > max) {
          newStatus = 'caution';
          feedback = 'Recheck in 10 min';
        } else if (Math.abs(payload.value - target.baseline) > span * 0.35) {
          newStatus = 'watch';
          feedback = 'Looks normal';
        }
      }

      return {
        feedback,
        newStatus,
        updatedIndicatorId: payload.indicatorId,
      };
    },
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  return data;
}

export async function fetchCoachNote(regionId: string): Promise<{ message: string }> {
  const { data } = await fetchWithFallback(
    '/api/coach',
    () => ({
      message:
        'Steady self-checks keep small drifts easy to correct before they affect mission tasks.',
    }),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regionId }),
    }
  );
  return data;
}

export async function queueSurgeonPacket(
  packet: PacketState,
  isOnline: boolean
): Promise<PacketState> {
  if (!isOnline) {
    const queued: PacketState = {
      ...packet,
      status: 'queued',
      queuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    localStorage.setItem(STORAGE_KEYS.packet, JSON.stringify(queued));
    return queued;
  }

  const { data } = await fetchWithFallback(
    '/api/packet',
    () => ({
      ...packet,
      status: 'sending' as const,
      queuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packet),
    }
  );
  localStorage.setItem(STORAGE_KEYS.packet, JSON.stringify(data));
  return data;
}

export function loadLocalState<T>(key: keyof typeof STORAGE_KEYS, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key]);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocalState<T>(key: keyof typeof STORAGE_KEYS, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
  } catch {
    // Ignore storage quota issues
  }
}

export function getInitialRings(): HealthRingsState {
  return loadLocalState('rings', INITIAL_RINGS_FIXTURE);
}

// Quiet procedural ambient cabin audio (OFF by default)
class CalmCabinAudio {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private active = false;

  toggle(enable: boolean) {
    if (enable === this.active) return;
    if (enable) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 0.0001;

        this.osc1 = this.ctx.createOscillator();
        this.osc1.type = 'sine';
        this.osc1.frequency.value = 65.41; // C2 warm cabin hum

        this.osc2 = this.ctx.createOscillator();
        this.osc2.type = 'triangle';
        this.osc2.frequency.value = 98.0; // G2 subtle fifth

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 180;

        this.osc1.connect(filter);
        this.osc2.connect(filter);
        filter.connect(this.gain);
        this.gain.connect(this.ctx.destination);

        this.osc1.start();
        this.osc2.start();
        this.gain.gain.exponentialRampToValueAtTime(0.025, this.ctx.currentTime + 1.2);
        this.active = true;
      } catch {
        this.active = false;
      }
    } else {
      try {
        if (this.gain && this.ctx) {
          this.gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
          setTimeout(() => {
            this.osc1?.stop();
            this.osc2?.stop();
            this.ctx?.close();
            this.ctx = null;
            this.osc1 = null;
            this.osc2 = null;
            this.gain = null;
          }, 420);
        }
      } catch {
        // Ignore cleanup errors
      }
      this.active = false;
    }
  }
}

export const cabinAudio = new CalmCabinAudio();
