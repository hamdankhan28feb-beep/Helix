import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  HELP_ME_NOW_PROTOCOLS,
  HelpSymptomProtocol,
} from '../../data/fixtures';
import { Button } from '../ui/Primitives';

interface HelpMeNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSurgeonPacket: (note: string) => void;
}

export const HelpMeNowModal: React.FC<HelpMeNowModalProps> = ({
  isOpen,
  onClose,
  onOpenSurgeonPacket,
}) => {
  const [selected, setSelected] = useState<HelpSymptomProtocol | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (timerSeconds === null || timerSeconds <= 0) return;
    const t = setInterval(() => {
      setTimerSeconds((s) => (s !== null && s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [timerSeconds]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#070B14] text-[#E8EEF7] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Help me now guided support"
    >
      <div className="max-w-2xl mx-auto px-5 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <span className="text-xs font-medium text-[#7FB2FF]">
              Calm Self-Care Guide · Works Offline
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-[#E8EEF7]">
              {selected ? selected.label : 'What are you feeling?'}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setTimerSeconds(null);
              onClose();
            }}
            className="p-2.5 rounded-2xl bg-[#151E2E] border border-white/10 text-[#8A97AD] hover:text-[#E8EEF7] cursor-pointer"
            aria-label="Close Help me now"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Step 1: Large Touch Targets */}
        {!selected && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-[#8A97AD]">
              Pick what feels closest right now. HELIX does not diagnose—it walks you through safe first steps and when to call the flight surgeon.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HELP_ME_NOW_PROTOCOLS.map((proto) => (
                <button
                  key={proto.id}
                  type="button"
                  onClick={() => {
                    setSelected(proto);
                    setTimerSeconds(null);
                  }}
                  className="p-5 rounded-2xl cockpit-panel hover:border-[#7FB2FF]/60 text-left transition-colors cursor-pointer min-h-[96px]"
                >
                  <p className="text-base font-semibold text-[#E8EEF7]">
                    {proto.label}
                  </p>
                  <p className="mt-1 text-xs text-[#8A97AD]">{proto.sublabel}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Safe Self-Care + Retest + Escalation */}
        {selected && (
          <div className="mt-6 space-y-6">
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setTimerSeconds(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7FB2FF] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Pick a different feeling</span>
            </button>

            {/* Safe Self-Care Steps */}
            <div className="p-5 rounded-3xl cockpit-panel space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#3DE0C5]">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Safe first steps (do these calmly)</span>
              </div>
              <ol className="space-y-3 text-sm text-[#E8EEF7]/90 list-decimal list-inside">
                {selected.selfCareSteps.map((step, i) => (
                  <li key={i} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Retest Timing */}
            <div className="p-5 rounded-3xl cockpit-panel flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#7FB2FF]">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  <span>Retest in {selected.retestMinutes} minutes</span>
                </div>
                <p className="mt-1 text-xs text-[#8A97AD]">
                  Rest quietly first, then check again to see if the feeling eases.
                </p>
              </div>
              {timerSeconds === null ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setTimerSeconds(selected.retestMinutes * 60)}
                >
                  Start {selected.retestMinutes}m timer
                </Button>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-[#070B14] border border-[#7FB2FF]/40 font-mono-tabular text-lg font-semibold text-[#7FB2FF]">
                  {timerSeconds === 0 ? 'Ready to retest' : formatTimer(timerSeconds)}
                </div>
              )}
            </div>

            {/* When to Contact Flight Surgeon */}
            <div className="p-5 rounded-3xl bg-[#FF6B5E]/10 border border-[#FF6B5E]/35 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#FF6B5E]">
                <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                <span>When to contact the flight surgeon right away</span>
              </div>
              <ul className="space-y-2 text-sm text-[#E8EEF7]/90 list-disc list-inside">
                {selected.escalateSigns.map((sign, i) => (
                  <li key={i}>{sign}</li>
                ))}
              </ul>
              <div className="pt-2">
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    const note = `Crew used Help Me Now for: ${selected.label}.`;
                    setSelected(null);
                    onClose();
                    onOpenSurgeonPacket(note);
                  }}
                >
                  Prepare Flight Surgeon Packet
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
