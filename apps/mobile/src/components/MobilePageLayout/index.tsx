import type { ReactNode } from 'react';
import './mobile-page-layout.css';
import { MobileAppShell } from '../MobileAppShell';

function cx(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(' ');
}

type MobilePageLayoutProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  showBack?: boolean;
  defaultHref?: string;
  className?: string;
  contentClassName?: string;
};

export function MobilePageLayout({
  title,
  subtitle,
  actions,
  children,
  showBack = false,
  defaultHref,
  className,
  contentClassName,
}: MobilePageLayoutProps) {
  return (
    <MobileAppShell title={title} showBack={showBack} defaultHref={defaultHref}>
      <section className={cx('mobile-page-layout', className)}>
        {subtitle || actions ? (
          <header className="mobile-page-layout-header">
            {subtitle ? <p className="mobile-page-layout-subtitle">{subtitle}</p> : <span />}
            {actions ? <div className="mobile-page-layout-actions">{actions}</div> : null}
          </header>
        ) : null}
        <div className={cx('mobile-page-layout-content', contentClassName)}>{children}</div>
      </section>
    </MobileAppShell>
  );
}
