// File: index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async'; // <-- TAMBAHAN INI

import App from './App';
import DetailPage from './src/pages/DetailPage';
import LoginPage from './src/pages/LoginPage';
import AdminDashboard from './src/pages/AdminDashboard';
import ProtectedRoute from './src/components/ProtectedRoute';
import CategoryPage from './src/pages/CategoryPage';
import BookmarksPage from './src/pages/BookmarksPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider> {/* <-- BUNGKUSAN HELMET PROVIDER DI SINI */}
      <BrowserRouter>
        <Routes>
          {/* Halaman Utama (Public) */}
          <Route path="/" element={<App />} />

          {/* Halaman Detail (Public) */}
          <Route path="/detail/:id" element={<DetailPage />} />

          {/* Halaman Login (Public) */}
          <Route path="/login" element={<LoginPage />} />

          {/* Halaman Kategori */}
          <Route path="/category/:categoryId" element={<CategoryPage />} />

          {/* Halaman Favorit */}
          <Route path="/bookmarks" element={<BookmarksPage />} />

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
    </HelmetProvider>
  </React.StrictMode>
);