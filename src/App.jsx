import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // DataProvider is wrapped here to ensure it only initializes when authenticated
  return (
    <DataProvider>
      <Layout />
    </DataProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<Reports />} /> {/* Resumen/Informes como Home */}
            <Route path="transactions" element={<Transactions />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
