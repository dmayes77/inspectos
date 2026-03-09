import './login.css';
import { useState } from "react";
import { useHistory } from "react-router-dom";
import { IonButton, IonContent, IonIcon, IonInput, IonItem, IonLabel, IonPage, IonSpinner, IonText } from "@ionic/react";
import { eyeOffOutline, eyeOutline } from "ionicons/icons";
import { useAuth } from "../../contexts/AuthContext";
import { login, requestPasswordReset } from "../../services/api";

export default function Login() {
  const history = useHistory();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    setStatus("Signing in...");
    try {
      await login(email, password);
      await refreshSession();
      history.replace("/");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    if (!email.trim()) {
      setStatus("Enter your username/email first to reset password.");
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setStatus("Password reset email sent.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="login-shell">
          <div className="login-panel login-panel-auth">
            <div className="login-brand">
              <div className="login-brand-icon">IO</div>
              <span className="login-brand-text">InspectOS</span>
            </div>
            <h1 className="login-title">Log in</h1>

            <IonItem lines="none" className="login-field">
              <IonLabel position="stacked">Username</IonLabel>
              <IonInput type="email" value={email} onIonInput={(e) => setEmail(String(e.detail.value ?? ""))} />
            </IonItem>

            <IonItem lines="none" className="login-field">
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput type={showPassword ? "text" : "password"} value={password} onIonInput={(e) => setPassword(String(e.detail.value ?? ""))}>
                <IonButton slot="end" fill="clear" onClick={() => setShowPassword((v) => !v)}>
                  <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                </IonButton>
              </IonInput>
            </IonItem>

            <IonButton expand="block" className="login-action-primary" onClick={signIn} disabled={loading || !email || !password}>
              {loading ? <IonSpinner name="crescent" /> : "LOG IN"}
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              color="medium"
              className="login-action-secondary"
              onClick={() => setStatus("Biometric login will be available after first successful login.")}
            >
              ENABLE BIOMETRIC LOGIN
            </IonButton>

            <button type="button" className="login-link-btn" onClick={() => void onForgotPassword()}>
              Forgot Password?
            </button>
            <p className="login-note">Sign up is not available in the mobile app.</p>

            {status ? (
              <IonText color="medium">
                <p className="login-status">{status}</p>
              </IonText>
            ) : null}
          </div>
          <p className="login-legal-fixed">By clicking LOG IN, you agree to our Terms of Service and acknowledge our Privacy Policy.</p>
        </div>
      </IonContent>
    </IonPage>
  );
}
