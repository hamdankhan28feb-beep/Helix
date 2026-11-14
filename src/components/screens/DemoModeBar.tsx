import React from 'react';
import { Pause, Play, RotateCcw, X, Zap } from 'lucide-react';
import { DEMO_CHOREOGRAPHY } from '../../data/fixtures';
import { cn } from '../../lib/utils';

interface DemoModeBarProps {
  active: boolean;
  playing: boolean;
  currentSec: number;
  speed: 1 | 2;
  onTogglePlay: () => void;
  onSeek: (sec: number) => void;
  onChangeSpeed: (s: 1 | 2) => void;
  onInjectStressor: (type: 'solar' | 'co2' | 'sleep' | 'eva') => void;
  onExit: () => void;
}

export const DemoModeBar: React.FC<DemoModeBarProps> = ({
  active,
  playing,
  currentSec,
  speed,
  onTogglePlay,
  onSeek,
  onChangeSpeed,
  onInjectStressor,
  onExit,
}) => {
  if (!active) return null;

  const currentFrame =
    DEMO_CHOREOGRAPHY.slice()
      .reverse()
      .find((k) => currentSec >= k.timeSec) || DEMO_CHOREOGRAPHY[0];

  return (
    <div
      className="w-full bg-[#151E2E] border-b border-[#7FB2FF]/35"
      role="region"
      aria-label="90-second Demo Mode controller"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Caption + Progress */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onTogglePlay}
            className="p-2 rounded-xl bg-[#7FB2FF] text-[#070B14] hover:bg-[#99C2FF] cursor-pointer shrink-0"
            aria-label={playing ? 'Pause demo' : 'Play demo'}
          >
            {playing ? (
              <Pause className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Play className="w-4 h-4" aria-hidden="true" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#E8EEF7] truncate">
              {currentFrame.caption}
            </p>
            <div className="mt-1.5 flex items-center gap-2.5">
              <input
                type="range"
                min={0}
                max={90}
                value={currentSec}
                onChange={(e) => onSeek(Number(e.target.value))}
                aria-label="Demo timeline scrubber"
                className="flex-1 accent-[#7FB2FF] cursor-pointer h-1.5"
              />
              <span className="font-mono-tabular text-[11px] text-[#8A97AD] shrink-0">
                {String(Math.floor(currentSec)).padStart(2, '0')}s / 90s
              </span>
            </div>
          </div>
        </div>

        {/* Stressor Injector + Speed + Exit */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <span className="text-[11px] text-[#8A97AD] inline-flex items-center gap-1 mr-1">
            <Zap className="w-3 h-3 text-[#FFB547]" aria-hidden="true" />
            Inject:
          </span>
          {(
            [
              { id: 'solar', label: 'Solar flare' },
              { id: 'co2', label: 'CO₂ drift' },
              { id: 'sleep', label: 'Sleep loss' },
              { id: 'eva', label: 'EVA strain' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => onInjectStressor(st.id)}
              className="px-2 py-1 rounded-lg text-[11px] font-medium bg-[#070B14] border border-white/10 text-[#E8EEF7] hover:border-[#FFB547]/60 cursor-pointer"
            >
              {st.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onChangeSpeed(speed === 1 ? 2 : 1)}
            className={cn(
              'px-2 py-1 rounded-lg text-[11px] font-mono-tabular border cursor-pointer',
              speed === 2
                ? 'bg-[#7FB2FF]/20 border-[#7FB2FF]/50 text-[#7FB2FF]'
                : 'bg-[#070B14] border-white/10 text-[#8A97AD]'
            )}
          >
            {speed}x
          </button>

          <button
            type="button"
            onClick={() => onSeek(0)}
            className="p-1.5 rounded-lg text-[#8A97AD] hover:text-[#E8EEF7] cursor-pointer"
            aria-label="Restart demo"
            title="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onExit}
            className="p-1.5 rounded-lg text-[#8A97AD] hover:text-[#FF6B5E] cursor-pointer"
            aria-label="Exit demo mode"
            title="Exit demo"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
