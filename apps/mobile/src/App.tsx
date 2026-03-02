import { Redirect, Route, Switch } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonSpinner, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import People from './pages/People';
import Calendar from './pages/Calendar';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import './theme/variables.css';

setupIonicReact();

function AppRoutes() {
  const { user, tenant, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>
        <IonSpinner name="crescent" />
      </div>
    );
  }

  return (
    <IonRouterOutlet>
      <Switch>
        <Route exact path="/login">
          {user && tenant ? <Redirect to={`/t/${tenant.slug}/dashboard`} /> : <Login />}
        </Route>

        <Route exact path="/t/:tenantSlug/dashboard">
          {user && tenant ? <Dashboard /> : <Redirect to="/login" />}
        </Route>

        <Route exact path="/t/:tenantSlug/orders">
          {user && tenant ? <Orders /> : <Redirect to="/login" />}
        </Route>

        <Route exact path="/t/:tenantSlug/order/:orderId">
          {user && tenant ? <OrderDetail /> : <Redirect to="/login" />}
        </Route>

        <Route exact path="/t/:tenantSlug/profile">
          {user && tenant ? <Profile /> : <Redirect to="/login" />}
        </Route>

        <Route exact path="/t/:tenantSlug/settings">
          {user && tenant ? <Settings /> : <Redirect to="/login" />}
        </Route>

        <Route exact path="/t/:tenantSlug/people">
          {user && tenant ? <People /> : <Redirect to="/login" />}
        </Route>

        <Route exact path="/t/:tenantSlug/calendar">
          {user && tenant ? <Calendar /> : <Redirect to="/login" />}
        </Route>

        <Route exact path="/">
          {user && tenant ? <Redirect to={`/t/${tenant.slug}/dashboard`} /> : <Redirect to="/login" />}
        </Route>

        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </IonRouterOutlet>
  );
}

const App = () => (
  <IonApp>
    <ThemeProvider>
      <AuthProvider>
        <IonReactRouter>
          <AppRoutes />
        </IonReactRouter>
      </AuthProvider>
    </ThemeProvider>
  </IonApp>
);

export default App;
