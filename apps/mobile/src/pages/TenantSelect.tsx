import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export default function TenantSelect() {
  const { user, selectTenant, refreshTenants, error } = useAuth();
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const history = useHistory();

  const handleSelect = async (slug: string) => {
    setSelecting(slug);
    try {
      await selectTenant(slug);
      history.replace('/t/' + slug + '/dashboard');
    } catch (err) {
      console.error('Failed to select tenant:', err);
    } finally {
      setSelecting(null);
    }
  };

  useEffect(() => {
    const loadTenants = async () => {
      setLoadingTenants(true);
      const list = await refreshTenants();
      setTenants(list);
      setLoadingTenants(false);

      // Auto-redirect if only one tenant
      if (list.length === 1) {
        handleSelect(list[0].slug);
      }
    };

    if (user) {
      loadTenants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, refreshTenants]);

  const handleCreateNew = () => {
    history.push('/tenant/create');
  };

  if (loadingTenants) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" />
          <p>Loading your organizations...</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Select Organization</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}

        {tenants.length === 0 ? (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Welcome to InspectOS</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>You're not a member of any organization yet.</p>
              <p>Create your first organization to get started.</p>
              <IonButton expand="block" onClick={handleCreateNew} style={{ marginTop: 16 }}>
                Create Organization
              </IonButton>
            </IonCardContent>
          </IonCard>
        ) : (
          <>
            <IonList>
              {tenants.map((tenant) => (
                <IonItem
                  key={tenant.id}
                  button
                  onClick={() => handleSelect(tenant.slug)}
                  disabled={selecting !== null}
                >
                  <IonLabel>
                    <h2>{tenant.name}</h2>
                    <p>{tenant.role}</p>
                  </IonLabel>
                  {selecting === tenant.slug && <IonSpinner name="crescent" />}
                </IonItem>
              ))}
            </IonList>

            <IonButton
              expand="block"
              fill="outline"
              onClick={handleCreateNew}
              style={{ marginTop: 16 }}
            >
              Create New Organization
            </IonButton>
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
