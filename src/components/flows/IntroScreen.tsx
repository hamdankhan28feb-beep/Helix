import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { cabinAudio } from '../../lib/api';
import { Button } from '../ui/Primitives';

interface IntroScreenProps {
  reduceMotion: boolean;
  ambientAudio: boolean;
  onToggleAudio: (enabled: boolean) => void;
  onComplete: () => void;
}

const STARS = Array.from({ length: 42 }).map((_, i) => ({
  id: i,
  cx: ((i * 73 + 19) % 100),
  cy: ((i * 47 + 11) % 100),
  r: (i % 3) * 0.45 + 0.6,
  delay: (i % 7) * 0.6,
}));

export const IntroScreen: React.FC<IntroScreenProps> = ({
  reduceMotion,
  ambientAudio,
  onToggleAudio,
  onComplete,
}) => {
  const [stage, setStage] = useState<'orbit' | 'mark' | 'ready'>(
    reduceMotion ? 'ready' : 'orbit'
  );

  useEffect(() => {
    if (reduceMotion) {
      setStage('ready');
      return;
    }
    const t1 = setTimeout(() => setStage('mark'), 1200);
    const t2 = setTimeout(() => setStage('ready'), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduceMotion]);

  const handleToggleAudio = () => {
    const next = !ambientAudio;
    cabinAudio.toggle(next);
    onToggleAudio(next);
  };

  return (
    <main className="relative min-h-screen w-full bg-[#070B14] text-[#E8EEF7] flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Quiet Breathing Starfield */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {STARS.map((s) => (
          <circle
            key={s.id}
            cx={s.cx}
            cy={s.cy}
            r={s.r * 0.14}
            fill="#E8EEF7"
            opacity={reduceMotion ? 0.25 : 0.32}
          >
            {!reduceMotion && (
              <animate
                attributeName="opacity"
                values="0.12;0.42;0.12"
                dur={`${5 + (s.id % 4)}s`}
                begin={`${s.delay}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
        ))}

        {/* Thin Orbit Line Drawing */}
        <motion.ellipse
          cx="50"
          cy="50"
          rx="42"
          ry="16"
          transform="rotate(-14 50 50)"
          fill="none"
          stroke="#7FB2FF"
          strokeWidth="0.14"
          strokeOpacity="0.45"
          initial={{ pathLength: reduceMotion ? 1 : 0, opacity: reduceMotion ? 0.5 : 0 }}
          animate={{ pathLength: 1, opacity: 0.55 }}
          transition={{ duration: reduceMotion ? 0 : 2.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      {/* Top Controls: Audio (OFF by default) + Skip */}
      <div className="absolute top-6 right-6 left-6 flex items-center justify-between z-10">
        <button
          type="button"
          onClick={handleToggleAudio}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E1522] border border-white/10 text-xs text-[#8A97AD] hover:text-[#E8EEF7] transition-colors cursor-pointer"
          aria-pressed={ambientAudio}
          aria-label="Toggle subtle ambient cabin audio"
        >
          {ambientAudio ? (
            <Volume2 className="w-3.5 h-3.5 text-[#7FB2FF]" aria-hidden="true" />
          ) : (
            <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span>Ambient audio: {ambientAudio ? 'On' : 'Off'}</span>
        </button>

        <button
          type="button"
          onClick={onComplete}
          className="px-3 py-1.5 text-xs font-medium text-[#8A97AD] hover:text-[#E8EEF7] transition-colors cursor-pointer"
        >
          Skip intro
        </button>
      </div>

      {/* Center HELIX Mark & Tagline */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        <motion.div
          initial={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.94 }}
          animate={{ opacity: stage === 'orbit' ? 0.3 : 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* Minimalist Helix Instrument Emblem */}
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            className="mb-6"
            aria-hidden="true"
          >
            <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <path
              d="M17 16C25 22 31 34 39 40M39 16C31 22 25 34 17 40"
              stroke="#7FB2FF"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="28" cy="28" r="3.2" fill="#3DE0C5" />
          </svg>

          <h1 className="text-4xl sm:text-5xl font-semibold tracking-[0.22em] text-[#E8EEF7] pl-[0.22em]">
            HELIX
          </h1>
          <p className="mt-3 text-base sm:text-lg text-[#8A97AD] font-normal">
            Your body’s flight computer
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: stage === 'ready' ? 1 : 0, y: stage === 'ready' ? 0 : 8 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={onComplete}
            className="px-9"
          >
            Begin
          </Button>
        </motion.div>
      </div>
    </main>
  );
};
