import type { ReactNode } from 'react';
import './info-card.css';

type InfoCardTone = 'default' | 'client' | 'scheduled';

type InfoCardProps = {
  label: string;
  value: ReactNode;
  tone?: InfoCardTone;
  className?: string;
};

export function InfoCard({ label, value, tone = 'default', className }: InfoCardProps) {
  const toneClassName =
    tone === 'default' ? '' : tone === 'scheduled' ? ' inspector-meta-card--scheduled' : ' inspector-meta-card--client';

  return (
    <div className={`inspector-meta-card${toneClassName}${className ? ` ${className}` : ''}`}>
      <span className="inspector-progress-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
