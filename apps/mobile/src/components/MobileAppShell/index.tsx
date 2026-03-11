import React from 'react';
import './mobile-app-shell.css';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  calendarOutline,
  chevronBackOutline,
  ellipsisVertical,
  homeOutline,
  imagesOutline,
  listOutline,
  optionsOutline,
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function MobileAppShell({
  title,
  children,
  showBack = false,
  defaultHref,
}: {
  title: string;
  children: React.ReactNode;
  showBack?: boolean;
  defaultHref?: string;
}) {
  const history = useHistory();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isOrdersMenuOpen, setIsOrdersMenuOpen] = React.useState(false);
  const [headerOffset, setHeaderOffset] = React.useState(0);
  const headerRef = React.useRef<HTMLIonHeaderElement | null>(null);
  const tenantSlug = location.pathname.match(/^\/t\/([^/]+)/)?.[1];

  const isDashboard = /\/dashboard$/.test(location.pathname);
  const isOrders = /\/orders(\/|$)|\/order\//.test(location.pathname);
  const isGallery = /\/quick-capture(\/|$)/.test(location.pathname);
  const isCalendar = /\/calendar$/.test(location.pathname);
  const isTitleOnlyPage = Boolean(showBack);
  const displayName = user?.email
    ? user.email
        .split('@')[0]
        .split(/[._-]/)
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() + part.slice(1))
        .join(' ')
    : 'Profile';
  const avatarInitials =
    user?.email
      ?.split('@')[0]
      ?.split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('') || 'U';
  const avatarUrl = user?.avatar_url?.trim() || null;

  React.useEffect(() => {
    setIsOrdersMenuOpen(false);
  }, [location.pathname]);

  React.useLayoutEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const syncHeaderOffset = () => {
      setHeaderOffset(headerEl.offsetHeight);
    };

    syncHeaderOffset();

    const resizeObserver = new ResizeObserver(syncHeaderOffset);
    resizeObserver.observe(headerEl);
    window.addEventListener('resize', syncHeaderOffset);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncHeaderOffset);
    };
  }, []);

  return (
    <IonPage>
      <IonHeader ref={headerRef} className="mobile-shell-header">
        <IonToolbar className={`mobile-shell-toolbar ${showBack ? 'mobile-shell-toolbar--back' : ''}`}>
          {showBack ? (
            <IonButtons slot="start">
              <IonBackButton defaultHref={defaultHref} icon={chevronBackOutline} text="" />
            </IonButtons>
          ) : null}
          <IonTitle>{title}</IonTitle>
          <IonButtons slot="end">
            {isTitleOnlyPage ? null : (
              <div className="mobile-header-actions mobile-header-actions--orders">
                <button
                  className="mobile-header-icon-btn mobile-header-icon-btn--plain"
                  aria-label="Open settings"
                  onClick={() => {
                    if (!tenantSlug) return;
                    history.push(`/t/${tenantSlug}/settings`);
                  }}
                >
                  <IonIcon icon={optionsOutline} />
                </button>
                <button
                  className="mobile-header-icon-btn mobile-header-icon-btn--plain"
                  aria-label="Create field intake"
                  onClick={() => {
                    if (!tenantSlug) return;
                    history.push(`/t/${tenantSlug}/orders/field-intake`);
                  }}
                >
                  <IonIcon icon={addOutline} />
                </button>
                <button
                  className="mobile-header-icon-btn mobile-header-icon-btn--plain"
                  aria-label="More options"
                  onClick={() => setIsOrdersMenuOpen((open) => !open)}
                >
                  <IonIcon icon={ellipsisVertical} />
                </button>
              </div>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      {!isTitleOnlyPage ? (
        <div
          className={`mobile-orders-menu-overlay ${isOrdersMenuOpen ? 'is-open' : ''}`}
          onClick={() => setIsOrdersMenuOpen(false)}
          aria-hidden={!isOrdersMenuOpen}
        >
          <div className="mobile-orders-menu" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="mobile-orders-menu-profile"
              onClick={() => {
                setIsOrdersMenuOpen(false);
                if (!tenantSlug) return;
                history.push(`/t/${tenantSlug}/profile`);
              }}
            >
              <span className="mobile-orders-menu-avatar">
                {avatarUrl ? <img src={avatarUrl} alt="User avatar" /> : avatarInitials}
              </span>
              <span className="mobile-orders-menu-name">{displayName}</span>
            </button>
            <button
              type="button"
              className="is-danger"
              onClick={async () => {
                setIsOrdersMenuOpen(false);
                await signOut();
                history.replace('/login');
              }}
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
      <IonContent
        className={`mobile-shell-content ${isDashboard ? 'is-dashboard' : ''}`}
        style={{ '--offset-top': `${headerOffset}px` } as React.CSSProperties}
      >
        {children}
      </IonContent>
      <IonFooter className="inspectos-tabbar">
        <IonToolbar>
          <div className="inspectos-tabbar-row">
            <button className={`inspectos-tab-btn ${isDashboard ? 'active' : ''}`} onClick={() => tenantSlug && history.replace(`/t/${tenantSlug}/dashboard`)}>
              <IonIcon icon={homeOutline} />
              <span>Home</span>
            </button>
            <button className={`inspectos-tab-btn ${isOrders ? 'active' : ''}`} onClick={() => tenantSlug && history.replace(`/t/${tenantSlug}/orders`)}>
              <IonIcon icon={listOutline} />
              <span>Orders</span>
            </button>
            <button className={`inspectos-tab-btn ${isGallery ? 'active' : ''}`} onClick={() => tenantSlug && history.replace(`/t/${tenantSlug}/quick-capture`)}>
              <IonIcon icon={imagesOutline} />
              <span>Gallery</span>
            </button>
            <button className={`inspectos-tab-btn ${isCalendar ? 'active' : ''}`} onClick={() => tenantSlug && history.replace(`/t/${tenantSlug}/calendar`)}>
              <IonIcon icon={calendarOutline} />
              <span>Calendar</span>
            </button>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
}
