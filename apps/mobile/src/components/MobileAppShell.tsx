import React from 'react';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useSyncStatus } from '../sync';

interface MobileAppShellProps {
  title: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  defaultHref?: string;
  headerActions?: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
  subHeader?: React.ReactNode;
  contentClassName?: string;
}

export function MobileAppShell({
  title,
  children,
  showBackButton = false,
  defaultHref,
  headerActions,
  onRefresh,
  subHeader,
  contentClassName,
}: MobileAppShellProps) {
  const { isOnline } = useSyncStatus();

  const handleRefresh = async (event: CustomEvent) => {
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      event.detail.complete();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="inspectos-toolbar">
          <IonButtons slot="start">
            {showBackButton && <IonBackButton defaultHref={defaultHref} />}
          </IonButtons>
          <IonTitle>{title}</IonTitle>
          {headerActions && <IonButtons slot="end">{headerActions}</IonButtons>}
        </IonToolbar>
        {!isOnline && <div className="inspectos-offline-banner">Offline mode: changes will sync when you reconnect.</div>}
        {subHeader}
      </IonHeader>
      <IonContent className={contentClassName || 'inspectos-content'}>
        {onRefresh && (
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>
        )}
        {children}
      </IonContent>
    </IonPage>
  );
}
