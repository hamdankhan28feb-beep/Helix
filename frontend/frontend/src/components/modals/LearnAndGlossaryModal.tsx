import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
  X,
} from 'lucide-react';
import { GLOSSARY_FIXTURE, LEARN_CARDS_FIXTURE } from '../../data/fixtures';
import { cn } from '../../lib/utils';
import { EvidenceTagChip } from '../ui/Primitives';

interface LearnAndGlossaryModalProps {
  isOpen: boolean;
  initialTab: 'learn' | 'glossary';
  onClose: () => void;
}

export const LearnAndGlossaryModal: React.FC<LearnAndGlossaryModalProps> = ({
  isOpen,
  initialTab,
  onClose,
}) => {
  const [tab, setTab] = useState<'learn' | 'glossary'>(initialTab);
  const [cardIdx, setCardIdx] = useState(0);
  const [query, setQuery] = useState('');

  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const card = LEARN_CARDS_FIXTURE[cardIdx];
  const filteredGlossary = GLOSSARY_FIXTURE.filter(
    (g) =>
      g.term.toLowerCase().includes(query.toLowerCase()) ||
      g.definition.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-[#070B14]/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Learn spaceflight health and glossary"
    >
      <div className="w-full max-w-xl rounded-3xl cockpit-panel-elevated p-6 sm:p-7 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div className="inline-flex items-center p-1 rounded-xl bg-[#070B14] border border-white/10">
            <button
              type="button"
              onClick={() => setTab('learn')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer',
                tab === 'learn' ? 'bg-[#151E2E] text-[#E8EEF7]' : 'text-[#8A97AD]'
              )}
            >
              Learn Mode ({LEARN_CARDS_FIXTURE.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('glossary')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer',
                tab === 'glossary' ? 'bg-[#151E2E] text-[#E8EEF7]' : 'text-[#8A97AD]'
              )}
            >
              Glossary ({GLOSSARY_FIXTURE.length})
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A97AD] hover:text-[#E8EEF7] hover:bg-white/5 cursor-pointer"
            aria-label="Close Learn and Glossary"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* LEARN MODE SWIPEABLE CARDS */}
        {tab === 'learn' && card && (
          <div className="mt-5 space-y-4">
            <div className="p-5 rounded-3xl bg-[#070B14]/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#7FB2FF] capitalize">
                  Hazard: {card.hazard}
                </span>
                <EvidenceTagChip tag={card.evidence} />
              </div>

              <h2 className="text-xl font-semibold text-[#E8EEF7]">
                {card.title}
              </h2>
              <p className="text-sm font-medium text-[#E8EEF7]/90">
                {card.headline}
              </p>
              <p className="text-sm text-[#8A97AD] leading-relaxed">{card.body}</p>

              <div className="p-3.5 rounded-2xl bg-[#3DE0C5]/10 border border-[#3DE0C5]/25 text-xs text-[#E8EEF7]">
                <span className="font-semibold text-[#3DE0C5]">Self-care: </span>
                {card.selfCare}
              </div>

              <a
                href={card.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#7FB2FF] hover:underline pt-1"
              >
                <span>{card.sourceLabel}</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setCardIdx((i) =>
                    i === 0 ? LEARN_CARDS_FIXTURE.length - 1 : i - 1
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#151E2E] border border-white/10 text-xs font-medium text-[#E8EEF7] hover:border-white/25 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                <span>Previous card</span>
              </button>

              <div className="flex items-center gap-1.5">
                {LEARN_CARDS_FIXTURE.map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCardIdx(idx)}
                    aria-label={`Card ${idx + 1}`}
                    className={cn(
                      'h-1.5 rounded-full transition-all cursor-pointer',
                      idx === cardIdx ? 'w-5 bg-[#7FB2FF]' : 'w-1.5 bg-white/20'
                    )}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setCardIdx((i) => (i + 1) % LEARN_CARDS_FIXTURE.length)
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#151E2E] border border-white/10 text-xs font-medium text-[#E8EEF7] hover:border-white/25 cursor-pointer"
              >
                <span>Next card</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* GLOSSARY */}
        {tab === 'glossary' && (
          <div className="mt-5 space-y-4">
            <div className="relative">
              <Search
                className="w-4 h-4 text-[#8A97AD] absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search terms like SANS, HRV, Baseline…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070B14] border border-white/12 text-sm text-[#E8EEF7] placeholder:text-[#8A97AD]/60 focus:border-[#7FB2FF] focus:outline-none"
              />
            </div>

            <div className="space-y-2.5">
              {filteredGlossary.map((g) => (
                <div
                  key={g.term}
                  className="p-3.5 rounded-2xl bg-[#070B14]/70 border border-white/[0.08]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#7FB2FF]">
                      {g.term}
                    </span>
                    <span className="text-[11px] text-[#8A97AD]">{g.category}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#E8EEF7]/90 leading-relaxed">
                    {g.definition}
                  </p>
                </div>
              ))}
              {filteredGlossary.length === 0 && (
                <p className="text-xs text-[#8A97AD] text-center py-6">
                  No matching terms found.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
