import React, { useState, useRef, useEffect } from 'react';
import {
  HelpCircle,
  Play,
  Settings,
  User,
  Wifi,
  WifiOff,
  ChevronDown,
  BookOpen,
  HeartHandshake,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { HAZARDS_FIXTURE } from '../../data/fixtures';
import { ENVIRONMENT_CONFIG } from '../../lib/tokens';
import { cn, getCombinedRiskSummary, getStatusColor } from '../../lib/utils';
import {
  BodyRegion,
  HazardId,
  HomeTab,
  MissionEnvironment,
  UserProfile,
} from '../../types/helix';
import { StatusIcon } from '../ui/Primitives';

interface TopBarProps {
  profile: UserProfile;
  environment: MissionEnvironment;
  activeHazards: HazardId[];
  regions: BodyRegion[];
  activeTab: HomeTab;
  isOnline: boolean;
  colorBlindSafe: boolean;
  demoActive: boolean;
  flightSchoolSkipped: boolean;
  highlightedCoachStep?: number | null;
  onChangeEnvironment: (env: MissionEnvironment) => void;
  onToggleHazard: (id: HazardId) => void;
  onChangeTab: (tab: HomeTab) => void;
  onStartDemo: () => void;
  onOpenHelpMeNow: () => void;
  onOpenLearn: (tab: 'learn' | 'glossary') => void;
  onReplayFlightSchool: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  profile,
  environment,
  activeHazards,
  regions,
  activeTab,
  isOnline,
  colorBlindSafe,
  demoActive,
  flightSchoolSkipped,
  highlightedCoachStep,
  onChangeEnvironment,
  onToggleHazard,
  onChangeTab,
  onStartDemo,
  onOpenHelpMeNow,
  onOpenLearn,
  onReplayFlightSchool,
  onOpenSettings,
  onSignOut,
}) => {
  const [helpOpen, setHelpOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutside = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutside);
    return () => document.removeEventListener('mousedown', closeOnOutside);
  }, []);

  const envCfg = ENVIRONMENT_CONFIG[environment];
  const combinedRisk = getCombinedRiskSummary(activeHazards, regions);
  const riskColor = getStatusColor(combinedRisk.level, colorBlindSafe);

  return (
    <header className="w-full border-b border-white/[0.08] bg-[#070B14]/95">
      {/* Row 1: Primary Navigation & Comms */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onChangeTab('twin')}
            className="text-base font-semibold tracking-[0.18em] text-[#E8EEF7] whitespace-nowrap shrink-0 cursor-pointer"
          >
            HELIX
          </button>

          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary views">
            {(
              [
                { id: 'twin', label: 'Twin' },
                { id: 'crew', label: 'Crew' },
                { id: 'summary', label: 'Surgeon Packet' },
              ] as Array<{ id: HomeTab; label: string }>
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChangeTab(tab.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer',
                    active
                      ? 'bg-[#151E2E] text-[#E8EEF7]'
                      : 'text-[#8A97AD] hover:text-[#E8EEF7]'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Controls: Demo, Help, Account */}
        <div className="flex items-center gap-2 shrink-0">
          {flightSchoolSkipped && (
            <button
              type="button"
              onClick={onReplayFlightSchool}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#7FB2FF] bg-[#7FB2FF]/10 border border-[#7FB2FF]/30 hover:bg-[#7FB2FF]/20 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Resume Flight School</span>
            </button>
          )}

          <button
            type="button"
            onClick={onStartDemo}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer',
              demoActive
                ? 'bg-[#7FB2FF] text-[#070B14] border-[#7FB2FF]'
                : 'bg-[#151E2E] text-[#E8EEF7] border-white/10 hover:border-white/25'
            )}
          >
            <Play className="w-3 h-3" aria-hidden="true" />
            <span>{demoActive ? 'Demo Playing' : '90s Demo'}</span>
          </button>

          {/* Help Menu */}
          <div ref={helpRef} className="relative">
            <button
              type="button"
              onClick={() => setHelpOpen((v) => !v)}
              aria-expanded={helpOpen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#151E2E] text-[#E8EEF7] border border-white/10 hover:border-white/25 whitespace-nowrap cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#7FB2FF]" aria-hidden="true" />
              <span>Help</span>
              <ChevronDown className="w-3 h-3 text-[#8A97AD]" aria-hidden="true" />
            </button>

            {helpOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-2xl cockpit-panel-elevated p-1.5 z-50"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setHelpOpen(false);
                    onOpenHelpMeNow();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-[#FF6B5E] hover:bg-[#FF6B5E]/10 font-medium cursor-pointer"
                >
                  <HeartHandshake className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Help me now (I feel unwell)</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setHelpOpen(false);
                    onReplayFlightSchool();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#7FB2FF] shrink-0" aria-hidden="true" />
                  <span>Replay Flight School</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setHelpOpen(false);
                    onOpenLearn('learn');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#3DE0C5] shrink-0" aria-hidden="true" />
                  <span>Learn spaceflight risks</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setHelpOpen(false);
                    onOpenLearn('glossary');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-[#8A97AD] shrink-0" aria-hidden="true" />
                  <span>Plain-language glossary</span>
                </button>
              </div>
            )}
          </div>

          {/* Account Menu */}
          <div ref={accountRef} className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              aria-expanded={accountOpen}
              aria-label="Account and settings menu"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#151E2E] text-[#E8EEF7] border border-white/10 hover:border-white/25 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#8A97AD]" aria-hidden="true" />
              <span className="hidden sm:inline max-w-[90px] truncate">
                {profile.name}
              </span>
            </button>

            {accountOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-2xl cockpit-panel-elevated p-1.5 z-50"
              >
                <div className="px-3 py-2 border-b border-white/[0.08]">
                  <p className="text-xs font-semibold text-[#E8EEF7]">{profile.name}</p>
                  <p className="text-[11px] text-[#8A97AD] font-mono-tabular">
                    {profile.crewId} · {profile.experience}
                  </p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl text-left text-xs text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#8A97AD]" aria-hidden="true" />
                  <span>Settings & Accessibility</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-[#8A97AD] hover:text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>Switch profile / Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Environment Switcher, Hazard Lens Chips, Combined Risk & Comms Ribbon */}
      <div
        className={cn(
          'border-t border-white/[0.06] bg-[#0E1522]/75',
          highlightedCoachStep === 5 && 'ring-2 ring-[#7FB2FF] ring-inset'
        )}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 flex-wrap">
          {/* Environment Switcher */}
          <div
            className="inline-flex items-center p-0.5 rounded-xl bg-[#070B14] border border-white/10 overflow-x-auto max-w-full"
            role="group"
            aria-label="Mission environment"
          >
            {(['transit', 'station', 'lunar', 'mars'] as MissionEnvironment[]).map(
              (envId) => {
                const cfg = ENVIRONMENT_CONFIG[envId];
                const active = environment === envId;
                return (
                  <button
                    key={envId}
                    type="button"
                    onClick={() => onChangeEnvironment(envId)}
                    className={cn(
                      'px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer',
                      active
                        ? 'bg-[#151E2E] text-[#E8EEF7] border border-white/15'
                        : 'text-[#8A97AD] hover:text-[#E8EEF7] border border-transparent'
                    )}
                    aria-pressed={active}
                  >
                    {cfg.shortLabel}
                  </button>
                );
              }
            )}
          </div>

          {/* Hazard Lens Filter Chips */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto max-w-full"
            role="group"
            aria-label="Hazard Lens filters"
          >
            <span className="text-[11px] text-[#8A97AD] mr-1 whitespace-nowrap">
              Hazard Lens:
            </span>
            {HAZARDS_FIXTURE.map((hazard) => {
              const active = activeHazards.includes(hazard.id);
              return (
                <button
                  key={hazard.id}
                  type="button"
                  onClick={() => onToggleHazard(hazard.id)}
                  aria-pressed={active}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer',
                    active
                      ? 'bg-[#7FB2FF]/18 text-[#E8EEF7] border-[#7FB2FF]/60'
                      : 'bg-[#070B14]/60 text-[#8A97AD] border-white/[0.08] hover:text-[#E8EEF7]'
                  )}
                >
                  {hazard.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Combined Risk + Thin Comms Ribbon */}
          <div className="flex items-center gap-3 text-[11px] shrink-0">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border"
              style={{
                color: riskColor,
                borderColor: `${riskColor}45`,
                backgroundColor: `${riskColor}14`,
              }}
            >
              <StatusIcon status={combinedRisk.level} colorBlindSafe={colorBlindSafe} className="w-3 h-3" />
              <span className="font-medium whitespace-nowrap">{combinedRisk.label}</span>
            </div>

            <div className="flex items-center gap-1.5 text-[#8A97AD] font-mono-tabular whitespace-nowrap">
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-[#3DE0C5]" aria-hidden="true" />
                  <span>Earth link · {envCfg.earthDelayText}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-[#FFB547]" aria-hidden="true" />
                  <span className="text-[#E8EEF7]">Offline · Everything works offline</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Compounding Hazards Notice Ribbon */}
        {activeHazards.length >= 2 && combinedRisk.compoundingNote && (
          <div className="border-t border-[#FFB547]/20 bg-[#FFB547]/[0.06] px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#E8EEF7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB547] animate-pulse" />
              <span className="font-medium text-[#FFB547]">Compounding Hazard Effect:</span>
              <span className="text-[#8A97AD]">{combinedRisk.compoundingNote}</span>
            </div>
            <span className="text-[10px] text-[#8A97AD] font-mono-tabular shrink-0 hidden sm:inline">
              Multi-hazard interaction
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
