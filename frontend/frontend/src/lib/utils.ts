import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  BodyRegion,
  HazardId,
  MissionEnvironment,
  RunwayItem,
  StatusLevel,
  WhatIfAdjustments,
} from '../types/helix';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusColor(status: StatusLevel, colorBlindSafe = false): string {
  if (colorBlindSafe) {
    switch (status) {
      case 'nominal':
        return '#009E73';
      case 'watch':
        return '#56B4E9';
      case 'caution':
        return '#E69F00';
      case 'escalate':
        return '#D55E00';
    }
  }
  switch (status) {
    case 'nominal':
      return '#3DE0C5';
    case 'watch':
      return '#6CB6FF';
    case 'caution':
      return '#FFB547';
    case 'escalate':
      return '#FF6B5E';
  }
}

export function calculateWhatIfDelta(
  region: BodyRegion,
  adjustments: WhatIfAdjustments
): number {
  let bonus = 0;
  if (adjustments.sleepPlus90) {
    if (region.id === 'mind_sleep') bonus += 6;
    if (region.id === 'heart_vessels') bonus += 3;
    if (region.id === 'immune_skin') bonus += 2;
    if (region.id === 'brain_eyes') bonus += 2;
  }
  if (adjustments.exerciseBoost) {
    if (region.id === 'bones_muscles') bonus += 8;
    if (region.id === 'heart_vessels') bonus += 4;
    if (region.id === 'mind_sleep') bonus += 2;
    if (region.id === 'gut_metabolism') bonus += 2;
  }
  if (adjustments.lighterWorkload) {
    if (region.id === 'mind_sleep') bonus += 4;
    if (region.id === 'heart_vessels') bonus += 2;
    if (region.id === 'immune_skin') bonus += 2;
  }
  if (adjustments.hydrationNutrition) {
    if (region.id === 'gut_metabolism') bonus += 5;
    if (region.id === 'heart_vessels') bonus += 3;
    if (region.id === 'inner_ear') bonus += 2;
    if (region.id === 'bones_muscles') bonus += 2;
  }
  if (adjustments.lightShift) {
    if (region.id === 'mind_sleep') bonus += 5;
    if (region.id === 'brain_eyes') bonus += 2;
  }
  return bonus;
}

export function applyEnvironmentAndHazardsToRunway(
  baseRunway: RunwayItem[],
  regions: BodyRegion[],
  environment: MissionEnvironment,
  activeHazards: HazardId[],
  adjustments: WhatIfAdjustments
): Array<RunwayItem & { deltaDays: number }> {
  const regionMap = new Map(regions.map((r) => [r.id, r]));

  return baseRunway.map((item) => {
    const region = regionMap.get(item.regionId);
    if (!region) return { ...item, deltaDays: 0 };

    let days = item.days;
    if (days !== null) {
      // Subtle realistic environment modifier
      if (environment === 'mars' && region.id === 'bones_muscles') days += 3;
      if (environment === 'transit' && region.id === 'radiation') days = Math.max(4, days - 3);
      if (environment === 'lunar' && region.id === 'lungs_oxygen') days = Math.max(5, days - 2);

      // Active hazard lens pressure preview
      if (activeHazards.length > 0 && region.affectedByHazards.some((h) => activeHazards.includes(h))) {
        const overlapCount = region.affectedByHazards.filter((h) =>
          activeHazards.includes(h)
        ).length;
        days = Math.max(2, days - overlapCount);
      }
    }

    const whatIfBonus = calculateWhatIfDelta(region, adjustments);
    const adjustedDays = days === null ? null : Math.min(90, days + whatIfBonus);

    return {
      ...item,
      days: adjustedDays,
      deltaDays: whatIfBonus,
    };
  });
}

export function getCombinedRiskSummary(
  activeHazards: HazardId[],
  regions: BodyRegion[]
): {
  level: StatusLevel;
  label: string;
  compoundingNote: string | null;
} {
  const escalated = regions.filter((r) => r.status === 'escalate').length;
  const cautioned = regions.filter((r) => r.status === 'caution').length;
  const watched = regions.filter((r) => r.status === 'watch').length;

  let compoundingNote: string | null = null;
  if (activeHazards.includes('isolation') && activeHazards.includes('closed')) {
    compoundingNote = 'Sleep + isolation + closed cabin air are stacking on mood and focus.';
  } else if (activeHazards.includes('radiation') && activeHazards.includes('distance')) {
    compoundingNote = 'Deep-space radiation + Earth comms delay increase self-monitoring priority.';
  } else if (activeHazards.includes('gravity') && activeHazards.includes('radiation')) {
    compoundingNote = 'Fluid shift + radiation load are stacking on vision and bone recovery.';
  } else if (activeHazards.length >= 2) {
    compoundingNote = `${activeHazards.length} mission hazards are stacking across shared body systems.`;
  }

  if (escalated > 0 || activeHazards.length >= 4) {
    return { level: 'escalate', label: 'Elevated stack', compoundingNote };
  }
  if (cautioned >= 2 || activeHazards.length >= 2) {
    return { level: 'caution', label: 'Moderate stack', compoundingNote };
  }
  if (cautioned === 1 || watched >= 2 || activeHazards.length === 1) {
    return { level: 'watch', label: 'Mild load', compoundingNote };
  }
  return { level: 'nominal', label: 'Calm baseline', compoundingNote };
}
