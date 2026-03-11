import './client-info.css';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IonButton, IonSpinner, IonText } from '@ionic/react';
import { useParams } from 'react-router-dom';
import { MobilePageLayout } from '../../components/MobilePageLayout';
import { getOrder } from '../../services/api';
import { mobileQueryKeys } from '../../lib/query-keys';

export default function ClientInfo() {
  const { tenantSlug, orderId } = useParams<{ tenantSlug: string; orderId: string }>();
  const orderQuery = useQuery({
    queryKey: mobileQueryKeys.order(tenantSlug, orderId),
    queryFn: () => getOrder(tenantSlug, orderId),
  });

  const detail = orderQuery.data ?? null;
  const order = detail?.order ?? null;
  const client = order?.client ?? null;
  const loading = orderQuery.isPending;
  const error = orderQuery.error instanceof Error ? orderQuery.error.message : null;

  const propertyAddress = useMemo(
    () =>
      [order?.property?.address_line1, order?.property?.city, order?.property?.state, order?.property?.zip_code]
        .filter((value): value is string => Boolean(value && value.trim().length > 0))
        .join(', '),
    [order]
  );

  return (
    <MobilePageLayout
      title={client?.name || 'Client Info'}
      showBack
      defaultHref={`/t/${tenantSlug}/order/${orderId}`}
      contentClassName="client-info-content"
    >
      {loading ? <IonSpinner name="crescent" /> : null}
      {error ? (
        <IonText color="danger">
          <p>{error}</p>
        </IonText>
      ) : null}
      {!loading && !error && !client ? (
        <IonText color="medium">
          <p>Client information is unavailable for this order.</p>
        </IonText>
      ) : null}
      {!loading && !error && client ? (
        <div className="client-info-page">
          <section className="client-info-card">
            <span className="client-info-label">Client</span>
            <h2>{client.name || 'Unknown client'}</h2>
            <p>{propertyAddress || 'No property address linked to this order.'}</p>
          </section>

          <section className="client-info-details">
            <div className="client-info-row">
              <span>Email</span>
              <strong>{client.email || 'Not provided'}</strong>
            </div>
            <div className="client-info-row">
              <span>Phone</span>
              <strong>{client.phone || 'Not provided'}</strong>
            </div>
          </section>

          <div className="client-info-actions">
            <IonButton expand="block" fill="outline" disabled={!client.phone} href={client.phone ? `tel:${client.phone}` : undefined}>
              Call Client
            </IonButton>
            <IonButton expand="block" disabled={!client.email} href={client.email ? `mailto:${client.email}` : undefined}>
              Email Client
            </IonButton>
          </div>
        </div>
      ) : null}
    </MobilePageLayout>
  );
}
