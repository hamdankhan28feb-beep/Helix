import React, { useState } from 'react';
import {
  Activity,
  Heart,
  Moon,
  Thermometer,
  Zap,
  Gauge,
  Droplets,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
} from 'lucide-react';
import { calculateIndicatorStatus } from '../../lib/evaluator';
import { cn, getStatusColor } from '../../lib/utils';
import { BodyRegion, Indicator, RunwayItem, StatusLevel } from '../../types/helix';
import { StatusIcon } from '../ui/Primitives';

interface VitalsEntryModalProps {
  isOpen: boolean;
  indicators: Indicator[];
  colorBlindSafe: boolean;
  onClose: () => void;
  onSaveVitals: (entries: Array<{ indicatorId: string; value: number }>) => void;
  onResetToBaseline: () => void;
}

interface VitalFieldConfig {
  id: string;
  label: string;
  unit: string;
  icon: React.ElementType;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  normalRange: string;
  regionId: string;
}

const VITALS_CONFIG: VitalFieldConfig[] = [
  {
    id: 'resting_hr',
    label: 'Resting Heart Rate',
    unit: 'bpm',
    icon: Heart,
    defaultValue: 68,
    min: 35,
    max: 180,
    step: 1,
    normalRange: '60–100 bpm',
    regionId: 'heart_vessels',
  },
  {
    id: 'bp_systolic',
    label: 'Blood Pressure (Systolic)',
    unit: 'mmHg',
    icon: Activity,
    defaultValue: 116,
    min: 70,
    max: 200,
    step: 1,
    normalRange: '95–120 mmHg',
    regionId: 'heart_vessels',
  },
  {
    id: 'sleep_duration',
    label: 'Daily Sleep Duration',
    unit: 'hours',
    icon: Moon,
    defaultValue: 7.6,
    min: 2,
    max: 14,
    step: 0.1,
    normalRange: '7.0–9.0 hrs',
    regionId: 'mind_sleep',
  },
  {
    id: 'spo2',
    label: 'Oxygen Saturation (SpO2)',
    unit: '%',
    icon: Droplets,
    defaultValue: 98,
    min: 80,
    max: 100,
    step: 1,
    normalRange: '96–100%',
    regionId: 'lungs_oxygen',
  },
  {
    id: 'core_temp',
    label: 'Core Body Temperature',
    unit: '°C',
    icon: Thermometer,
    defaultValue: 36.8,
    min: 34,
    max: 41,
    step: 0.1,
    normalRange: '36.5–37.5°C',
    regionId: 'immune_skin',
  },
  {
    id: 'blood_glucose',
    label: 'Blood Glucose',
    unit: 'mg/dL',
    icon: Zap,
    defaultValue: 88,
    min: 40,
    max: 250,
    step: 1,
    normalRange: '70–100 mg/dL',
    regionId: 'gut_metabolism',
  },
  {
    id: 'mood_energy',
    label: 'Stress & Fatigue Score',
    unit: 'scale (1–5)',
    icon: Gauge,
    defaultValue: 2,
    min: 1,
    max: 5,
    step: 1,
    normalRange: '1–2 (nominal)',
    regionId: 'mind_sleep',
  },
  {
    id: 'bone_load_score',
    label: 'Resistive Exercise Compliance',
    unit: '%',
    icon: Activity,
    defaultValue: 92,
    min: 10,
    max: 150,
    step: 5,
    normalRange: '85–100%',
    regionId: 'bones_muscles',
  },
];

