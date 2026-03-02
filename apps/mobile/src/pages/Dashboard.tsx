import { useEffect, useMemo, useState } from 'react';
import { IonIcon, IonSpinner, IonText } from '@ionic/react';
import {
  addCircleOutline,
  checkboxOutline,
  chevronForwardOutline,
  clipboardOutline,
  documentTextOutline,
  folderOpenOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchBootstrap } from '../services/api';
import { MobileAppShell } from '../components/MobileAppShell';

type BootstrapOrders = Awaited<ReturnType<typeof fetchBootstrap>>['orders'];
type BootstrapProperties = Awaited<ReturnType<typeof fetchBootstrap>>['properties'];
type BootstrapClients = Awaited<ReturnType<typeof fetchBootstrap>>['clients'];

export default function Dashboard() {
  const { tenant } = useAuth();
  const history = useHistory();
  const [orders, setOrders] = useState<BootstrapOrders>([]);
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
        setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [tenant]);

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

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(new Date()),
    []
  );

  return (
    <MobileAppShell title={tenant?.name || 'Dashboard'}>
      <div className="dashboard-hub">
        <section className="dashboard-hub-header">
          <h2>{todayLabel}</h2>
          <p>Field Operations Hub</p>
          <div className="dashboard-hub-stats">
            <span>{today.length} today</span>
            <span>{upcoming.length} upcoming</span>
            <span>{overdue.length} overdue</span>
          </div>
        </section>

        {loading ? (
          <div className="dashboard-hub-loading">
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
            <section className="hub-section">
              <div className="hub-section-head">Inspection & Audit</div>
              <div className="hub-grid">
                <button className="hub-tile hub-tile-wide" onClick={() => tenant && history.push(`/t/${tenant.slug}/orders`)}>
                  <IonIcon icon={addCircleOutline} />
                  <strong>Start New Inspection</strong>
                </button>
                <button className="hub-tile" onClick={() => tenant && history.push(`/t/${tenant.slug}/orders`)}>
                  <IonIcon icon={clipboardOutline} />
                  <strong>Orders Queue</strong>
                  <small>{orders.length} assigned</small>
                </button>
                <button className="hub-tile" onClick={() => tenant && history.push(`/t/${tenant.slug}/orders`)}>
                  <IonIcon icon={checkboxOutline} />
                  <strong>Today's Schedule</strong>
                  <small>{today.length} inspections</small>
                </button>
              </div>
            </section>

            <section className="hub-section">
              <div className="hub-section-head">Records</div>
              <div className="hub-grid">
                <button className="hub-tile">
                  <IonIcon icon={documentTextOutline} />
                  <strong>Reports</strong>
                </button>
                <button className="hub-tile">
                  <IonIcon icon={folderOpenOutline} />
                  <strong>Checklist</strong>
                </button>
              </div>
            </section>

          </>
        ) : null}
      </div>
    </MobileAppShell>
  );
}
