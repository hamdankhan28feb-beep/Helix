import { BodyRegion, Indicator, RegionId, RunwayItem, StatusLevel } from '../types/helix';

/**
 * Evaluates physiological status from real user inputs based on NASA HRP
 * standards, standard medical reference ranges, and flight surgeon thresholds.
 */
export function calculateIndicatorStatus(
  indicatorId: string,
  value: number
): { status: StatusLevel; feedback: 'Recorded for review' | 'Contact flight surgeon'; note: string } {
  let status: StatusLevel = 'nominal';
  let note = 'Within personal flight baseline.';

  switch (indicatorId) {
    case 'resting_hr': {
      // Normal: 60 - 100 bpm
      if (value < 42 || value > 130) {
        status = 'escalate';
        note = 'Severe tachycardia / bradycardia requiring crew surgeon consult.';
      } else if (value < 50 || value > 115) {
        status = 'caution';
        note = 'Elevated cardiac rate sustained outside nominal envelope.';
      } else if (value < 58 || value > 102) {
        status = 'watch';
        note = 'Slight elevation above baseline resting rate.';
      } else {
        status = 'nominal';
        note = 'Resting heart rate in optimal flight baseline (60–100 bpm).';
      }
      break;
    }

    case 'hrv_rmssd': {
      // Normal: 30 - 90 ms
      if (value < 15) {
        status = 'escalate';
        note = 'Severely depressed HRV indicating acute autonomic exhaustion.';
      } else if (value < 25) {
        status = 'caution';
        note = 'Low vagal tone; autonomic strain detected.';
      } else if (value < 35) {
        status = 'watch';
        note = 'Minor recovery deficit; consider schedule decompression.';
      } else {
        status = 'nominal';
        note = 'Autonomic tone well-balanced (RMSSD > 35 ms).';
      }
      break;
    }

    case 'sleep_duration': {
      // Normal: 7.0 - 9.0 hours
      if (value < 4.5) {
        status = 'escalate';
        note = 'Critical sleep deprivation (<4.5h); high cognitive error risk.';
      } else if (value < 6.0) {
        status = 'caution';
        note = 'Substantial sleep debt accrued (<6.0h); recovery nap advised.';
      } else if (value < 7.0) {
        status = 'watch';
        note = 'Slightly below recommended 7.0–9.0h mission sleep window.';
      } else {
        status = 'nominal';
        note = 'Restful mission sleep recorded in target window (7.0–9.0h).';
      }
      break;
    }

    case 'mood_energy':
    case 'mood_score': {
      // Normal: 1 - 2 (Low stress / high readiness)
      if (value >= 5) {
        status = 'escalate';
        note = 'High acute mission stress or severe cognitive fatigue.';
      } else if (value >= 4) {
        status = 'caution';
        note = 'Elevated subjective stress; behavioral decompression recommended.';
      } else if (value >= 3) {
        status = 'watch';
        note = 'Moderate fatigue/strain logged.';
      } else {
        status = 'nominal';
        note = 'Optimal mental readiness and low stress reported.';
      }
      break;
    }

    case 'near_acuity': {
      // LogMAR scale (0.00 is 20/20, +0.20 is 20/32)
      if (value > 0.35) {
        status = 'escalate';
        note = 'Significant visual acuity shift; possible SANS progression.';
      } else if (value > 0.20) {
        status = 'caution';
        note = 'Noticeable near visual degradation; schedule ultrasound.';
      } else if (value > 0.08) {
        status = 'watch';
        note = 'Mild near-vision focal drift from preflight acuity.';
      } else {
        status = 'nominal';
        note = 'Near visual acuity steady at baseline (20/20 equivalent).';
      }
      break;
    }

    case 'bone_load_score': {
      // ARED Daily Mechanical Work (kJ) or loading compliance %
      if (value < 40) {
        status = 'escalate';
        note = 'Critically inadequate resistive load; osteopenia progression accelerated.';
      } else if (value < 65) {
        status = 'caution';
        note = 'Below target ARED resistive load; bone density maintenance compromised.';
      } else if (value < 85) {
        status = 'watch';
        note = 'Slightly under daily resistive exercise goal.';
      } else {
        status = 'nominal';
        note = 'Target skeletal load met for microgravity preservation.';
      }
      break;
    }

    case 'vestibular_drift': {
      // Angular heading error in degrees (0 - 30 deg)
      if (value > 20) {
        status = 'escalate';
        note = 'Substantial otolith/semicircular disorientation.';
      } else if (value > 12) {
        status = 'caution';
        note = 'Active spatial disorientation (SMS); restrict rapid head turns.';
      } else if (value > 6) {
        status = 'watch';
        note = 'Mild sensory adaptation drift during environment transition.';
      } else {
        status = 'nominal';
        note = 'Otolith and ocular stabilization verified nominal.';
      }
      break;
    }

    case 'hydration_intake': {
      // Liters / day (target 2.2 - 3.2 L)
      if (value < 1.2) {
        status = 'escalate';
        note = 'Severe dehydration risk; orthostatic tolerance compromised.';
      } else if (value < 1.8) {
        status = 'caution';
        note = 'Below minimum fluid balance; increase electrolyte intake.';
      } else if (value < 2.3) {
        status = 'watch';
        note = 'Marginal fluid intake logged for today.';
      } else {
        status = 'nominal';
        note = 'Optimal mission fluid and electrolyte hydration maintained.';
      }
      break;
    }

    case 'bp_systolic': {
      // mmHg (normal 95 - 120)
      if (value < 80 || value >= 150) {
        status = 'escalate';
        note = 'Blood pressure severely out of mission flight envelope.';
      } else if (value < 90 || value >= 135) {
        status = 'caution';
        note = 'Noticeable cephalad fluid shift / cardiovascular strain.';
      } else if (value < 95 || value >= 125) {
        status = 'watch';
        note = 'Borderline blood pressure reading.';
      } else {
        status = 'nominal';
        note = 'Arterial pressure in optimal range (95–120 mmHg).';
      }
      break;
    }

    case 'spo2': {
      // %
      if (value < 90) {
        status = 'escalate';
        note = 'Hypoxemia detected; verify cabin pO2 and breathing loop.';
      } else if (value < 93) {
        status = 'caution';
        note = 'Depressed blood oxygen saturation.';
      } else if (value < 96) {
        status = 'watch';
        note = 'Mildly reduced oxygenation; check physical exertion levels.';
      } else {
        status = 'nominal';
        note = 'Blood oxygen saturation optimal (96–100%).';
      }
      break;
    }

    case 'core_temp': {
      // °C
      if (value < 35.5 || value >= 39.0) {
        status = 'escalate';
        note = 'Critical hypothermia or hyperthermia / acute infection.';
      } else if (value < 36.0 || value >= 38.0) {
        status = 'caution';
        note = 'Significant core temperature elevation or drop.';
      } else if (value < 36.4 || value >= 37.6) {
        status = 'watch';
        note = 'Slight thermal regulation variance (possible space fever adaptation).';
      } else {
        status = 'nominal';
        note = 'Core body temperature normal (36.5–37.5°C).';
      }
      break;
    }

    case 'blood_glucose': {
      // mg/dL
      if (value < 50 || value > 165) {
        status = 'escalate';
        note = 'Acute hypoglycemia or hyperglycemia.';
      } else if (value < 65 || value > 130) {
        status = 'caution';
        note = 'Altered glucose tolerance in microgravity; adjust nutrition plan.';
      } else if (value < 70 || value > 110) {
        status = 'watch';
        note = 'Slightly outside standard post-prandial range.';
      } else {
        status = 'nominal';
        note = 'Blood glucose within optimal fasting/post-meal envelope.';
      }
      break;
    }

    default: {
      // Generic percentage drift check
      status = 'nominal';
      note = 'Measurement recorded in flight computer log.';
      break;
    }
  }

  const feedback =
    status === 'escalate' ? 'Contact flight surgeon' : 'Recorded for review';

  return { status, feedback, note };
}

