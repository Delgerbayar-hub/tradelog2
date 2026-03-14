// src/App.tsx
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useFirestore } from './hooks/useFirestore';

import TradesPage from './pages/TradesPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';

type Page = 'dashboard' | 'trades' | 'profile';

export default function App() {
  const { user, loading: loadingAuth, logout } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [openModal, setOpenModal] = useState(false);

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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col py-6 px-4 fixed h-full z-10">
        {/* Logo */}
        <div className="mb-8 px-2">
          <span className="text-white font-bold text-lg tracking-tight">Trade</span>
          <span className="text-cyan-400 font-bold text-lg">Log</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {([
            { id: 'dashboard', label: 'Dashboard', icon: '▦' },
            { id: 'trades',    label: 'Trades',    icon: '≡' },
          ] as { id: Page; label: string; icon: string }[]).map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                page === item.id
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User + Profile + Logout */}
        <div className="border-t border-gray-800 pt-4 space-y-1">
          <button
            onClick={() => setPage('profile')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all ${
              page === 'profile'
                ? 'bg-cyan-500/10 border border-cyan-500/20'
                : 'hover:bg-gray-800'
            }`}
          >
            {user.photoURL ? (
              <img src={user.photoURL} className="w-6 h-6 rounded-full shrink-0" alt="avatar" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold shrink-0">
                {user.displayName?.[0] ?? user.email?.[0] ?? '?'}
              </div>
            )}
            <p className={`text-xs truncate ${page === 'profile' ? 'text-cyan-400' : 'text-gray-400'}`}>
              {user.displayName || user.email}
            </p>
          </button>
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-all"
          >
            Гарах
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 min-h-screen overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full py-32">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : page === 'dashboard' ? (
          <DashboardPage trades={trades} onAdd={() => { setPage('trades'); setOpenModal(true); }} />
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
