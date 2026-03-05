import React from 'react';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonPage,
  IonPopover,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  calendarOutline,
  ellipsisHorizontalOutline,
  homeOutline,
  imagesOutline,
  listOutline,
  logOutOutline,
  optionsOutline,
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
  const { user, tenant: authTenant, signOut } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = React.useState(false);
  const [accountMenuEvent, setAccountMenuEvent] = React.useState<MouseEvent | undefined>(undefined);
  const tenantSlug = location.pathname.match(/^\/t\/([^/]+)/)?.[1];

  const isDashboard = /\/dashboard$/.test(location.pathname);
  const isOrders = /\/orders$|\/order\//.test(location.pathname);
  const isGallery = /\/quick-capture(\/|$)/.test(location.pathname);
  const isCalendar = /\/calendar$/.test(location.pathname);
  const businessTitle = authTenant?.name?.trim() || 'InspectOS';
  const avatarInitials =
    user?.email
      ?.split('@')[0]
      ?.split(/[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('') || 'U';
  const avatarUrl = user?.avatar_url?.trim() || null;

  const navigateToSettings = () => {
    if (!tenantSlug) return;
    history.push(`/t/${tenantSlug}/settings`);
  };

  const navigateToFieldIntake = () => {
    if (!tenantSlug) return;
    history.push(`/t/${tenantSlug}/orders/field-intake`);
  };

  const navigateToProfile = () => {
    setIsAccountMenuOpen(false);
    if (!tenantSlug) return;
    history.push(`/t/${tenantSlug}/profile`);
  };

  const handleSignOut = async () => {
    setIsAccountMenuOpen(false);
    setAccountMenuEvent(undefined);
    await signOut();
    history.replace('/login');
  };

  const handleAccountMenuToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isAccountMenuOpen) {
      setIsAccountMenuOpen(false);
      setAccountMenuEvent(undefined);
      return;
    }
    setAccountMenuEvent(event.nativeEvent);
    setIsAccountMenuOpen(true);
  };

  return (
    <IonPage>
      <IonHeader className="mobile-shell-header">
        <IonToolbar className="mobile-shell-toolbar">
          <IonButtons slot="start">
            {showBack ? (
              <IonBackButton defaultHref={defaultHref} />
            ) : (
              <div className="mobile-header-left">
                <span className="mobile-business-name">{businessTitle}</span>
              </div>
            )}
          </IonButtons>
          <IonTitle>{title ? '' : ''}</IonTitle>
          <IonButtons slot="end">
            <div className="mobile-header-actions">
              <button className="mobile-header-icon-btn mobile-header-icon-btn--plain" aria-label="Settings" onClick={navigateToSettings}>
                <IonIcon icon={optionsOutline} />
              </button>
              <button className="mobile-header-icon-btn mobile-header-icon-btn--plain" aria-label="New Field Intake" onClick={navigateToFieldIntake}>
                <IonIcon icon={addOutline} />
              </button>
              <button
                className={`mobile-header-icon-btn mobile-header-icon-btn--plain ${isAccountMenuOpen ? 'is-open' : ''}`}
                aria-label="Account menu"
                onClick={handleAccountMenuToggle}
              >
                <IonIcon icon={ellipsisHorizontalOutline} />
              </button>
              <IonPopover
                isOpen={isAccountMenuOpen}
                event={accountMenuEvent}
                reference="event"
                onDidDismiss={() => {
                  setIsAccountMenuOpen(false);
                  setAccountMenuEvent(undefined);
                }}
                side="bottom"
                alignment="center"
                className="mobile-user-menu"
              >
                <IonList>
                  <IonItem lines="none" button detail={false} onClick={navigateToProfile}>
                    <span slot="start" className="mobile-menu-avatar">
                      {avatarUrl ? <img src={avatarUrl} alt="User avatar" /> : avatarInitials}
                    </span>
                    Profile Settings
                  </IonItem>
                  <IonItem lines="none" button detail={false} onClick={() => void handleSignOut()}>
                    <IonIcon slot="start" icon={logOutOutline} className="mobile-logout-icon" />
                    Logout
                  </IonItem>
                </IonList>
              </IonPopover>
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
