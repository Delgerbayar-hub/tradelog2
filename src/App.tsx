// src/App.tsx
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useFirestore } from './hooks/useFirestore';
import { LayoutDashboard, List, Calendar, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

import TradesPage from './pages/TradesPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';

type Page = 'dashboard' | 'trades' | 'calendar' | 'profile';

const NAV_ITEMS = [
  { id: 'dashboard' as Page, label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'trades'    as Page, label: 'Trades',    Icon: List },
  { id: 'calendar'  as Page, label: 'Calendar',  Icon: Calendar },
];

export default function App() {
  const { user, loading: loadingAuth, logout } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [openModal, setOpenModal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const {
    trades,
    loading,
    userSettings,
    addTrade,
    updateTrade,
    deleteTrade,
    updateUserSettings,
  } = useFirestore(user?.uid ?? null);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const sideW = collapsed ? 'w-[60px]' : 'w-56';
  const mainML = collapsed ? 'ml-[60px]' : 'ml-56';

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className={`${sideW} bg-bg2 border-r border-border flex flex-col py-5 fixed h-full z-10 transition-all duration-200 overflow-hidden`}>

        {/* Logo + collapse toggle */}
        <div className="flex items-center justify-between px-3 mb-7">
          {!collapsed && (
            <div className="px-1">
              <span className="text-white font-bold text-lg tracking-tight">Trade</span>
              <span className="text-accent font-bold text-lg">Log</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className={`w-7 h-7 rounded-lg bg-bg3 border border-border flex items-center justify-center text-muted hover:text-zinc-200 transition-colors shrink-0 ${collapsed ? 'mx-auto' : ''}`}
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1 px-2">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setPage(id)}
              title={collapsed ? label : undefined}
              className={`nav-item w-full text-left ${page === id ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          ))}
        </nav>

        {/* Bottom: profile + logout */}
        <div className="border-t border-border pt-3 px-2 space-y-0.5">
          <button
            onClick={() => setPage('profile')}
            title={collapsed ? (user.displayName || user.email || 'Profile') : undefined}
            className={`nav-item w-full text-left ${page === 'profile' ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
          >
            {user.photoURL ? (
              <img src={user.photoURL} className="w-5 h-5 rounded-full shrink-0" alt="avatar" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-bold shrink-0">
                {user.displayName?.[0] ?? user.email?.[0] ?? '?'}
              </div>
            )}
            {!collapsed && <p className="text-xs truncate">{user.displayName || user.email}</p>}
          </button>

          <button
            onClick={logout}
            title={collapsed ? 'Гарах' : undefined}
            className={`nav-item w-full text-left hover:text-red-400 ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut size={15} className="shrink-0" />
            {!collapsed && <span>Гарах</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 ${mainML} min-h-screen overflow-y-auto transition-all duration-200`}>
        {loading ? (
          <div className="flex items-center justify-center h-full py-32">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : page === 'dashboard' ? (
          <DashboardPage trades={trades} userSettings={userSettings} onAdd={() => { setPage('trades'); setOpenModal(true); }} />
        ) : page === 'trades' ? (
          <TradesPage
            trades={trades}
            onAdd={addTrade}
            onUpdate={updateTrade}
            onDelete={deleteTrade}
            userSettings={userSettings}
            openModal={openModal}
            onModalClose={() => setOpenModal(false)}
          />
        ) : page === 'calendar' ? (
          <CalendarPage trades={trades} onAdd={() => { setPage('trades'); setOpenModal(true); }} userSettings={userSettings} />
        ) : (
          <ProfilePage
            user={user}
            userSettings={userSettings}
            trades={trades}
            onUpdateSettings={updateUserSettings}
          />
        )}
      </main>
    </div>
  );
}
