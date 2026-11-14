import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CREW_FIXTURE,
  DEMO_CHOREOGRAPHY,
  INDICATORS_FIXTURE,
  INITIAL_RINGS_FIXTURE,
  ONE_THING_FIXTURE,
  REGIONS_FIXTURE,
  RUNWAY_FIXTURE,
} from './data/fixtures';
import {
  cabinAudio,
  fetchIndicators,
  fetchOneThing,
  fetchRunway,
  fetchTwin,
  fetchDemoDashboard,
  mapDemoDashboard,
  loadLocalState,
  queueSurgeonPacket,
  saveLocalState,
  submitMeasurement,
  signOutCrew,
  syncPendingOperations,
} from './lib/api';
import { applyEnvironmentAndHazardsToRunway } from './lib/utils';
import {
  AccessibilitySettings,
  AppScreen,
  BodyRegion,
  CrewMember,
  HazardId,
  HealthRingsState,
  HomeTab,
  Indicator,
  MissionEnvironment,
  OneThingAction,
  PacketState,
  RegionId,
  RunwayItem,
  StatusLevel,
  TwinLayer,
  UserProfile,
  WhatIfAdjustments,
} from './types/helix';

import { IntroScreen } from './components/flows/IntroScreen';
import { SignInScreen } from './components/flows/SignInScreen';
import { WelcomeProfileScreen } from './components/flows/WelcomeProfileScreen';
import { FlightSchoolOverlay } from './components/flows/FlightSchoolOverlay';
import { TopBar } from './components/cockpit/TopBar';
import { HealthRunwayPanel } from './components/cockpit/HealthRunwayPanel';
import { TwinViewport } from './components/twin/TwinViewport';
import { OneThingCard } from './components/cockpit/OneThingCard';
import { HealthRingsBar } from './components/cockpit/HealthRingsBar';
import { RegionDrawer } from './components/drawers/RegionDrawer';
import { MeasurementWizard } from './components/modals/MeasurementWizard';
import { WhyAndWhatIfModal } from './components/modals/WhyAndWhatIfModal';
import { HelpMeNowModal } from './components/modals/HelpMeNowModal';
import { LearnAndGlossaryModal } from './components/modals/LearnAndGlossaryModal';
import { CrewScreen } from './components/screens/CrewScreen';
import { FlightSurgeonSummary } from './components/screens/FlightSurgeonSummary';
import { DemoModeBar } from './components/screens/DemoModeBar';
import { SettingsModal } from './components/screens/SettingsModal';

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr-maya',
  name: 'Maya Lin',
  crewId: 'CDR-01',
  role: 'Mission Commander',
  environment: 'transit',
  experience: 'novice',
  authMethod: 'demo',
  flightSchoolCompleted: false,
};

const DEFAULT_SETTINGS: AccessibilitySettings = {
  largeText: false,
  highContrast: false,
  colorBlindSafe: false,
  reduceMotion:
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  ambientAudio: false,
  offlineSimulated: false,
  forceFallback2D: false,
};

