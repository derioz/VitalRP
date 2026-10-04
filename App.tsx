import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { Home } from './spa/pages/Home';
import { Merch } from './spa/pages/Merch';
import { MerchProduct } from './spa/pages/MerchProduct';
import { MerchPolicies } from './spa/pages/MerchPolicies';
import { MerchOrders } from './spa/pages/MerchOrders';
import { RulesPage } from './spa/pages/RulesPage';
import { AdminLayout } from './spa/pages/admin/AdminLayout';
import { Dashboard } from './spa/pages/admin/Dashboard';
import { UsersPage } from './spa/pages/admin/Users';
import { Settings } from './spa/pages/admin/Settings';
import { RulesManagerPage } from './spa/pages/admin/RulesManager';
import { StaffManagerPage } from './spa/pages/admin/StaffManager';
import { RolePermissionsPage } from './spa/pages/admin/RolePermissionsManager';
import { AuditLogsPage } from './spa/pages/admin/AuditLogs';
import { MerchManagerPage } from './spa/pages/admin/MerchManager';
import { AuthCallback } from './spa/pages/AuthCallback';
import { WikiHome } from './spa/pages/wiki/WikiHome';
import { WikiCharacters } from './spa/pages/wiki/WikiCharacters';
import { WikiCharacterDetail } from './spa/pages/wiki/WikiCharacterDetail';
import { WikiCharacterEdit } from './spa/pages/wiki/WikiCharacterEdit';
import { WikiCharacterNew } from './spa/pages/wiki/WikiCharacterNew';
import { WikiCharacterBacklinks } from './spa/pages/wiki/WikiCharacterBacklinks';
import { WikiCharacterHistory } from './spa/pages/wiki/WikiCharacterHistory';
import { WikiCategory } from './spa/pages/wiki/WikiCategory';
import { WikiAdmin } from './spa/pages/wiki/WikiAdmin';
import { WikiWantedView } from './components/wiki/WikiWantedView';
import { WikiEntityDirectory } from './components/wiki/WikiEntityDirectory';
import { WikiEntityView } from './components/wiki/WikiEntityView';
import { WikiEntityRoute } from './spa/pages/wiki/WikiEntityRoute';

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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rules" element={<RulesPage />} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
