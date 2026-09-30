import { useState } from 'react';
import { LoginForm } from './components/LoginForm.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { ComandasPage } from './modules/kds/ComandasPage.jsx';
import { ConsolesPage } from './modules/consoles/ConsolesPage.jsx';
import { AdminPage } from './modules/admin/AdminPage.jsx';
import { ExpensesPage } from './modules/expenses/ExpensesPage.jsx';
import { POSPage } from './modules/pos/POSPage.jsx';
import { clearAccessToken, getAccessToken } from './services/api.js';

export default function App() {
  const [activeView, setActiveView] = useState('nuevo-pedido');
  const [authenticated, setAuthenticated] = useState(Boolean(getAccessToken()));

  function logout() {
    clearAccessToken();
    setAuthenticated(false);
  }

  if (!authenticated) return <LoginForm onAuthenticated={() => setAuthenticated(true)} />;

  const views = {
    'nuevo-pedido': <POSPage />,
    comandas: <ComandasPage />,
    rentas: <ConsolesPage onLogout={logout} />,
    gastos: <ExpensesPage />,
    admin: <AdminPage onLogout={logout} />
  };

  return <div className="min-h-screen bg-brand-light text-brand-dark md:flex">
    <Sidebar activeView={activeView} onChange={setActiveView} />
    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">{views[activeView]}</main>
  </div>;
}
