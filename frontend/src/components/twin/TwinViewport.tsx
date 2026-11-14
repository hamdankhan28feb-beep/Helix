import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
  RotateCcw,
  RotateCw,
  ArrowUp,
  ArrowDown,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from 'lucide-react';
import { HAZARDS_FIXTURE } from '../../data/fixtures';
import { ENVIRONMENT_CONFIG } from '../../lib/tokens';
import { cn, getCombinedRiskSummary, getStatusColor } from '../../lib/utils';
import {
  BodyRegion,
  HazardId,
  MissionEnvironment,
  RegionId,
  TwinLayer,
} from '../../types/helix';
import { StatusIcon } from '../ui/Primitives';
import { AnatomyFallback2D } from './AnatomyFallback2D';
import type { CameraCommand } from './AnatomyScene3D';

const LazyAnatomyScene3D = React.lazy(() =>
  import('./AnatomyScene3D').then((m) => ({ default: m.AnatomyScene3D }))
);

class TwinErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function detectWebGL(): { supported: boolean; isSoftwareGl: boolean } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { supported: false, isSoftwareGl: false };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return { supported: true, isSoftwareGl };
  } catch {
    return { supported: false, isSoftwareGl: false };
  }
}

interface TwinViewportProps {
  regions: BodyRegion[];
  selectedRegionId: RegionId | null;
  layer: TwinLayer;
  activeHazards: HazardId[];
  environment: MissionEnvironment;
  colorBlindSafe: boolean;
  reduceMotion: boolean;
  forceFallback2D: boolean;
  onSelectRegion: (id: RegionId) => void;
  onChangeLayer: (layer: TwinLayer) => void;
  highlightedCoachStep?: number | null;
}

const LAYERS: Array<{ id: TwinLayer; label: string }> = [
  { id: 'skeleton', label: 'Skeleton' },
  { id: 'organs', label: 'Organs' },
  { id: 'muscles', label: 'Muscles' },
  { id: 'suit', label: 'Suit' },
];

