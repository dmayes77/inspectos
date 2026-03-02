import { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel, IonList, IonSpinner, IonText } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import { fetchBootstrap } from '../services/api';
import { MobileAppShell } from '../components/MobileAppShell';

export default function Orders() {
  const { tenant } = useAuth();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const history = useHistory();
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof fetchBootstrap>>['orders']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!tenant) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchBootstrap(tenant.slug);
        setOrders(data.orders || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tenant]);

  return (
    <MobileAppShell title="Orders">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Assigned Orders</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {loading ? <IonSpinner name="crescent" /> : null}
          {error ? <IonText color="danger"><p>{error}</p></IonText> : null}
          {!loading && !error && orders.length === 0 ? <IonText color="medium"><p>No assigned orders.</p></IonText> : null}
          {!loading && !error && orders.length > 0 ? (
            <IonList>
              {orders.map((o) => (
                <IonItem key={o.id} button onClick={() => history.push(`/t/${tenantSlug}/order/${o.id}`)}>
                  <IonLabel>
                    <h2>{o.order_number || 'Inspection Order'}</h2>
                    <p>{o.scheduled_date} {o.scheduled_time ?? ''}</p>
                    <p>{o.status}</p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          ) : null}
        </IonCardContent>
      </IonCard>
    </MobileAppShell>
  );
}
