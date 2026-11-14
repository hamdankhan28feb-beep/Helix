import React from 'react';
import { ExternalLink, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  AccessibilitySettings,
  ExperienceLevel,
  UserProfile,
} from '../../types/helix';

interface SettingsModalProps {
  isOpen: boolean;
  profile: UserProfile;
  settings: AccessibilitySettings;
  onUpdateExperience: (exp: ExperienceLevel) => void;
  onUpdateSettings: (next: AccessibilitySettings) => void;
  onResetBaseline: () => void;
  onClose: () => void;
}

const CITED_REFERENCES = [
  {
    title: 'NASA Human Research Program (HRP) Integrated Research Plan',
    url: 'https://humanresearchroadmap.nasa.gov/',
  },
  {
    title: 'NASA-STD-3001 Vol. 2 — Space Flight Human-System Standard',
    url: 'https://www.nasa.gov/hhp/standards',
  },
  {
    title: 'Spaceflight-Associated Neuro-ocular Syndrome (SANS) Evidence Report',
    url: 'https://humanresearchroadmap.nasa.gov/risks/risk.aspx?i=105',
  },
  {
    title: 'Behavioral Health & Performance / Sleep & Circadian Evidence',
    url: 'https://humanresearchroadmap.nasa.gov/risks/risk.aspx?i=99',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  profile,
  settings,
  onUpdateExperience,
  onUpdateSettings,
  onResetBaseline,
  onClose,
}) => {
  if (!isOpen) return null;

  const toggleSetting = (key: keyof AccessibilitySettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#070B14]/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Settings, Accessibility, and Credits"
    >
      <div className="w-full max-w-xl rounded-3xl cockpit-panel-elevated p-6 sm:p-7 max-h-[88vh] overflow-y-auto space-y-6">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-xl font-semibold text-[#E8EEF7]">
              Settings & Accessibility
            </h2>
            <p className="text-xs text-[#8A97AD] mt-0.5">
              {profile.name} · {profile.crewId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A97AD] hover:text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Explanation Depth */}
        <section>
          <h3 className="text-xs font-semibold text-[#7FB2FF] mb-2">
            Explanation depth
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'novice', label: 'Simple' },
                { id: 'basics', label: 'Balanced' },
                { id: 'experienced', label: 'Detailed' },
              ] as Array<{ id: ExperienceLevel; label: string }>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdateExperience(opt.id)}
                className={cn(
                  'py-2 px-3 rounded-xl text-xs font-medium border cursor-pointer',
                  profile.experience === opt.id
                    ? 'bg-[#7FB2FF]/18 border-[#7FB2FF] text-[#E8EEF7]'
                    : 'bg-[#070B14] border-white/10 text-[#8A97AD]'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Accessibility & Simulation Toggles */}
        <section className="space-y-2.5">
          <h3 className="text-xs font-semibold text-[#7FB2FF]">
            Display, accessibility & simulation
          </h3>

          {(
            [
              {
                key: 'largeText',
                label: 'Large text mode',
                desc: 'Increases base typography scale across every panel.',
              },
              {
                key: 'highContrast',
                label: 'High contrast mode',
                desc: 'Boosts borders and text luminance for bright cabin glare.',
              },
              {
                key: 'colorBlindSafe',
                label: 'Color-blind safe palette',
                desc: 'Uses high-distinction Okabe-Ito tones alongside icons & shapes.',
              },
              {
                key: 'reduceMotion',
                label: 'Reduce motion',
                desc: 'Stops starfield drift, auto-rotation, and smooth camera transitions.',
              },
              {
                key: 'ambientAudio',
                label: 'Quiet cabin ambient audio',
                desc: 'Gentle low harmonic hum (off by default).',
              },
              {
                key: 'offlineSimulated',
                label: 'Simulate offline mode',
                desc: 'Tests cached local profile, offline queuing, and local fixtures.',
              },
              {
                key: 'forceFallback2D',
                label: 'Use 2D anatomical fallback',
                desc: 'Preview the zero-WebGL stylized SVG twin.',
              },
            ] as Array<{
              key: keyof AccessibilitySettings;
              label: string;
              desc: string;
            }>
          ).map((item) => {
            const on = settings[item.key];
            return (
              <button
                key={item.key}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => toggleSetting(item.key)}
                className="w-full p-3 rounded-2xl bg-[#070B14]/70 border border-white/[0.08] flex items-center justify-between gap-3 text-left hover:border-white/20 cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium text-[#E8EEF7]">{item.label}</p>
                  <p className="text-xs text-[#8A97AD]">{item.desc}</p>
                </div>
                <div
                  className={cn(
                    'w-10 h-5 rounded-full p-0.5 transition-colors shrink-0',
                    on ? 'bg-[#7FB2FF]' : 'bg-white/15'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full bg-[#070B14] transition-transform',
                      on ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </div>
              </button>
            );
          })}
        </section>

        {/* Credits & Cited References */}
        <section className="space-y-3 pt-3 border-t border-white/[0.08]">
          <h3 className="text-xs font-semibold text-[#7FB2FF]">
            Credits & 3D Anatomy Attribution
          </h3>
          <p className="text-xs text-[#8A97AD] leading-relaxed">
            3D Ghost Twin anatomical layers (Skeleton, Organs, Muscles, EVA Suit) and 2D SVG fallback are generated procedurally in-app using Three.js geometry primitives (CC0 / MIT-licensed scene architecture) for zero-latency offline reliability, with anatomical proportions guided by open human body proportions.
          </p>

          <h4 className="text-xs font-semibold text-[#E8EEF7] pt-1">
            Cited Spaceflight References
          </h4>
          <ul className="space-y-1.5">
            {CITED_REFERENCES.map((ref) => (
              <li key={ref.title}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#7FB2FF] hover:underline"
                >
                  <span>{ref.title}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* Reset & Clinical Disclaimer */}
        <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[#FFB547]">
            Synthetic data, self-assessment support, not clinical.
          </p>
          <button
            type="button"
            onClick={onResetBaseline}
            className="text-xs text-[#8A97AD] hover:text-[#E8EEF7] underline cursor-pointer self-start"
          >
            Reset demo data
          </button>
        </div>
      </div>
    </div>
  );
};