const DEFAULT_WHAT_IF: WhatIfAdjustments = {
  sleepPlus90: false,
  exerciseBoost: false,
  lighterWorkload: false,
  hydrationNutrition: false,
  lightShift: false,
};

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('intro');
  const [homeTab, setHomeTab] = useState<HomeTab>('twin');

  const [profile, setProfile] = useState<UserProfile>(() =>
    loadLocalState('profile', DEFAULT_PROFILE)
  );
  const [settings, setSettings] = useState<AccessibilitySettings>(() =>
    loadLocalState('accessibility', DEFAULT_SETTINGS)
  );

  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const isOnline = browserOnline && !settings.offlineSimulated;
  const [backendStressors, setBackendStressors] = useState<string[]>([]);

  // Core physiological state
  const [regions, setRegions] = useState<BodyRegion[]>(REGIONS_FIXTURE);
  const [indicators, setIndicators] = useState<Indicator[]>(INDICATORS_FIXTURE);
  const [baseRunway, setBaseRunway] = useState<RunwayItem[]>(RUNWAY_FIXTURE);
  const [oneThing, setOneThing] = useState<OneThingAction>(ONE_THING_FIXTURE);
  const [crew, setCrew] = useState<CrewMember[]>(CREW_FIXTURE);
  const [rings, setRings] = useState<HealthRingsState>(() =>
    loadLocalState('rings', INITIAL_RINGS_FIXTURE)
  );
  const [packet, setPacket] = useState<PacketState>(() =>
    loadLocalState('packet', {
      id: 'PKT-001',
      status: 'idle',
      notes: '',
    })
  );

  // Interactive cockpit filters & selection
  const [environment, setEnvironment] = useState<MissionEnvironment>(
    profile.environment
  );
  const [layer, setLayer] = useState<TwinLayer>('skeleton');
  const [activeHazards, setActiveHazards] = useState<HazardId[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Modals & Flows
  const [flightSchoolOpen, setFlightSchoolOpen] = useState(false);
  const [flightSchoolStep, setFlightSchoolStep] = useState(0);
  const [flightSchoolSkipped, setFlightSchoolSkipped] = useState(false);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardIndicatorId, setWizardIndicatorId] = useState<string | null>(null);

  const [whyModal, setWhyModal] = useState<{
    open: boolean;
    mode: 'why' | 'whatif';
    regionId: RegionId;
  }>({ open: false, mode: 'why', regionId: 'mind_sleep' });
  const [whatIf, setWhatIf] = useState<WhatIfAdjustments>(DEFAULT_WHAT_IF);

  const [helpMeNowOpen, setHelpMeNowOpen] = useState(false);
  const [learnModal, setLearnModal] = useState<{
    open: boolean;
    tab: 'learn' | 'glossary';
  }>({ open: false, tab: 'learn' });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Demo mode 90s choreography state
  const [demoActive, setDemoActive] = useState(false);
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [demoSec, setDemoSec] = useState(0);
  const [demoSpeed, setDemoSpeed] = useState<1 | 2>(1);

  // Calm gentle alert toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  // Apply root accessibility HTML classes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('helix-large-text', settings.largeText);
    root.classList.toggle('helix-high-contrast', settings.highContrast);
    root.classList.toggle('helix-colorblind-safe', settings.colorBlindSafe);
    root.classList.toggle('helix-reduced-motion', settings.reduceMotion);
    saveLocalState('accessibility', settings);
    cabinAudio.toggle(settings.ambientAudio);
  }, [settings]);

  // Online / Offline listeners
  useEffect(() => {
    void fetch('/auth/session', { credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() : null)
      .then((session: { crewId?: string; user?: { name?: string } } | null) => {
        if (!session?.crewId) return;
        setProfile((current) => {
          const next = { ...current, crewId: session.crewId!, name: session.user?.name || current.name,
            authMethod: 'credentials' as const };
          saveLocalState('profile', next);
          return next;
        });
        setScreen('home');
      }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const onOnline = () => setBrowserOnline(true);
    const onOffline = () => setBrowserOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) void syncPendingOperations();
  }, [isOnline]);

  // Load initial data from Express API with local JSON fixture fallback
  useEffect(() => {
    Promise.all([fetchTwin(), fetchIndicators(), fetchRunway(), fetchOneThing()]).then(
      ([twin, inds, rw, ott]) => {
        setRegions(twin.regions);
        setCrew(twin.crew);
        setIndicators(inds);
        setBaseRunway(rw);
        setOneThing(ott);
      }
    );
  }, []);

  // Optional SSE stream subscription when online & on Home
  useEffect(() => {
    if (!isOnline || screen !== 'home') return;
    let source: EventSource | null = null;
    try {
      source = new EventSource('/api/stream');
      source.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as {
            indicatorId: string;
            value: number;
          };
          if (msg.indicatorId === 'resting_hr') {
            setIndicators((prev) =>
              prev.map((ind) =>
                ind.id === 'resting_hr' ? { ...ind, value: msg.value } : ind
              )
            );
          }
        } catch {
          // Ignore malformed tick
        }
      };
    } catch {
      // Fallback gracefully when SSE unavailable
    }
    return () => source?.close();
  }, [isOnline, screen]);

  // Demo Mode 90s Playback Loop
  useEffect(() => {
    if (!demoActive || !demoPlaying) return;
    const timer = setInterval(() => {
      setDemoSec((prev) => {
        const next = prev + 0.5 * demoSpeed;
        if (next >= 90) {
          setDemoPlaying(false);
          return 90;
        }
        return next;
      });
    }, 500);
    return () => clearInterval(timer);
  }, [demoActive, demoPlaying, demoSpeed]);

  // Sync scene state to active Demo keyframe
  useEffect(() => {
    if (!demoActive) return;
    const frame =
      DEMO_CHOREOGRAPHY.slice()
        .reverse()
        .find((k) => demoSec >= k.timeSec) || DEMO_CHOREOGRAPHY[0];

    if (frame.environment) setEnvironment(frame.environment);
    if (frame.hazards) setActiveHazards(frame.hazards);
    if (frame.layer) setLayer(frame.layer);
    if (frame.focusRegion !== undefined) setSelectedRegionId(frame.focusRegion);

    if (frame.regionOverrides) {
      setRegions((prev) =>
        prev.map((r) => {
          const ov = frame.regionOverrides?.[r.id];
          return ov ? { ...r, status: ov.status, runwayDays: ov.runwayDays } : r;
        })
      );
      setBaseRunway((prev) =>
        prev.map((rw) => {
          const ov = frame.regionOverrides?.[rw.regionId];
          return ov ? { ...rw, status: ov.status, days: ov.runwayDays } : rw;
        })
      );
    }
  }, [demoActive, demoSec]);

  // Derived Runway with Environment + Hazard Lens + What-If Simulator
  const computedRunway = useMemo(
    () =>
      applyEnvironmentAndHazardsToRunway(
        baseRunway,
        regions,
        environment,
        activeHazards,
        whatIf
      ),
    [baseRunway, regions, environment, activeHazards, whatIf]
  );

  const handleSelectRegion = (id: RegionId) => {
    setSelectedRegionId(id);
    setDrawerOpen(true);
  };

  const refreshDemoDashboard = async (stressors = backendStressors) => {
    const payload = await fetchDemoDashboard(stressors);
    if (!payload) return;
    const mapped = mapDemoDashboard(payload, regions, indicators);
    setRegions(mapped.regions);
    setBaseRunway(mapped.runway);
    setOneThing(mapped.oneThing);
    setIndicators(mapped.indicators);
    saveLocalState('regions', mapped.regions);
    saveLocalState('indicators', mapped.indicators);
    saveLocalState('oneThing', mapped.oneThing);
  };

  const handleToggleHazard = (id: HazardId) => {
    setActiveHazards((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  };

  const handleMeasurementSubmit = async (payload: {
    indicatorId: string;
    value: number;
    note?: string;
  }) => {
    const res = await submitMeasurement(payload);

    // Update local indicators, regions, and runway immediately so Twin reacts visibly
    let targetRegionId: RegionId = 'mind_sleep';
    setIndicators((prev) => {
      const updated = prev.map((ind) => {
        if (ind.id !== payload.indicatorId) return ind;
        targetRegionId = ind.regionId;
        return {
          ...ind,
          value: payload.value,
          status: res.newStatus,
          series: [
            ...ind.series.slice(0, -1),
            { day: 'Today', value: payload.value },
          ],
        };
      });
      saveLocalState('indicators', updated);
      return updated;
    });

    const nextRunwayDays =
      res.newStatus === 'nominal'
        ? null
        : res.newStatus === 'watch'
        ? 16
        : res.newStatus === 'caution'
        ? 8
        : 3;

    setRegions((prev) => {
      const updated = prev.map((r) =>
        r.id === targetRegionId
          ? { ...r, status: res.newStatus, runwayDays: nextRunwayDays }
          : r
      );
      saveLocalState('regions', updated);
      return updated;
    });

    setBaseRunway((prev) =>
      prev.map((rw) =>
        rw.regionId === targetRegionId
          ? { ...rw, status: res.newStatus, days: nextRunwayDays }
          : rw
      )
    );

    // Update Measure ring (always rewards honest logging even if elevated)
    setRings((prev) => {
      const next = {
        ...prev,
        measure: Math.min(1, Number((prev.measure + 0.5).toFixed(2))),
      };
      saveLocalState('rings', next);
      return next;
    });

    return res;
  };

  const handleCompleteOneThing = () => {
    const nextOtt: OneThingAction = { ...oneThing, completed: true };
    setOneThing(nextOtt);
    saveLocalState('oneThing', nextOtt);

    setRings((prev) => {
      const next = {
        ...prev,
        [oneThing.ringTarget]: Math.min(
          1,
          Number((prev[oneThing.ringTarget] + 0.4).toFixed(2))
        ),
      };
      saveLocalState('rings', next);
      return next;
    });
    showToast('Action logged. Your Rest ring updated gently.');
  };

  const handleIncrementRing = (key: 'move' | 'rest' | 'connect') => {
    setRings((prev) => {
      const nextVal = Math.min(1, Number((prev[key] + 0.25).toFixed(2)));
      const next = { ...prev, [key]: nextVal };
      saveLocalState('rings', next);
      if (nextVal >= 1 && prev[key] < 1) {
        showToast(`${key.charAt(0).toUpperCase() + key.slice(1)} ring complete.`);
      }
      return next;
    });
  };

  const handleQueuePacket = async () => {
    const updated = await queueSurgeonPacket(packet, isOnline);
    setPacket(updated);
    if (isOnline) {
      showToast('Summary packet prepared and queued. Use the approved mission Earth link to send it.');
    } else {
      showToast('Saved offline — queued to send when Earth link resumes.');
    }
  };

  const handleInjectStressor = (type: 'solar' | 'co2' | 'sleep' | 'eva') => {
    const stressorByType: Record<typeof type, string[]> = {
      solar: ['radiation_event'], co2: ['co2_rise'], sleep: ['sleep_debt', 'isolation_stress'], eva: ['eva_strain'],
    };
    const nextStressors = Array.from(new Set([...backendStressors, ...stressorByType[type]]));
    setBackendStressors(nextStressors);
    if (type === 'solar') {
      setActiveHazards(['radiation', 'distance']);
      setRegions((prev) =>
        prev.map((r) =>
          r.id === 'radiation' ? { ...r, status: 'caution', runwayDays: 9 } : r
        )
      );
      setBaseRunway((prev) =>
        prev.map((rw) =>
          rw.regionId === 'radiation' ? { ...rw, status: 'caution', days: 9 } : rw
        )
      );
      showToast('Injected Solar Particle Event: Radiation Load moved to Caution.');
    } else if (type === 'co2') {
      setActiveHazards(['closed']);
      setRegions((prev) =>
        prev.map((r) =>
          r.id === 'lungs_oxygen' ? { ...r, status: 'watch', runwayDays: 12 } : r
        )
      );
      setBaseRunway((prev) =>
        prev.map((rw) =>
          rw.regionId === 'lungs_oxygen' ? { ...rw, status: 'watch', days: 12 } : rw
        )
      );
      showToast('Injected Cabin CO₂ Drift: Lungs & Oxygen moved to Watch.');
    } else if (type === 'sleep') {
      setActiveHazards(['isolation', 'closed']);
      setRegions((prev) =>
        prev.map((r) =>
          r.id === 'mind_sleep' ? { ...r, status: 'escalate', runwayDays: 4 } : r
        )
      );
      setBaseRunway((prev) =>
        prev.map((rw) =>
          rw.regionId === 'mind_sleep' ? { ...rw, status: 'escalate', days: 4 } : rw
        )
      );
      showToast('Injected Sleep Disruption: Mind & Sleep moved to Escalate (4 days).');
    } else {
      setActiveHazards(['gravity']);
      setRegions((prev) =>
        prev.map((r) =>
          r.id === 'heart_vessels' ? { ...r, status: 'caution', runwayDays: 8 } : r
        )
      );
      setBaseRunway((prev) =>
        prev.map((rw) =>
          rw.regionId === 'heart_vessels' ? { ...rw, status: 'caution', days: 8 } : rw
        )
      );
      showToast('Injected EVA Strain: Heart & Vessels moved to Caution.');
    }
    void refreshDemoDashboard(nextStressors);
  };

  const handleResetDemoData = () => {
    setRegions(REGIONS_FIXTURE);
    setIndicators(INDICATORS_FIXTURE);
    setBaseRunway(RUNWAY_FIXTURE);
    setOneThing(ONE_THING_FIXTURE);
    setRings(INITIAL_RINGS_FIXTURE);
    setActiveHazards([]);
    setBackendStressors([]);
    setWhatIf(DEFAULT_WHAT_IF);
    saveLocalState('regions', REGIONS_FIXTURE);
    saveLocalState('indicators', INDICATORS_FIXTURE);
    saveLocalState('oneThing', ONE_THING_FIXTURE);
    saveLocalState('rings', INITIAL_RINGS_FIXTURE);
    showToast('Baseline demo data restored.');
  };

  // Screen 1: Intro
  if (screen === 'intro') {
    return (
      <IntroScreen
        reduceMotion={settings.reduceMotion}
        ambientAudio={settings.ambientAudio}
        onToggleAudio={(enabled) =>
          setSettings((s) => ({ ...s, ambientAudio: enabled }))
        }
        onComplete={() => setScreen('signin')}
      />
    );
  }

  // Screen 2: Sign-In
  if (screen === 'signin') {
    return (
      <SignInScreen
        isOnline={isOnline}
        onSuccess={({ crewId, name, authMethod }) => {
          const nextProfile: UserProfile = {
            ...profile,
            crewId,
            name: name || profile.name,
            authMethod,
          };
          setProfile(nextProfile);
          saveLocalState('profile', nextProfile);
          setScreen('profile');
          if (authMethod === 'demo' || authMethod === 'credentials') void refreshDemoDashboard([]);
        }}
      />
    );
  }

  // Screen 3: Welcome Profile (3 steps)
  if (screen === 'profile') {
    return (
      <WelcomeProfileScreen
        initialName={profile.name}
        initialEnvironment={profile.environment}
        initialExperience={profile.experience}
        onComplete={({ name, environment: env, experience }) => {
          const nextProfile: UserProfile = {
            ...profile,
            name,
            environment: env,
            experience,
          };
          setProfile(nextProfile);
          setEnvironment(env);
          saveLocalState('profile', nextProfile);
          setScreen('home');
          setHomeTab('twin');
          setFlightSchoolOpen(true);
          setFlightSchoolStep(0);
        }}
      />
    );
  }

  const activeRegion = regions.find((r) => r.id === selectedRegionId) || null;

  // Screen 5: Home Flight Deck (+ Flight School Spotlight Overlay when active)
  return (
    <div className="min-h-screen bg-[#070B14] text-[#E8EEF7] flex flex-col">
      <TopBar
        profile={profile}
        environment={environment}
        activeHazards={activeHazards}
        regions={regions}
        activeTab={homeTab}
        isOnline={isOnline}
        colorBlindSafe={settings.colorBlindSafe}
        demoActive={demoActive}
        flightSchoolSkipped={flightSchoolSkipped && !profile.flightSchoolCompleted}
        highlightedCoachStep={flightSchoolOpen ? flightSchoolStep : null}
        onChangeEnvironment={(env) => {
          setEnvironment(env);
          setProfile((p) => {
            const next = { ...p, environment: env };
            saveLocalState('profile', next);
            return next;
          });
        }}
        onToggleHazard={handleToggleHazard}
        onChangeTab={(tab) => {
          setHomeTab(tab);
          setDrawerOpen(false);
        }}
        onStartDemo={() => {
          setHomeTab('twin');
          setDemoActive(true);
          setDemoPlaying(true);
          setDemoSec(0);
        }}
        onOpenHelpMeNow={() => setHelpMeNowOpen(true)}
        onOpenLearn={(tab) => setLearnModal({ open: true, tab })}
        onReplayFlightSchool={() => {
          setHomeTab('twin');
          setFlightSchoolStep(0);
          setFlightSchoolOpen(true);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onSignOut={() => { void signOutCrew(); setScreen('signin'); }}
      />

      <div className="px-4 py-1.5 text-center text-[10px] tracking-wide text-[#FFB547] bg-[#FFB547]/[0.06] border-b border-[#FFB547]/20">
        SYNTHETIC DATA · Demo trend bands only · Self-assessment support, not clinical advice
      </div>

      <DemoModeBar
        active={demoActive}
        playing={demoPlaying}
        currentSec={demoSec}
        speed={demoSpeed}
        onTogglePlay={() => setDemoPlaying((v) => !v)}
        onSeek={(sec) => setDemoSec(sec)}
        onChangeSpeed={setDemoSpeed}
        onInjectStressor={handleInjectStressor}
        onExit={() => {
          setDemoActive(false);
          setDemoPlaying(false);
          handleResetDemoData();
        }}
      />

      {/* Gentle Non-Startling Slide-In Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 z-50 px-4 py-2.5 rounded-2xl cockpit-panel-elevated text-xs font-medium text-[#E8EEF7] border-[#7FB2FF]/40"
        >
          {toast}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {homeTab === 'twin' && (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5">
            <div className="grid grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)_310px] xl:grid-cols-[330px_minmax(0,1fr)_320px] gap-5 items-stretch">
              {/* Left: HOW LONG can I stay here? (Runway) */}
              <div className="order-2 lg:order-1">
                <HealthRunwayPanel
                  items={computedRunway}
                  selectedRegionId={selectedRegionId}
                  colorBlindSafe={settings.colorBlindSafe}
                  highlightedCoachStep={flightSchoolOpen ? flightSchoolStep : null}
                  onSelectRegion={handleSelectRegion}
                  onOpenWhy={(regionId) =>
                    setWhyModal({ open: true, mode: 'why', regionId })
                  }
                  onOpenWhatIf={() =>
                    setWhyModal({
                      open: true,
                      mode: 'whatif',
                      regionId: selectedRegionId || 'mind_sleep',
                    })
                  }
                />
              </div>

              {/* Center: WHERE am I? (3D Ghost Twin) */}
              <div className="order-1 lg:order-2">
                <TwinViewport
                  regions={regions}
                  selectedRegionId={selectedRegionId}
                  layer={layer}
                  activeHazards={activeHazards}
                  environment={environment}
                  colorBlindSafe={settings.colorBlindSafe}
                  reduceMotion={settings.reduceMotion}
                  forceFallback2D={settings.forceFallback2D}
                  onSelectRegion={handleSelectRegion}
                  onChangeLayer={setLayer}
                  highlightedCoachStep={flightSchoolOpen ? flightSchoolStep : null}
                />
              </div>

              {/* Right: WHAT do I do? (One Thing Today) */}
              <div className="order-3">
                <OneThingCard
                  action={oneThing}
                  highlightedCoachStep={flightSchoolOpen ? flightSchoolStep : null}
                  onDoIt={() => {
                    if (oneThing.indicatorId) {
                      setWizardIndicatorId(oneThing.indicatorId);
                      setWizardOpen(true);
                    } else {
                      handleCompleteOneThing();
                    }
                  }}
                  onRemindMe={() => {
                    const nextOtt: OneThingAction = {
                      ...oneThing,
                      remindedAt: '20:30',
                    };
                    setOneThing(nextOtt);
                    saveLocalState('oneThing', nextOtt);
                    showToast('Calm reminder set for 20:30 cabin time.');
                  }}
                  onWhy={(regionId) =>
                    setWhyModal({ open: true, mode: 'why', regionId })
                  }
                  onUseBackup={(title) => {
                    setRings((prev) => {
                      const next = {
                        ...prev,
                        move: Math.min(1, Number((prev.move + 0.35).toFixed(2))),
                      };
                      saveLocalState('rings', next);
                      return next;
                    });
                    showToast(`Logged backup: ${title}`);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {homeTab === 'crew' && (
          <CrewScreen
            crew={crew}
            colorBlindSafe={settings.colorBlindSafe}
            onBuddyCheckIn={() => handleIncrementRing('connect')}
          />
        )}

        {homeTab === 'summary' && (
          <FlightSurgeonSummary
            profile={profile}
            environment={environment}
            regions={regions}
            indicators={indicators}
            packet={packet}
            isOnline={isOnline}
            colorBlindSafe={settings.colorBlindSafe}
            onUpdateNotes={(notes) => {
              const next = { ...packet, notes };
              setPacket(next);
              saveLocalState('packet', next);
            }}
            onQueuePacket={handleQueuePacket}
          />
        )}
      </main>

      {/* Bottom Dock: Health Rings + Measure Now + Persistent Surgeon Link */}
      <HealthRingsBar
        rings={rings}
        onMeasureNow={() => {
          setWizardIndicatorId(null);
          setWizardOpen(true);
        }}
        onOpenSurgeonGuide={() => setHomeTab('summary')}
        onIncrementRing={handleIncrementRing}
      />

      {/* Interactive Overlays & Drawers */}
      {flightSchoolOpen && (
        <FlightSchoolOverlay
          currentStep={flightSchoolStep}
          onChangeStep={setFlightSchoolStep}
          onQuickMeasure={async (value) => {
            await handleMeasurementSubmit({
              indicatorId: 'sleep_duration',
              value,
            });
          }}
          onSkip={() => {
            setFlightSchoolOpen(false);
            setFlightSchoolSkipped(true);
          }}
          onComplete={() => {
            setFlightSchoolOpen(false);
            setFlightSchoolSkipped(false);
            const nextProfile = { ...profile, flightSchoolCompleted: true };
            setProfile(nextProfile);
            saveLocalState('profile', nextProfile);

            setRings((prev) => {
              const next = {
                ...prev,
                badges: prev.badges.map((b) =>
                  b.id === 'badge-cleared' ? { ...b, earned: true } : b
                ),
              };
              saveLocalState('rings', next);
              return next;
            });
          }}
        />
      )}

      <RegionDrawer
        region={drawerOpen ? activeRegion : null}
        indicators={indicators}
        experience={profile.experience}
        colorBlindSafe={settings.colorBlindSafe}
        onClose={() => setDrawerOpen(false)}
        onMeasureIndicator={(indicatorId) => {
          setWizardIndicatorId(indicatorId);
          setWizardOpen(true);
        }}
      />

      <MeasurementWizard
        isOpen={wizardOpen}
        indicators={indicators}
        initialIndicatorId={wizardIndicatorId}
        colorBlindSafe={settings.colorBlindSafe}
        onClose={() => setWizardOpen(false)}
        onSubmitMeasurement={async (payload) => {
          const res = await handleMeasurementSubmit(payload);
          if (payload.indicatorId === oneThing.indicatorId) {
            handleCompleteOneThing();
          }
          return res;
        }}
        onOpenSurgeonPacket={() => setHomeTab('summary')}
      />

      <WhyAndWhatIfModal
        isOpen={whyModal.open}
        mode={whyModal.mode}
        regionId={whyModal.regionId}
        regions={regions}
        runwayItems={computedRunway}
        adjustments={whatIf}
        onChangeMode={(mode) => setWhyModal((w) => ({ ...w, mode }))}
        onChangeAdjustments={setWhatIf}
        onClose={() => setWhyModal((w) => ({ ...w, open: false }))}
      />

      <HelpMeNowModal
        isOpen={helpMeNowOpen}
        onClose={() => setHelpMeNowOpen(false)}
        onOpenSurgeonPacket={(note) => {
          const next = { ...packet, notes: note };
          setPacket(next);
          saveLocalState('packet', next);
          setHomeTab('summary');
        }}
      />

      <LearnAndGlossaryModal
        isOpen={learnModal.open}
        initialTab={learnModal.tab}
        onClose={() => setLearnModal((m) => ({ ...m, open: false }))}
      />

      <SettingsModal
        isOpen={settingsOpen}
        profile={profile}
        settings={settings}
        onUpdateExperience={(experience) => {
          const next = { ...profile, experience };
          setProfile(next);
          saveLocalState('profile', next);
        }}
        onUpdateSettings={setSettings}
        onResetBaseline={handleResetDemoData}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
