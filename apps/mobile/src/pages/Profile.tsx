import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  applySocialLinksToPayload,
  buildSocialLinksFromProfile,
} from '../../../../shared/utils/profile-social';
import {
  IonButton,
  IonInput,
  IonSpinner,
  IonText,
  IonTextarea,
} from '@ionic/react';
import { MobileAppShell } from '../components/MobileAppShell';
import { SocialLinksEditor } from '../components/profile/SocialLinksEditor';
import { fetchProfile, type MobileProfilePayload, updateProfile, uploadAvatar } from '../services/api';

type ProfileForm = {
  full_name: string;
  phone: string;
  bio: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state_region: string;
  country: string;
  postal_code: string;
};

const emptyForm: ProfileForm = {
  full_name: '',
  phone: '',
  bio: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state_region: '',
  country: '',
  postal_code: '',
};

function toForm(profile: MobileProfilePayload): ProfileForm {
  return {
    full_name: profile.full_name ?? '',
    phone: profile.phone ?? '',
    bio: profile.bio ?? '',
    address_line1: profile.address_line1 ?? '',
    address_line2: profile.address_line2 ?? '',
    city: profile.city ?? '',
    state_region: profile.state_region ?? '',
    country: profile.country ?? '',
    postal_code: profile.postal_code ?? '',
  };
}

export default function Profile() {
  const [profile, setProfile] = useState<MobileProfilePayload | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState<string[]>(['']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setStatus(null);
      try {
        const data = await fetchProfile();
        setProfile(data);
        setForm(toForm(data));
        setSocialLinks(buildSocialLinksFromProfile(data));
        setAvatarUrl(data.avatar_url ?? '');
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const emailValue = profile?.email ?? '—';
  const avatarPreview = useMemo(() => avatarUrl.trim(), [avatarUrl]);

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setAvatarUploading(true);
    setStatus(null);
    try {
      const uploadedAvatarUrl = await uploadAvatar(file);
      setAvatarUrl(uploadedAvatarUrl);
      setStatus('Avatar updated.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const basePayload = {
        full_name: form.full_name.trim(),
        avatar_url: avatarUrl.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim(),
        city: form.city.trim(),
        state_region: form.state_region.trim(),
        country: form.country.trim(),
        postal_code: form.postal_code.trim(),
      };
      const payload = applySocialLinksToPayload(basePayload, socialLinks);
      const data = await updateProfile(payload);
      setProfile(data);
      setForm(toForm(data));
      setSocialLinks(buildSocialLinksFromProfile(data));
      setAvatarUrl(data.avatar_url ?? '');
      setStatus('Profile saved.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileAppShell title="Profile">
      <section className="profile-panel">
        <h2 className="profile-heading">Edit Profile</h2>
        {loading ? (
          <div className="profile-loading">
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <div className="profile-page">
            <section className="profile-hero">
              {avatarPreview ? (
                <div className="profile-avatar-preview-wrap">
                  <img src={avatarPreview} alt="Profile avatar" className="profile-avatar-preview" />
                </div>
              ) : null}

              <div className="profile-avatar-actions">
                <input
                  ref={cameraInputRef}
                  className="profile-avatar-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleAvatarFile}
                />
                <input
                  ref={photosInputRef}
                  className="profile-avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                />
                <IonButton fill="outline" size="small" onClick={() => cameraInputRef.current?.click()} disabled={avatarUploading}>
                  Take Photo
                </IonButton>
                <IonButton fill="outline" size="small" onClick={() => photosInputRef.current?.click()} disabled={avatarUploading}>
                  Choose Photo
                </IonButton>
              </div>
            </section>

            <section className="profile-section">
              <h3>Contact</h3>
              <label className="profile-field-row">
                <span>Email</span>
                <IonInput className="profile-input profile-input-readonly" value={emailValue} readonly />
              </label>
              <label className="profile-field-row">
                <span>Full Name</span>
                <IonInput className="profile-input" value={form.full_name} onIonInput={(e) => handleChange('full_name', String(e.detail.value ?? ''))} />
              </label>
              <label className="profile-field-row">
                <span>Phone</span>
                <IonInput className="profile-input" value={form.phone} onIonInput={(e) => handleChange('phone', String(e.detail.value ?? ''))} />
              </label>
              <label className="profile-field-row">
                <span>Bio</span>
                <IonTextarea className="profile-input profile-textarea" value={form.bio} autoGrow onIonInput={(e) => handleChange('bio', String(e.detail.value ?? ''))} />
              </label>
            </section>

            <section className="profile-section">
              <h3>Address</h3>
              <label className="profile-field-row">
                <span>Address Line 1</span>
                <IonInput className="profile-input" value={form.address_line1} onIonInput={(e) => handleChange('address_line1', String(e.detail.value ?? ''))} />
              </label>
              <label className="profile-field-row">
                <span>Address Line 2</span>
                <IonInput className="profile-input" value={form.address_line2} onIonInput={(e) => handleChange('address_line2', String(e.detail.value ?? ''))} />
              </label>
              <label className="profile-field-row">
                <span>City</span>
                <IonInput className="profile-input" value={form.city} onIonInput={(e) => handleChange('city', String(e.detail.value ?? ''))} />
              </label>
              <label className="profile-field-row">
                <span>State / Region</span>
                <IonInput className="profile-input" value={form.state_region} onIonInput={(e) => handleChange('state_region', String(e.detail.value ?? ''))} />
              </label>
              <label className="profile-field-row">
                <span>Country</span>
                <IonInput className="profile-input" value={form.country} onIonInput={(e) => handleChange('country', String(e.detail.value ?? ''))} />
              </label>
              <label className="profile-field-row">
                <span>Postal Code</span>
                <IonInput className="profile-input" value={form.postal_code} onIonInput={(e) => handleChange('postal_code', String(e.detail.value ?? ''))} />
              </label>
            </section>

            <section className="profile-section">
              <h3>Social</h3>
              <SocialLinksEditor links={socialLinks} onChange={setSocialLinks} />
            </section>

            <IonButton expand="block" onClick={handleSave} disabled={saving || avatarUploading}>
              {saving || avatarUploading ? <IonSpinner name="crescent" /> : 'Save Profile'}
            </IonButton>

            {status ? (
              <IonText color={status === 'Profile saved.' ? 'success' : 'danger'}>
                <p>{status}</p>
              </IonText>
            ) : null}
          </div>
        )}
      </section>
    </MobileAppShell>
  );
}
