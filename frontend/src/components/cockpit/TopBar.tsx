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
  Sun,
  Moon,
  PlusCircle,
  Activity,
  RotateCcw,
  Radio,
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
  theme?: 'dark' | 'light';
  highlightedCoachStep?: number | null;
  onChangeEnvironment: (env: MissionEnvironment) => void;
  onToggleHazard: (id: HazardId) => void;
  onChangeTab: (tab: HomeTab) => void;
  onStartDemo: () => void;
  onOpenHelpMeNow: () => void;
  onOpenLearn: (tab: 'learn' | 'glossary') => void;
  onReplayFlightSchool: () => void;
  onOpenSettings: () => void;
  onOpenVitalsEntry: () => void;
  onResetToBaseline: () => void;
  onToggleTheme: () => void;
  onSignInGoogle?: () => void;
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
  theme = 'dark',
  highlightedCoachStep,
  onChangeEnvironment,
  onToggleHazard,
  onChangeTab,
  onStartDemo,
  onOpenHelpMeNow,
  onOpenLearn,
  onReplayFlightSchool,
  onOpenSettings,
  onOpenVitalsEntry,
  onResetToBaseline,
  onToggleTheme,
  onSignInGoogle,
  onSignOut,
}) => {
  const [helpOpen, setHelpOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [metSeconds, setMetSeconds] = useState(142 * 86400 + 8 * 3600 + 34 * 60 + 12);
  const helpRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Live ticking Mission Elapsed Time
  useEffect(() => {
    const timer = setInterval(() => {
      setMetSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatMET = (totalSec: number) => {
    const days = Math.floor(totalSec / 86400);
    const rem = totalSec % 86400;
    const hours = String(Math.floor(rem / 3600)).padStart(2, '0');
    const mins = String(Math.floor((rem % 3600) / 60)).padStart(2, '0');
    const secs = String(rem % 60).padStart(2, '0');
    return `MET +${days}d ${hours}:${mins}:${secs}`;
  };

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
    <header className="w-full border-b border-white/[0.08] bg-[#070B14]/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      {/* Row 1: Primary Navigation, Live Telemetry, & Global Actions */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Brand + Telemetry + View Switcher */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* Brand Mark */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onChangeTab('twin')}
              className="text-base font-bold tracking-[0.24em] text-[#E8EEF7] hover:text-[#7FB2FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#3DE0C5] shadow-[0_0_8px_#3DE0C5]" />
              <span>HELIX</span>
            </button>

            {/* Live MET & Telemetry indicator */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#151E2E]/60 border border-white/10 text-[11px] text-[#8A97AD]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3DE0C5] animate-pulse" />
              <span className="font-mono-tabular text-[#E8EEF7] font-medium">
                {formatMET(metSeconds)}
              </span>
            </div>
          </div>

          {/* Primary View Switcher Tabs */}
          <nav
            className="flex items-center p-1 rounded-xl bg-[#0E1522]/90 border border-white/10"
            aria-label="Primary views"
          >
            {(
              [
                { id: 'twin', label: 'Ghost Twin' },
                { id: 'crew', label: 'Crew Sync' },
                { id: 'summary', label: 'Flight Surgeon' },
              ] as Array<{ id: HomeTab; label: string }>
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChangeTab(tab.id)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer',
                    active
                      ? 'bg-[#151E2E] text-[#E8EEF7] shadow-sm border border-white/10'
                      : 'text-[#8A97AD] hover:text-[#E8EEF7] border border-transparent'
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Quick Vitals Entry + Theme Toggle + Demo + Help + Account */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* + LOG VITAL (Direct User Input Action) */}
          <button
            type="button"
            onClick={onOpenVitalsEntry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#7FB2FF] text-[#070B14] hover:bg-[#9EC5FF] transition-all shadow-md shadow-[#7FB2FF]/20 cursor-pointer"
            title="Log real vitals or reset to baseline"
          >
            <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Log Vital</span>
          </button>

          {/* Theme Switcher Toggle (Light / Dark) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-medium bg-[#151E2E] text-[#E8EEF7] border border-white/10 hover:border-white/25 transition-colors cursor-pointer flex items-center gap-1.5"
            aria-label={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#FFB547]" aria-hidden="true" />
                <span className="hidden sm:inline text-[11px]">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#7FB2FF]" aria-hidden="true" />
                <span className="hidden sm:inline text-[11px]">Dark</span>
              </>
            )}
          </button>

          {/* Resume Flight School (if skipped) */}
          {flightSchoolSkipped && (
            <button
              type="button"
              onClick={onReplayFlightSchool}
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#7FB2FF] bg-[#7FB2FF]/10 border border-[#7FB2FF]/30 hover:bg-[#7FB2FF]/20 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Resume Flight School</span>
            </button>
          )}

          {/* 90s Demo Simulation */}
          <button
            type="button"
            onClick={onStartDemo}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer',
              demoActive
                ? 'bg-[#7FB2FF] text-[#070B14] border-[#7FB2FF]'
                : 'bg-[#151E2E] text-[#E8EEF7] border-white/10 hover:border-white/25'
            )}
            title="Run 90s automated demo playback"
          >
            <Play className="w-3 h-3" aria-hidden="true" />
            <span className="hidden sm:inline">{demoActive ? 'Demo Playing' : '90s Demo'}</span>
          </button>

          {/* Help Menu */}
          <div ref={helpRef} className="relative">
            <button
              type="button"
              onClick={() => setHelpOpen((v) => !v)}
              aria-expanded={helpOpen}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#151E2E] text-[#E8EEF7] border border-white/10 hover:border-white/25 whitespace-nowrap cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#7FB2FF]" aria-hidden="true" />
              <span className="hidden sm:inline">Help</span>
              <ChevronDown className="w-3 h-3 text-[#8A97AD]" aria-hidden="true" />
            </button>

            {helpOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-2xl cockpit-panel-elevated p-1.5 z-50 shadow-xl"
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

          {/* Account & Profile Menu */}
          <div ref={accountRef} className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              aria-expanded={accountOpen}
              aria-label="Account and settings menu"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#151E2E] text-[#E8EEF7] border border-white/10 hover:border-white/25 cursor-pointer"
            >
              <div className="w-4 h-4 rounded-full bg-[#7FB2FF]/20 flex items-center justify-center text-[10px] text-[#7FB2FF] font-bold">
                {profile.name[0] || 'C'}
              </div>
              <span className="hidden sm:inline max-w-[85px] truncate">
                {profile.name}
              </span>
            </button>

            {accountOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-60 rounded-2xl cockpit-panel-elevated p-1.5 z-50 shadow-xl"
              >
                <div className="px-3 py-2 border-b border-white/[0.08]">
                  <p className="text-xs font-semibold text-[#E8EEF7]">{profile.name}</p>
                  <p className="text-[11px] text-[#8A97AD] font-mono-tabular">
                    {profile.crewId} · {profile.experience}
                  </p>
                  {profile.authMethod === 'google' ? (
                    <span className="inline-flex items-center gap-1.5 mt-1 text-[10px] text-[#4285F4] font-medium">
                      ● Google Connected
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        onSignInGoogle?.();
                      }}
                      className="mt-2 w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[#E8EEF7] text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z" />
                        <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
                      </svg>
                      <span>Sign in with Google</span>
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                    onOpenVitalsEntry();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl text-left text-xs text-[#7FB2FF] hover:bg-[#7FB2FF]/10 font-medium cursor-pointer"
                >
                  <Activity className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Log Live Vitals</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                    onResetToBaseline();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-[#8A97AD] shrink-0" aria-hidden="true" />
                  <span>Reset to Clean Baseline (Zero Drift)</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
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
          'border-t border-white/[0.06] bg-[#0E1522]/80',
          highlightedCoachStep === 5 && 'ring-2 ring-[#7FB2FF] ring-inset'
        )}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3 flex-wrap">
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
                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors whitespace-nowrap cursor-pointer',
                    active
                      ? 'bg-[#7FB2FF]/15 border-[#7FB2FF]/60 text-[#7FB2FF]'
                      : 'bg-[#070B14]/60 border-white/[0.08] text-[#8A97AD] hover:text-[#E8EEF7]'
                  )}
                >
                  <span>{hazard.label}</span>
                </button>
              );
            })}
          </div>

          {/* Combined Risk Readout & Earth Comms Link Status */}
          <div className="flex items-center gap-3 text-xs shrink-0">
            {/* Combined Risk Pill */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-medium text-[11px]"
              style={{
                backgroundColor: `${riskColor}15`,
                borderColor: `${riskColor}35`,
                color: riskColor,
              }}
              role="status"
              aria-label={`Overall flight risk: ${combinedRisk.level}`}
            >
              <StatusIcon
                status={combinedRisk.level}
                colorBlindSafe={colorBlindSafe}
                className="w-3 h-3"
              />
              <span className="capitalize">{combinedRisk.level} Risk</span>
            </div>

            {/* Comms indicator */}
            <div
              className="flex items-center gap-1.5 text-[11px] text-[#8A97AD]"
              title={envCfg.earthDelayText}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-[#3DE0C5]" aria-hidden="true" />
                  <span className="hidden sm:inline font-mono-tabular">
                    {envCfg.earthDelayText}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-[#FFB547]" aria-hidden="true" />
                  <span className="text-[#FFB547] font-medium">Offline (Local Flight Computer)</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
