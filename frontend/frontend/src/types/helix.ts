export type StatusLevel = 'nominal' | 'watch' | 'caution' | 'escalate';

export type TwinLayer = 'skeleton' | 'organs' | 'muscles' | 'suit';

export type MissionEnvironment = 'transit' | 'station' | 'lunar' | 'mars';

export type HazardId =
  | 'radiation'
  | 'isolation'
  | 'distance'
  | 'gravity'
  | 'closed';

export type ExperienceLevel = 'novice' | 'basics' | 'experienced';

export type EvidenceTag = 'Recommended' | 'Under study';

export type AppScreen = 'intro' | 'signin' | 'profile' | 'home';

export type HomeTab = 'twin' | 'crew' | 'summary';

export type RegionId =
  | 'brain_eyes'
  | 'mind_sleep'
  | 'inner_ear'
  | 'lungs_oxygen'
  | 'heart_vessels'
  | 'immune_skin'
  | 'gut_metabolism'
  | 'bones_muscles'
  | 'radiation';

export interface UserProfile {
  id: string;
  name: string;
  crewId: string;
  role: string;
  environment: MissionEnvironment;
  experience: ExperienceLevel;
  authMethod: 'google' | 'credentials' | 'guest' | 'demo' | 'offline';
  flightSchoolCompleted: boolean;
}

export interface IndicatorPoint {
  day: string;
  value: number;
  event?: string;
}

export interface FiveQuestions {
  measurableInSpace: string;
  whyNeeded: string;
  hazardEffect: string;
  whenToCallSurgeon: string;
  whatCanIDo: string;
}

export interface Indicator {
  id: string;
  regionId: RegionId;
  name: string;
  shortName: string;
  value: number;
  unit: string;
  baseline: number;
  referenceRange: { min: number; max: number; label: string };
  referenceSource: string;
  status: StatusLevel;
  source: 'auto' | 'manual';
  inputType: 'number' | 'mood_scale' | 'journal' | 'camera';
  minInput?: number;
  maxInput?: number;
  stepInput?: number;
  guidancePrompt: string;
  simpleSummary: string;
  series: IndicatorPoint[];
  fiveQuestions: FiveQuestions;
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  evidence: EvidenceTag;
  duration?: string;
}

export interface BodyRegion {
  id: RegionId;
  name: string;
  shortName: string;
  tabOrder: number;
  status: StatusLevel;
  runwayDays: number | null; // null means "Stable"
  confidence: 'high' | 'medium' | 'low';
  driftOffset: [number, number, number];
  cameraTarget: [number, number, number];
  cameraPos: [number, number, number];
  hotspotPos: [number, number, number];
  simpleFunction: string;
  detailedFunction: string;
  spaceflightEffect: string;
  simpleSpaceflightEffect: string;
  didYouKnow: string;
  nasaSourceLabel: string;
  nasaSourceUrl: string;
  affectedByHazards: HazardId[];
  recommendations: Recommendation[];
}

export interface ContributingSignal {
  label: string;
  weight: number; // 0-100
  direction: 'up' | 'down';
  deltaText: string;
}

export interface RunwayItem {
  regionId: RegionId;
  regionName: string;
  days: number | null;
  status: StatusLevel;
  confidence: 'high' | 'medium' | 'low';
  sparkline: number[];
  topSignals: ContributingSignal[];
  crossingDay: number | null;
}

export interface OneThingAction {
  id: string;
  title: string;
  reason: string;
  evidence: EvidenceTag;
  regionId: RegionId;
  indicatorId?: string;
  ringTarget: 'measure' | 'move' | 'rest' | 'connect';
  completed: boolean;
  remindedAt?: string;
  whySignals: ContributingSignal[];
  backups: Array<{
    id: string;
    title: string;
    reason: string;
    evidence: EvidenceTag;
  }>;
}

export interface HazardInfo {
  id: HazardId;
  label: string;
  shortLabel: string;
  causeAndEffect: string;
  affectedRegions: RegionId[];
  nasaSource: string;
}

export interface CrewMember {
  id: string;
  name: string;
  crewId: string;
  role: string;
  missionDay: number;
  environment: MissionEnvironment;
  avatarInitials: string;
  summaryStatus: StatusLevel;
  restingHrCurrent: number;
  restingHrBaseline: number;
  sleepHoursCurrent: number;
  sleepHoursBaseline: number;
  boneDensityDelta: number;
  note: string;
}

export interface HealthRingsState {
  measure: number; // 0 to 1
  move: number;
  rest: number;
  connect: number;
  streakDays: number;
  badges: Array<{
    id: string;
    title: string;
    description: string;
    earned: boolean;
  }>;
}

export interface ConsentTiers {
  includeVitals: boolean;
  includeDriftStatus: boolean;
  includeNotes: boolean;
  includeImagery: boolean;
}

export interface PacketState {
  id: string;
  status: 'idle' | 'queued' | 'sending' | 'delivered';
  queuedAt?: string;
  deliveredAt?: string;
  notes: string;
  consentTiers?: ConsentTiers;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  category: string;
}

export interface LearnCard {
  id: string;
  hazard: HazardId;
  title: string;
  headline: string;
  body: string;
  selfCare: string;
  evidence: EvidenceTag;
  sourceLabel: string;
  sourceUrl: string;
}

export interface WhatIfAdjustments {
  sleepPlus90: boolean;
  exerciseBoost: boolean;
  lighterWorkload: boolean;
  hydrationNutrition: boolean;
  lightShift: boolean;
}

export interface AccessibilitySettings {
  largeText: boolean;
  highContrast: boolean;
  colorBlindSafe: boolean;
  reduceMotion: boolean;
  ambientAudio: boolean;
  offlineSimulated: boolean;
  forceFallback2D: boolean;
}

export interface DemoKeyframe {
  timeSec: number;
  caption: string;
  environment?: MissionEnvironment;
  hazards?: HazardId[];
  focusRegion?: RegionId | null;
  layer?: TwinLayer;
  regionOverrides?: Partial<Record<RegionId, { status: StatusLevel; runwayDays: number | null }>>;
}
