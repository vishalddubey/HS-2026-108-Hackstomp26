'use client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Activity, Bell, LogOut, Wifi, WifiOff } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/symptoms', label: 'Check', icon: Activity },
  { href: '/referral', label: 'Referrals', icon: Bell },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-gray-50 relative">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="offline-banner">
          <WifiOff size={14} />
          <span>Offline Mode — Data saved locally, will sync when connected</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <div>
            <p className="font-bold text-green-800 text-sm leading-tight font-display">GramHealth AI</p>
            {user && <p className="text-xs text-gray-500">{user.name}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isOnline
            ? <span title="Online" className="text-green-500"><Wifi size={18} /></span>
            : <span title="Offline" className="text-amber-500"><WifiOff size={18} /></span>
          }
          <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-around z-50 safe-bottom shadow-lg">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={isActive ? 'nav-item-active' : 'nav-item'}>
              <Icon size={22} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
