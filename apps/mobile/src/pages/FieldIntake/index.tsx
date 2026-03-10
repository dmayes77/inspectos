import './field-intake.css';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useHistory, useParams } from 'react-router-dom';
import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTextarea,
} from '@ionic/react';
import { MobilePageLayout } from '../../components/MobilePageLayout';
import {
  createFieldIntakeOrder,
  getOrder,
  updateFieldIntakeOrder,
  type CreateFieldIntakeOrderInput,
} from '../../services/api';
import { mobileQueryKeys } from '../../lib/query-keys';

const fieldIntakeDefaults: CreateFieldIntakeOrderInput = {
  address_line1: '',
  city: '',
  state: '',
  zip_code: '',
  reason_code: 'walk_up',
  priority: 'normal',
  contact_name: '',
  tenant_phone: '',
  notes: '',
};

export default function FieldIntake() {
  const history = useHistory();
  const { tenantSlug, orderId } = useParams<{ tenantSlug: string; orderId?: string }>();
  const isEditMode = Boolean(orderId);
  const [fieldIntake, setFieldIntake] = useState<CreateFieldIntakeOrderInput>(fieldIntakeDefaults);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [canEditExisting, setCanEditExisting] = useState(true);
  const existingOrderQuery = useQuery({
    queryKey: mobileQueryKeys.order(tenantSlug, orderId ?? 'new'),
    queryFn: () => getOrder(tenantSlug, orderId!),
    enabled: isEditMode && Boolean(orderId),
  });
  const loadingExisting = existingOrderQuery.isPending;

  useEffect(() => {
    if (!isEditMode || !orderId) return;
    const detail = existingOrderQuery.data;
    if (!detail) {
      if (existingOrderQuery.error instanceof Error) {
        setCanEditExisting(false);
        setStatus(existingOrderQuery.error.message);
      }
      return;
    }

    setStatus(null);
    const order = detail.order;
    const isPendingFieldIntake =
      (order.source ?? '').startsWith('mobile_field_intake:') &&
      order.status === 'pending';

    if (!isPendingFieldIntake) {
      setCanEditExisting(false);
      setStatus('This Field Intake has already been deployed. You can no longer edit it from mobile.');
      return;
    }

    setCanEditExisting(true);
    setFieldIntake((prev) => ({
      ...prev,
      address_line1: order.property?.address_line1 ?? '',
      city: order.property?.city ?? '',
      state: order.property?.state ?? '',
      zip_code: order.property?.zip_code ?? '',
      contact_name: order.client?.name ?? '',
    }));
  }, [existingOrderQuery.data, existingOrderQuery.error, isEditMode, orderId]);

  const canSubmitCreate = useMemo(
    () =>
      Boolean(
        fieldIntake.address_line1.trim() &&
          fieldIntake.city.trim() &&
          fieldIntake.state.trim() &&
          fieldIntake.zip_code.trim()
      ),
    [fieldIntake.address_line1, fieldIntake.city, fieldIntake.state, fieldIntake.zip_code]
  );

  const canSubmitEdit = useMemo(
    () =>
      Boolean(
        canEditExisting &&
          fieldIntake.address_line1.trim() &&
          fieldIntake.city.trim() &&
          fieldIntake.state.trim() &&
          fieldIntake.zip_code.trim() &&
          fieldIntake.contact_name?.trim()
      ),
    [
      canEditExisting,
      fieldIntake.address_line1,
      fieldIntake.city,
      fieldIntake.state,
      fieldIntake.zip_code,
      fieldIntake.contact_name,
    ]
  );

  const submit = async () => {
    setSaving(true);
    setStatus(null);
    try {
      if (isEditMode && orderId) {
        await updateFieldIntakeOrder(tenantSlug, orderId, {
          contact_name: fieldIntake.contact_name?.trim(),
          address_line1: fieldIntake.address_line1.trim(),
          city: fieldIntake.city.trim(),
          state: fieldIntake.state.trim().toUpperCase(),
          zip_code: fieldIntake.zip_code.trim(),
        });
        history.replace(`/t/${tenantSlug}/order/${orderId}`);
        return;
      }

      const created = await createFieldIntakeOrder(tenantSlug, fieldIntake);
      history.replace(`/t/${tenantSlug}/order/${created.order_id}`);
    } catch (saveError) {
      setStatus(saveError instanceof Error ? saveError.message : 'Failed to save Field Intake');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobilePageLayout
      title={isEditMode ? 'Edit Field Intake' : 'Create Field Intake'}
      showBack
      defaultHref={isEditMode && orderId ? `/t/${tenantSlug}/order/${orderId}` : `/t/${tenantSlug}/orders`}
    >
      <div className="profile-page">
        {loadingExisting ? <IonSpinner name="crescent" /> : null}

        <IonItem lines="none" className="profile-input">
          <IonLabel position="stacked">Contact Name</IonLabel>
          <IonInput
            value={fieldIntake.contact_name}
            onIonInput={(e) =>
              setFieldIntake((prev) => ({
                ...prev,
                contact_name: String(e.detail.value ?? ''),
              }))
            }
            disabled={isEditMode && !canEditExisting}
          />
        </IonItem>

        <IonItem lines="none" className="profile-input">
          <IonLabel position="stacked">Address Line 1</IonLabel>
          <IonInput
            value={fieldIntake.address_line1}
            onIonInput={(e) =>
              setFieldIntake((prev) => ({
                ...prev,
                address_line1: String(e.detail.value ?? ''),
              }))
            }
            disabled={isEditMode && !canEditExisting}
          />
        </IonItem>
        <IonItem lines="none" className="profile-input">
          <IonLabel position="stacked">City</IonLabel>
          <IonInput
            value={fieldIntake.city}
            onIonInput={(e) =>
              setFieldIntake((prev) => ({
                ...prev,
                city: String(e.detail.value ?? ''),
              }))
            }
            disabled={isEditMode && !canEditExisting}
          />
        </IonItem>
        <IonItem lines="none" className="profile-input">
          <IonLabel position="stacked">State</IonLabel>
          <IonInput
            value={fieldIntake.state}
            onIonInput={(e) =>
              setFieldIntake((prev) => ({
                ...prev,
                state: String(e.detail.value ?? '').toUpperCase(),
              }))
            }
            disabled={isEditMode && !canEditExisting}
          />
        </IonItem>
        <IonItem lines="none" className="profile-input">
          <IonLabel position="stacked">ZIP Code</IonLabel>
          <IonInput
            value={fieldIntake.zip_code}
            onIonInput={(e) =>
              setFieldIntake((prev) => ({
                ...prev,
                zip_code: String(e.detail.value ?? ''),
              }))
            }
            disabled={isEditMode && !canEditExisting}
          />
        </IonItem>

        {!isEditMode ? (
          <>
            <div className="profile-section">
              <h3>Reason</h3>
              <IonItem lines="none" className="profile-input">
                <IonLabel position="stacked">Inspection Reason</IonLabel>
                <IonSelect
                  value={fieldIntake.reason_code}
                  interface="action-sheet"
                  onIonChange={(e) =>
                    setFieldIntake((prev) => ({
                      ...prev,
                      reason_code: e.detail.value as CreateFieldIntakeOrderInput['reason_code'],
                    }))
                  }
                >
                  <IonSelectOption value="emergency">Emergency</IonSelectOption>
                  <IonSelectOption value="walk_up">Walk-up</IonSelectOption>
                  <IonSelectOption value="add_on">Add-on</IonSelectOption>
                  <IonSelectOption value="after_hours">After Hours</IonSelectOption>
                  <IonSelectOption value="other">Other</IonSelectOption>
                </IonSelect>
              </IonItem>
            </div>

            <div className="profile-section">
              <h3>Priority</h3>
              <IonSegment
                value={fieldIntake.priority}
                onIonChange={(e) =>
                  setFieldIntake((prev) => ({
                    ...prev,
                    priority: e.detail.value as CreateFieldIntakeOrderInput['priority'],
                  }))
                }
              >
                <IonSegmentButton value="low"><IonLabel>Low</IonLabel></IonSegmentButton>
                <IonSegmentButton value="normal"><IonLabel>Normal</IonLabel></IonSegmentButton>
                <IonSegmentButton value="high"><IonLabel>High</IonLabel></IonSegmentButton>
                <IonSegmentButton value="urgent"><IonLabel>Urgent</IonLabel></IonSegmentButton>
              </IonSegment>
            </div>

            <IonItem lines="none" className="profile-input">
              <IonLabel position="stacked">Tenant Phone (optional)</IonLabel>
              <IonInput
                value={fieldIntake.tenant_phone}
                onIonInput={(e) =>
                  setFieldIntake((prev) => ({
                    ...prev,
                    tenant_phone: String(e.detail.value ?? ''),
                  }))
                }
              />
            </IonItem>
            <IonItem lines="none" className="profile-input profile-textarea">
              <IonLabel position="stacked">Notes (optional)</IonLabel>
              <IonTextarea
                autoGrow
                value={fieldIntake.notes}
                onIonInput={(e) =>
                  setFieldIntake((prev) => ({
                    ...prev,
                    notes: String(e.detail.value ?? ''),
                  }))
                }
              />
            </IonItem>
          </>
        ) : null}

        <IonButton
          expand="block"
          onClick={() => void submit()}
          disabled={
            saving ||
            loadingExisting ||
            (isEditMode ? !canSubmitEdit : !canSubmitCreate)
          }
        >
          {saving ? <IonSpinner name="crescent" /> : isEditMode ? 'Update Field Intake' : 'Submit Field Intake'}
        </IonButton>

        {status ? (
          <IonText color="danger">
            <p>{status}</p>
          </IonText>
        ) : null}
      </div>
    </MobilePageLayout>
  );
}
