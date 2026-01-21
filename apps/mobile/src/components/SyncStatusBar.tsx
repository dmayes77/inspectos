import React from 'react';
import { IonIcon, IonSpinner, IonChip } from '@ionic/react';
import {
  cloudDoneOutline,
  cloudOfflineOutline,
  cloudUploadOutline,
  alertCircleOutline,
  refreshOutline
} from 'ionicons/icons';
import { useSyncStatus, useSyncActions } from '../sync';

interface SyncStatusBarProps {
  showDetails?: boolean;
}

export const SyncStatusBar: React.FC<SyncStatusBarProps> = ({ showDetails = false }) => {
  const { status, pendingChanges, pendingUploads, isOnline, error } = useSyncStatus();
  const { sync } = useSyncActions();

  const getStatusIcon = () => {
    if (!isOnline) return cloudOfflineOutline;
    if (status === 'syncing') return cloudUploadOutline;
    if (status === 'error') return alertCircleOutline;
    if (pendingChanges > 0 || pendingUploads > 0) return refreshOutline;
    return cloudDoneOutline;
  };

  const getStatusColor = (): 'success' | 'warning' | 'danger' | 'medium' => {
    if (!isOnline) return 'medium';
    if (status === 'error') return 'danger';
    if (status === 'syncing') return 'warning';
    if (pendingChanges > 0 || pendingUploads > 0) return 'warning';
    return 'success';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (status === 'syncing') return 'Syncing...';
    if (status === 'error') return 'Sync Error';
    if (pendingChanges > 0) return `${pendingChanges} pending`;
    if (pendingUploads > 0) return `${pendingUploads} uploads`;
    return 'Synced';
  };

  const handleTap = () => {
    if (isOnline && status !== 'syncing') {
      sync();
    }
  };

  return (
    <IonChip
      color={getStatusColor()}
      onClick={handleTap}
      style={{ cursor: isOnline ? 'pointer' : 'default' }}
    >
      {status === 'syncing' ? (
        <IonSpinner name="crescent" style={{ width: '16px', height: '16px' }} />
      ) : (
        <IonIcon icon={getStatusIcon()} />
      )}
      {showDetails && (
        <span style={{ marginLeft: '4px' }}>{getStatusText()}</span>
      )}
      {error && showDetails && (
        <span style={{ marginLeft: '4px', fontSize: '0.8em', opacity: 0.8 }}>
          {error}
        </span>
      )}
    </IonChip>
  );
};

export default SyncStatusBar;
