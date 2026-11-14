import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import { calculateWhatIfDelta, cn } from '../../lib/utils';
import {
  BodyRegion,
  RegionId,
  RunwayItem,
  WhatIfAdjustments,
} from '../../types/helix';
import { RunwayProjectionChart } from '../charts/SparklineAndCharts';
import { Button } from '../ui/Primitives';

interface WhyAndWhatIfModalProps {
  isOpen: boolean;
  mode: 'why' | 'whatif';
  regionId: RegionId;
  regions: BodyRegion[];
  runwayItems: Array<RunwayItem & { deltaDays: number }>;
  adjustments: WhatIfAdjustments;
  onChangeMode: (m: 'why' | 'whatif') => void;
  onChangeAdjustments: (next: WhatIfAdjustments) => void;
  onClose: () => void;
}

const SLIDER_CONTROLS: Array<{
  key: keyof WhatIfAdjustments;
  label: string;
  effect: string;
}> = [
  {
    key: 'sleepPlus90',
    label: 'Sleep +90 minutes tonight',
    effect: 'Lengthens Mind & Sleep (+6d), Heart (+3d), Brain (+2d)',
  },
  {
    key: 'exerciseBoost',
    label: 'Complete ARED + cycle block',
    effect: 'Lengthens Bones & Muscles (+8d), Heart (+4d)',
  },
  {
    key: 'lighterWorkload',
    label: 'Lighter afternoon workload',
    effect: 'Lengthens Mind & Sleep (+4d), Immune (+2d)',
  },
  {
    key: 'hydrationNutrition',
    label: '+500 ml electrolyte + fiber meal',
    effect: 'Lengthens Gut (+5d), Heart (+3d), Balance (+2d)',
  },
  {
    key: 'lightShift',
    label: 'Morning bright-light schedule anchor',
    effect: 'Lengthens Mind & Sleep (+5d), Brain & Eyes (+2d)',
  },
];