export const VitalsEntryModal: React.FC<VitalsEntryModalProps> = ({
  isOpen,
  indicators,
  colorBlindSafe,
  onClose,
  onSaveVitals,
  onResetToBaseline,
}) => {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    VITALS_CONFIG.forEach((cfg) => {
      const existing = indicators.find((i) => i.id === cfg.id);
      initial[cfg.id] = existing ? existing.value : cfg.defaultValue;
    });
    return initial;
  });

  const [dirty, setDirty] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleChange = (id: string, num: number) => {
    setValues((prev) => ({ ...prev, [id]: num }));
    setDirty((prev) => new Set(prev).add(id));
  };

  const handleSave = () => {
    const entries = Object.entries(values).map(([indicatorId, value]) => ({
      indicatorId,
      value,
    }));
    onSaveVitals(entries);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#070B14]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Direct Vitals Input Station"
    >
      <div className="w-full max-w-2xl rounded-3xl cockpit-panel-elevated p-5 sm:p-7 max-h-[90vh] flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#7FB2FF]/15 text-[#7FB2FF]">
                <Activity className="w-4 h-4" aria-hidden="true" />
              </span>
              <h2 className="text-lg sm:text-xl font-semibold text-[#E8EEF7]">
                Live Vitals Entry Station
              </h2>
            </div>
            <p className="text-xs text-[#8A97AD]">
              Enter real measurements to dynamically update your 3D Ghost Twin, health runway, and recommendations.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A97AD] hover:text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VITALS_CONFIG.map((cfg) => {
              const val = values[cfg.id] ?? cfg.defaultValue;
              const evalRes = calculateIndicatorStatus(cfg.id, val);
              const color = getStatusColor(evalRes.status, colorBlindSafe);
              const Icon = cfg.icon;

              return (
                <div
                  key={cfg.id}
                  className="p-3.5 rounded-2xl bg-[#070B14]/75 border border-white/10 hover:border-white/20 transition-colors flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#7FB2FF]" aria-hidden="true" />
                      <div>
                        <span className="text-xs font-medium text-[#E8EEF7] block">
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-[#8A97AD] font-mono-tabular">
                          Normal: {cfg.normalRange}
                        </span>
                      </div>
                    </div>

                    {/* Live Status Pill */}
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider shrink-0"
                      style={{
                        backgroundColor: `${color}18`,
                        color: color,
                        border: `1px solid ${color}40`,
                      }}
                    >
                      <StatusIcon status={evalRes.status} colorBlindSafe={colorBlindSafe} className="w-2.5 h-2.5" />
                      {evalRes.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min={cfg.min}
                        max={cfg.max}
                        step={cfg.step}
                        value={val}
                        onChange={(e) => {
                          const parsed = parseFloat(e.target.value);
                          if (!Number.isNaN(parsed)) {
                            handleChange(cfg.id, parsed);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-[#0E1522] border border-white/15 text-sm font-semibold font-mono-tabular text-[#E8EEF7] focus:border-[#7FB2FF] focus:outline-none focus:ring-1 focus:ring-[#7FB2FF]"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-[#8A97AD] pointer-events-none">
                        {cfg.unit}
                      </span>
                    </div>

                    {/* Quick increment/decrement buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleChange(cfg.id, Math.max(cfg.min, Number((val - cfg.step).toFixed(1))))}
                        className="w-7 h-8 rounded-lg bg-[#151E2E] hover:bg-white/10 text-xs font-bold text-[#E8EEF7] flex items-center justify-center cursor-pointer border border-white/10"
                        title="Decrease"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange(cfg.id, Math.min(cfg.max, Number((val + cfg.step).toFixed(1))))}
                        className="w-7 h-8 rounded-lg bg-[#151E2E] hover:bg-white/10 text-xs font-bold text-[#E8EEF7] flex items-center justify-center cursor-pointer border border-white/10"
                        title="Increase"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {evalRes.status !== 'nominal' && (
                    <p className="text-[11px] text-[#FFB547] leading-tight">
                      {evalRes.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              onResetToBaseline();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#8A97AD] hover:text-[#E8EEF7] hover:bg-white/5 border border-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset to Clean Baseline (Zero Drift)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#8A97AD] hover:text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#7FB2FF] text-[#070B14] hover:bg-[#9EC5FF] transition-colors shadow-lg shadow-[#7FB2FF]/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Apply Vitals to Flight Computer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
