import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ENVIRONMENT_CONFIG } from '../../lib/tokens';
import { cn } from '../../lib/utils';
import { ExperienceLevel, MissionEnvironment } from '../../types/helix';
import { Button } from '../ui/Primitives';

interface WelcomeProfileScreenProps {
  initialName?: string;
  initialEnvironment: MissionEnvironment;
  initialExperience: ExperienceLevel;
  onComplete: (profile: {
    name: string;
    environment: MissionEnvironment;
    experience: ExperienceLevel;
  }) => void;
}

const EXPERIENCE_OPTIONS: Array<{
  id: ExperienceLevel;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'novice',
    title: "I'm new to this",
    subtitle: 'Plain everyday language, simple step-by-step explanations, and calm self-care guides.',
  },
  {
    id: 'basics',
    title: 'I know the basics',
    subtitle: 'Clear trends paired with key mission indicators and concise explanations.',
  },
  {
    id: 'experienced',
    title: "I'm experienced",
    subtitle: 'Full physiological metrics, clinical reference bounds, and direct NASA source citations.',
  },
];

export const WelcomeProfileScreen: React.FC<WelcomeProfileScreenProps> = ({
  initialName = 'Maya Lin',
  initialEnvironment,
  initialExperience,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(initialName);
  const [environment, setEnvironment] = useState<MissionEnvironment>(initialEnvironment);
  const [experience, setExperience] = useState<ExperienceLevel>(initialExperience);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        setNameError('Please enter your first name or callsign.');
        return;
      }
      setNameError(null);
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      onComplete({
        name: name.trim(),
        environment,
        experience,
      });
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#070B14] text-[#E8EEF7] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl cockpit-panel p-6 sm:p-8">
        {/* Progress Dots */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-[#8A97AD]">Step {step} of 3</span>
          <div className="flex items-center gap-2" aria-label={`Step ${step} of 3`}>
            {[1, 2, 3].map((dot) => (
              <span
                key={dot}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  dot === step ? 'w-6 bg-[#7FB2FF]' : dot < step ? 'w-2.5 bg-[#3DE0C5]' : 'w-2.5 bg-white/15'
                )}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#E8EEF7] tracking-tight">
              What should HELIX call you?
            </h1>
            <p className="mt-2 text-sm text-[#8A97AD]">
              Your name personalizes your baseline and flight surgeon packets.
            </p>
            <div className="mt-6">
              <label htmlFor="profile-name" className="sr-only">
                Your name
              </label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                placeholder="Enter your name"
                autoFocus
                className="w-full px-4 py-3.5 rounded-2xl bg-[#070B14] border border-white/14 text-base text-[#E8EEF7] focus:border-[#7FB2FF] focus:outline-none"
              />
              {nameError && (
                <p role="alert" className="mt-2 text-xs text-[#FF6B5E]">
                  {nameError}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Mission Environment */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#E8EEF7] tracking-tight">
              Where are you flying today?
            </h1>
            <p className="mt-2 text-sm text-[#8A97AD]">
              Gravity and Earth comms delay tune your health twin automatically.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['transit', 'station', 'lunar', 'mars'] as MissionEnvironment[]).map(
                (envId) => {
                  const cfg = ENVIRONMENT_CONFIG[envId];
                  const active = environment === envId;
                  return (
                    <button
                      key={envId}
                      type="button"
                      onClick={() => setEnvironment(envId)}
                      className={cn(
                        'p-4 rounded-2xl text-left border transition-colors cursor-pointer',
                        active
                          ? 'bg-[#151E2E] border-[#7FB2FF] text-[#E8EEF7]'
                          : 'bg-[#070B14]/70 border-white/10 text-[#8A97AD] hover:border-white/25 hover:text-[#E8EEF7]'
                      )}
                      aria-pressed={active}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-[#E8EEF7]">
                          {cfg.label}
                        </span>
                        <span className="font-mono-tabular text-xs text-[#7FB2FF]">
                          {cfg.gravityLabel}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#8A97AD] leading-relaxed">
                        {cfg.earthDelayText}
                      </p>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Step 3: Experience Level */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#E8EEF7] tracking-tight">
              How comfortable are you with health metrics?
            </h1>
            <p className="mt-2 text-sm text-[#8A97AD]">
              This sets how simply or deeply HELIX explains every chart and body system.
            </p>
            <div className="mt-6 space-y-3">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const active = experience === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExperience(opt.id)}
                    className={cn(
                      'w-full p-4 rounded-2xl text-left border transition-colors cursor-pointer',
                      active
                        ? 'bg-[#151E2E] border-[#7FB2FF]'
                        : 'bg-[#070B14]/70 border-white/10 hover:border-white/25'
                    )}
                    aria-pressed={active}
                  >
                    <p className="font-semibold text-sm text-[#E8EEF7]">{opt.title}</p>
                    <p className="mt-1 text-xs text-[#8A97AD] leading-relaxed">
                      {opt.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back</span>
            </Button>
          ) : (
            <div />
          )}

          <Button type="button" variant="primary" onClick={handleNext}>
            <span>{step === 3 ? 'Enter Flight School' : 'Next'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </main>
  );
};
