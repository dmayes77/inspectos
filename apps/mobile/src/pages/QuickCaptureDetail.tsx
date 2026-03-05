import { Capacitor } from '@capacitor/core';
import { IonButton, IonIcon, IonSpinner, IonText } from '@ionic/react';
import { locationOutline, timeOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { MobilePageLayout } from '../components/MobilePageLayout';
import { fetchQuickCaptureById, type QuickCaptureMediaPayload } from '../services/api';

function formatDateTime(dateIso: string) {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return dateIso;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function QuickCaptureDetail() {
  const history = useHistory();
  const { tenantSlug, captureId } = useParams<{ tenantSlug: string; captureId: string }>();
  const [item, setItem] = useState<QuickCaptureMediaPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchQuickCaptureById(tenantSlug, captureId);
        setItem(data);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load capture');
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantSlug, captureId]);

  const mapEmbedUrl = useMemo(() => {
    if (!item) return null;
    return `https://www.google.com/maps?q=${item.latitude},${item.longitude}&output=embed`;
  }, [item]);

  const openNativeMaps = () => {
    if (!item) return;
    const coords = `${item.latitude},${item.longitude}`;
    const platform = Capacitor.getPlatform();

    if (platform === 'ios') {
      window.location.href = `maps://?q=${encodeURIComponent(coords)}`;
      return;
    }

    if (platform === 'android') {
      window.location.href = `geo:${coords}?q=${encodeURIComponent(coords)}`;
      return;
    }

    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <MobilePageLayout title={item?.name || 'Capture Detail'} showBack defaultHref={`/t/${tenantSlug}/quick-capture`}>
      {!item ? (
        loading ? (
          <IonSpinner name="crescent" />
        ) : (
          <IonText color={error ? 'danger' : 'medium'}>
            <p>{error || 'Capture not found.'}</p>
          </IonText>
        )
      ) : (
        <div className="quick-capture-detail-page">
          <img src={item.image_url} alt={item.name} className="quick-capture-detail-image" />

          <section className="quick-capture-detail-section">
            <h3>Capture Info</h3>
            <div className="quick-capture-meta-row">
              <IonIcon icon={timeOutline} />
              <span>{formatDateTime(item.captured_at)}</span>
            </div>
            <div className="quick-capture-meta-row">
              <IonIcon icon={locationOutline} />
                <span>
                  {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                  {item.accuracy_meters ? ` (±${Math.round(item.accuracy_meters)}m)` : ''}
                </span>
              </div>
          </section>

          <section className="quick-capture-detail-section">
            <h3>Note</h3>
            <p className="quick-capture-note">{item.note}</p>
          </section>

          {mapEmbedUrl ? (
            <section className="quick-capture-detail-section">
              <h3>Capture Location</h3>
              <div className="inspector-map-block">
                <iframe
                  className="inspector-map-embed"
                  title="Capture location map"
                  src={mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <IonButton fill="outline" expand="block" onClick={openNativeMaps}>
                Open in Maps
              </IonButton>
            </section>
          ) : null}

          <IonButton fill="outline" expand="block" onClick={() => history.push(`/t/${tenantSlug}/quick-capture`)}>
            Back to Inbox
          </IonButton>
        </div>
      )}
    </MobilePageLayout>
  );
}