/**
 * Calculates projected health runway in days from status level.
 */
export function getRunwayFromStatus(status: StatusLevel): number | null {
  switch (status) {
    case 'nominal':
      return null; // Stable
    case 'watch':
      return 16;
    case 'caution':
      return 8;
    case 'escalate':
      return 3;
  }
}

/**
 * Updates full physiological state (indicators, regions, runway) when user logs new vitals.
 */
export function applyUserMeasurement(
  indicatorId: string,
  value: number,
  currentIndicators: Indicator[],
  currentRegions: BodyRegion[],
  currentRunway: RunwayItem[]
): {
  updatedIndicators: Indicator[];
  updatedRegions: BodyRegion[];
  updatedRunway: RunwayItem[];
  evaluation: { status: StatusLevel; feedback: 'Recorded for review' | 'Contact flight surgeon'; note: string };
  targetRegionId: RegionId;
} {
  const evalResult = calculateIndicatorStatus(indicatorId, value);
  let targetRegionId: RegionId = 'heart_vessels';

  const updatedIndicators = currentIndicators.map((ind) => {
    if (ind.id !== indicatorId) return ind;
    targetRegionId = ind.regionId;
    return {
      ...ind,
      value,
      status: evalResult.status,
      series: [
        ...ind.series.slice(0, -1),
        { day: 'Today', value },
      ],
    };
  });

  const nextRunwayDays = getRunwayFromStatus(evalResult.status);

  const updatedRegions = currentRegions.map((region) => {
    if (region.id !== targetRegionId) return region;
    return {
      ...region,
      status: evalResult.status,
      runwayDays: nextRunwayDays,
    };
  });

  const updatedRunway = currentRunway.map((rw) => {
    if (rw.regionId !== targetRegionId) return rw;
    return {
      ...rw,
      status: evalResult.status,
      days: nextRunwayDays,
    };
  });

  return {
    updatedIndicators,
    updatedRegions,
    updatedRunway,
    evaluation: evalResult,
    targetRegionId,
  };
}
