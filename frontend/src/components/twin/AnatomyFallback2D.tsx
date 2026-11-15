import React from 'react';
import { getStatusColor } from '../../lib/utils';
import {
  BodyRegion,
  HazardId,
  MissionEnvironment,
  RegionId,
  TwinLayer,
} from '../../types/helix';

interface AnatomyFallback2DProps {
  regions: BodyRegion[];
  selectedRegionId: RegionId | null;
  hoveredRegionId: RegionId | null;
  layer: TwinLayer;
  activeHazards: HazardId[];
  environment: MissionEnvironment;
  colorBlindSafe: boolean;
  onSelectRegion: (id: RegionId) => void;
  onHoverRegion: (id: RegionId | null) => void;
}

const HOTSPOT_2D: Record<RegionId, { x: number; y: number; r: number }> = {
  mind_sleep: { x: 160, y: 42, r: 22 },
  brain_eyes: { x: 160, y: 66, r: 16 },
  inner_ear: { x: 184, y: 68, r: 13 },
  lungs_oxygen: { x: 142, y: 138, r: 20 },
  heart_vessels: { x: 168, y: 142, r: 18 },
  immune_skin: { x: 102, y: 175, r: 16 },
  gut_metabolism: { x: 160, y: 200, r: 22 },
  bones_muscles: { x: 184, y: 318, r: 24 },
  radiation: { x: 244, y: 120, r: 20 },
};

