import React, { useState } from 'react';
import { Users, ArrowLeftRight, HeartHandshake, CheckCircle2, MessageSquare, X } from 'lucide-react';
import { ENVIRONMENT_CONFIG } from '../../lib/tokens';
import { cn } from '../../lib/utils';
import { CrewMember } from '../../types/helix';
import { Button, StatusIndicator } from '../ui/Primitives';

interface CrewScreenProps {
  crew: CrewMember[];
  colorBlindSafe: boolean;
  onBuddyCheckIn?: (crewName: string, promptText: string) => void;
}

const BUDDY_PROMPTS = [
  {
    id: 'galley_meal',
    title: 'Invite to shared galley meal',
    reason: 'NASA BHP research shows shared social downtime buffers mission isolation and stabilizes mood.',
    category: 'Social Support',
  },
  {
    id: 'workload_relief',
    title: 'Offer cross-check on EVA / maintenance schedule',
    reason: 'Secondary cross-checking lightens cognitive overload and supports mission teamwork standards.',
    category: 'Teamwork',
  },
  {
    id: 'window_time',
    title: 'Suggest 15-min quiet cupola window time',
    reason: 'Earth observation and unstructured quiet periods facilitate circadian and emotional reset.',
    category: 'Rest & Mental Health',
  },
  {
    id: 'sleep_checkin',
    title: 'Private check-in: "How are your sleep cycles holding up?"',
    reason: 'Discreet peer check-in helps catch sleep debt before cardiovascular or cognitive drift compounds.',
    category: 'Peer Care',
  },
];

export const CrewScreen: React.FC<CrewScreenProps> = ({
  crew,
  colorBlindSafe,
  onBuddyCheckIn,
}) => {
  const [sharedTestHr, setSharedTestHr] = useState(68);
  const [selectedBuddy, setSelectedBuddy] = useState<CrewMember | null>(null);
  const [nudgeSent, setNudgeSent] = useState<string | null>(null);
  const maya = crew[0];
  const jonah = crew[1];

  const handleSendNudge = (member: CrewMember, prompt: typeof BUDDY_PROMPTS[0]) => {
    if (onBuddyCheckIn) {
      onBuddyCheckIn(member.name, prompt.title);
    }
    setNudgeSent(`Buddy nudge sent to ${member.name}: "${prompt.title}" · Connect ring +25%`);
    setSelectedBuddy(null);
    setTimeout(() => setNudgeSent(null), 4000);
  };

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

              <div className="pt-2 border-t border-white/[0.06] space-y-2">
                <p className="text-[11px] text-[#8A97AD] leading-relaxed">
                  {m.note}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedBuddy(m)}
                  className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#0E1522] hover:bg-[#151E2E] border border-white/10 text-xs font-medium text-[#7FB2FF] transition-colors cursor-pointer"
                >
                  <HeartHandshake className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Buddy Check-in</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Confirmation Toast */}
      {nudgeSent && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#070B14]/95 border border-[#3DE0C5]/40 shadow-2xl flex items-center gap-3 text-xs text-[#E8EEF7] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#3DE0C5] shrink-0" aria-hidden="true" />
          <span>{nudgeSent}</span>
        </div>
      )}

      {/* Peer Buddy Check-in Prompt Modal */}
      {selectedBuddy && (
        <div
          className="fixed inset-0 z-50 bg-[#070B14]/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="buddy-modal-title"
        >
          <div className="w-full max-w-md rounded-3xl cockpit-panel-elevated p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[#7FB2FF]" aria-hidden="true" />
                <h3 id="buddy-modal-title" className="text-base font-semibold text-[#E8EEF7]">
                  Buddy Nudge: {selectedBuddy.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBuddy(null)}
                className="p-1 rounded-lg text-[#8A97AD] hover:text-[#E8EEF7] hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs text-[#8A97AD]">
              NASA Behavioral Health research recommends discreet peer check-ins during long-duration confinement to mitigate isolation and cognitive stress. Choose a prompt:
            </p>

            <div className="space-y-2.5">
              {BUDDY_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => handleSendNudge(selectedBuddy, prompt)}
                  className="w-full text-left p-3.5 rounded-2xl bg-[#070B14]/80 border border-white/10 hover:border-[#7FB2FF]/50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#E8EEF7] group-hover:text-[#7FB2FF]">
                      {prompt.title}
                    </span>
                    <span className="text-[10px] text-[#7FB2FF] bg-[#7FB2FF]/10 px-2 py-0.5 rounded-full">
                      {prompt.category}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#8A97AD] leading-relaxed">
                    {prompt.reason}
                  </p>
                </button>
              ))}
            </div>

            <div className="pt-2 text-center">
              <span className="text-[10px] text-[#8A97AD]">
                Check-ins are private within the crew and increment your Connect ring.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
