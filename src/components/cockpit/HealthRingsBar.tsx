import React, { useState } from 'react';
import { Award, Plus, ShieldAlert, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { HealthRingsState } from '../../types/helix';
import { Button } from '../ui/Primitives';

interface HealthRingsBarProps {
  rings: HealthRingsState;
  onMeasureNow: () => void;
  onOpenSurgeonGuide: () => void;
  onIncrementRing: (key: 'move' | 'rest' | 'connect') => void;
}

const RING_CONFIG: Array<{
  key: 'measure' | 'move' | 'rest' | 'connect';
  label: string;
  color: string;
  actionHint: string;
}> = [
  { key: 'measure', label: 'Measure', color: '#7FB2FF', actionHint: 'Log any self-check' },
  { key: 'move', label: 'Move', color: '#3DE0C5', actionHint: 'Resistance or cardio block' },
  { key: 'rest', label: 'Rest', color: '#6CB6FF', actionHint: 'Wind-down or sleep check' },
  { key: 'connect', label: 'Connect', color: '#FFB547', actionHint: 'Crew meal or Earth note' },
];

function RingSvg({ progress, color }: { progress: number; color: string }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(1, Math.max(0, progress));

  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.09)"
        strokeWidth="3.5"
      />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 20 20)"
        className="transition-all duration-300"
      />
    </svg>
  );
}

export const HealthRingsBar: React.FC<HealthRingsBarProps> = ({
  rings,
  onMeasureNow,
  onOpenSurgeonGuide,
  onIncrementRing,
}) => {
  const [badgesOpen, setBadgesOpen] = useState(false);

  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#0E1522]/90">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Four Health Rings */}
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-center">
          {RING_CONFIG.map((cfg) => {
            const pct = Math.round(rings[cfg.key] * 100);
            const complete = pct >= 100;
            return (
              <button
                key={cfg.key}
                type="button"
                onClick={() => {
                  if (cfg.key === 'measure') onMeasureNow();
                  else onIncrementRing(cfg.key);
                }}
                title={`${cfg.label}: ${cfg.actionHint}`}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="relative flex items-center justify-center">
                  <RingSvg progress={rings[cfg.key]} color={cfg.color} />
                  <span className="absolute font-mono-tabular text-[10px] font-semibold text-[#E8EEF7]">
                    {complete ? '✓' : `${pct}%`}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-[#E8EEF7]">{cfg.label}</p>
                  <p className="text-[10px] text-[#8A97AD] hidden sm:block">
                    {complete ? 'Complete' : cfg.actionHint}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Streak & Calm Badges Trigger */}
          <button
            type="button"
            onClick={() => setBadgesOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#070B14]/70 border border-white/10 text-xs text-[#8A97AD] hover:text-[#E8EEF7] cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-[#3DE0C5]" aria-hidden="true" />
            <span className="font-mono-tabular">{rings.streakDays}d streak</span>
          </button>
        </div>

        {/* Right Actions: Measure now + Persistent Flight Surgeon Link */}
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <button
            type="button"
            onClick={onOpenSurgeonGuide}
            className="inline-flex items-center gap-1.5 text-xs text-[#8A97AD] hover:text-[#FF6B5E] transition-colors underline underline-offset-4 decoration-white/20 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            <span>When to contact the flight surgeon</span>
          </button>

          <Button type="button" variant="primary" onClick={onMeasureNow}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Measure now</span>
          </Button>
        </div>
      </div>

      {/* Streaks & Educational Badges Modal */}
      {badgesOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#070B14]/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Mission Health Streaks and Badges"
        >
          <div className="w-full max-w-md rounded-3xl cockpit-panel-elevated p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#E8EEF7]">
                  Steady Crew Habits
                </h3>
                <p className="text-xs text-[#8A97AD]">
                  Honest self-checks always count—even when a reading is in Caution.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBadgesOpen(false)}
                className="p-2 rounded-xl text-[#8A97AD] hover:text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
                aria-label="Close badges dialog"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#070B14]/70 border border-white/10 mb-4 flex items-center justify-between">
              <span className="text-sm text-[#E8EEF7]">Current self-check streak</span>
              <span className="font-mono-tabular text-lg font-semibold text-[#3DE0C5]">
                {rings.streakDays} days
              </span>
            </div>

            <div className="space-y-2.5">
              {rings.badges.map((b) => (
                <div
                  key={b.id}
                  className={cn(
                    'p-3 rounded-2xl border flex items-start gap-3',
                    b.earned
                      ? 'bg-[#151E2E] border-[#3DE0C5]/35'
                      : 'bg-[#070B14]/45 border-white/[0.06] opacity-60'
                  )}
                >
                  <Award
                    className={cn(
                      'w-4 h-4 mt-0.5 shrink-0',
                      b.earned ? 'text-[#3DE0C5]' : 'text-[#8A97AD]'
                    )}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-semibold text-[#E8EEF7]">{b.title}</p>
                    <p className="text-xs text-[#8A97AD] mt-0.5">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
