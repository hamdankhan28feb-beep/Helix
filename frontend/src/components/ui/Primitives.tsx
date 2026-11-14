import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  Eye,
  AlertTriangle,
  OctagonAlert,
  Info,
} from 'lucide-react';
import { GLOSSARY_FIXTURE } from '../../data/fixtures';
import { STATUS_TOKENS } from '../../lib/tokens';
import { cn, getStatusColor } from '../../lib/utils';
import { EvidenceTag, StatusLevel } from '../../types/helix';

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
  }
>(({ className, variant = 'secondary', size = 'md', children, ...props }, ref) => {
  const variants = {
    primary:
      'bg-[#7FB2FF] text-[#070B14] font-semibold hover:bg-[#99C2FF] shadow-sm',
    secondary:
      'bg-[#151E2E] text-[#E8EEF7] border border-white/10 hover:bg-[#1C273C] hover:border-white/20',
    ghost:
      'bg-transparent text-[#8A97AD] hover:text-[#E8EEF7] hover:bg-white/5',
    danger:
      'bg-[#FF6B5E]/15 text-[#FF6B5E] border border-[#FF6B5E]/40 hover:bg-[#FF6B5E]/25',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs min-h-[34px] rounded-xl',
    md: 'px-4 py-2 text-sm min-h-[40px] rounded-xl',
    lg: 'px-5 py-3 text-base min-h-[46px] rounded-2xl',
  };

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = 'Button';

export function StatusIcon({
  status,
  className,
  colorBlindSafe = false,
}: {
  status: StatusLevel;
  className?: string;
  colorBlindSafe?: boolean;
}) {
  const color = getStatusColor(status, colorBlindSafe);
  const props = { className: cn('w-3.5 h-3.5 shrink-0', className), style: { color } };

  switch (status) {
    case 'nominal':
      return <CheckCircle2 {...props} aria-hidden="true" />;
    case 'watch':
      return <Eye {...props} aria-hidden="true" />;
    case 'caution':
      return <AlertTriangle {...props} aria-hidden="true" />;
    case 'escalate':
      return <OctagonAlert {...props} aria-hidden="true" />;
  }
}

export function StatusIndicator({
  status,
  colorBlindSafe = false,
  compact = false,
}: {
  status: StatusLevel;
  colorBlindSafe?: boolean;
  compact?: boolean;
}) {
  const token = STATUS_TOKENS[status];
  const color = getStatusColor(status, colorBlindSafe);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium whitespace-nowrap shrink-0',
        compact ? 'text-xs' : 'text-xs px-2.5 py-1 rounded-lg border'
      )}
      style={
        compact
          ? { color }
          : {
              color,
              borderColor: `${color}45`,
              backgroundColor: `${color}16`,
            }
      }
      aria-label={`Status: ${token.label}`}
    >
      <StatusIcon status={status} colorBlindSafe={colorBlindSafe} />
      <span>{token.label}</span>
    </span>
  );
}

export function EvidenceTagChip({ tag }: { tag: EvidenceTag }) {
  const isRecommended = tag === 'Recommended';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md whitespace-nowrap shrink-0',
        isRecommended
          ? 'bg-[#3DE0C5]/12 text-[#3DE0C5] border border-[#3DE0C5]/35'
          : 'bg-transparent text-[#8A97AD] border border-dashed border-white/25'
      )}
      title={
        isRecommended
          ? 'NASA-stated self-care guidance'
          : 'Active spaceflight research / countermeasure under study'
      }
    >
      {tag}
    </span>
  );
}

export function GlossaryTerm({
  term,
  children,
}: {
  term: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const entry = GLOSSARY_FIXTURE.find(
    (g) => g.term.toLowerCase() === term.toLowerCase()
  );

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!entry) {
    return <span>{children || term}</span>;
  }

  return (
    <span ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="underline decoration-dotted decoration-[#7FB2FF]/70 underline-offset-4 hover:text-[#7FB2FF] transition-colors cursor-pointer font-inherit text-inherit"
        aria-expanded={open}
      >
        {children || term}
      </button>
      {open && (
        <span
          role="dialog"
          aria-label={`Glossary definition for ${entry.term}`}
          className="absolute left-0 bottom-full mb-2 z-50 w-64 p-3 rounded-2xl cockpit-panel-elevated text-left text-xs text-[#E8EEF7] shadow-2xl"
        >
          <span className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-[#7FB2FF] flex items-center gap-1">
              <Info className="w-3.5 h-3.5" aria-hidden="true" />
              {entry.term}
            </span>
            <span className="text-[10px] text-[#8A97AD]">{entry.category}</span>
          </span>
          <span className="block text-[#E8EEF7]/90 leading-relaxed font-normal">
            {entry.definition}
          </span>
        </span>
      )}
    </span>
  );
}