export const WhyAndWhatIfModal: React.FC<WhyAndWhatIfModalProps> = ({
  isOpen,
  mode,
  regionId,
  regions,
  runwayItems,
  adjustments,
  onChangeMode,
  onChangeAdjustments,
  onClose,
}) => {
  if (!isOpen) return null;

  const activeRunway =
    runwayItems.find((r) => r.regionId === regionId) ||
    runwayItems.find((r) => r.days !== null) ||
    runwayItems[0];

  const activeRegion = regions.find((r) => r.id === activeRunway.regionId);
  const baseDays = activeRunway.days !== null ? activeRunway.days - activeRunway.deltaDays : 30;
  const bonusDays = activeRegion ? calculateWhatIfDelta(activeRegion, adjustments) : 0;
  const projectedDays = baseDays + bonusDays;

  const toggleAdjustment = (key: keyof WhatIfAdjustments) => {
    onChangeAdjustments({
      ...adjustments,
      [key]: !adjustments[key],
    });
  };

  const resetAdjustments = () => {
    onChangeAdjustments({
      sleepPlus90: false,
      exerciseBoost: false,
      lighterWorkload: false,
      hydrationNutrition: false,
      lightShift: false,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#070B14]/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Why and What-if Simulator"
    >
      <div className="w-full max-w-2xl rounded-3xl cockpit-panel-elevated p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* Header + Mode Switcher */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div className="inline-flex items-center p-1 rounded-xl bg-[#070B14] border border-white/10">
            <button
              type="button"
              onClick={() => onChangeMode('why')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer',
                mode === 'why' ? 'bg-[#151E2E] text-[#E8EEF7]' : 'text-[#8A97AD]'
              )}
            >
              Why this runway?
            </button>
            <button
              type="button"
              onClick={() => onChangeMode('whatif')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer',
                mode === 'whatif' ? 'bg-[#151E2E] text-[#E8EEF7]' : 'text-[#8A97AD]'
              )}
            >
              What-if simulator
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A97AD] hover:text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* WHY CARD */}
        {mode === 'why' && (
          <div className="mt-5 space-y-5">
            <div>
              <span className="text-xs text-[#7FB2FF] font-medium">
                {activeRunway.regionName}
              </span>
              <h2 className="mt-1 text-xl font-semibold text-[#E8EEF7]">
                Top 3 contributing signals
              </h2>
              <p className="mt-1 text-xs text-[#8A97AD]">
                These readings explain why your runway sits at{' '}
                <span className="font-mono-tabular text-[#E8EEF7]">
                  {activeRunway.days !== null ? `~${activeRunway.days} days` : 'Stable'}
                </span>
                .
              </p>
            </div>

            <div className="space-y-3">
              {activeRunway.topSignals.map((sig) => (
                <div
                  key={sig.label}
                  className="p-3.5 rounded-2xl bg-[#070B14]/70 border border-white/[0.08]"
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-2">
                    <span className="font-medium text-[#E8EEF7]">{sig.label}</span>
                    <span className="font-mono-tabular text-[#FFB547]">
                      {sig.deltaText}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#7FB2FF] transition-all duration-300"
                      style={{ width: `${sig.weight}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Crossing Point Chart */}
            <div className="p-4 rounded-2xl bg-[#070B14]/70 border border-white/[0.08]">
              <h3 className="text-xs font-semibold text-[#E8EEF7] mb-2">
                Trend, threshold & crossing point
              </h3>
              <RunwayProjectionChart
                currentDays={baseDays}
                projectedDays={projectedDays}
                thresholdDays={activeRunway.thresholdDays}
                regionName={activeRunway.regionName}
              />
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="primary" onClick={() => onChangeMode('whatif')}>
                Try What-if improvements
              </Button>
            </div>
          </div>
        )}

        {/* WHAT-IF SLIDERS / ACTIONS */}
        {mode === 'whatif' && (
          <div className="mt-5 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#E8EEF7]">
                  What-if recovery simulator
                </h2>
                <p className="mt-1 text-xs text-[#8A97AD]">
                  Toggle countermeasures to see how your runway bars lengthen before applying them.
                </p>
              </div>
              <button
                type="button"
                onClick={resetAdjustments}
                className="inline-flex items-center gap-1.5 text-xs text-[#8A97AD] hover:text-[#E8EEF7] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {SLIDER_CONTROLS.map((ctrl) => {
                const enabled = adjustments[ctrl.key];
                return (
                  <button
                    key={ctrl.key}
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    onClick={() => toggleAdjustment(ctrl.key)}
                    className={cn(
                      'w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-4 transition-colors cursor-pointer',
                      enabled
                        ? 'bg-[#3DE0C5]/10 border-[#3DE0C5]/45'
                        : 'bg-[#070B14]/65 border-white/10 hover:border-white/25'
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#E8EEF7]">{ctrl.label}</p>
                      <p className="text-xs text-[#8A97AD] mt-0.5">{ctrl.effect}</p>
                    </div>
                    <div
                      className={cn(
                        'w-11 h-6 rounded-full p-0.5 transition-colors shrink-0',
                        enabled ? 'bg-[#3DE0C5]' : 'bg-white/15'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full bg-[#070B14] transition-transform',
                          enabled ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Animated Runway Preview Bars */}
            <div className="p-4 rounded-2xl bg-[#070B14]/75 border border-white/[0.08] space-y-2.5">
              <p className="text-xs font-semibold text-[#E8EEF7]">
                Projected runway changes
              </p>
              {runwayItems
                .filter((i) => i.days !== null)
                .map((item) => {
                  const pct = Math.min(96, ((item.days || 0) / 30) * 100);
                  return (
                    <div key={item.regionId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#E8EEF7]">{item.regionName}</span>
                        <div className="flex items-center gap-2 font-mono-tabular">
                          <span className="text-[#8A97AD]">~{item.days}d</span>
                          {item.deltaDays > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-[#3DE0C5]/15 text-[#3DE0C5] text-[10px] font-semibold">
                              +{item.deltaDays}d
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#3DE0C5] transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
