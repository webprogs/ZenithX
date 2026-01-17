import { useNavigate } from 'react-router-dom';
import { Menu } from '@headlessui/react';
import {
  BellIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout, unreadNotifications } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-[#12121a] border-b border-[#2d2d3a] flex items-center justify-between px-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-white">
          {user?.role === 'admin' ? 'Admin Panel' : 'Member Dashboard'}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(user?.role === 'admin' ? '/admin/audit-logs' : '/member/notifications')}
          className="relative p-2 text-gray-400 hover:text-white transition-colors"
        >
          <BellIcon className="w-6 h-6" />
          {unreadNotifications > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>

        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#1a1a24] transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-gray-300 text-sm">{user?.name}</span>
          </Menu.Button>

          <Menu.Items className="absolute right-0 mt-2 w-48 bg-[#1a1a24] border border-[#2d2d3a] rounded-lg shadow-lg py-1 z-50">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => navigate(user?.role === 'admin' ? '/admin/settings' : '/member/profile')}
                  className={`${
                    active ? 'bg-[#1e1e28]' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-gray-300`}
                >
                  <UserCircleIcon className="w-5 h-5 mr-2" />
                  {user?.role === 'admin' ? 'Settings' : 'Profile'}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`${
                    active ? 'bg-[#1e1e28]' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-red-400`}
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                  Logout
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Menu>
      </div>
    </header>
  );
};

export default Header;
