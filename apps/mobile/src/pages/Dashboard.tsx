import { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { calendarOutline, locationOutline, personOutline, timeOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { jobsRepository, JobWithDetails } from '../db/repositories/jobs';
import { SyncStatusBar } from '../components/SyncStatusBar';
import { useSyncStatus, useSyncActions } from '../sync';
import { MobileAppShell } from '../components/MobileAppShell';

export default function Dashboard() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant, user, signOut } = useAuth();
  const { isOnline, pendingChanges, pendingUploads } = useSyncStatus();
  const { sync } = useSyncActions();
  const history = useHistory();

  const [todayJobs, setTodayJobs] = useState<JobWithDetails[]>([]);
  const [upcomingJobs, setUpcomingJobs] = useState<JobWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    if (!tenant || !user) return;

    setLoading(true);
    try {
      const today = await jobsRepository.getToday(tenant.id, user.id);
      const upcoming = await jobsRepository.getUpcoming(tenant.id, user.id);

      setTodayJobs(today);
      // Filter out today's jobs from upcoming
      const todayDate = new Date().toISOString().split('T')[0];
      setUpcomingJobs(upcoming.filter(j => j.scheduled_date !== todayDate));
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, user]);

  const handleRefresh = async () => {
    if (isOnline) {
      await sync();
    }
    await loadJobs();
  };

  const handleJobClick = (job: JobWithDetails) => {
    history.push(`/t/${tenantSlug}/job/${job.id}`);
  };

  const handleSignOut = async () => {
    await signOut();
    history.replace('/login');
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <MobileAppShell
      title={tenant?.name || 'Dashboard'}
      headerActions={<SyncStatusBar showDetails />}
      onRefresh={handleRefresh}
      contentClassName="ion-padding"
    >
      {/* Sync status banner */}
      {!isOnline && (
        <IonCard color="warning">
          <IonCardContent>
            <strong>Offline Mode</strong>
            <p>You can continue working. Changes will sync when online.</p>
          </IonCardContent>
        </IonCard>
      )}

      {(pendingChanges > 0 || pendingUploads > 0) && isOnline && (
        <IonCard color="light">
          <IonCardContent>
            <p>
              {pendingChanges > 0 && `${pendingChanges} changes pending`}
              {pendingChanges > 0 && pendingUploads > 0 && ' • '}
              {pendingUploads > 0 && `${pendingUploads} uploads pending`}
            </p>
          </IonCardContent>
        </IonCard>
      )}

      {/* Today's Jobs */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Today's Inspections</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {loading ? (
            <div className="ion-text-center">
              <IonSpinner name="crescent" />
            </div>
          ) : todayJobs.length === 0 ? (
            <IonText color="medium">
              <p>No inspections scheduled for today.</p>
            </IonText>
          ) : (
            <IonList>
              {todayJobs.map((job) => (
                <IonItem key={job.id} button onClick={() => handleJobClick(job)}>
                  <IonLabel>
                    <h2>{job.property_address}</h2>
                    <p>
                      <IonIcon icon={timeOutline} /> {formatTime(job.scheduled_time)}
                      {job.client_name && (
                        <>
                          {' • '}
                          <IonIcon icon={personOutline} /> {job.client_name}
                        </>
                      )}
                    </p>
                    <p>
                      <IonIcon icon={locationOutline} /> {job.template_name}
                    </p>
                  </IonLabel>
                  <IonText
                    color={
                      job.status === 'completed'
                        ? 'success'
                        : job.status === 'in_progress'
                        ? 'warning'
                        : 'medium'
                    }
                    slot="end"
                  >
                    {job.status.replace('_', ' ')}
                  </IonText>
                </IonItem>
              ))}
            </IonList>
          )}
        </IonCardContent>
      </IonCard>

      {/* Upcoming Jobs */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Upcoming Inspections</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {loading ? (
            <div className="ion-text-center">
              <IonSpinner name="crescent" />
            </div>
          ) : upcomingJobs.length === 0 ? (
            <IonText color="medium">
              <p>No upcoming inspections.</p>
            </IonText>
          ) : (
            <IonList>
              {upcomingJobs.slice(0, 5).map((job) => (
                <IonItem key={job.id} button onClick={() => handleJobClick(job)}>
                  <IonLabel>
                    <h2>{job.property_address}</h2>
                    <p>
                      <IonIcon icon={calendarOutline} /> {formatDate(job.scheduled_date)}
                      {job.scheduled_time && ` at ${formatTime(job.scheduled_time)}`}
                    </p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          )}
        </IonCardContent>
      </IonCard>

      {/* Sign out button */}
      <IonButton expand="block" fill="outline" color="medium" onClick={handleSignOut}>
        Sign Out
      </IonButton>
    </MobileAppShell>
  );
}
