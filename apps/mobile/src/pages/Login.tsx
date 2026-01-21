import { useMemo, useState } from "react";
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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");

  const canSignIn = useMemo(() => {
    if (!email.includes("@")) return false;
    if (mode === "reset") return true;
    return password.length >= 6;
  }, [email, password, mode]);

  const canSignUp = useMemo(() => {
    if (!email.includes("@")) return false;
    if (password.length < 6) return false;
    return password === confirmPassword;
  }, [email, password, confirmPassword]);

  async function signIn() {
    setStatus("Signing in...");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setStatus(error ? error.message : "Signed in.");
  }

  async function signUp() {
    setStatus("Creating account...");
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    setStatus(
      error
        ? error.message
        : "Account created. Check your email to confirm if required."
    );
  }

  async function resetPassword() {
    setStatus("Sending reset email...");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setStatus(error ? error.message : "Password reset email sent.");
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            InspectOS{" "}
            {mode === "signin" ? "Login" : mode === "signup" ? "Sign Up" : "Reset Password"}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Email</IonLabel>
          <IonInput
            value={email}
            onIonInput={(e: CustomEvent) => setEmail((e.detail.value as string) ?? "")}
            type="email"
            placeholder="you@domain.com"
          />
        </IonItem>

        {mode !== "reset" && (
          <IonItem>
            <IonLabel position="stacked">Password</IonLabel>
            <IonInput
              value={password}
              onIonInput={(e: CustomEvent) => setPassword((e.detail.value as string) ?? "")}
              type="password"
              placeholder="••••••••"
            />
          </IonItem>
        )}

        {mode === "signup" && (
          <IonItem>
            <IonLabel position="stacked">Confirm Password</IonLabel>
            <IonInput
              value={confirmPassword}
              onIonInput={(e: CustomEvent) =>
                setConfirmPassword((e.detail.value as string) ?? "")
              }
              type="password"
              placeholder="••••••••"
            />
          </IonItem>
        )}

        <IonButton
          expand="block"
          disabled={mode === "signup" ? !canSignUp : !canSignIn}
          onClick={
            mode === "signin" ? signIn : mode === "signup" ? signUp : resetPassword
          }
          style={{ marginTop: 16 }}
        >
          {mode === "signin"
            ? "Sign in"
            : mode === "signup"
            ? "Create account"
            : "Send reset email"}
        </IonButton>

        <IonButton
          expand="block"
          fill="clear"
          onClick={() => {
            setStatus("");
            setMode(mode === "signin" ? "signup" : "signin");
          }}
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </IonButton>

        <IonButton
          expand="block"
          fill="clear"
          onClick={() => {
            setStatus("");
            setMode(mode === "reset" ? "signin" : "reset");
          }}
        >
          {mode === "reset" ? "Back to sign in" : "Forgot password?"}
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
