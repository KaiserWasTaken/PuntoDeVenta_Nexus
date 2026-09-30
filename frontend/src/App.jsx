import { useState } from 'react';
import { LoginForm } from './components/LoginForm.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { CatalogAdminPage } from './modules/catalog/CatalogAdminPage.jsx';
import { ConsolesPage } from './modules/consoles/ConsolesPage.jsx';
import { DashboardPage } from './modules/dashboard/DashboardPage.jsx';
import { InventoryPage } from './modules/inventory/InventoryPage.jsx';
import { KDSPage } from './modules/kds/KDSPage.jsx';
import { OrdersHistoryPage } from './modules/orders/OrdersHistoryPage.jsx';
import { POSPage } from './modules/pos/POSPage.jsx';
import { MonitorPage } from './modules/reports/MonitorPage.jsx';
import { ExpensesPage } from './modules/expenses/ExpensesPage.jsx';
import { AdminPage } from './modules/admin/AdminPage.jsx';
import { clearAccessToken, getAccessToken } from './services/api.js';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [authenticated, setAuthenticated] = useState(Boolean(getAccessToken()));

  function logout() {
    clearAccessToken();
    setAuthenticated(false);
  }

  if (!authenticated) return <LoginForm onAuthenticated={() => setAuthenticated(true)} />;

  const views = {
    dashboard: <DashboardPage />,
    rentas: <ConsolesPage onLogout={logout} />,
    monitor: <MonitorPage />,
    cafeteria: <POSPage />,
    kds: <KDSPage />,
    inventario: <InventoryPage />,
    catalogo: <CatalogAdminPage />,
    ordenes: <OrdersHistoryPage />,
    gastos: <ExpensesPage />,
    admin: <AdminPage onNavigate={setActiveView} />
  };

  return <div className="min-h-screen bg-brand-light text-brand-dark md:flex">
    <Sidebar activeView={activeView} onChange={setActiveView} />
    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">{views[activeView]}</main>
  </div>;
}
