import { StatusLevel, MissionEnvironment } from '../types/helix';

export const STATUS_TOKENS: Record<
  StatusLevel,
  {
    label: string;
    color: string;
    colorBlindColor: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    shape: 'circle' | 'diamond' | 'triangle' | 'octagon';
    glyph: string;
    description: string;
  }
> = {
  nominal: {
    label: 'Nominal',
    color: '#3DE0C5',
    colorBlindColor: '#009E73',
    bgClass: 'bg-[#3DE0C5]/12',
    textClass: 'text-[#3DE0C5]',
    borderClass: 'border-[#3DE0C5]/35',
    shape: 'circle',
    glyph: '●',
    description: 'Within your personal baseline range.',
  },
  watch: {
    label: 'Watch',
    color: '#6CB6FF',
    colorBlindColor: '#56B4E9',
    bgClass: 'bg-[#6CB6FF]/12',
    textClass: 'text-[#6CB6FF]',
    borderClass: 'border-[#6CB6FF]/35',
    shape: 'diamond',
    glyph: '◆',
    description: 'Early drift detected. Worth monitoring today.',
  },
  caution: {
    label: 'Caution',
    color: '#FFB547',
    colorBlindColor: '#E69F00',
    bgClass: 'bg-[#FFB547]/14',
    textClass: 'text-[#FFB547]',
    borderClass: 'border-[#FFB547]/40',
    shape: 'triangle',
    glyph: '▲',
    description: 'Sustained drift from baseline. Self-care action recommended.',
  },
  escalate: {
    label: 'Escalate',
    color: '#FF6B5E',
    colorBlindColor: '#D55E00',
    bgClass: 'bg-[#FF6B5E]/15',
    textClass: 'text-[#FF6B5E]',
    borderClass: 'border-[#FF6B5E]/45',
    shape: 'octagon',
    glyph: '⬢',
    description: 'Needs crew attention. Follow mission procedure and prepare a flight surgeon summary.',
  },
};

export const ENVIRONMENT_CONFIG: Record<
  MissionEnvironment,
  {
    id: MissionEnvironment;
    label: string;
    shortLabel: string;
    gravityLabel: string;
    earthDelayText: string;
    earthDelaySeconds: number;
    distanceFactor: number;
    gravityStrength: number;
    summary: string;
  }
> = {
  transit: {
    id: 'transit',
    label: 'Deep Space Transit',
    shortLabel: 'Transit',
    gravityLabel: '0 g',
    earthDelayText: '4m 10s one-way',
    earthDelaySeconds: 250,
    distanceFactor: 0.65,
    gravityStrength: 0,
    summary: 'Free-fall cruise outside Earth magnetosphere with growing comms lag.',
  },
  station: {
    id: 'station',
    label: 'Orbital Station',
    shortLabel: 'Station',
    gravityLabel: '~0 g',
    earthDelayText: '0.3s live link',
    earthDelaySeconds: 0.3,
    distanceFactor: 0.15,
    gravityStrength: 0.01,
    summary: 'Low Earth Orbit microgravity with near-real-time flight surgeon link.',
  },
  lunar: {
    id: 'lunar',
    label: 'Lunar Base',
    shortLabel: 'Lunar ~0.16 g',
    gravityLabel: '~0.16 g',
    earthDelayText: '1.3s one-way',
    earthDelaySeconds: 1.3,
    distanceFactor: 0.35,
    gravityStrength: 0.16,
    summary: 'Partial lunar gravity with dust exposure and 14-day solar cycles.',
  },
  mars: {
    id: 'mars',
    label: 'Mars Base',
    shortLabel: 'Mars ~0.38 g',
    gravityLabel: '~0.38 g',
    earthDelayText: '14m 20s one-way',
    earthDelaySeconds: 860,
    distanceFactor: 1.0,
    gravityStrength: 0.38,
    summary: 'Autonomous operations with long comms delay and partial gravity.',
  },
};
