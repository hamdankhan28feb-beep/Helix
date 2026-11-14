import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Send,
  WifiOff,
  FileText,
} from 'lucide-react';
import { ENVIRONMENT_CONFIG } from '../../lib/tokens';
import { cn } from '../../lib/utils';
import {
  BodyRegion,
  Indicator,
  MissionEnvironment,
  PacketState,
  UserProfile,
} from '../../types/helix';
import { Button, StatusIndicator } from '../ui/Primitives';

interface FlightSurgeonSummaryProps {
  profile: UserProfile;
  environment: MissionEnvironment;
  regions: BodyRegion[];
  indicators: Indicator[];
  packet: PacketState;
  isOnline: boolean;
  colorBlindSafe: boolean;
  onUpdateNotes: (notes: string) => void;
  onQueuePacket: () => void;
}

export const FlightSurgeonSummary: React.FC<FlightSurgeonSummaryProps> = ({
  profile,
  environment,
  regions,
  indicators,
  packet,
  isOnline,
  colorBlindSafe,
  onUpdateNotes,
  onQueuePacket,
}) => {
  const [copied, setCopied] = useState(false);

  const driftedRegions = regions.filter((r) => r.status !== 'nominal');
  const envCfg = ENVIRONMENT_CONFIG[environment];

  const handleCopyText = () => {
    const summaryText = [
      `HELIX FLIGHT SURGEON SUMMARY — ${profile.name} (${profile.crewId})`,
      `Environment: ${envCfg.label} (${envCfg.earthDelayText})`,
      `Drifted regions: ${
        driftedRegions.map((r) => `${r.name} [${r.status}]`).join(', ') || 'None'
      }`,
      `Crew notes: ${packet.notes || 'None'}`,
    ].join('\n');
    navigator.clipboard?.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Offline Dashed Ribbon */}
      {!isOnline && (
        <div className="p-3.5 rounded-2xl border border-dashed border-[#FFB547]/60 bg-[#FFB547]/10 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#FFB547] font-medium">
            <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Queued, will send when linked — packet is saved safely on this device.</span>
          </div>
        </div>
      )}

      {/* One-Page Packet Preview */}
      <article className="rounded-3xl cockpit-panel p-6 sm:p-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#7FB2FF]">
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>One-Page Flight Surgeon Summary</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-semibold text-[#E8EEF7]">
              {profile.name} · <span className="font-mono-tabular text-[#8A97AD]">{profile.crewId}</span>
            </h1>
            <p className="mt-1 text-xs text-[#8A97AD]">
              {envCfg.label} ({envCfg.gravityLabel}) · Earth link: {envCfg.earthDelayText}
            </p>
          </div>

          {/* Queue State Indicator */}
          <div
            className={cn(
              'px-3.5 py-2 rounded-2xl border text-xs font-medium inline-flex items-center gap-2 self-start',
              packet.status === 'delivered'
                ? 'bg-[#3DE0C5]/12 border-[#3DE0C5]/40 text-[#3DE0C5]'
                : packet.status === 'sending'
                ? 'bg-[#6CB6FF]/12 border-[#6CB6FF]/40 text-[#6CB6FF]'
                : packet.status === 'queued'
                ? 'bg-[#FFB547]/12 border-dashed border-[#FFB547]/50 text-[#FFB547]'
                : 'bg-[#070B14] border-white/12 text-[#8A97AD]'
            )}
          >
            {packet.status === 'delivered' && <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
            {packet.status === 'sending' && <Send className="w-4 h-4" aria-hidden="true" />}
            {packet.status === 'queued' && <Clock className="w-4 h-4" aria-hidden="true" />}
            <span>
              {packet.status === 'idle'
                ? 'Ready to queue'
                : packet.status === 'queued'
                ? 'Queued, will send when linked'
                : packet.status === 'sending'
                ? `Sending across ${envCfg.earthDelayText}…`
                : `Delivered at ${packet.deliveredAt}`}
            </span>
          </div>
        </header>

        {/* Drifted Body Systems */}
        <section>
          <h2 className="text-sm font-semibold text-[#E8EEF7] mb-3">
            Systems drifting from personal baseline ({driftedRegions.length})
          </h2>
          {driftedRegions.length === 0 ? (
            <p className="text-xs text-[#3DE0C5] p-3 rounded-2xl bg-[#3DE0C5]/10 border border-[#3DE0C5]/25">
              All 9 body regions are currently Nominal against baseline.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {driftedRegions.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-2xl bg-[#070B14]/70 border border-white/[0.08] flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-medium text-[#E8EEF7]">{r.name}</p>
                    <p className="text-xs text-[#8A97AD] mt-0.5">
                      {r.runwayDays ? `Runway ~${r.runwayDays} days` : 'Stable'}
                    </p>
                  </div>
                  <StatusIndicator status={r.status} colorBlindSafe={colorBlindSafe} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Key Indicator Table */}
        <section>
          <h2 className="text-sm font-semibold text-[#E8EEF7] mb-3">
            Key indicator readings vs personal baseline
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070B14]/80 text-[#8A97AD]">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Indicator</th>
                  <th className="py-2.5 px-3 font-medium">Current</th>
                  <th className="py-2.5 px-3 font-medium">Baseline</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {indicators.slice(0, 7).map((ind) => (
                  <tr key={ind.id} className="bg-[#0E1522]/40">
                    <td className="py-2.5 px-3 font-medium text-[#E8EEF7]">
                      {ind.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono-tabular text-[#E8EEF7]">
                      {ind.value} {ind.unit}
                    </td>
                    <td className="py-2.5 px-3 font-mono-tabular text-[#8A97AD]">
                      {ind.baseline} {ind.unit}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusIndicator
                        status={ind.status}
                        colorBlindSafe={colorBlindSafe}
                        compact
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Crew Context Notes */}
        <section>
          <label htmlFor="surgeon-notes" className="block text-sm font-semibold text-[#E8EEF7] mb-2">
            Symptoms or self-care already tried
          </label>
          <textarea
            id="surgeon-notes"
            rows={3}
            value={packet.notes}
            onChange={(e) => onUpdateNotes(e.target.value)}
            placeholder="Describe what you feel, when it started, and any self-care steps taken..."
            className="w-full px-3.5 py-2.5 rounded-2xl bg-[#070B14] border border-white/12 text-sm text-[#E8EEF7] placeholder:text-[#8A97AD]/50 focus:border-[#7FB2FF] focus:outline-none"
          />
        </section>

        {/* Send / Copy Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/[0.08]">
          <p className="text-[11px] text-[#8A97AD]">
            Synthetic data, self-assessment support, not clinical.
          </p>

          <div className="flex items-center gap-2.5">
            <Button type="button" variant="secondary" onClick={handleCopyText}>
              {copied ? 'Copied summary' : 'Copy plain text'}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={onQueuePacket}
              disabled={packet.status === 'sending'}
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>
                {!isOnline
                  ? 'Queue offline packet'
                  : packet.status === 'delivered'
                  ? 'Resend packet'
                  : 'Send to Flight Surgeon'}
              </span>
            </Button>
          </div>
        </footer>
      </article>
    </div>
  );
};
