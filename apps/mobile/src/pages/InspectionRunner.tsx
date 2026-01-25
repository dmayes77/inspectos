import { useEffect, useState, useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonToolbar,
  IonText,
  IonTextarea,
} from "@ionic/react";
import { addOutline, alertCircleOutline, cameraOutline, checkmarkCircleOutline, chevronBackOutline, chevronForwardOutline } from "ionicons/icons";
import { useAuth } from "../contexts/AuthContext";
import { inspectionsRepository, Inspection, Answer, Finding } from "../db/repositories/inspections";
import { templatesRepository, TemplateWithSections, TemplateSection, TemplateItem } from "../db/repositories/templates";
import { SyncStatusBar } from "../components/SyncStatusBar";
import { capturePhoto } from "../services/camera";
import { saveInspectionPhoto } from "../services/storage";
import { mediaRepository } from "../db/repositories/media";
import { MobileAppShell } from "../components/MobileAppShell";

interface RatingValue {
  rating: number;
  label: string;
}

const RATINGS: RatingValue[] = [
  { rating: 1, label: "Poor" },
  { rating: 2, label: "Fair" },
  { rating: 3, label: "Average" },
  { rating: 4, label: "Good" },
  { rating: 5, label: "Excellent" },
];

export default function InspectionRunner() {
  const { tenantSlug, inspectionId } = useParams<{ tenantSlug: string; inspectionId: string }>();
  const { tenant } = useAuth();
  const history = useHistory();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [template, setTemplate] = useState<TemplateWithSections | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [findings, setFindings] = useState<Finding[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<Record<string, string | null>>({});

  // Load inspection data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const inspectionData = await inspectionsRepository.getById(inspectionId);
        if (!inspectionData) {
          console.error("Inspection not found");
          return;
        }
        setInspection(inspectionData);

        const templateData = await templatesRepository.getWithSections(inspectionData.template_id);
        setTemplate(templateData);

        const existingAnswers = await inspectionsRepository.getAnswers(inspectionId);
        const answersMap: Record<string, Answer> = {};
        for (const answer of existingAnswers) {
          answersMap[answer.template_item_id] = answer;
        }
        setAnswers(answersMap);

        const existingFindings = await inspectionsRepository.getFindings(inspectionId);
        setFindings(existingFindings);
      } catch (error) {
        console.error("Failed to load inspection:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [inspectionId]);

  // Save an answer
  const saveAnswer = useCallback(
    async (item: TemplateItem, sectionId: string, value: string | null, notes?: string) => {
      if (!inspection) return;

      setSaving(true);
      try {
        await inspectionsRepository.saveAnswer(inspection.id, item.id, sectionId, value, notes || null);

        // Update local state
        setAnswers((prev) => ({
          ...prev,
          [item.id]: {
            id: prev[item.id]?.id || "",
            inspection_id: inspection.id,
            template_item_id: item.id,
            section_id: sectionId,
            value,
            notes: notes || null,
            created_at: prev[item.id]?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }));
      } catch (error) {
        console.error("Failed to save answer:", error);
      } finally {
        setSaving(false);
      }
    },
    [inspection],
  );

  // Add a finding
  const addFinding = useCallback(
    async (sectionId: string, itemId?: string) => {
      if (!inspection) return;

      try {
        const id = await inspectionsRepository.createFinding(inspection.id, {
          section_id: sectionId,
          template_item_id: itemId || null,
          defect_library_id: null,
          title: "New Finding",
          description: null,
          severity: "minor",
          location: null,
          recommendation: null,
          estimated_cost_min: null,
          estimated_cost_max: null,
        });

        setFindings((prev) => [
          ...prev,
          {
            id,
            inspection_id: inspection.id,
            section_id: sectionId,
            template_item_id: itemId || null,
            defect_library_id: null,
            title: "New Finding",
            description: null,
            severity: "minor",
            location: null,
            recommendation: null,
            estimated_cost_min: null,
            estimated_cost_max: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      } catch (error) {
        console.error("Failed to add finding:", error);
      }
    },
    [inspection],
  );

  const estimateBase64Bytes = (base64: string) => {
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    return Math.ceil((base64.length * 3) / 4) - padding;
  };

  const handlePhotoCapture = useCallback(
    async (item: TemplateItem, sectionId: string) => {
      if (!inspection) return;

      setPhotoStatus((prev) => ({ ...prev, [item.id]: "Capturing photo..." }));
      try {
        const photo = await capturePhoto();
        if (!photo) {
          setPhotoStatus((prev) => ({ ...prev, [item.id]: "Photo capture canceled." }));
          return;
        }

        const photoId = crypto.randomUUID();
        const saved = await saveInspectionPhoto(inspection.id, photoId, photo.base64);
        const format = photo.format || "jpeg";
        const mimeType = `image/${format}`;
        const fileName = `${photoId}.${format}`;
        const fileSize = estimateBase64Bytes(photo.base64);

        await mediaRepository.create({
          inspectionId: inspection.id,
          localPath: saved.path,
          fileName,
          mimeType,
          fileSize,
        });

        await saveAnswer(item, sectionId, fileName);

        setPhotoStatus((prev) => ({ ...prev, [item.id]: "Photo saved for upload." }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Photo capture failed";
        setPhotoStatus((prev) => ({ ...prev, [item.id]: message }));
      }
    },
    [inspection, saveAnswer],
  );

  // Complete inspection
  const handleComplete = async () => {
    if (!inspection) return;

    setSaving(true);
    try {
      await inspectionsRepository.complete(inspection.id);
      history.replace(`/t/${tenantSlug}/dashboard`);
    } catch (error) {
      console.error("Failed to complete inspection:", error);
    } finally {
      setSaving(false);
    }
  };

  // Navigation
  const goToSection = (index: number) => {
    if (template && index >= 0 && index < template.sections.length) {
      setCurrentSectionIndex(index);
    }
  };

  const currentSection = template?.sections[currentSectionIndex];

  // Calculate progress
  const calculateProgress = () => {
    if (!template) return { completed: 0, total: 0, percentage: 0 };

    let total = 0;
    let completed = 0;

    for (const section of template.sections) {
      for (const item of section.items) {
        if (item.is_required) {
          total++;
          if (answers[item.id]?.value) {
            completed++;
          }
        }
      }
    }

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <MobileAppShell title="Inspection">
        <div className="ion-text-center">
          <IonSpinner name="crescent" />
          <p>Loading inspection...</p>
        </div>
      </MobileAppShell>
    );
  }

  if (!inspection || !template) {
    return (
      <MobileAppShell title="Inspection" showBackButton defaultHref={`/t/${tenantSlug}/dashboard`}>
        <IonText color="danger">
          <p>Inspection not found.</p>
        </IonText>
      </MobileAppShell>
    );
  }

  return (
    <MobileAppShell
      title={template.name}
      showBackButton
      defaultHref={`/t/${tenantSlug}/dashboard`}
      headerActions={<SyncStatusBar />}
      subHeader={
        <IonToolbar>
          <IonSegment
            value={currentSectionIndex.toString()}
            onIonChange={(event: CustomEvent<{ value?: string | null }>) => goToSection(parseInt((event.detail.value as string) ?? "0", 10))}
            scrollable
          >
            {template.sections.map((section, index) => (
              <IonSegmentButton key={section.id} value={index.toString()}>
                <IonLabel>{section.name}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </IonToolbar>
      }
      contentClassName="ion-padding"
    >
      {/* Progress bar */}
      <IonCard>
        <IonCardContent>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span>Progress</span>
            <span>
              {progress.completed}/{progress.total} required items ({progress.percentage}%)
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: "var(--ion-color-light)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress.percentage}%`,
                background: progress.percentage === 100 ? "var(--ion-color-success)" : "var(--ion-color-primary)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </IonCardContent>
      </IonCard>

      {/* Section content */}
      {currentSection && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{currentSection.name}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {currentSection.description && (
              <IonText color="medium">
                <p>{currentSection.description}</p>
              </IonText>
            )}

            <IonList>
              {currentSection.items.map((item) => (
                <InspectionItem
                  key={item.id}
                  item={item}
                  sectionId={currentSection.id}
                  answer={answers[item.id]}
                  onSave={(value, notes) => saveAnswer(item, currentSection.id, value, notes)}
                  onAddFinding={() => addFinding(currentSection.id, item.id)}
                  onTakePhoto={() => handlePhotoCapture(item, currentSection.id)}
                  statusMessage={photoStatus[item.id] || null}
                />
              ))}
            </IonList>

            {/* Add finding button */}
            <IonButton expand="block" fill="outline" onClick={() => addFinding(currentSection.id)} style={{ marginTop: 16 }}>
              <IonIcon icon={addOutline} slot="start" />
              Add Finding
            </IonButton>
          </IonCardContent>
        </IonCard>
      )}

      {/* Section findings */}
      {currentSection && findings.filter((f) => f.section_id === currentSection.id).length > 0 && (
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={alertCircleOutline} /> Findings
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              {findings
                .filter((f) => f.section_id === currentSection.id)
                .map((finding) => (
                  <IonItem key={finding.id}>
                    <IonLabel>
                      <h3>{finding.title}</h3>
                      <p style={{ textTransform: "capitalize" }}>{finding.severity}</p>
                    </IonLabel>
                  </IonItem>
                ))}
            </IonList>
          </IonCardContent>
        </IonCard>
      )}

      {/* Navigation buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <IonButton expand="block" fill="outline" disabled={currentSectionIndex === 0} onClick={() => goToSection(currentSectionIndex - 1)} style={{ flex: 1 }}>
          <IonIcon icon={chevronBackOutline} slot="start" />
          Previous
        </IonButton>

        {currentSectionIndex === template.sections.length - 1 ? (
          <IonButton expand="block" color="success" onClick={handleComplete} disabled={saving || progress.percentage < 100} style={{ flex: 1 }}>
            {saving ? (
              <IonSpinner name="crescent" />
            ) : (
              <>
                <IonIcon icon={checkmarkCircleOutline} slot="start" />
                Complete
              </>
            )}
          </IonButton>
        ) : (
          <IonButton expand="block" onClick={() => goToSection(currentSectionIndex + 1)} style={{ flex: 1 }}>
            Next
            <IonIcon icon={chevronForwardOutline} slot="end" />
          </IonButton>
        )}
      </div>
    </MobileAppShell>
  );
}

// Individual inspection item component
interface InspectionItemProps {
  item: TemplateItem;
  sectionId: string;
  answer?: Answer;
  onSave: (value: string | null, notes?: string) => void;
  onAddFinding: () => void;
  onTakePhoto: () => void;
  statusMessage?: string | null;
}

function InspectionItem({ item, answer, onSave, onAddFinding, onTakePhoto, statusMessage }: InspectionItemProps) {
  const [localValue, setLocalValue] = useState(answer?.value || "");
  const [localNotes, setLocalNotes] = useState(answer?.notes || "");

  useEffect(() => {
    setLocalValue(answer?.value || "");
    setLocalNotes(answer?.notes || "");
  }, [answer]);

  const handleBlur = () => {
    if (localValue !== answer?.value || localNotes !== answer?.notes) {
      onSave(localValue || null, localNotes);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    const value = checked ? "yes" : "no";
    setLocalValue(value);
    onSave(value, localNotes);
  };

  const handleSelectChange = (value: string) => {
    setLocalValue(value);
    onSave(value, localNotes);
  };

  const handleRatingChange = (rating: number) => {
    const value = rating.toString();
    setLocalValue(value);
    onSave(value, localNotes);
  };

  return (
    <div style={{ marginBottom: 16, padding: 8, background: "var(--ion-color-light)", borderRadius: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <IonLabel>
          <h3>
            {item.name}
            {item.is_required && <span style={{ color: "var(--ion-color-danger)" }}> *</span>}
          </h3>
          {item.description && <p style={{ color: "var(--ion-color-medium)" }}>{item.description}</p>}
        </IonLabel>
        <IonButton fill="clear" size="small" onClick={onAddFinding}>
          <IonIcon icon={alertCircleOutline} />
        </IonButton>
      </div>

      {/* Input based on type */}
      {item.item_type === "checkbox" && (
        <IonItem lines="none">
          <IonCheckbox checked={localValue === "yes"} onIonChange={(event: CustomEvent<{ checked: boolean }>) => handleCheckboxChange(event.detail.checked)} />
          <IonLabel style={{ marginLeft: 8 }}>Satisfactory</IonLabel>
        </IonItem>
      )}

      {item.item_type === "rating" && (
        <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
          {RATINGS.map((r) => (
            <IonButton key={r.rating} fill={localValue === r.rating.toString() ? "solid" : "outline"} size="small" onClick={() => handleRatingChange(r.rating)}>
              {r.rating}
            </IonButton>
          ))}
        </div>
      )}

      {item.item_type === "text" && (
        <IonItem lines="none">
          <IonTextarea
            value={localValue}
            placeholder="Enter response..."
            onIonInput={(e: CustomEvent) => setLocalValue((e.detail.value as string) ?? "")}
            onIonBlur={handleBlur}
            rows={2}
          />
        </IonItem>
      )}

      {item.item_type === "number" && (
        <IonItem lines="none">
          <IonInput
            type="number"
            value={localValue}
            placeholder="Enter number..."
            onIonInput={(e: CustomEvent) => setLocalValue((e.detail.value as string) ?? "")}
            onIonBlur={handleBlur}
          />
        </IonItem>
      )}

      {item.item_type === "select" && item.options && (
        <IonItem lines="none">
          <IonSelect
            value={localValue}
            placeholder="Select option..."
            onIonChange={(event: CustomEvent<{ value: string }>) => handleSelectChange(event.detail.value)}
          >
            {(JSON.parse(item.options) as { value: string; label: string }[]).map((opt) => (
              <IonSelectOption key={opt.value} value={opt.value}>
                {opt.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
      )}

      {item.item_type === "photo" && (
        <IonButton expand="block" fill="outline" style={{ marginTop: 8 }} onClick={onTakePhoto}>
          <IonIcon icon={cameraOutline} slot="start" />
          Take Photo
        </IonButton>
      )}

      {item.item_type === "photo" && statusMessage && (
        <IonText color="medium">
          <p style={{ marginTop: 6, fontSize: "0.85em" }}>{statusMessage}</p>
        </IonText>
      )}

      {/* Notes field */}
      <IonItem lines="none" style={{ marginTop: 8 }}>
        <IonTextarea
          value={localNotes}
          placeholder="Add notes..."
          onIonInput={(e: CustomEvent) => setLocalNotes((e.detail.value as string) ?? "")}
          onIonBlur={handleBlur}
          rows={1}
          style={{ fontSize: "0.9em" }}
        />
      </IonItem>
    </div>
  );
}
