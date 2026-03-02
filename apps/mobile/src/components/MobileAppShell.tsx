import React from 'react';
import {
  IonBackButton,
  IonButtons,
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonPopover,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  calendarOutline,
  homeOutline,
  listOutline,
  menuOutline,
  moonOutline,
  notificationsOutline,
  personOutline,
  peopleOutline,
  settingsOutline,
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
  const { user, tenant: authTenant } = useAuth();
  const tenantSlug = location.pathname.match(/^\/t\/([^/]+)/)?.[1];

  const isDashboard = /\/dashboard$/.test(location.pathname);
  const isOrders = /\/orders$|\/order\//.test(location.pathname);
  const isPeople = /\/people$/.test(location.pathname);
  const isCalendar = /\/calendar$/.test(location.pathname);
  const isSettings = /\/settings$/.test(location.pathname);
  const isProfile = /\/profile$/.test(location.pathname);
  const businessTitle = authTenant?.name?.trim() || 'InspectOS';
  const hasUnreadNotifications = true;
  const avatarInitials =
    user?.email
      ?.split('@')[0]
      ?.split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('') || 'U';
  const avatarUrl = user?.avatar_url?.trim() || null;

  return (
    <IonPage>
      <IonHeader className="mobile-shell-header">
        <IonToolbar className="mobile-shell-toolbar">
          <IonButtons slot="start">
            {showBack ? (
              <IonBackButton defaultHref={defaultHref} />
            ) : (
              <div className="mobile-header-left">
                <IonButton
                  fill="clear"
                  className="mobile-menu-btn"
                  aria-label="Settings"
                  onClick={() => {
                    if (!tenantSlug) return;
                    history.push(isSettings ? `/t/${tenantSlug}/dashboard` : `/t/${tenantSlug}/settings`);
                  }}
                >
                  <IonIcon icon={menuOutline} />
                </IonButton>
                <span className="mobile-business-name">{businessTitle}</span>
              </div>
            )}
          </IonButtons>
          <IonTitle>{title ? '' : ''}</IonTitle>
          <IonButtons slot="end">
            <div className="mobile-header-actions">
              <button className="mobile-header-icon-btn" aria-label="Theme">
                <IonIcon icon={moonOutline} />
              </button>
              <button className="mobile-header-icon-btn" aria-label="Notifications">
                {hasUnreadNotifications ? <span className="mobile-header-dot" /> : null}
                <IonIcon icon={notificationsOutline} />
              </button>
              <button
                className="mobile-user-chip"
                aria-label="User profile"
                onClick={() => {
                  if (!tenantSlug) return;
                  history.push(isProfile ? `/t/${tenantSlug}/dashboard` : `/t/${tenantSlug}/profile`);
                }}
              >
                <span className="mobile-user-avatar">
                  {avatarUrl ? <img src={avatarUrl} alt="User avatar" /> : avatarInitials}
                </span>
              </button>
            </div>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className={`ion-padding mobile-shell-content ${isDashboard ? 'is-dashboard' : ''}`}>{children}</IonContent>
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
            <button className={`inspectos-tab-btn ${isPeople ? 'active' : ''}`} onClick={() => tenantSlug && history.replace(`/t/${tenantSlug}/people`)}>
              <IonIcon icon={peopleOutline} />
              <span>People</span>
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
