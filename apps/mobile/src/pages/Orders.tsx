import { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonButton, IonItem, IonLabel, IonList, IonSpinner, IonText } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import { fetchBootstrap } from '../services/api';
import { MobilePageLayout } from '../components/MobilePageLayout';

export default function Orders() {
  const { tenant } = useAuth();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const history = useHistory();
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof fetchBootstrap>>['orders']>([]);
  const [propertyAddressById, setPropertyAddressById] = useState<Record<string, string>>({});
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
        const nextPropertyAddressById = Object.fromEntries(
          (data.properties || []).map((property) => [
            property.id,
            [property.address_line1, property.city, property.state, property.zip_code].filter(Boolean).join(', '),
          ])
        );
        setPropertyAddressById(nextPropertyAddressById);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [tenant]);

  return (
    <MobilePageLayout title="Orders">
      <IonButton expand="block" fill="outline" onClick={() => history.push(`/t/${tenantSlug}/orders/field-intake`)}>
        Create Field Intake
      </IonButton>

      {loading ? <IonSpinner name="crescent" /> : null}
      {error ? <IonText color="danger"><p>{error}</p></IonText> : null}
      {!loading && !error && orders.length === 0 ? <IonText color="medium"><p>No assigned orders.</p></IonText> : null}
      {!loading && !error && orders.length > 0 ? (
        <IonList>
          {orders.map((o) => (
            <IonItem key={o.id} button onClick={() => history.push(`/t/${tenantSlug}/order/${o.id}`)}>
              <IonLabel>
                <h2>{propertyAddressById[o.property_id] || 'Property address unavailable'}</h2>
                <p>{o.order_number || 'Inspection Order'}</p>
                <p>{o.scheduled_date} {o.scheduled_time ?? ''}</p>
                <p>{o.status}</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      ) : null}
    </MobilePageLayout>
  );
}
