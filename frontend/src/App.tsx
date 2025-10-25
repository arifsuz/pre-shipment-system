// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ShipmentList } from './pages/shipments/ShipmenList';
import { ShipmentForm } from './pages/shipments/ShipmenForm';
import { ShipmentDetail } from './pages/shipments/ShipmentDetail';
import { CompaniesList } from './pages/companies/CompaniesList';
import { CompanyForm } from './pages/companies/CompanyForm';
import { UsersList } from './pages/users/UsersList';
import { UserForm } from './pages/users/UserForm';
import { MemoPage } from './pages/shipments/MemoPage';
import { MemoList } from './pages/shipments/MemoList';
import { MemoDetail } from './pages/shipments/MemoDetail';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return !user ? <>{children}</> : <Navigate to="/" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipments"
        element={
          <ProtectedRoute>
            <ShipmentList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipments/create"
        element={
          <ProtectedRoute>
            <ShipmentForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipments/:id/edit"
        element={
          <ProtectedRoute>
            <ShipmentForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipments/:id"
        element={
          <ProtectedRoute>
            <ShipmentDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shipments/:id/memo"
        element={
          <ProtectedRoute>
            <MemoPage />
          </ProtectedRoute>
        }
      />
      {/* read-only memo detail */}
      <Route
        path="/shipments/:id/memo/view"
        element={
          <ProtectedRoute>
            <MemoDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/companies"
        element={
          <ProtectedRoute>
            <CompaniesList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/companies/create"
        element={
          <ProtectedRoute>
            <CompanyForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/companies/:id/edit"
        element={
          <ProtectedRoute>
            <CompanyForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UsersList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/create"
        element={
          <ProtectedRoute>
            <UserForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:id/edit"
        element={
          <ProtectedRoute>
            <UserForm />
          </ProtectedRoute>
        }
      />
      <Route path="/shipments/memos" element={<MemoList />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;