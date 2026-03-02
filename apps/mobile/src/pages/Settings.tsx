import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';
import { MobileAppShell } from '../components/MobileAppShell';

export default function Settings() {
  return (
    <MobileAppShell title="Settings">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Settings</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <p>Account sign out is available in Profile.</p>
        </IonCardContent>
      </IonCard>
    </MobileAppShell>
  );
}
