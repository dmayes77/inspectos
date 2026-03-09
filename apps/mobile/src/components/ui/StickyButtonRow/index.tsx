import { Children, type ReactNode } from 'react';
import './sticky-button-row.css';

type StickyButtonRowProps = {
  children: ReactNode;
};

export function StickyButtonRow({ children }: StickyButtonRowProps) {
  const actionCount = Children.toArray(children).length;
  const className =
    actionCount === 1
      ? 'inspector-bottom-actions inspector-bottom-actions--single'
      : actionCount === 2
        ? 'inspector-bottom-actions inspector-bottom-actions--split'
        : 'inspector-bottom-actions';

  return <div className={className}>{children}</div>;
}
