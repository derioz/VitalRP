import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { Home } from './spa/pages/Home';
import { Merch } from './spa/pages/Merch';
import { RulesPage } from './spa/pages/RulesPage';
import { AdminLayout } from './spa/pages/admin/AdminLayout';
import { Dashboard } from './spa/pages/admin/Dashboard';
import { UsersPage } from './spa/pages/admin/Users';
import { Settings } from './spa/pages/admin/Settings';
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

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<Settings />} />
            {/* Add more admin routes here */}
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;