export const TwinViewport: React.FC<TwinViewportProps> = ({
  regions,
  selectedRegionId,
  layer,
  activeHazards,
  environment,
  colorBlindSafe,
  reduceMotion,
  forceFallback2D,
  onSelectRegion,
  onChangeLayer,
  highlightedCoachStep,
}) => {
  const [hoveredRegionId, setHoveredRegionId] = useState<RegionId | null>(null);
  const [cameraCommand, setCameraCommand] = useState<CameraCommand | null>(null);
  const [tabHidden, setTabHidden] = useState(false);

  const webglProbe = useMemo(() => detectWebGL(), []);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const issueCamera = (type: CameraCommand['type']) => {
    setCameraCommand({ type, nonce: Date.now() + Math.random() });
  };

  const activeRegion =
    regions.find((r) => r.id === (hoveredRegionId || selectedRegionId)) || null;

  const activeHazardInfos = HAZARDS_FIXTURE.filter((h) =>
    activeHazards.includes(h.id)
  );
  const combinedRisk = getCombinedRiskSummary(activeHazards, regions);

  const sortedRegions = useMemo(
    () => regions.slice().sort((a, b) => a.tabOrder - b.tabOrder),
    [regions]
  );

  const use2DFallback = forceFallback2D || !webglProbe.supported;

  const fallbackNode = (
    <AnatomyFallback2D
      regions={regions}
      selectedRegionId={selectedRegionId}
      hoveredRegionId={hoveredRegionId}
      layer={layer}
      activeHazards={activeHazards}
      environment={environment}
      colorBlindSafe={colorBlindSafe}
      onSelectRegion={onSelectRegion}
      onHoverRegion={setHoveredRegionId}
    />
  );

  return (
    <section
      aria-label="3D Ghost Twin Viewport"
      className={cn(
        'relative flex flex-col justify-between rounded-3xl cockpit-panel overflow-hidden min-h-[440px] lg:min-h-[560px]',
        (highlightedCoachStep === 0 || highlightedCoachStep === 1) &&
          'ring-2 ring-[#7FB2FF]'
      )}
    >
      {/* Subtle Top Viewport Context Strip */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 pt-3.5 pb-1 pointer-events-none">
        <div className="flex items-center gap-2 text-xs text-[#8A97AD]">
          <span className="font-medium text-[#E8EEF7]">Ghost Twin</span>
          <span aria-hidden="true">·</span>
          <span>{ENVIRONMENT_CONFIG[environment].gravityLabel}</span>
          <span aria-hidden="true">·</span>
          <span>Wireframe = Earth baseline</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1">
          {!use2DFallback && (
            <button
              type="button"
              onClick={() => issueCamera('reset')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#8A97AD] hover:text-[#E8EEF7] bg-[#151E2E]/80 border border-white/10 rounded-lg transition-colors cursor-pointer"
              aria-label="Reset 3D camera view"
            >
              <RefreshCw className="w-3 h-3" aria-hidden="true" />
              <span>Reset view</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Hazard Cause-and-Effect Banner */}
      {activeHazardInfos.length > 0 && (
        <div className="relative z-10 mx-4 mt-1 px-3 py-2 rounded-xl bg-[#070B14]/85 border border-white/10 text-xs">
          <p className="text-[#E8EEF7]">
            <span className="font-semibold text-[#7FB2FF]">
              {activeHazardInfos.map((h) => h.label).join(' + ')}:
            </span>{' '}
            {combinedRisk.compoundingNote || activeHazardInfos[0].causeAndEffect}
          </p>
        </div>
      )}

      {/* Main 3D / 2D Canvas Stage */}
      <div className="relative flex-1 min-h-[320px] lg:min-h-[410px]">
        {use2DFallback ? (
          fallbackNode
        ) : tabHidden ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-[#8A97AD]">
            3D paused while tab is hidden
          </div>
        ) : (
          <TwinErrorBoundary fallback={fallbackNode}>
            <Suspense
              fallback={
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-36 h-64 rounded-full bg-white/5 animate-pulse" />
                  <span className="text-xs text-[#8A97AD]">Loading anatomical twin…</span>
                </div>
              }
            >
              <LazyAnatomyScene3D
                regions={regions}
                selectedRegionId={selectedRegionId}
                hoveredRegionId={hoveredRegionId}
                layer={layer}
                activeHazards={activeHazards}
                environment={environment}
                colorBlindSafe={colorBlindSafe}
                reduceMotion={reduceMotion}
                isSoftwareGl={webglProbe.isSoftwareGl}
                cameraCommand={cameraCommand}
                onSelectRegion={onSelectRegion}
                onHoverRegion={setHoveredRegionId}
              />
            </Suspense>
          </TwinErrorBoundary>
        )}

        {/* One-line Hover / Selection Readout */}
        {activeRegion && (
          <div
            className="absolute left-4 bottom-3 z-10 px-3 py-1.5 rounded-xl bg-[#070B14]/90 border border-white/12 flex items-center gap-2 text-xs pointer-events-none"
            role="status"
          >
            <StatusIcon status={activeRegion.status} colorBlindSafe={colorBlindSafe} />
            <span className="font-semibold text-[#E8EEF7]">{activeRegion.name}</span>
            <span aria-hidden="true" className="text-[#8A97AD]">·</span>
            <span
              className="font-mono-tabular"
              style={{ color: getStatusColor(activeRegion.status, colorBlindSafe) }}
            >
              {activeRegion.runwayDays ? `~${activeRegion.runwayDays}d runway` : 'Stable'}
            </span>
          </div>
        )}

        {/* Keyboard 3D Camera Controls (bottom-right of canvas) */}
        {!use2DFallback && (
          <div
            className="absolute right-3 bottom-3 z-10 hidden sm:flex items-center gap-1 p-1 rounded-xl bg-[#070B14]/80 border border-white/10"
            role="group"
            aria-label="Keyboard 3D body rotation and zoom controls"
          >
            <button
              type="button"
              onClick={() => issueCamera('rotateLeft')}
              className="p-1.5 text-[#8A97AD] hover:text-[#E8EEF7] rounded-lg hover:bg-white/5 cursor-pointer"
              aria-label="Rotate body left"
              title="Rotate left"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => issueCamera('rotateRight')}
              className="p-1.5 text-[#8A97AD] hover:text-[#E8EEF7] rounded-lg hover:bg-white/5 cursor-pointer"
              aria-label="Rotate body right"
              title="Rotate right"
            >
              <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => issueCamera('rotateUp')}
              className="p-1.5 text-[#8A97AD] hover:text-[#E8EEF7] rounded-lg hover:bg-white/5 cursor-pointer"
              aria-label="Tilt view up"
              title="Tilt up"
            >
              <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => issueCamera('rotateDown')}
              className="p-1.5 text-[#8A97AD] hover:text-[#E8EEF7] rounded-lg hover:bg-white/5 cursor-pointer"
              aria-label="Tilt view down"
              title="Tilt down"
            >
              <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => issueCamera('zoomIn')}
              className="p-1.5 text-[#8A97AD] hover:text-[#E8EEF7] rounded-lg hover:bg-white/5 cursor-pointer"
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => issueCamera('zoomOut')}
              className="p-1.5 text-[#8A97AD] hover:text-[#E8EEF7] rounded-lg hover:bg-white/5 cursor-pointer"
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls: Layer Segmented Control + Keyboard Top-to-Bottom Region Cycle */}
      <div className="relative z-10 px-4 pb-3.5 pt-2 border-t border-white/[0.06] flex flex-col items-center gap-2.5 bg-[#0E1522]/85">
        <div
          className="inline-flex items-center p-1 rounded-xl bg-[#070B14] border border-white/10"
          role="tablist"
          aria-label="Anatomical twin layer"
        >
          {LAYERS.map((item) => {
            const active = layer === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeLayer(item.id)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap',
                  active
                    ? 'bg-[#151E2E] text-[#E8EEF7] border border-white/15'
                    : 'text-[#8A97AD] hover:text-[#E8EEF7] border border-transparent'
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Accessible Top-to-Bottom Tab Strip for Region Selection */}
        <div
          className="w-full flex items-center gap-1.5 overflow-x-auto pb-0.5"
          role="navigation"
          aria-label="Body regions top to bottom"
        >
          {sortedRegions.map((region) => {
            const selected = selectedRegionId === region.id;
            const color = getStatusColor(region.status, colorBlindSafe);
            return (
              <button
                key={region.id}
                type="button"
                onClick={() => onSelectRegion(region.id)}
                onMouseEnter={() => setHoveredRegionId(region.id)}
                onMouseLeave={() => setHoveredRegionId(null)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer',
                  selected
                    ? 'bg-[#151E2E] text-[#E8EEF7] border-[#7FB2FF]/60'
                    : 'bg-[#070B14]/60 text-[#8A97AD] hover:text-[#E8EEF7] border-white/[0.07]'
                )}
              >
                <StatusIcon status={region.status} colorBlindSafe={colorBlindSafe} className="w-3 h-3" />
                <span>{region.shortName}</span>
                {region.runwayDays && (
                  <span className="font-mono-tabular text-[10px]" style={{ color }}>
                    {region.runwayDays}d
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
