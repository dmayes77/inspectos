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
import {
  callOutline,
  calendarOutline,
  documentTextOutline,
  locationOutline,
  personOutline,
  playOutline,
  timeOutline,
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { jobsRepository, JobWithDetails } from '../db/repositories/jobs';
import { inspectionsRepository, Inspection } from '../db/repositories/inspections';
import { templatesRepository } from '../db/repositories/templates';
import { MobileAppShell } from '../components/MobileAppShell';

export default function JobDetail() {
  const { tenantSlug, jobId } = useParams<{ tenantSlug: string; jobId: string }>();
  const { tenant, user } = useAuth();
  const history = useHistory();

  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const jobData = await jobsRepository.getById(jobId);
        setJob(jobData);

        if (jobData) {
          const existingInspection = await inspectionsRepository.getByJobId(jobId);
          setInspection(existingInspection);
        }
      } catch (error) {
        console.error('Failed to load job:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [jobId]);

  const handleStartInspection = async () => {
    if (!job || !tenant || !user) return;

    setStarting(true);
    try {
      let inspectionId: string;

      if (inspection) {
        // Resume existing inspection
        inspectionId = inspection.id;
        if (inspection.status === 'draft') {
          await inspectionsRepository.start(inspectionId);
        }
      } else {
        // Get template version
        const template = await templatesRepository.getWithSections(job.template_id);
        const templateVersion = template?.version || 1;

        // Create new inspection
        inspectionId = await inspectionsRepository.create(
          job.id,
          tenant.id,
          job.template_id,
          templateVersion,
          user.id
        );
        await inspectionsRepository.start(inspectionId);
      }

      // Update job status
      await jobsRepository.updateStatus(job.id, 'in_progress');

      // Navigate to inspection runner
      history.push(`/t/${tenantSlug}/inspection/${inspectionId}`);
    } catch (error) {
      console.error('Failed to start inspection:', error);
    } finally {
      setStarting(false);
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'Not specified';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const formatDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <MobileAppShell title="Job Details">
        <div className="ion-text-center">
          <IonSpinner name="crescent" />
          <p>Loading job details...</p>
        </div>
      </MobileAppShell>
    );
  }

  if (!job) {
    return (
      <MobileAppShell title="Job Not Found" showBackButton defaultHref={`/t/${tenantSlug}/dashboard`}>
        <IonText color="danger">
          <p>This job could not be found.</p>
        </IonText>
      </MobileAppShell>
    );
  }

  const canStart = job.status !== 'completed' && job.status !== 'cancelled';
  const buttonText = inspection
    ? inspection.status === 'completed'
      ? 'View Inspection'
      : 'Continue Inspection'
    : 'Start Inspection';

  return (
    <MobileAppShell title="Job Details" showBackButton defaultHref={`/t/${tenantSlug}/dashboard`}>
        {/* Property Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={locationOutline} /> Property
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <h2 style={{ margin: '0 0 8px 0' }}>{job.property_address}</h2>
            <p style={{ margin: 0, color: 'var(--ion-color-medium)' }}>
              {job.property_city}, {job.property_state}
            </p>
          </IonCardContent>
        </IonCard>

        {/* Schedule Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={calendarOutline} /> Schedule
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem lines="none">
                <IonIcon icon={calendarOutline} slot="start" />
                <IonLabel>
                  <p>Date</p>
                  <h3>{formatDate(job.scheduled_date)}</h3>
                </IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonIcon icon={timeOutline} slot="start" />
                <IonLabel>
                  <p>Time</p>
                  <h3>{formatTime(job.scheduled_time)}</h3>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Client Card */}
        {job.client_name && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={personOutline} /> Client
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem lines="none">
                  <IonIcon icon={personOutline} slot="start" />
                  <IonLabel>
                    <h3>{job.client_name}</h3>
                  </IonLabel>
                </IonItem>
                {job.client_phone && (
                  <IonItem lines="none" href={`tel:${job.client_phone}`}>
                    <IonIcon icon={callOutline} slot="start" />
                    <IonLabel>
                      <h3>{job.client_phone}</h3>
                    </IonLabel>
                  </IonItem>
                )}
              </IonList>
            </IonCardContent>
          </IonCard>
        )}

        {/* Template Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={documentTextOutline} /> Inspection Type
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <h3>{job.template_name}</h3>
          </IonCardContent>
        </IonCard>

        {/* Status */}
        <IonCard>
          <IonCardContent>
            <IonItem lines="none">
              <IonLabel>
                <p>Job Status</p>
                <h3 style={{ textTransform: 'capitalize' }}>{job.status.replace('_', ' ')}</h3>
              </IonLabel>
            </IonItem>
            {inspection && (
              <IonItem lines="none">
                <IonLabel>
                  <p>Inspection Status</p>
                  <h3 style={{ textTransform: 'capitalize' }}>{inspection.status.replace('_', ' ')}</h3>
                </IonLabel>
              </IonItem>
            )}
          </IonCardContent>
        </IonCard>

        {/* Action Button */}
        {canStart && (
          <IonButton
            expand="block"
            size="large"
            onClick={handleStartInspection}
            disabled={starting}
            style={{ marginTop: 16 }}
          >
            {starting ? (
              <IonSpinner name="crescent" />
            ) : (
              <>
                <IonIcon icon={playOutline} slot="start" />
                {buttonText}
              </>
            )}
          </IonButton>
        )}
    </MobileAppShell>
  );
}
