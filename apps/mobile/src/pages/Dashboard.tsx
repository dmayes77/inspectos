import { useCallback, useEffect, useMemo, useState } from 'react';
import { IonButton, IonIcon, IonSpinner, IonText } from '@ionic/react';
import {
  addCircleOutline,
  alertCircleOutline,
  calendarOutline,
  cameraOutline,
  clipboardOutline,
  cloudDoneOutline,
  cloudOfflineOutline,
  documentTextOutline,
  folderOpenOutline,
  warningOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchBootstrap } from '../services/api';
import { MobileAppShell } from '../components/MobileAppShell';

type BootstrapPayload = Awaited<ReturnType<typeof fetchBootstrap>>;
type BootstrapOrders = BootstrapPayload['orders'];

type OrderStateTone = 'info' | 'warning' | 'danger';

const ACTIVE_ORDER_STATUSES = new Set(['scheduled', 'assigned', 'in_progress', 'draft']);
const IN_PROGRESS_STATUSES = new Set(['in_progress', 'draft']);
const WARNING_ORDER_STATUSES = new Set(['pending_review', 'needs_changes']);

function formatDateTime(date: string, time?: string | null): string {
  const parsed = new Date(`${date}${time ? `T${time}` : 'T09:00'}`);
  if (Number.isNaN(parsed.getTime())) return `${date}${time ? ` ${time}` : ''}`;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

function normalizeDateTime(date: string, time?: string | null): number {
  const parsed = new Date(`${date}${time ? `T${time}` : 'T09:00'}`);
  return Number.isNaN(parsed.getTime()) ? Number.POSITIVE_INFINITY : parsed.getTime();
}

function toneForOrder(status: string, date: string, todayDate: string): OrderStateTone {
  if (date < todayDate && status !== 'completed') return 'danger';
  if (WARNING_ORDER_STATUSES.has(status)) return 'warning';
  return 'info';
}

export default function Dashboard() {
  const { tenant } = useAuth();
  const history = useHistory();
  const [orders, setOrders] = useState<BootstrapOrders>([]);
  const [propertyAddressById, setPropertyAddressById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const loadDashboard = useCallback(async () => {
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
      setLastUpdatedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  const today = useMemo(() => {
    return orders.filter((o) => o.scheduled_date === todayDate);
  }, [orders, todayDate]);

  const upcoming = useMemo(() => {
    return orders.filter((o) => o.scheduled_date > todayDate);
  }, [orders, todayDate]);

  const overdue = useMemo(() => {
    return orders.filter((o) => o.scheduled_date < todayDate && o.status !== 'completed');
  }, [orders, todayDate]);

  const nextInspection = useMemo(() => {
    return orders
      .filter((o) => ACTIVE_ORDER_STATUSES.has(o.status))
      .sort((a, b) => normalizeDateTime(a.scheduled_date, a.scheduled_time) - normalizeDateTime(b.scheduled_date, b.scheduled_time))[0];
  }, [orders]);

  const inProgressInspection = useMemo(() => {
    return orders
      .filter((o) => IN_PROGRESS_STATUSES.has(o.status))
      .sort((a, b) => normalizeDateTime(a.scheduled_date, a.scheduled_time) - normalizeDateTime(b.scheduled_date, b.scheduled_time))[0];
  }, [orders]);

  const todayTimeline = useMemo(() => {
    return [...today].sort((a, b) => normalizeDateTime(a.scheduled_date, a.scheduled_time) - normalizeDateTime(b.scheduled_date, b.scheduled_time));
  }, [today]);

  const criticalAlerts = useMemo(() => {
    const alerts: Array<{ id: string; message: string; tone: OrderStateTone }> = [];

    overdue.slice(0, 3).forEach((o) => {
      alerts.push({
        id: `overdue-${o.id}`,
        message: `${o.order_number || 'Order'} is overdue`,
        tone: 'danger',
      });
    });

    orders
      .filter((o) => WARNING_ORDER_STATUSES.has(o.status))
      .slice(0, 2)
      .forEach((o) => {
        alerts.push({
          id: `warning-${o.id}`,
          message: `${o.order_number || 'Order'} needs attention (${o.status.replace('_', ' ')})`,
          tone: 'warning',
        });
      });

    return alerts.slice(0, 5);
  }, [orders, overdue]);

  const syncState = useMemo(() => {
    if (error) return { label: 'Sync issue', detail: 'Last request failed', icon: cloudOfflineOutline, tone: 'danger' as const };
    if (!lastUpdatedAt) return { label: 'Waiting for sync', detail: 'No successful sync yet', icon: cloudOfflineOutline, tone: 'warning' as const };
    return { label: 'Synced', detail: `Updated ${new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(lastUpdatedAt)}`, icon: cloudDoneOutline, tone: 'ok' as const };
  }, [error, lastUpdatedAt]);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(new Date()),
    []
  );

  const getOrderAddress = useCallback(
    (order: BootstrapOrders[number]) =>
      propertyAddressById[order.property_id]?.trim() || 'Property address unavailable',
    [propertyAddressById]
  );

  return (
    <MobileAppShell title={tenant?.name || 'Dashboard'}>
      <div className="dashboard-briefing">
        <section className="briefing-band">
          <p className="briefing-date">{todayLabel}</p>
          <h2>Inspection Briefing</h2>
          <div className="briefing-pills">
            <span>
              <IonIcon icon={calendarOutline} />
              {today.length} Today
            </span>
            <span>
              <IonIcon icon={clipboardOutline} />
              {upcoming.length} Upcoming
            </span>
            <span>
              <IonIcon icon={warningOutline} />
              {overdue.length} Overdue
            </span>
          </div>
        </section>

        <section className={`briefing-sync-state tone-${syncState.tone}`}>
          <IonIcon icon={syncState.icon} />
          <div>
            <strong>{syncState.label}</strong>
            <small>{syncState.detail}</small>
          </div>
          <button type="button" onClick={() => void loadDashboard()}>
            Refresh
          </button>
        </section>

        {loading ? (
          <div className="dashboard-briefing-loading">
            <IonSpinner name="crescent" />
          </div>
        ) : null}

        {error ? (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        ) : null}

        {!loading && !error ? (
          <>
            <section className="briefing-actions">
              <button className="briefing-primary-action" onClick={() => tenant && history.push(`/t/${tenant.slug}/orders/field-intake`)}>
                <span className="briefing-primary-icon">
                  <IonIcon icon={addCircleOutline} />
                </span>
                <span>
                  <strong>Start New Inspection</strong>
                  <small>Open guided intake and create an order in the field</small>
                </span>
              </button>
            </section>

            {nextInspection ? (
              <section className="briefing-focus-card">
                <h3>Next Inspection</h3>
                <p>{getOrderAddress(nextInspection)}</p>
                <small>{nextInspection.order_number || 'Inspection Order'}</small>
                <small>{formatDateTime(nextInspection.scheduled_date, nextInspection.scheduled_time)}</small>
                <IonButton
                  size="small"
                  fill="outline"
                  onClick={() => tenant && history.push(`/t/${tenant.slug}/order/${nextInspection.id}`)}
                >
                  Open Order
                </IonButton>
              </section>
            ) : null}

            {inProgressInspection ? (
              <section className="briefing-focus-card is-progress">
                <h3>Resume In Progress</h3>
                <p>{getOrderAddress(inProgressInspection)}</p>
                <small>{inProgressInspection.order_number || 'Inspection Order'}</small>
                <small>Status: {inProgressInspection.status.replace('_', ' ')}</small>
                <IonButton
                  size="small"
                  onClick={() => tenant && history.push(`/t/${tenant.slug}/order/${inProgressInspection.id}`)}
                >
                  Continue Inspection
                </IonButton>
              </section>
            ) : null}

            <section className="briefing-alerts">
              <div className="briefing-section-head">
                <h3>Critical Alerts</h3>
                <small>{criticalAlerts.length} items</small>
              </div>
              {criticalAlerts.length === 0 ? (
                <p className="briefing-empty">No critical alerts right now.</p>
              ) : (
                <ul>
                  {criticalAlerts.map((alert) => (
                    <li key={alert.id} className={`tone-${alert.tone}`}>
                      <IonIcon icon={alert.tone === 'danger' ? alertCircleOutline : warningOutline} />
                      <span>{alert.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="briefing-timeline">
              <div className="briefing-section-head">
                <h3>Today Timeline</h3>
                <small>{todayTimeline.length} inspections</small>
              </div>
              {todayTimeline.length === 0 ? (
                <p className="briefing-empty">No inspections scheduled today.</p>
              ) : (
                <ul>
                  {todayTimeline.map((o) => (
                    <li key={o.id}>
                      <button type="button" onClick={() => tenant && history.push(`/t/${tenant.slug}/order/${o.id}`)}>
                        <div>
                          <strong>{getOrderAddress(o)}</strong>
                          <small>{o.order_number || 'Inspection Order'}</small>
                          <small>{formatDateTime(o.scheduled_date, o.scheduled_time)}</small>
                        </div>
                        <span className={`timeline-status tone-${toneForOrder(o.status, o.scheduled_date, todayDate)}`}>
                          {o.status.replace('_', ' ')}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="briefing-grid">
              <button className="briefing-card" onClick={() => tenant && history.push(`/t/${tenant.slug}/orders`)}>
                <IonIcon icon={calendarOutline} />
                <strong>Overdue Follow-ups</strong>
                <small>{overdue.length} need attention</small>
              </button>
              <button className="briefing-card" onClick={() => tenant && history.push(`/t/${tenant.slug}/quick-capture`)}>
                <IonIcon icon={cameraOutline} />
                <strong>Quick Capture</strong>
                <small>Capture photo evidence with required note + GPS</small>
              </button>
              <button className="briefing-card">
                <IonIcon icon={documentTextOutline} />
                <strong>Reports</strong>
                <small>Review and finalize field reports</small>
              </button>
              <button className="briefing-card">
                <IonIcon icon={folderOpenOutline} />
                <strong>Checklist</strong>
                <small>Reference standards and notes</small>
              </button>
            </section>
          </>
        ) : null}
      </div>
    </MobileAppShell>
  );
}
