import './settings.css';
import { IonText } from '@ionic/react';
import { MobilePageLayout } from '../../components/MobilePageLayout';

export default function Settings() {
  return (
    <MobilePageLayout title="Settings">
      <IonText color="medium">
        <p>Account sign out is available in Profile.</p>
      </IonText>
    </MobilePageLayout>
  );
}
