import { useState } from 'react';
import { getStatusColor } from '../../lib/utils';
import { IndicatorPoint, StatusLevel } from '../../types/helix';

export function Sparkline({
  values,
  status,
  colorBlindSafe = false,
  width = 64,
  height = 20,
  label,
}: {
  values: number[];
  status: StatusLevel;
  colorBlindSafe?: boolean;
  width?: number;
  height?: number;
  label?: string;
}) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 2;

  const points = values
    .map((val, idx) => {
      const x = pad + (idx / (values.length - 1)) * (width - pad * 2);
      const y = height - pad - ((val - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const lastX = width - pad;
  const lastY =
    height - pad - ((values[values.length - 1] - min) / span) * (height - pad * 2);
  const color = getStatusColor(status, colorBlindSafe);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
      role="img"
      aria-label={label || '7-day trend sparkline'}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        opacity="0.9"
      />
      <circle cx={lastX} cy={lastY} r="2.2" fill={color} />
    </svg>
  );
}

export function IndicatorTrendChart({
  series,
  baseline,
  referenceRange,
  unit,
  status,
  mode,
  colorBlindSafe = false,
}: {
  series: IndicatorPoint[];
  baseline: number;
  referenceRange: { min: number; max: number; label: string };
  unit: string;
  status: StatusLevel;
  mode: 'baseline' | 'reference';
  colorBlindSafe?: boolean;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 360;
  const height = 148;
  const padL = 36;
  const padR = 14;
  const padT = 16;
  const padB = 26;

  const allVals = [
    ...series.map((s) => s.value),
    baseline,
    ...(mode === 'reference' ? [referenceRange.min, referenceRange.max] : []),
  ];
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const padding = (maxV - minV || 1) * 0.18;
  const yMin = minV - padding;
  const yMax = maxV + padding;
  const ySpan = yMax - yMin || 1;

  const toX = (idx: number) =>
    padL + (idx / Math.max(1, series.length - 1)) * (width - padL - padR);
  const toY = (val: number) =>
    height - padB - ((val - yMin) / ySpan) * (height - padT - padB);

  const lineColor = getStatusColor(status, colorBlindSafe);
  const pathPoints = series
    .map((pt, i) => `${toX(i).toFixed(1)},${toY(pt.value).toFixed(1)}`)
    .join(' ');

  const areaPoints = `${toX(0).toFixed(1)},${height - padB} ${pathPoints} ${toX(
    series.length - 1
  ).toFixed(1)},${height - padB}`;

  const baselineY = toY(baseline);
  const refTopY = toY(referenceRange.max);
  const refBottomY = toY(referenceRange.min);

  const activePoint = hoverIdx !== null ? series[hoverIdx] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label={`7-day chart showing values compared to ${
          mode === 'baseline' ? 'personal baseline' : 'reference range'
        }`}
      >
        {/* Reference range band */}
        {mode === 'reference' && (
          <rect
            x={padL}
            y={Math.min(refTopY, refBottomY)}
            width={width - padL - padR}
            height={Math.max(4, Math.abs(refBottomY - refTopY))}
            fill="#3DE0C5"
            fillOpacity="0.1"
            rx="2"
          />
        )}

        {/* Baseline horizontal dashed guide */}
        <line
          x1={padL}
          x2={width - padR}
          y1={baselineY}
          y2={baselineY}
          stroke={mode === 'baseline' ? '#7FB2FF' : 'rgba(255,255,255,0.2)'}
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
        <text
          x={padL + 4}
          y={Math.max(padT + 8, baselineY - 5)}
          fill={mode === 'baseline' ? '#7FB2FF' : '#8A97AD'}
          fontSize="9.5"
          fontFamily="JetBrains Mono, monospace"
        >
          {mode === 'baseline' ? `Base ${baseline} ${unit}` : `Ref ${referenceRange.label}`}
        </text>

        {/* Y axis labels */}
        <text
          x={padL - 6}
          y={padT + 4}
          textAnchor="end"
          fill="#8A97AD"
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
        >
          {yMax.toFixed(1)}
        </text>
        <text
          x={padL - 6}
          y={height - padB}
          textAnchor="end"
          fill="#8A97AD"
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
        >
          {yMin.toFixed(1)}
        </text>

        {/* Subtle area fill */}
        <polygon points={areaPoints} fill={lineColor} fillOpacity="0.09" />

        {/* Data line */}
        <polyline
          fill="none"
          stroke={lineColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pathPoints}
        />

        {/* Points, X labels, and Event markers */}
        {series.map((pt, idx) => {
          const cx = toX(idx);
          const cy = toY(pt.value);
          const isHover = hoverIdx === idx;
          return (
            <g key={pt.day}>
              {pt.event && (
                <g>
                  <line
                    x1={cx}
                    x2={cx}
                    y1={padT}
                    y2={height - padB}
                    stroke="#FFB547"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                    opacity="0.65"
                  />
                  <circle cx={cx} cy={padT + 3} r="3" fill="#FFB547" />
                </g>
              )}
              <circle
                cx={cx}
                cy={cy}
                r={isHover ? 4.5 : 2.8}
                fill={isHover ? '#FFFFFF' : lineColor}
                stroke={lineColor}
                strokeWidth="1.5"
              />
              <text
                x={cx}
                y={height - 8}
                textAnchor="middle"
                fill={isHover ? '#E8EEF7' : '#8A97AD'}
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                {pt.day}
              </text>
              {/* Invisible wide touch/hover target */}
              <rect
                x={cx - 18}
                y={padT}
                width={36}
                height={height - padT - padB + 16}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
                onClick={() => setHoverIdx(idx)}
              />
            </g>
          );
        })}
      </svg>

      {activePoint && (
        <div className="mt-1.5 flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-[#070B14]/80 border border-white/10">
          <span className="text-[#8A97AD]">
            {activePoint.day}
            {activePoint.event ? ` · Event: ${activePoint.event}` : ''}
          </span>
          <span className="font-mono-tabular font-semibold text-[#E8EEF7]">
            {activePoint.value} {unit}
          </span>
        </div>
      )}
    </div>
  );
}

export function RunwayProjectionChart({
  currentDays,
  projectedDays,
  thresholdDays,
  regionName,
}: {
  currentDays: number;
  projectedDays: number;
  thresholdDays: number;
  regionName: string;
}) {
  const width = 380;
  const height = 140;
  const padL = 38;
  const padR = 20;
  const padT = 18;
  const padB = 26;

  const maxX = Math.max(24, currentDays + 6, projectedDays + 4);
  const toX = (day: number) => padL + (day / maxX) * (width - padL - padR);
  const toY = (margin: number) =>
    height - padB - (margin / 100) * (height - padT - padB);

  const thresholdY = toY(25);
  const currentCrossX = toX(currentDays);
  const projectedCrossX = toX(projectedDays);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label={`Runway projection chart for ${regionName} showing current crossing at day ${currentDays} and projected crossing at day ${projectedDays}`}
    >
      {/* Safe vs Caution zone */}
      <rect
        x={padL}
        y={thresholdY}
        width={width - padL - padR}
        height={height - padB - thresholdY}
        fill="#FFB547"
        fillOpacity="0.08"
      />
      <line
        x1={padL}
        x2={width - padR}
        y1={thresholdY}
        y2={thresholdY}
        stroke="#FFB547"
        strokeWidth="1.2"
        strokeDasharray="4 4"
      />
      <text
        x={padL + 4}
        y={thresholdY - 5}
        fill="#FFB547"
        fontSize="9.5"
        fontFamily="JetBrains Mono, monospace"
      >
        Action threshold (Day {thresholdDays} buffer)
      </text>

      {/* Current trend line */}
      <line
        x1={toX(0)}
        y1={toY(82)}
        x2={currentCrossX}
        y2={thresholdY}
        stroke="#FF6B5E"
        strokeWidth="2.2"
      />
      <circle cx={currentCrossX} cy={thresholdY} r="4.5" fill="#FF6B5E" />
      <text
        x={currentCrossX}
        y={height - 8}
        textAnchor="middle"
        fill="#FF6B5E"
        fontSize="9.5"
        fontFamily="JetBrains Mono, monospace"
      >
        D+{currentDays}
      </text>

      {/* Adjusted What-If trend line */}
      {projectedDays !== currentDays && (
        <>
          <line
            x1={toX(0)}
            y1={toY(82)}
            x2={projectedCrossX}
            y2={thresholdY}
            stroke="#3DE0C5"
            strokeWidth="2.2"
            strokeDasharray="5 3"
          />
          <circle cx={projectedCrossX} cy={thresholdY} r="4.5" fill="#3DE0C5" />
          <text
            x={projectedCrossX}
            y={height - 8}
            textAnchor="middle"
            fill="#3DE0C5"
            fontSize="9.5"
            fontFamily="JetBrains Mono, monospace"
          >
            D+{projectedDays}
          </text>
        </>
      )}

      <text
        x={toX(0)}
        y={height - 8}
        textAnchor="middle"
        fill="#8A97AD"
        fontSize="9.5"
        fontFamily="JetBrains Mono, monospace"
      >
        Today
      </text>
    </svg>
  );
}
