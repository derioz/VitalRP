import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { Home } from './spa/pages/Home';

// Every page but the homepage is loaded when it is first visited
const Merch = lazy(() => import('./spa/pages/Merch').then((m) => ({ default: m.Merch })));
const MerchProduct = lazy(() => import('./spa/pages/MerchProduct').then((m) => ({ default: m.MerchProduct })));
const MerchPolicies = lazy(() => import('./spa/pages/MerchPolicies').then((m) => ({ default: m.MerchPolicies })));
const MerchOrders = lazy(() => import('./spa/pages/MerchOrders').then((m) => ({ default: m.MerchOrders })));
const RulesPage = lazy(() => import('./spa/pages/RulesPage').then((m) => ({ default: m.RulesPage })));
const Gta6 = lazy(() => import('./spa/pages/Gta6').then((m) => ({ default: m.Gta6 })));
const AdminLayout = lazy(() => import('./spa/pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const Dashboard = lazy(() => import('./spa/pages/admin/Dashboard').then((m) => ({ default: m.Dashboard })));
const UsersPage = lazy(() => import('./spa/pages/admin/Users').then((m) => ({ default: m.UsersPage })));
const Settings = lazy(() => import('./spa/pages/admin/Settings').then((m) => ({ default: m.Settings })));
const RulesManagerPage = lazy(() => import('./spa/pages/admin/RulesManager').then((m) => ({ default: m.RulesManagerPage })));
const StaffManagerPage = lazy(() => import('./spa/pages/admin/StaffManager').then((m) => ({ default: m.StaffManagerPage })));
const RolePermissionsPage = lazy(() => import('./spa/pages/admin/RolePermissionsManager').then((m) => ({ default: m.RolePermissionsPage })));
const AuditLogsPage = lazy(() => import('./spa/pages/admin/AuditLogs').then((m) => ({ default: m.AuditLogsPage })));
const MerchManagerPage = lazy(() => import('./spa/pages/admin/MerchManager').then((m) => ({ default: m.MerchManagerPage })));
const AuthCallback = lazy(() => import('./spa/pages/AuthCallback').then((m) => ({ default: m.AuthCallback })));
const WikiHome = lazy(() => import('./spa/pages/wiki/WikiHome').then((m) => ({ default: m.WikiHome })));
const WikiCharacters = lazy(() => import('./spa/pages/wiki/WikiCharacters').then((m) => ({ default: m.WikiCharacters })));
const WikiCharacterDetail = lazy(() => import('./spa/pages/wiki/WikiCharacterDetail').then((m) => ({ default: m.WikiCharacterDetail })));
const WikiCharacterEdit = lazy(() => import('./spa/pages/wiki/WikiCharacterEdit').then((m) => ({ default: m.WikiCharacterEdit })));
const WikiCharacterNew = lazy(() => import('./spa/pages/wiki/WikiCharacterNew').then((m) => ({ default: m.WikiCharacterNew })));
const WikiCharacterBacklinks = lazy(() => import('./spa/pages/wiki/WikiCharacterBacklinks').then((m) => ({ default: m.WikiCharacterBacklinks })));
const WikiCharacterHistory = lazy(() => import('./spa/pages/wiki/WikiCharacterHistory').then((m) => ({ default: m.WikiCharacterHistory })));
const WikiCategory = lazy(() => import('./spa/pages/wiki/WikiCategory').then((m) => ({ default: m.WikiCategory })));
const WikiAdmin = lazy(() => import('./spa/pages/wiki/WikiAdmin').then((m) => ({ default: m.WikiAdmin })));
const WikiWantedView = lazy(() => import('./components/wiki/WikiWantedView').then((m) => ({ default: m.WikiWantedView })));
const WikiEntityDirectory = lazy(() => import('./components/wiki/WikiEntityDirectory').then((m) => ({ default: m.WikiEntityDirectory })));
const WikiEntityView = lazy(() => import('./components/wiki/WikiEntityView').then((m) => ({ default: m.WikiEntityView })));
const WikiEntityRoute = lazy(() => import('./spa/pages/wiki/WikiEntityRoute').then((m) => ({ default: m.WikiEntityRoute })));

function PageLoading() {
  return (
    <p role="status" className="flex min-h-screen items-center justify-center bg-dark-950 text-sm text-gray-300">
      Loading...
    </p>
  );
}

function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTopOnNavigate />
        <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/gta6" element={<Gta6 />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/merch/policies" element={<MerchPolicies />} />
          <Route path="/merch/orders" element={<MerchOrders />} />
          <Route path="/merch/order/:orderId" element={<MerchOrders />} />
          <Route path="/merch/:slug" element={<MerchProduct />} />

          {/* Wiki Routes */}
          <Route path="/wiki" element={<WikiHome />} />
          <Route path="/wiki/characters" element={<WikiCharacters />} />
          <Route path="/wiki/characters/new" element={<WikiCharacterNew />} />
          <Route path="/wiki/characters/:slug" element={<WikiCharacterDetail />} />
          <Route path="/wiki/characters/:slug/edit" element={<WikiCharacterEdit />} />
          <Route path="/wiki/characters/:slug/backlinks" element={<WikiCharacterBacklinks />} />
          <Route path="/wiki/characters/:slug/history" element={<WikiCharacterHistory />} />
          <Route path="/wiki/categories/:slug" element={<WikiCategory />} />
          <Route path="/wiki/admin" element={<WikiAdmin />} />
          <Route path="/wiki/wanted" element={<WikiWantedView />} />
          <Route path="/wiki/entities" element={<WikiEntityDirectory />} />
          <Route path="/wiki/entities/new" element={<WikiEntityView creating />} />
          <Route path="/wiki/:collection/:id" element={<WikiEntityRoute />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="rules" element={<RulesManagerPage />} />
            <Route path="staff" element={<StaffManagerPage />} />
            <Route path="permissions" element={<RolePermissionsPage />} />
            <Route path="audit" element={<AuditLogsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="merch" element={<MerchManagerPage />} />
            <Route path="wiki" element={<WikiAdmin />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
