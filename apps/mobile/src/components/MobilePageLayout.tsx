import type { ReactNode } from 'react';
import { MobileAppShell } from './MobileAppShell';

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
        <header className="mobile-page-layout-header">
          <div>
            <h2 className="mobile-page-layout-title">{title}</h2>
            {subtitle ? <p className="mobile-page-layout-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="mobile-page-layout-actions">{actions}</div> : null}
        </header>
        <div className={cx('mobile-page-layout-content', contentClassName)}>{children}</div>
      </section>
    </MobileAppShell>
  );
}
