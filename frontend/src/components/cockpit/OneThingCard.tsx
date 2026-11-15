import React, { useState } from 'react';
import {
  CheckCircle2,
  Bell,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { OneThingAction, RegionId } from '../../types/helix';
import { Button, EvidenceTagChip } from '../ui/Primitives';

interface OneThingCardProps {
  action: OneThingAction;
  highlightedCoachStep?: number | null;
  onDoIt: () => void;
  onRemindMe: () => void;
  onWhy: (regionId: RegionId) => void;
  onUseBackup: (backupTitle: string) => void;
}

export const OneThingCard: React.FC<OneThingCardProps> = ({
  action,
  highlightedCoachStep,
  onDoIt,
  onRemindMe,
  onWhy,
  onUseBackup,
}) => {
  const [backupsOpen, setBackupsOpen] = useState(false);

  return (
    <aside
      aria-label="One Thing Today"
      className={cn(
        'rounded-3xl cockpit-panel p-5 flex flex-col justify-between gap-5',
        highlightedCoachStep === 4 && 'ring-2 ring-[#7FB2FF]'
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-medium text-[#7FB2FF]">One thing today</span>
          <EvidenceTagChip tag={action.evidence} />
        </div>

        <h2 className="text-xl sm:text-[22px] font-semibold text-[#E8EEF7] leading-snug text-balance">
          {action.title}
        </h2>

        <p className="mt-3 text-sm text-[#8A97AD] leading-relaxed">
          {action.reason}
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-5 space-y-2.5">
          {action.completed ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#3DE0C5]/12 border border-[#3DE0C5]/35 text-sm font-medium text-[#3DE0C5]">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Done for today · Ring updated</span>
            </div>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={onDoIt}
            >
              <span>Do it now</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onRemindMe}>
              <Bell className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{action.remindedAt ? `Set ${action.remindedAt}` : 'Remind me'}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onWhy(action.regionId)}
            >
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Why?</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Two Collapsed Backups */}
      <div className="pt-3 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={() => setBackupsOpen((v) => !v)}
          aria-expanded={backupsOpen}
          className="w-full flex items-center justify-between text-xs font-medium text-[#8A97AD] hover:text-[#E8EEF7] cursor-pointer py-1"
        >
          <span>Two backup options</span>
          {backupsOpen ? (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {backupsOpen && (
          <div className="mt-2.5 space-y-2.5">
            {action.backups.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-2xl bg-[#070B14]/70 border border-white/[0.07]"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-medium text-[#E8EEF7] leading-snug">
                    {b.title}
                  </p>
                  <EvidenceTagChip tag={b.evidence} />
                </div>
                <p className="text-[11px] text-[#8A97AD] leading-relaxed">{b.reason}</p>
                <button
                  type="button"
                  onClick={() => onUseBackup(b.title)}
                  className="mt-2 text-[11px] font-medium text-[#7FB2FF] hover:underline cursor-pointer"
                >
                  Log this instead
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
