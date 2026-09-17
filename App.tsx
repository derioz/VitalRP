import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { Home } from './spa/pages/Home';
import { Merch } from './spa/pages/Merch';
import { AdminLayout } from './spa/pages/admin/AdminLayout';
import { Dashboard } from './spa/pages/admin/Dashboard';
import { StaffRoster } from './spa/pages/admin/StaffRoster';
import { UsersPage } from './spa/pages/admin/Users';
import { GalleryManager } from './spa/pages/admin/GalleryManager';
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
            <Route path="staff" element={<StaffRoster />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="gallery" element={<GalleryManager />} />
            <Route path="settings" element={<Settings />} />
            {/* Add more admin routes here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;