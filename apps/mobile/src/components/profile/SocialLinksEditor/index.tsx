import './social-links-editor.css';
import { IonButton, IonIcon, IonInput } from '@ionic/react';
import { addOutline, trashOutline } from 'ionicons/icons';
import { getSocialLinkMetadata } from '../../../../../../shared/utils/profile-social';

export function SocialLinksEditor({
  links,
  onChange,
}: {
  links: string[];
  onChange: (nextLinks: string[]) => void;
}) {
  return (
    <div className="profile-social-editor">
      {links.map((value, index) => {
        const meta = getSocialLinkMetadata(value);
        const label = meta?.label ?? null;
        return (
          <div key={`social-link-${index}`} className="profile-social-row">
            <IonInput
              className="profile-input"
              value={value}
              placeholder="https://linkedin.com/in/your-name"
              onIonInput={(event) => {
                const next = [...links];
                next[index] = String(event.detail.value ?? '');
                onChange(next);
              }}
            />
            <IonButton
              type="button"
              fill="outline"
              size="small"
              className="profile-social-remove"
              onClick={() => {
                if (links.length === 1) {
                  onChange(['']);
                  return;
                }
                onChange(links.filter((_, i) => i !== index));
              }}
            >
              <IonIcon icon={trashOutline} />
            </IonButton>
            {label ? <span className="profile-social-badge">{label}</span> : null}
          </div>
        );
      })}

      <div className="profile-social-footer">
        <p>Add any social URL. Platform is auto-detected.</p>
        <IonButton type="button" fill="outline" size="small" onClick={() => onChange([...links, ''])}>
          <IonIcon icon={addOutline} />
          Add Link
        </IonButton>
      </div>
    </div>
  );
}