export const AnatomyFallback2D: React.FC<AnatomyFallback2DProps> = ({
  regions,
  selectedRegionId,
  hoveredRegionId,
  layer,
  activeHazards,
  environment,
  colorBlindSafe,
  onSelectRegion,
  onHoverRegion,
}) => {
  const regionMap = new Map(regions.map((r) => [r.id, r]));
  const isHazardDimmed = activeHazards.length > 0;

  const isAffectedByHazard = (region: BodyRegion) =>
    activeHazards.length === 0 ||
    region.affectedByHazards.some((h) => activeHazards.includes(h));

  const getStrokeForRegion = (id: RegionId, baseStroke: string) => {
    const r = regionMap.get(id);
    if (!r) return baseStroke;
    if (r.status === 'nominal') {
      return isHazardDimmed && !isAffectedByHazard(r)
        ? 'rgba(138, 151, 173, 0.25)'
        : baseStroke;
    }
    return getStatusColor(r.status, colorBlindSafe);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      <svg
        viewBox="0 0 320 440"
        className="w-full h-full max-h-[500px]"
        role="img"
        aria-label={`Interactive anatomical twin in ${layer} view (${environment} environment)`}
      >
        <defs>
          <radialGradient id="twinAmbient" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#7FB2FF" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#070B14" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="320" height="440" fill="url(#twinAmbient)" />

        {/* Hazard: Closed environment boundary */}
        {activeHazards.includes('closed') && (
          <ellipse
            cx="160"
            cy="220"
            rx="118"
            ry="194"
            fill="none"
            stroke="#7FB2FF"
            strokeOpacity="0.35"
            strokeDasharray="6 6"
            strokeWidth="1.5"
          />
        )}

        {/* Hazard: Isolation narrowing halo */}
        {activeHazards.includes('isolation') && (
          <circle
            cx="160"
            cy="64"
            r="52"
            fill="none"
            stroke="#FFB547"
            strokeOpacity="0.4"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}

        {/* Hazard: Distance Earth marker + tether */}
        {activeHazards.includes('distance') && (
          <g opacity="0.8">
            <line
              x1="160"
              y1="142"
              x2="288"
              y2="42"
              stroke="#7FB2FF"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <circle cx="292" cy="38" r="7" fill="#6CB6FF" fillOpacity="0.3" stroke="#6CB6FF" />
            <text x="292" y="56" textAnchor="middle" fill="#8A97AD" fontSize="9">
              Earth
            </text>
          </g>
        )}

        {/* Hazard: Radiation drifting particles */}
        {activeHazards.includes('radiation') && (
          <g fill="#FFB547" fillOpacity="0.55">
            <circle cx="52" cy="88" r="2" />
            <circle cx="268" cy="145" r="2.2" />
            <circle cx="72" cy="280" r="1.8" />
            <circle cx="250" cy="310" r="2" />
            <circle cx="235" cy="95" r="1.5" />
          </g>
        )}

        {/* Earth Baseline Ghost Wireframe (behind live body) */}
        <g
          transform="translate(-5, -2)"
          fill="none"
          stroke="#7FB2FF"
          strokeOpacity="0.2"
          strokeDasharray="3 3"
          strokeWidth="1"
        >
          <circle cx="160" cy="64" r="24" />
          <path d="M126 108 L194 108 L186 225 L134 225 Z" />
          <path d="M124 114 L92 225" />
          <path d="M196 114 L228 225" />
          <path d="M142 226 L132 390" />
          <path d="M178 226 L188 390" />
        </g>

        {/* Live Twin Layers */}
        {layer === 'suit' && (
          <g stroke="#8A97AD" strokeWidth="1.8" fill="#151E2E" fillOpacity="0.85">
            {/* Helmet */}
            <circle cx="160" cy="64" r="30" stroke="#9FB3CE" />
            <ellipse cx="160" cy="66" rx="20" ry="15" fill="#0B1324" stroke="#7FB2FF" strokeOpacity="0.5" />
            {/* Torso PLSS & chest display */}
            <rect x="118" y="102" width="84" height="122" rx="18" />
            <rect x="140" y="128" width="40" height="28" rx="6" fill="#070B14" stroke="#7FB2FF" strokeOpacity="0.4" />
            {/* Arms */}
            <rect x="86" y="110" width="26" height="114" rx="12" transform="rotate(8 99 110)" />
            <rect x="208" y="110" width="26" height="114" rx="12" transform="rotate(-8 221 110)" />
            {/* Legs */}
            <rect x="124" y="226" width="30" height="164" rx="13" />
            <rect x="166" y="226" width="30" height="164" rx="13" />
          </g>
        )}

        {layer === 'muscles' && (
          <g fill="#2A3954" fillOpacity="0.6" stroke="#7E97BA" strokeWidth="1.4">
            <ellipse cx="160" cy="64" rx="22" ry="26" />
            <path d="M122 106 Q160 96 198 106 L188 224 Q160 232 132 224 Z" />
            <ellipse cx="100" cy="162" rx="12" ry="52" transform="rotate(9 100 162)" />
            <ellipse cx="220" cy="162" rx="12" ry="52" transform="rotate(-9 220 162)" />
            <ellipse
              cx="140"
              cy="310"
              rx="15"
              ry="78"
              stroke={getStrokeForRegion('bones_muscles', '#7E97BA')}
              strokeWidth="2"
            />
            <ellipse
              cx="180"
              cy="310"
              rx="15"
              ry="78"
              stroke={getStrokeForRegion('bones_muscles', '#7E97BA')}
              strokeWidth="2"
            />
          </g>
        )}

        {layer === 'organs' && (
          <g fill="none" strokeWidth="1.6">
            {/* Soft body contour */}
            <path
              d="M160 38 C176 38 184 50 184 64 C184 82 170 94 170 98 L196 108 L224 220 M160 38 C144 38 136 50 136 64 C136 82 150 94 150 98 L124 108 L96 220"
              stroke="rgba(255,255,255,0.16)"
            />
            {/* Brain */}
            <ellipse
              cx="160"
              cy="58"
              rx="16"
              ry="13"
              fill={getStrokeForRegion('brain_eyes', '#6CB6FF')}
              fillOpacity="0.28"
              stroke={getStrokeForRegion('brain_eyes', '#6CB6FF')}
            />
            {/* Lungs */}
            <ellipse
              cx="143"
              cy="138"
              rx="13"
              ry="24"
              fill={getStrokeForRegion('lungs_oxygen', '#3DE0C5')}
              fillOpacity="0.2"
              stroke={getStrokeForRegion('lungs_oxygen', '#3DE0C5')}
            />
            <ellipse
              cx="177"
              cy="138"
              rx="13"
              ry="24"
              fill={getStrokeForRegion('lungs_oxygen', '#3DE0C5')}
              fillOpacity="0.2"
              stroke={getStrokeForRegion('lungs_oxygen', '#3DE0C5')}
            />
            {/* Heart */}
            <circle
              cx="166"
              cy="140"
              r="11"
              fill={getStrokeForRegion('heart_vessels', '#6CB6FF')}
              fillOpacity="0.45"
              stroke={getStrokeForRegion('heart_vessels', '#6CB6FF')}
            />
            {/* Gut */}
            <rect
              x="138"
              y="178"
              width="44"
              height="40"
              rx="14"
              fill={getStrokeForRegion('gut_metabolism', '#3DE0C5')}
              fillOpacity="0.2"
              stroke={getStrokeForRegion('gut_metabolism', '#3DE0C5')}
            />
          </g>
        )}

        {layer === 'skeleton' && (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Skull */}
            <ellipse
              cx="160"
              cy="60"
              rx="20"
              ry="24"
              fill="#172234"
              stroke={getStrokeForRegion('brain_eyes', '#DCE6F5')}
              strokeWidth="2"
            />
            {/* Mind halo */}
            <ellipse
              cx="160"
              cy="40"
              rx="28"
              ry="9"
              stroke={getStrokeForRegion('mind_sleep', '#FFB547')}
              strokeWidth="1.6"
              strokeDasharray="4 3"
            />
            {/* Spine */}
            <line x1="160" y1="86" x2="160" y2="215" stroke="#DCE6F5" strokeWidth="4" strokeDasharray="6 4" />
            {/* Ribcage */}
            {[114, 126, 138, 150, 162].map((y, idx) => (
              <ellipse
                key={y}
                cx="160"
                cy={y}
                rx={28 - idx * 1.5}
                ry={5}
                stroke="#C5D4E8"
                strokeWidth="1.8"
                opacity="0.8"
              />
            ))}
            {/* Clavicles & Arms */}
            <line x1="120" y1="106" x2="200" y2="106" stroke="#DCE6F5" strokeWidth="2.5" />
            <line x1="120" y1="106" x2="96" y2="220" stroke="#C5D4E8" strokeWidth="3.5" />
            <line x1="200" y1="106" x2="224" y2="220" stroke="#C5D4E8" strokeWidth="3.5" />
            {/* Pelvis */}
            <path
              d="M132 212 Q160 232 188 212 L182 232 Q160 242 138 232 Z"
              fill="#172234"
              stroke="#DCE6F5"
              strokeWidth="2"
            />
            {/* Femurs & Tibias */}
            <line
              x1="142"
              y1="230"
              x2="136"
              y2="388"
              stroke={getStrokeForRegion('bones_muscles', '#DCE6F5')}
              strokeWidth="4.5"
            />
            <line
              x1="178"
              y1="230"
              x2="184"
              y2="388"
              stroke={getStrokeForRegion('bones_muscles', '#DCE6F5')}
              strokeWidth="4.5"
            />
          </g>
        )}

        {/* Clickable & Keyboard-focusable Hotspot Rings */}
        {regions
          .slice()
          .sort((a, b) => a.tabOrder - b.tabOrder)
          .map((region) => {
            const pt = HOTSPOT_2D[region.id];
            if (!pt) return null;
            const color = getStatusColor(region.status, colorBlindSafe);
            const isSelected = selectedRegionId === region.id;
            const isHovered = hoveredRegionId === region.id;
            const dimmed = isHazardDimmed && !isAffectedByHazard(region);

            return (
              <g
                key={region.id}
                role="button"
                tabIndex={0}
                aria-label={`${region.name}, status ${region.status}${
                  region.runwayDays ? `, ${region.runwayDays} days runway` : ', stable'
                }`}
                onClick={() => onSelectRegion(region.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectRegion(region.id);
                  }
                }}
                onMouseEnter={() => onHoverRegion(region.id)}
                onMouseLeave={() => onHoverRegion(null)}
                onFocus={() => onHoverRegion(region.id)}
                onBlur={() => onHoverRegion(null)}
                className="cursor-pointer outline-none"
                opacity={dimmed ? 0.25 : 1}
              >
                {(region.status !== 'nominal' || isSelected || isHovered) && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? pt.r + 4 : pt.r}
                    fill={color}
                    fillOpacity={isSelected ? 0.24 : 0.14}
                    stroke={color}
                    strokeWidth={isSelected ? 2 : 1.2}
                    strokeDasharray={region.id === 'radiation' ? '3 3' : undefined}
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={5}
                  fill={color}
                  stroke="#070B14"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
      </svg>
    </div>
  );
};
