import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Activity,
  Watch,
  Hand,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  BodyRegion,
  ExperienceLevel,
  Indicator,
} from '../../types/helix';
import { IndicatorTrendChart } from '../charts/SparklineAndCharts';
import {
  Button,
  EvidenceTagChip,
  GlossaryTerm,
  StatusIndicator,
} from '../ui/Primitives';

interface RegionDrawerProps {
  region: BodyRegion | null;
  indicators: Indicator[];
  experience: ExperienceLevel;
  colorBlindSafe: boolean;
  onClose: () => void;
  onMeasureIndicator: (indicatorId: string) => void;
}

function renderWithGlossary(text: string): React.ReactNode {
  const terms = ['SANS', 'HRV', 'ARED', 'ALARA', 'Otolith', 'pCO₂', 'Baseline'];
  const regex = new RegExp(`\\b(${terms.join('|')})\\b`, 'g');
  const parts = text.split(regex);
  return parts.map((part, idx) =>
    terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
      <GlossaryTerm key={idx} term={part} />
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    )
  );
}

export const RegionDrawer: React.FC<RegionDrawerProps> = ({
  region,
  indicators,
  experience,
  colorBlindSafe,
  onClose,
  onMeasureIndicator,
}) => {
  const [showDetails, setShowDetails] = useState(experience === 'experienced');
  const [chartMode, setChartMode] = useState<'baseline' | 'reference'>('baseline');
  const [openFiveQ, setOpenFiveQ] = useState<string | null>(null);

  useEffect(() => {
    setShowDetails(experience === 'experienced');
    setOpenFiveQ(null);
  }, [region?.id, experience]);

  useEffect(() => {
    if (!region) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [region, onClose]);

  if (!region) return null;

  const regionIndicators = indicators.filter((i) => i.regionId === region.id);

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`${region.name} details`}
    >
      <div
        className="fixed inset-0 bg-[#070B14]/60 transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-xl h-full overflow-y-auto cockpit-panel-elevated border-l border-white/10 p-5 sm:p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <StatusIndicator
                status={region.status}
                colorBlindSafe={colorBlindSafe}
              />
              <span className="text-xs font-mono-tabular text-[#8A97AD]">
                {region.runwayDays
                  ? `Runway ~${region.runwayDays} days`
                  : 'Runway Stable'}
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-[#E8EEF7] tracking-tight">
              {region.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A97AD] hover:text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
            aria-label="Close region drawer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Simple vs Detailed Explanation Toggle */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[#8A97AD]">
            {showDetails ? 'Detailed aerospace view' : 'Plain-language view'}
          </span>
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-[#070B14] border border-white/12 text-[#7FB2FF] hover:border-[#7FB2FF]/50 cursor-pointer"
          >
            {showDetails ? 'Explain simply' : 'Show details'}
          </button>
        </div>

        {/* Function & Spaceflight Effect */}
        <div className="space-y-3 text-sm leading-relaxed">
          <div className="p-4 rounded-2xl bg-[#070B14]/65 border border-white/[0.07]">
            <p className="text-xs font-medium text-[#7FB2FF] mb-1">What it does</p>
            <p className="text-[#E8EEF7]/90">
              {renderWithGlossary(
                showDetails ? region.detailedFunction : region.simpleFunction
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#070B14]/65 border border-white/[0.07]">
            <p className="text-xs font-medium text-[#FFB547] mb-1">
              How spaceflight affects it
            </p>
            <p className="text-[#E8EEF7]/90">
              {renderWithGlossary(
                showDetails
                  ? region.spaceflightEffect
                  : region.simpleSpaceflightEffect
              )}
            </p>
          </div>
        </div>

        {/* Linked Indicator Cards */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold text-[#E8EEF7]">
              Linked indicators ({regionIndicators.length})
            </h3>
            <div className="inline-flex items-center p-0.5 rounded-lg bg-[#070B14] border border-white/10 text-[11px]">
              <button
                type="button"
                onClick={() => setChartMode('baseline')}
                className={cn(
                  'px-2 py-1 rounded-md cursor-pointer',
                  chartMode === 'baseline'
                    ? 'bg-[#151E2E] text-[#E8EEF7]'
                    : 'text-[#8A97AD]'
                )}
              >
                My baseline
              </button>
              <button
                type="button"
                onClick={() => setChartMode('reference')}
                className={cn(
                  'px-2 py-1 rounded-md cursor-pointer',
                  chartMode === 'reference'
                    ? 'bg-[#151E2E] text-[#E8EEF7]'
                    : 'text-[#8A97AD]'
                )}
              >
                Reference range
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {regionIndicators.map((ind) => {
              const delta = Number((ind.value - ind.baseline).toFixed(2));
              const deltaSign = delta > 0 ? '+' : '';
              const fiveQOpen = openFiveQ === ind.id;

              return (
                <div
                  key={ind.id}
                  className="rounded-2xl bg-[#0E1522] border border-white/10 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#E8EEF7]">
                          {ind.name}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#8A97AD]">
                          {ind.source === 'auto' ? (
                            <>
                              <Watch className="w-3 h-3 text-[#7FB2FF]" aria-hidden="true" />
                              Auto from wrist sensor
                            </>
                          ) : (
                            <>
                              <Hand className="w-3 h-3 text-[#3DE0C5]" aria-hidden="true" />
                              You measure
                            </>
                          )}
                        </span>
                      </div>

                      <div className="mt-2 flex items-baseline gap-2.5 flex-wrap">
                        <span className="font-mono-tabular text-3xl font-semibold text-[#E8EEF7]">
                          {ind.value}
                        </span>
                        <span className="font-mono-tabular text-xs text-[#8A97AD]">
                          {ind.unit}
                        </span>
                        <StatusIndicator
                          status={ind.status}
                          colorBlindSafe={colorBlindSafe}
                          compact
                        />
                        <span className="font-mono-tabular text-xs text-[#8A97AD]">
                          ({deltaSign}
                          {delta} vs <GlossaryTerm term="Baseline">baseline</GlossaryTerm>{' '}
                          {ind.baseline})
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => onMeasureIndicator(ind.id)}
                    >
                      <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Measure</span>
                    </Button>
                  </div>

                  <p className="text-xs text-[#8A97AD]">{ind.simpleSummary}</p>

                  {/* 7-Day Trend Chart */}
                  <IndicatorTrendChart
                    series={ind.series}
                    baseline={ind.baseline}
                    referenceRange={ind.referenceRange}
                    unit={ind.unit}
                    status={ind.status}
                    mode={chartMode}
                    colorBlindSafe={colorBlindSafe}
                  />

                  <p className="text-[11px] text-[#8A97AD]">
                    Reference source: {ind.referenceSource} ({ind.referenceRange.label})
                  </p>

                  {/* Five Questions Expandable Panel */}
                  <div className="pt-2 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setOpenFiveQ(fiveQOpen ? null : ind.id)}
                      aria-expanded={fiveQOpen}
                      className="w-full flex items-center justify-between text-xs font-medium text-[#7FB2FF] hover:underline cursor-pointer py-1"
                    >
                      <span>Five questions about {ind.shortName}</span>
                      {fiveQOpen ? (
                        <ChevronUp className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>

                    {fiveQOpen && (
                      <dl className="mt-2.5 space-y-2.5 text-xs">
                        <div>
                          <dt className="font-semibold text-[#E8EEF7]">
                            1. Can it be measured in space?
                          </dt>
                          <dd className="text-[#8A97AD] mt-0.5">
                            {ind.fiveQuestions.measurableInSpace}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-[#E8EEF7]">
                            2. Why is it needed?
                          </dt>
                          <dd className="text-[#8A97AD] mt-0.5">
                            {ind.fiveQuestions.whyNeeded}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-[#E8EEF7]">
                            3. How do hazards affect it?
                          </dt>
                          <dd className="text-[#8A97AD] mt-0.5">
                            {ind.fiveQuestions.hazardEffect}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-[#FF6B5E]">
                            4. When do I call the flight surgeon?
                          </dt>
                          <dd className="text-[#E8EEF7]/90 mt-0.5">
                            {ind.fiveQuestions.whenToCallSurgeon}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-[#3DE0C5]">
                            5. What can I do?
                          </dt>
                          <dd className="text-[#8A97AD] mt-0.5">
                            {ind.fiveQuestions.whatCanIDo}
                          </dd>
                        </div>
                      </dl>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* What To Do Recommendations */}
        <div>
          <h3 className="text-sm font-semibold text-[#E8EEF7] mb-2.5">
            What you can do
          </h3>
          <div className="space-y-2.5">
            {region.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-2xl bg-[#070B14]/65 border border-white/[0.08]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-[#E8EEF7]">{rec.title}</p>
                  <EvidenceTagChip tag={rec.evidence} />
                </div>
                <p className="mt-1 text-xs text-[#8A97AD] leading-relaxed">
                  {rec.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Did You Know + NASA Source */}
        <div className="p-4 rounded-2xl bg-[#7FB2FF]/8 border border-[#7FB2FF]/25 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7FB2FF]">
            <Lightbulb className="w-4 h-4" aria-hidden="true" />
            <span>Did you know?</span>
          </div>
          <p className="text-xs text-[#E8EEF7]/90 leading-relaxed">
            {region.didYouKnow}
          </p>
          <a
            href={region.nasaSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#7FB2FF] hover:underline pt-1"
          >
            <span>{region.nasaSourceLabel}</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
};
