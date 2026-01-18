import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import {
  HomeIcon,
  UsersIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  LinkIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  BellIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Members', href: '/admin/members', icon: UsersIcon },
  { name: 'Top-Up Requests', href: '/admin/topup-requests', icon: ArrowUpTrayIcon },
  { name: 'Withdrawals', href: '/admin/withdrawal-requests', icon: ArrowDownTrayIcon },
  { name: 'Invitation Links', href: '/admin/invitation-links', icon: LinkIcon },
  { name: 'User Management', href: '/admin/users', icon: UsersIcon },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ClipboardDocumentListIcon },
  { name: 'Notifications', href: '/admin/notifications', icon: BellIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
];

const memberNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/member/dashboard', icon: HomeIcon },
  { name: 'Investments', href: '/member/investments', icon: CurrencyDollarIcon },
  { name: 'Top-Up', href: '/member/topup', icon: ArrowUpTrayIcon },
  { name: 'Withdraw', href: '/member/withdraw', icon: ArrowDownTrayIcon },
  { name: 'Notifications', href: '/member/notifications', icon: BellIcon },
  { name: 'Profile', href: '/member/profile', icon: UserCircleIcon },
];

const Sidebar = () => {
  const { user } = useAuthStore();
  const navItems = user?.role === 'admin' ? adminNavItems : memberNavItems;

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#eaecef]">
      <div className="flex flex-col h-full">
        <div className="flex items-center h-16 px-6 border-b border-[#eaecef]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#f0b90b] rounded-lg flex items-center justify-center">
              <span className="text-[#1e2329] font-bold text-sm">ZX</span>
            </div>
            <span className="text-xl font-bold text-[#1e2329]">ZenithX</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  'flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-[#fef6d8] text-[#1e2329] border border-[#f0b90b]/30'
                    : 'text-[#707a8a] hover:text-[#1e2329] hover:bg-[#f5f5f5]'
                )
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#eaecef]">
          <div className="flex items-center px-4 py-3 bg-[#f5f5f5] rounded-lg">
            <div className="w-10 h-10 bg-[#f0b90b] rounded-full flex items-center justify-center">
              <span className="text-[#1e2329] font-medium text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[#1e2329]">{user?.name}</p>
              <p className="text-xs text-[#707a8a] capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
