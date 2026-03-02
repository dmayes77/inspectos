import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonSpinner, IonText } from '@ionic/react';
import { MobileAppShell } from '../components/MobileAppShell';
import { fetchOrderDetail } from '../services/api';

export default function OrderDetail() {
  const { tenantSlug } = useParams<{ tenantSlug: string; orderId: string }>();
  const { orderId } = useParams<{ tenantSlug: string; orderId: string }>();
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchOrderDetail>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<string>('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrderDetail(tenantSlug, orderId);
        setDetail(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [tenantSlug, orderId]);

  const order = useMemo(() => detail?.order ?? null, [detail]);
  const totalTemplateItems = useMemo(
    () => detail?.template?.sections?.reduce((count, section) => count + section.items.length, 0) ?? 0,
    [detail]
  );
  const answeredCount = detail?.answers?.length ?? 0;
  const findingsCount = detail?.findings?.length ?? 0;
  const mediaCount = detail?.media?.length ?? 0;
  const hasStarted = answeredCount > 0 || findingsCount > 0 || mediaCount > 0;
  const completionPct = totalTemplateItems > 0 ? Math.min(100, Math.round((answeredCount / totalTemplateItems) * 100)) : 0;

  return (
    <MobileAppShell title="Inspection" showBack defaultHref={`/t/${tenantSlug}/orders`}>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>{order?.order_number || 'Inspection Order'}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {loading ? <IonSpinner name="crescent" /> : null}
          {error ? (
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          ) : null}
          {!loading && !error && !order ? (
            <IonText color="medium">
              <p>Order not found.</p>
            </IonText>
          ) : null}
          {!loading && !error && order ? (
            <div className="inspector-order">
              <div className="inspector-order-row">
                <span className="inspector-order-label">Status</span>
                <span className="inspector-order-badge">{order.status}</span>
              </div>
              <p className="inspector-order-address">
                {order.property?.address_line1 || 'Property address unavailable'}
                {order.property?.city ? `, ${order.property.city}` : ''}
                {order.property?.state ? `, ${order.property.state}` : ''}
              </p>
              <p className="inspector-order-subtle">
                Scheduled: {order.scheduled_date} {order.scheduled_time ?? ''}
              </p>
              <p className="inspector-order-subtle">
                Client: {order.client?.name || 'Not assigned'}
              </p>

              <div className="inspector-progress">
                <div>
                  <span className="inspector-progress-label">Progress</span>
                  <strong>{completionPct}%</strong>
                </div>
                <div>
                  <span className="inspector-progress-label">Findings</span>
                  <strong>{findingsCount}</strong>
                </div>
                <div>
                  <span className="inspector-progress-label">Photos</span>
                  <strong>{mediaCount}</strong>
                </div>
              </div>

              <IonButton
                expand="block"
                className="inspector-primary-action"
                onClick={() => setActionNote(hasStarted ? 'Continue inspection flow coming next.' : 'Start inspection flow coming next.')}
              >
                {hasStarted ? 'Continue Inspection' : 'Start Inspection'}
              </IonButton>

              <div className="inspector-secondary-actions">
                <IonButton fill="outline" onClick={() => setActionNote('Photo capture flow coming next.')}>
                  Add Photo
                </IonButton>
                <IonButton fill="outline" onClick={() => setActionNote('Finding capture flow coming next.')}>
                  Add Finding
                </IonButton>
              </div>

              {actionNote ? (
                <IonText color="medium">
                  <p className="inspector-order-subtle">{actionNote}</p>
                </IonText>
              ) : null}
            </div>
          ) : null}
        </IonCardContent>
      </IonCard>
    </MobileAppShell>
  );
}
