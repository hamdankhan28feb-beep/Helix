import React, { useState } from 'react';
import { Award, CheckCircle2, Sparkles } from 'lucide-react';
import { STATUS_TOKENS } from '../../lib/tokens';
import { cn } from '../../lib/utils';
import { StatusLevel } from '../../types/helix';
import { Button, StatusIcon } from '../ui/Primitives';

interface FlightSchoolOverlayProps {
  currentStep: number;
  onChangeStep: (step: number) => void;
  onQuickMeasure: (value: number) => Promise<void>;
  onSkip: () => void;
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Rotate the body',
    body: 'Drag anywhere on your Ghost Twin to inspect it from any angle—or use the keyboard arrow buttons in the corner. The faint wireframe behind you is your healthy Earth baseline.',
    targetHint: 'Spotlight: 3D Ghost Twin Viewport',
  },
  {
    title: 'Tap a region',
    body: 'Click any glowing spot on the body (or press Tab along the region strip below) to zoom in and see what that system does in plain words.',
    targetHint: 'Spotlight: Body Region Hotspots',
  },
  {
    title: 'What the colors mean',
    body: 'HELIX pairs every color with an icon and label so you never have to guess. Calm teal means steady; bright amber or coral means check in.',
    targetHint: 'Legend: Color + Icon + Shape',
    showColorKey: true,
  },
  {
    title: 'Read the Runway',
    body: 'Look left: each slim gauge shows how many days a system can keep drifting before needing action ("~7 days" or "Stable"). Shortest runways sit at the top.',
    targetHint: 'Spotlight: Health Runway (Left)',
  },
  {
    title: 'What One Thing Today is',
    body: 'Look right: when you are tired in space, you only need one clear next step. Tap "Do it" to log it or "Why?" to see the exact signals behind it.',
    targetHint: 'Spotlight: One Thing Today (Right)',
  },
  {
    title: 'The Hazard Lens',
    body: 'Use the top chips (Radiation, Isolation, Distance, Gravity, Closed cabin) to see how spaceflight stressors touch connected organs—and when they stack.',
    targetHint: 'Spotlight: Hazard Lens Chips (Top)',
  },
  {
    title: 'Take your first real check',
    body: 'Enter a quick morning sleep reading (e.g., 7.5 hrs) right here and watch your Ghost Twin and Mind & Sleep Runway update live.',
    targetHint: 'Interactive Check: Updates Twin Live',
    isInteractiveMeasure: true,
  },
];

export const FlightSchoolOverlay: React.FC<FlightSchoolOverlayProps> = ({
  currentStep,
  onChangeStep,
  onQuickMeasure,
  onSkip,
  onComplete,
}) => {
  const [sleepInput, setSleepInput] = useState('7.4');
  const [measured, setMeasured] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cleared, setCleared] = useState(false);

  const step = STEPS[currentStep] || STEPS[0];

  const handleMeasureSubmit = async () => {
    const num = parseFloat(sleepInput);
    if (Number.isNaN(num)) return;
    setSubmitting(true);
    await onQuickMeasure(num);
    setSubmitting(false);
    setMeasured(true);
  };

  if (cleared) {
    return (
      <div
        className="fixed inset-0 z-50 bg-[#070B14]/85 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Cleared for flight"
      >
        <div className="w-full max-w-md rounded-3xl cockpit-panel-elevated p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#3DE0C5]/15 border border-[#3DE0C5]/40 flex items-center justify-center mb-5">
            <Award className="w-7 h-7 text-[#3DE0C5]" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-semibold text-[#E8EEF7]">
            You’re cleared for flight
          </h2>
          <p className="mt-2 text-sm text-[#8A97AD] leading-relaxed">
            Calm badge unlocked: <span className="text-[#E8EEF7] font-medium">Cleared for Flight</span>. You can replay Flight School anytime from the Help menu.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="mt-6 w-full"
            onClick={onComplete}
          >
            Open Flight Deck
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 pointer-events-none flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="false"
      aria-label={`Flight School step ${currentStep + 1} of ${STEPS.length}`}
    >
      {/* Soft Dimmed Backdrop */}
      <div className="fixed inset-0 bg-[#070B14]/55 pointer-events-auto" onClick={onSkip} />

      <div className="relative z-10 pointer-events-auto w-full max-w-md rounded-3xl cockpit-panel-elevated p-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-medium text-[#7FB2FF] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Flight School · {currentStep + 1} of {STEPS.length}
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-[#8A97AD] hover:text-[#E8EEF7] cursor-pointer"
          >
            Skip for now
          </button>
        </div>

        <p className="text-[11px] font-mono-tabular text-[#8A97AD] mb-1.5">
          {step.targetHint}
        </p>

        <h2 className="text-xl font-semibold text-[#E8EEF7]">{step.title}</h2>
        <p className="mt-2 text-sm text-[#E8EEF7]/85 leading-relaxed">{step.body}</p>

        {step.showColorKey && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(['nominal', 'watch', 'caution', 'escalate'] as StatusLevel[]).map((st) => (
              <div
                key={st}
                className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-[#070B14]/80 border border-white/10 text-xs"
              >
                <StatusIcon status={st} />
                <span className="font-medium text-[#E8EEF7]">
                  {STATUS_TOKENS[st].label}
                </span>
              </div>
            ))}
          </div>
        )}

        {step.isInteractiveMeasure && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#070B14]/80 border border-white/10">
            <label htmlFor="fs-sleep" className="block text-xs text-[#8A97AD] mb-2">
              Last night’s sleep (hours)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="fs-sleep"
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={sleepInput}
                onChange={(e) => setSleepInput(e.target.value)}
                className="w-24 px-3 py-2 rounded-xl bg-[#151E2E] border border-white/15 font-mono-tabular text-base text-[#E8EEF7]"
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={submitting}
                onClick={handleMeasureSubmit}
              >
                {measured ? 'Updated!' : submitting ? 'Saving…' : 'Log & Update Twin'}
              </Button>
            </div>
            {measured && (
              <p className="mt-2 text-xs text-[#3DE0C5] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                Ghost Twin and Mind & Sleep Runway updated live.
              </p>
            )}
          </div>
        )}

        {/* Progress Dots + Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChangeStep(i)}
                aria-label={`Go to Flight School step ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all cursor-pointer',
                  i === currentStep ? 'w-5 bg-[#7FB2FF]' : 'w-1.5 bg-white/20 hover:bg-white/40'
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChangeStep(currentStep - 1)}
              >
                Back
              </Button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => onChangeStep(currentStep + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setCleared(true)}
              >
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
