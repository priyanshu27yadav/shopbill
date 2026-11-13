import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { OfflineProvider } from './context/OfflineContext';

import { AppLayout } from './components/Layout/AppLayout';
import { LoginScreen } from './components/Auth/LoginScreen';
import { RegisterScreen } from './components/Auth/RegisterScreen';
import { BillingScreen } from './components/Billing/BillingScreen';
import { DashboardScreen } from './components/Dashboard/DashboardScreen';
import { ProductList } from './components/Products/ProductList';
import { PriceListUploadScreen } from './components/PriceLists/PriceListUploadScreen';
import { CategoryManager } from './components/Categories/CategoryManager';
import { InvoiceHistory } from './components/Invoices/InvoiceHistory';
import { CustomerList } from './components/Customers/CustomerList';
import { ReportsScreen } from './components/Reports/ReportsScreen';
import { SettingsScreen } from './components/Settings/SettingsScreen';
import { SuperAdminScreen } from './components/SuperAdmin/SuperAdminScreen';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400 text-xs font-semibold">
        Loading ShopBill...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <OfflineProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} />

              {/* Protected App Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/billing" element={<BillingScreen />} />
                <Route path="/dashboard" element={<DashboardScreen />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/price-list-upload" element={<PriceListUploadScreen />} />
                <Route path="/categories" element={<CategoryManager />} />
                <Route path="/invoices" element={<InvoiceHistory />} />
                <Route path="/customers" element={<CustomerList />} />
                <Route path="/reports" element={<ReportsScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="/admin" element={<SuperAdminScreen />} />

                {/* Default route */}
                <Route path="/" element={<Navigate to="/billing" replace />} />
                <Route path="*" element={<Navigate to="/billing" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </OfflineProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
