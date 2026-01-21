import { Redirect, Route, Switch } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonSpinner, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import TenantCreate from './pages/TenantCreate';
import TenantSelect from './pages/TenantSelect';
import Dashboard from './pages/Dashboard';
import JobDetail from './pages/JobDetail';
import InspectionRunner from './pages/InspectionRunner';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

setupIonicReact();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isInitialized } = useAuth();

  if (!isInitialized || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <IonSpinner name="crescent" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

// Tenant-scoped route wrapper
function TenantRoute({ children }: { children: React.ReactNode }) {
  const { user, tenant, isLoading, isInitialized } = useAuth();

  if (!isInitialized || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <IonSpinner name="crescent" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!tenant) {
    return <Redirect to="/select-tenant" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <IonSpinner name="crescent" />
      </div>
    );
  }

  return (
    <IonRouterOutlet>
      <Switch>
        {/* Public routes */}
        <Route exact path="/login">
          {user ? <Redirect to="/select-tenant" /> : <Login />}
        </Route>

        {/* Protected routes (need auth) */}
        <Route exact path="/select-tenant">
          <ProtectedRoute>
            <TenantSelect />
          </ProtectedRoute>
        </Route>

        <Route exact path="/tenant/create">
          <ProtectedRoute>
            <TenantCreate />
          </ProtectedRoute>
        </Route>

        {/* Tenant-scoped routes */}
        <Route exact path="/t/:tenantSlug/dashboard">
          <TenantRoute>
            <Dashboard />
          </TenantRoute>
        </Route>

        <Route exact path="/t/:tenantSlug/job/:jobId">
          <TenantRoute>
            <JobDetail />
          </TenantRoute>
        </Route>

        <Route exact path="/t/:tenantSlug/inspection/:inspectionId">
          <TenantRoute>
            <InspectionRunner />
          </TenantRoute>
        </Route>

        {/* Default redirect */}
        <Route exact path="/">
          <Redirect to={user ? '/select-tenant' : '/login'} />
        </Route>

        {/* Catch all */}
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </IonRouterOutlet>
  );
}

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter>
        <AppRoutes />
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
);

export default App;
