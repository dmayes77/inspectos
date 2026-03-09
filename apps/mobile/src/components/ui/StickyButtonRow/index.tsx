import type { ReactNode } from 'react';
import './sticky-button-row.css';

type StickyButtonRowProps = {
  children: ReactNode;
};

export function StickyButtonRow({ children }: StickyButtonRowProps) {
  return <div className="inspector-bottom-actions">{children}</div>;
}
