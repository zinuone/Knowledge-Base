import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import DetailPage from './src/pages/DetailPage';
import LoginPage from './src/pages/LoginPage';

// --- TAMBAHAN PENTING (Biar Admin Jalan) ---
import AdminDashboard from './src/pages/AdminDashboard';
import ProtectedRoute from './src/components/ProtectedRoute';

import CategoryPage from './src/pages/CategoryPage';

// import './index.css'; // Biarkan dikomen kalau file css tidak ada

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Halaman Utama (Public) */}
        <Route path="/" element={<App />} />

        {/* Halaman Detail (Public) */}
        <Route path="/detail/:id" element={<DetailPage />} />

        {/* Halaman Login (Public) */}
        <Route path="/login" element={<LoginPage />} />

        <Route path="/category/:categoryId" element={<CategoryPage />} />

        {/* --- INI YANG TADINYA HILANG --- */}
        {/* Halaman Admin (Dilindungi Satpam/ProtectedRoute) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);