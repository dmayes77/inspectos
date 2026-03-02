import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonText } from '@ionic/react';
import { MobileAppShell } from '../components/MobileAppShell';

export default function Calendar() {
  return (
    <MobileAppShell title="Calendar">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Calendar</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText color="medium">
            <p>Schedule calendar view will appear here.</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    </MobileAppShell>
  );
}
