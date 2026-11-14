import React from 'react';
import { SlidersHorizontal, HelpCircle } from 'lucide-react';
import { cn, getStatusColor } from '../../lib/utils';
import { RegionId, RunwayItem } from '../../types/helix';
import { Sparkline } from '../charts/SparklineAndCharts';
import { StatusIcon } from '../ui/Primitives';

interface HealthRunwayPanelProps {
  items: Array<RunwayItem & { deltaDays: number }>;
  selectedRegionId: RegionId | null;
  colorBlindSafe: boolean;
  highlightedCoachStep?: number | null;
  onSelectRegion: (id: RegionId) => void;
  onOpenWhy: (regionId: RegionId) => void;
  onOpenWhatIf: () => void;
}

export const HealthRunwayPanel: React.FC<HealthRunwayPanelProps> = ({
  items,
  selectedRegionId,
  colorBlindSafe,
  highlightedCoachStep,
  onSelectRegion,
  onOpenWhy,
  onOpenWhatIf,
}) => {
  // Shortest runway first, stable items underneath
  const sorted = items.slice().sort((a, b) => {
    if (a.days === null && b.days === null) return 0;
    if (a.days === null) return 1;
    if (b.days === null) return -1;
    return a.days - b.days;
  });

  const shortestId = sorted.find((i) => i.days !== null)?.regionId;

  return (
    <aside
      aria-label="Health Runway"
      className={cn(
        'rounded-3xl cockpit-panel p-4 sm:p-5 flex flex-col justify-between gap-4',
        highlightedCoachStep === 3 && 'ring-2 ring-[#7FB2FF]'
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#E8EEF7]">Health Runway</h2>
            <p className="text-xs text-[#8A97AD] mt-0.5">
              How long until a trend may need attention
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenWhatIf}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#151E2E] text-[#7FB2FF] border border-white/10 hover:border-[#7FB2FF]/45 transition-colors cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>What-if</span>
          </button>
        </div>

        <div className="space-y-2">
          {sorted.map((item) => {
            const color = getStatusColor(item.status, colorBlindSafe);
            const isShortest = item.regionId === shortestId;
            const isSelected = selectedRegionId === item.regionId;
            const fillPct =
              item.days === null ? 92 : Math.min(95, Math.max(12, (item.days / 30) * 100));

            return (
              <div
                key={item.regionId}
                className={cn(
                  'group rounded-2xl p-2.5 border transition-colors',
                  isSelected
                    ? 'bg-[#151E2E] border-[#7FB2FF]/50'
                    : 'bg-[#070B14]/55 border-white/[0.06] hover:border-white/15',
                  isShortest && 'animate-single-pulse'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectRegion(item.regionId)}
                    className="flex items-center gap-2 min-w-0 text-left cursor-pointer flex-1"
                  >
                    <StatusIcon status={item.status} colorBlindSafe={colorBlindSafe} />
                    <span className="text-xs font-medium text-[#E8EEF7] truncate">
                      {item.regionName}
                    </span>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <Sparkline
                      values={item.sparkline}
                      status={item.status}
                      colorBlindSafe={colorBlindSafe}
                      width={44}
                      height={16}
                      label={`${item.regionName} 7-day trend`}
                    />
                    <span
                      className="font-mono-tabular text-xs font-semibold min-w-[54px] text-right"
                      style={{ color }}
                    >
                      {item.days !== null ? `~${item.days}d` : 'Stable'}
                    </span>
                    {item.deltaDays > 0 && (
                      <span className="font-mono-tabular text-[10px] text-[#3DE0C5]">
                        +{item.deltaDays}d
                      </span>
                    )}
                  </div>
                </div>

                {/* Slim Fuel Gauge Bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${fillPct}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] text-[#8A97AD] whitespace-nowrap"
                    title={`Confidence: ${item.confidence}`}
                  >
                    {item.confidence === 'high'
                      ? 'High conf'
                      : item.confidence === 'medium'
                      ? 'Med conf'
                      : 'Low conf'}
                  </span>
                  {item.days !== null && (
                    <button
                      type="button"
                      onClick={() => onOpenWhy(item.regionId)}
                      className="text-[10px] text-[#7FB2FF] hover:underline cursor-pointer inline-flex items-center gap-0.5"
                      aria-label={`Why is ${item.regionName} at ${item.days} days`}
                    >
                      <HelpCircle className="w-2.5 h-2.5" aria-hidden="true" />
                      <span>Why?</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-[#8A97AD] leading-relaxed pt-2 border-t border-white/[0.06]">
        Simple projection from synthetic data; demo trend marker, not a medical forecast.
      </p>
    </aside>
  );
};
