import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { Home } from './spa/pages/Home';
import { Merch } from './spa/pages/Merch';
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
import { AuthCallback } from './spa/pages/AuthCallback';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/merch/policies" element={<MerchPolicies />} />
          <Route path="/merch/orders" element={<MerchOrders />} />
          <Route path="/merch/order/:orderId" element={<MerchOrders />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="rules" element={<RulesManagerPage />} />
            <Route path="staff" element={<StaffManagerPage />} />
            <Route path="permissions" element={<RolePermissionsPage />} />
            <Route path="audit" element={<AuditLogsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;