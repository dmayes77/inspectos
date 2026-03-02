import React from 'react';
import {
  IonBackButton,
  IonButtons,
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  calendarOutline,
  chevronBackOutline,
  homeOutline,
  listOutline,
  menuOutline,
  moonOutline,
  notificationsOutline,
  peopleOutline,
  sunnyOutline,
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

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
  const { theme, toggleTheme } = useTheme();
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const tenantSlug = location.pathname.match(/^\/t\/([^/]+)/)?.[1];

  const isDashboard = /\/dashboard$/.test(location.pathname);
  const isOrders = /\/orders(\/|$)|\/order\//.test(location.pathname);
  const isPeople = /\/people$/.test(location.pathname);
  const isCalendar = /\/calendar$/.test(location.pathname);
  const isSettings = /\/settings$/.test(location.pathname);
  const isProfile = /\/profile$/.test(location.pathname);
  const mockAlerts = [
    { id: 'a1', title: 'Inspection updated', detail: 'Order #1042 changed to In Progress', time: '2m ago', unread: true },
    { id: 'a2', title: 'New comment', detail: 'Client added a note on Order #1039', time: '18m ago', unread: true },
    { id: 'a3', title: 'Calendar sync', detail: 'Tomorrow schedule imported successfully', time: '1h ago', unread: false },
  ];
  const businessTitle = authTenant?.name?.trim() || 'InspectOS';
  const hasUnreadNotifications = mockAlerts.some((alert) => alert.unread);
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
              <IonBackButton defaultHref={defaultHref} icon={chevronBackOutline} text="Back" />
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
              <button className="mobile-header-icon-btn" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={toggleTheme}>
                <IonIcon icon={theme === 'dark' ? sunnyOutline : moonOutline} />
              </button>
              <button
                id="mobile-notifications-trigger"
                className={`mobile-header-icon-btn ${isNotificationsOpen ? 'is-open' : ''}`}
                aria-label="Notifications"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
              >
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
      <div
        className={`mobile-alerts-overlay ${isNotificationsOpen ? 'is-open' : ''}`}
        aria-hidden={!isNotificationsOpen}
        onClick={() => setIsNotificationsOpen(false)}
      >
        <section className="mobile-alerts-sheet" onClick={(event) => event.stopPropagation()}>
          <div className="mobile-alerts-head">
            <h3>Alerts</h3>
            <button type="button" className="mobile-alerts-close" aria-label="Close alerts" onClick={() => setIsNotificationsOpen(false)}>
              Close
            </button>
          </div>
          <div className="mobile-alerts-list">
            {mockAlerts.map((alert) => (
              <article key={alert.id} className={`mobile-alert-item ${alert.unread ? 'is-unread' : ''}`}>
                <div className="mobile-alert-item-head">
                  <strong>{alert.title}</strong>
                  <span>{alert.time}</span>
                </div>
                <p>{alert.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
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
