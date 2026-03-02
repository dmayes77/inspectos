import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MobileAppShell } from '../components/MobileAppShell';

export default function Settings() {
  const { signOut } = useAuth();
  const history = useHistory();

  const handleSignOut = async () => {
    await signOut();
    history.replace('/login');
  };

  return (
    <MobileAppShell title="Settings">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Settings</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonButton expand="block" color="medium" onClick={() => void handleSignOut()}>
            Sign out
          </IonButton>
        </IonCardContent>
      </IonCard>
    </MobileAppShell>
  );
}
