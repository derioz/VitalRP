import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { Home } from './spa/pages/Home';
import { Merch } from './spa/pages/Merch';
import { AdminLayout } from './spa/pages/admin/AdminLayout';
import { Dashboard } from './spa/pages/admin/Dashboard';
import { UsersPage } from './spa/pages/admin/Users';
import { Settings } from './spa/pages/admin/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/merch" element={<Merch />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<Settings />} />
            {/* Add more admin routes here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;