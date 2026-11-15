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

const DB_NAME = 'helix-local-v1';
const DB_VERSION = 1;
type SyncItem = { id: string; kind: 'measurement' | 'packet'; payload: unknown; createdAt: string };

function openLocalDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('state')) db.createObjectStore('state');
      if (!db.objectStoreNames.contains('syncQueue')) db.createObjectStore('syncQueue', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('offlineAuth')) db.createObjectStore('offlineAuth');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbWrite(store: string, key: IDBValidKey, value: unknown): Promise<void> {
  try {
    const db = await openLocalDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch { /* LocalStorage remains a graceful fallback on restricted browsers. */ }
}

async function queueSync(item: SyncItem): Promise<void> {
  try {
    const db = await openLocalDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite');
      tx.objectStore('syncQueue').put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch { /* Keep essential work local even if IndexedDB is unavailable. */ }
}

async function readSyncQueue(): Promise<SyncItem[]> {
  try {
    const db = await openLocalDb();
    const items = await new Promise<SyncItem[]>((resolve, reject) => {
      const request = db.transaction('syncQueue').objectStore('syncQueue').getAll();
      request.onsuccess = () => resolve(request.result as SyncItem[]);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return items;
  } catch { return []; }
}

async function removeQueued(id: string): Promise<void> {
  try {
    const db = await openLocalDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite');
      tx.objectStore('syncQueue').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch { /* Leave the item queued for a future attempt. */ }
}

async function passwordDigest(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(salt);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBuffer, iterations: 180000, hash: 'SHA-256' }, key, 256);
  return Array.from(new Uint8Array(bits), (v) => v.toString(16).padStart(2, '0')).join('');
}

export async function rememberOfflineCredential(crewId: string, password: string): Promise<void> {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const digest = await passwordDigest(password, salt);
    const record = { salt: Array.from(salt), digest };
    await idbWrite('offlineAuth', crewId.toLowerCase(), record);
    localStorage.setItem(`helix_offline_auth_${crewId.toLowerCase()}`, JSON.stringify(record));
  } catch { /* Offline unlock remains unavailable on browsers without WebCrypto. */ }
}

export async function verifyOfflineCredential(crewId: string, password: string): Promise<boolean> {
  try {
    const db = await openLocalDb();
    const record = await new Promise<{ salt: number[]; digest: string } | undefined>((resolve, reject) => {
      const request = db.transaction('offlineAuth').objectStore('offlineAuth').get(crewId.toLowerCase());
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    const saved = record || JSON.parse(localStorage.getItem(`helix_offline_auth_${crewId.toLowerCase()}`) || 'null');
    if (!saved) return false;
    return (await passwordDigest(password, new Uint8Array(saved.salt))) === saved.digest;
  } catch { return false; }
}

export async function signInCrew(crewId: string, password: string): Promise<{ crewId: string; name: string }> {
  const csrfResponse = await fetch('/auth/csrf', { credentials: 'same-origin' });
  if (!csrfResponse.ok) throw new Error('Auth.js sign-in is unavailable. Start the HELIX server and backend.');
  const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
  const form = new URLSearchParams({ csrfToken, crew_id: crewId, password, callbackUrl: '/', json: 'true' });
  const response = await fetch('/auth/callback/credentials', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form,
  });
  if (!response.ok) throw new Error('Crew ID or password was not accepted.');
  const sessionResponse = await fetch('/auth/session', { credentials: 'same-origin' });
  const session = await sessionResponse.json() as { user?: { name?: string }; crewId?: string } | null;
  if (!session?.crewId) throw new Error('Sign-in could not be confirmed. Please try again.');
  await rememberOfflineCredential(crewId, password);
  return { crewId: session.crewId, name: session.user?.name || session.crewId };
}

export async function signOutCrew(): Promise<void> {
  try {
    const response = await fetch('/auth/csrf', { credentials: 'same-origin' });
    const { csrfToken } = await response.json() as { csrfToken: string };
    await fetch('/auth/signout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ csrfToken, callbackUrl: '/' }) });
  } catch { /* Local sign-out still proceeds. */ }
}

export async function syncPendingOperations(): Promise<number> {
  if (!navigator.onLine) return 0;
  const sessionResponse = await fetch('/auth/session', { credentials: 'same-origin' }).catch(() => null);
  const session = sessionResponse?.ok ? await sessionResponse.json().catch(() => null) as { crewId?: string } | null : null;
  if (!session?.crewId) return 0;
  let synced = 0;
  for (const item of await readSyncQueue()) {
    try {
      const endpoint = item.kind === 'measurement' ? '/api/measure' : '/api/packet';
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.payload) });
      if (!response.ok) break;
      await removeQueued(item.id);
      synced += 1;
    } catch { break; }
  }
  return synced;
}

export interface DemoBackendPayload { assessment: any; stream: any; }

export async function fetchDemoDashboard(stressors: string[] = []): Promise<DemoBackendPayload | null> {
  const query = new URLSearchParams({ profile: 'commander', day: '63' });
  stressors.forEach((stressor) => query.append('stressor', stressor));
  try {
    const response = await fetch(`/api/demo/dashboard?${query}`, { credentials: 'same-origin' });
    if (!response.ok) return null;
    return await response.json() as DemoBackendPayload;
  } catch { return null; }
}

export function mapDemoDashboard(payload: DemoBackendPayload, currentRegions: BodyRegion[], currentIndicators: Indicator[]): {
  regions: BodyRegion[]; runway: RunwayItem[]; oneThing: OneThingAction; indicators: Indicator[];
} {
  const assessment = payload.assessment;
  const points = payload.stream?.measurements || [];
  const statuses: Record<string, StatusLevel> = {
    Nominal: 'nominal', Watch: 'watch', Caution: 'caution', Escalate: 'escalate',
  };
  const regions = currentRegions.map((region) => {
    const live = assessment.regions?.[region.id];
    if (region.id === 'radiation') {
      // A solar flare is the scripted 90s-demo beat (22d -> 9d, same as the
      // inject handler and demo choreography): keep 9 days on a flare instead
      // of the backend's generic projection. Otherwise use the backend value.
      const flare = assessment.stressors?.includes('radiation_event');
      if (live) {
        const days = typeof live.runway === 'string' && live.runway.includes('days')
          ? Number(live.runway.match(/[\d.]+/)?.[0] || 0) : null;
        return { ...region, status: statuses[live.status] || 'caution', runwayDays: flare ? 9 : days,
          confidence: String(live.confidence || 'low').toLowerCase() as BodyRegion['confidence'] };
      }
      if (flare) {
        return { ...region, status: 'caution' as StatusLevel, runwayDays: 9 };
      }
    }
    if (!live) return region;
    const days = typeof live.runway === 'string' && live.runway.includes('days')
      ? Number(live.runway.match(/[\d.]+/)?.[0] || 0) : null;
    return { ...region, status: statuses[live.status] || 'nominal', runwayDays: days,
      confidence: String(live.confidence || 'low').toLowerCase() as BodyRegion['confidence'] };
  });
  // Merge the backend's regions into the full 9-system runway instead of
  // replacing it: the backend only reports the systems it has data for, so
  // rebuilding from its entries alone dropped the other rows entirely.
  const runway = currentRegions.map((region) => {
    const live = assessment.regions?.[region.id];
    if (!live) {
      return {
        regionId: region.id as RunwayItem['regionId'], regionName: region.name,
        days: region.runwayDays, status: region.status, confidence: region.confidence,
        sparkline: [], topSignals: [], crossingDay: region.runwayDays == null ? null : Number(assessment.day) + region.runwayDays,
      };
    }
    const days = typeof live.runway === 'string' && live.runway.includes('days')
      ? Number(live.runway.match(/[\d.]+/)?.[0] || 0) : null;
    // Same scripted flare beat as the region above: 22d -> 9d.
    const shownDays = region.id === 'radiation' && assessment.stressors?.includes('radiation_event') ? 9 : days;
    const keys = region.id === 'heart_vessels' ? ['heart_rate','blood_pressure_systolic']
      : region.id === 'mind_sleep' ? ['sleep_hours','mood_stress']
      : region.id === 'bones_muscles' ? ['exercise_minutes']
      : region.id === 'radiation' ? ['radiation_relative'] : [];
    const sparkline = points.slice(-7).map((point: any, index: number) => {
      if (!keys.length) return index;
      const vals = keys.map((key) => {
        const base = key === 'radiation_relative' ? 0.4 + Number(point.day) * 0.013 : Number(assessment.profile.baseline[key]);
        const drift = Math.abs(Number(point[key]) - base) / Math.max(1, base) * 100;
        return key === 'radiation_relative' ? Math.min(100, drift) : drift;
      });
      return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) || index;
    });
    return {
      regionId: region.id as RunwayItem['regionId'], regionName: region.name,
      days: shownDays, status: statuses[live.status] || 'nominal', confidence: String(live.confidence || 'low').toLowerCase() as RunwayItem['confidence'],
      sparkline, topSignals: [], crossingDay: shownDays === null ? null : Number(assessment.day) + shownDays,
    };
  });
  const primary = assessment.one_thing_today?.primary || { action: 'Keep today’s planned routine and check in again', reason: 'No notable change from the synthetic baseline.' };
  const title = String(primary.action);
  const targetRegion = /sleep|mood|stress/i.test(title) ? 'mind_sleep'
    : /exercise|activity/i.test(title) ? 'bones_muscles'
    : /blood pressure|heart/i.test(title) ? 'heart_vessels' : 'mind_sleep';
  const backupItems = (assessment.one_thing_today?.backups || []).map((item: any, index: number) => ({
    id: `backend-backup-${index}`, title: item.action, reason: item.reason, evidence: item.tag === 'Under study' ? 'Under study' as const : 'Recommended' as const,
  }));
  const oneThing: OneThingAction = {
    id: 'backend-one-thing', title, reason: String(primary.reason),
    evidence: primary.tag === 'Under study' ? 'Under study' : 'Recommended',
    regionId: targetRegion as OneThingAction['regionId'], indicatorId: /sleep/i.test(title) ? 'sleep_duration' : undefined,
    ringTarget: /sleep|rest/i.test(title) ? 'rest' : /exercise/i.test(title) ? 'move' : 'measure',
    completed: false, whySignals: [], backups: backupItems,
  };
  const indicatorKeys: Record<string, string> = {
    sleep_duration: 'sleep_hours', resting_hr: 'heart_rate',
  };
  const indicators = currentIndicators.map((indicator) => {
    const key = indicatorKeys[indicator.id];
    if (!key || !points.length) return indicator;
    const series = points.slice(-7).map((point: any) => ({ day: `D${point.day}`, value: Number(point[key]) }));
    return { ...indicator, value: series[series.length - 1].value, series };
  });
  return { regions, runway, oneThing, indicators };
}

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
  feedback: 'Recorded for review' | 'Contact flight surgeon';
  newStatus: StatusLevel;
  updatedIndicatorId: string;
}> {
  const queueItem: SyncItem = {
    id: `measurement-${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(16).slice(2)}`,
    kind: 'measurement', payload, createdAt: new Date().toISOString(),
  };
  const localResult = () => {
      const savedInd = localStorage.getItem(STORAGE_KEYS.indicators);
      const indicators: Indicator[] = savedInd
        ? JSON.parse(savedInd)
        : INDICATORS_FIXTURE;
      const target = indicators.find((i) => i.id === payload.indicatorId);
      const newStatus: StatusLevel = target?.status || 'nominal';
      const feedback: 'Recorded for review' = 'Recorded for review';

      return {
        feedback,
        newStatus,
        updatedIndicatorId: payload.indicatorId,
      };
  };
  let data = localResult();
  let fromCache = true;
  const sessionResponse = await fetch('/auth/session', { credentials: 'same-origin' }).catch(() => null);
  const session = sessionResponse?.ok ? await sessionResponse.json().catch(() => null) as { crewId?: string } | null : null;
  if (navigator.onLine && session?.crewId) {
    const result = await fetchWithFallback(
      '/api/measure', localResult,
      {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      }
    );
    data = result.data;
    fromCache = result.fromCache;
  }
  if (!navigator.onLine || (fromCache && session?.crewId)) await queueSync(queueItem);
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
    await idbWrite('state', STORAGE_KEYS.packet, queued);
    await queueSync({ id: `packet-${packet.id}`, kind: 'packet', payload: packet, createdAt: new Date().toISOString() });
    return queued;
  }

  const { data, fromCache } = await fetchWithFallback(
    '/api/packet',
    () => ({
      ...packet,
      status: 'queued' as const,
      queuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packet),
    }
  );
  localStorage.setItem(STORAGE_KEYS.packet, JSON.stringify(data));
  await idbWrite('state', STORAGE_KEYS.packet, data);
  if (fromCache) await queueSync({ id: `packet-${packet.id}`, kind: 'packet', payload: packet, createdAt: new Date().toISOString() });
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
  void idbWrite('state', STORAGE_KEYS[key], value);
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
