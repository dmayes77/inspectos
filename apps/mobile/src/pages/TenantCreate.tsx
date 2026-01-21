import { useEffect, useMemo, useState } from "react";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar
} from "@ionic/react";
import { supabase } from "../lib/supabaseClient";

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export default function TenantCreate() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.access_token ?? null);
    });

    const sub = supabase.auth.onAuthStateChange((_evt, session) => {
      setAccessToken(session?.access_token ?? null);
    });

    return () => sub.data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!slug && name) setSlug(slugify(name));
  }, [name, slug]);

  const canCreate = useMemo(() => {
    return !!accessToken && name.trim().length > 1 && /^[a-z0-9-]{3,40}$/.test(slug);
  }, [accessToken, name, slug]);

  async function createTenant() {
    if (!accessToken) {
      setStatus("Not signed in.");
      return;
    }

    setStatus("Creating tenant...");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

    const res = await fetch(`${baseUrl}/api/tenants/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({ name: name.trim(), slug: slug.trim().toLowerCase() })
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(json?.error ? `Error: ${json.error}` : `Error: ${res.status}`);
      return;
    }

    setStatus(`Tenant created ✅ slug=${json.tenant.slug}`);
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Create Tenant</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {!accessToken && (
          <IonText>
            <p style={{ marginBottom: 12 }}>Sign in first, then come back here.</p>
          </IonText>
        )}

        <IonItem>
          <IonLabel position="stacked">Company name</IonLabel>
          <IonInput value={name} onIonInput={(e: CustomEvent) => setName((e.detail.value as string) ?? "")} placeholder="Acme Home Inspections" />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Tenant slug</IonLabel>
          <IonInput value={slug} onIonInput={(e: CustomEvent) => setSlug((e.detail.value as string) ?? "")} placeholder="acme-home-inspections" />
        </IonItem>

        <IonButton expand="block" disabled={!canCreate} onClick={createTenant} style={{ marginTop: 16 }}>
          Create tenant
        </IonButton>

        {status && (
          <IonText>
            <p style={{ marginTop: 12 }}>{status}</p>
          </IonText>
        )}
      </IonContent>
    </IonPage>
  );
}
