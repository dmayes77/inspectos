import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import { MobileAppShell } from '../components/MobileAppShell';

export default function Settings() {
  const { signOut } = useAuth();

  return (
    <MobileAppShell title="Settings">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Settings</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonButton expand="block" color="medium" onClick={() => void signOut()}>
            Sign out
          </IonButton>
        </IonCardContent>
      </IonCard>
    </MobileAppShell>
  );
}
