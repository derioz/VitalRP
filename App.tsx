import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { Home } from './src/pages/Home';
import { AdminLayout } from './src/pages/admin/AdminLayout';
import { Dashboard } from './src/pages/admin/Dashboard';
import { StaffRoster } from './src/pages/admin/StaffRoster';
import { UsersPage } from './src/pages/admin/Users';
import { GalleryManager } from './src/pages/admin/GalleryManager';
import { Settings } from './src/pages/admin/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

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