import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonText } from '@ionic/react';
import { MobileAppShell } from '../components/MobileAppShell';

export default function People() {
  return (
    <MobileAppShell title="People">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>People</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText color="medium">
            <p>Team and contact directory will appear here.</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    </MobileAppShell>
  );
}
