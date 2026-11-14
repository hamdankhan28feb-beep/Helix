import React, { useState } from 'react';
import { Users, ArrowLeftRight } from 'lucide-react';
import { ENVIRONMENT_CONFIG } from '../../lib/tokens';
import { cn } from '../../lib/utils';
import { CrewMember } from '../../types/helix';
import { StatusIndicator } from '../ui/Primitives';

interface CrewScreenProps {
  crew: CrewMember[];
  colorBlindSafe: boolean;
}

export const CrewScreen: React.FC<CrewScreenProps> = ({
  crew,
  colorBlindSafe,
}) => {
  const [sharedTestHr, setSharedTestHr] = useState(68);
  const maya = crew[0];
  const jonah = crew[1];

  const getRelativeStatus = (hr: number, base: number) => {
    const diff = hr - base;
    if (diff >= 14) return 'caution' as const;
    if (diff >= 8) return 'watch' as const;
    return 'nominal' as const;
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Same Value, Different Baseline Interactive Comparison */}
      {maya && jonah && (
        <section className="rounded-3xl cockpit-panel p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7FB2FF]">
                <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
                Same value, different baseline
              </span>
              <h2 className="mt-1 text-xl font-semibold text-[#E8EEF7]">
                Why HELIX compares you against yourself—not a chart average
              </h2>
              <p className="mt-1 text-sm text-[#8A97AD]">
                Slide the resting heart rate below to see how one identical reading means two very different things for two astronauts.
              </p>
            </div>

            <div className="shrink-0 bg-[#070B14] border border-white/10 rounded-2xl p-3.5 min-w-[230px]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="shared-hr-slider" className="text-[#8A97AD]">
                  Test reading
                </label>
                <span className="font-mono-tabular font-semibold text-[#E8EEF7]">
                  {sharedTestHr} bpm
                </span>
              </div>
              <input
                id="shared-hr-slider"
                type="range"
                min={50}
                max={84}
                value={sharedTestHr}
                onChange={(e) => setSharedTestHr(Number(e.target.value))}
                className="w-full accent-[#7FB2FF] cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[maya, jonah].map((member) => {
              const delta = sharedTestHr - member.restingHrBaseline;
              const status = getRelativeStatus(sharedTestHr, member.restingHrBaseline);
              return (
                <div
                  key={member.id}
                  className="p-4 rounded-2xl bg-[#070B14]/70 border border-white/[0.08] flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#E8EEF7]">
                        {member.name} · <span className="text-[#8A97AD] font-normal">{member.role}</span>
                      </p>
                      <p className="text-xs text-[#8A97AD] mt-0.5 font-mono-tabular">
                        Earth baseline: {member.restingHrBaseline} bpm
                      </p>
                    </div>
                    <StatusIndicator status={status} colorBlindSafe={colorBlindSafe} />
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="font-mono-tabular text-3xl font-semibold text-[#E8EEF7]">
                      {sharedTestHr}
                    </span>
                    <span className="text-xs text-[#8A97AD]">bpm</span>
                    <span
                      className={cn(
                        'font-mono-tabular text-xs font-medium',
                        delta >= 8 ? 'text-[#FFB547]' : 'text-[#3DE0C5]'
                      )}
                    >
                      ({delta >= 0 ? '+' : ''}
                      {delta} vs personal base)
                    </span>
                  </div>

                  <p className="text-xs text-[#8A97AD] leading-relaxed">{member.note}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Crew & Mission Context Cards */}
      <section aria-label="Crew context cards">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-[#7FB2FF]" aria-hidden="true" />
          <h2 className="text-base font-semibold text-[#E8EEF7]">
            Mission Crew Overview (4)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {crew.map((m) => (
            <article
              key={m.id}
              className="rounded-3xl cockpit-panel p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#151E2E] border border-white/10 flex items-center justify-center font-mono-tabular text-xs font-semibold text-[#7FB2FF]">
                    {m.avatarInitials}
                  </div>
                  <StatusIndicator
                    status={m.summaryStatus}
                    colorBlindSafe={colorBlindSafe}
                  />
                </div>

                <h3 className="text-base font-semibold text-[#E8EEF7]">{m.name}</h3>
                <p className="text-xs text-[#8A97AD]">
                  {m.role} · <span className="font-mono-tabular">{m.crewId}</span>
                </p>

                <div className="mt-4 pt-3 border-t border-white/[0.07] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8A97AD]">Environment</span>
                    <span className="text-[#E8EEF7]">
                      {ENVIRONMENT_CONFIG[m.environment].shortLabel} · Day {m.missionDay}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A97AD]">Resting HR</span>
                    <span className="font-mono-tabular text-[#E8EEF7]">
                      {m.restingHrCurrent} / {m.restingHrBaseline} bpm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A97AD]">Sleep</span>
                    <span className="font-mono-tabular text-[#E8EEF7]">
                      {m.sleepHoursCurrent}h / {m.sleepHoursBaseline}h
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A97AD]">Hip BMD</span>
                    <span className="font-mono-tabular text-[#E8EEF7]">
                      {m.boneDensityDelta}%
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#8A97AD] leading-relaxed pt-2 border-t border-white/[0.06]">
                {m.note}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
