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
    <header className="h-16 bg-white border-b border-[#eaecef] flex items-center justify-between px-6">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-[#1e2329]">
          {user?.role === 'admin' ? 'Admin Panel' : 'Member Dashboard'}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(user?.role === 'admin' ? '/admin/notifications' : '/member/notifications')}
          className="relative p-2 text-[#707a8a] hover:text-[#1e2329] transition-colors"
        >
          <BellIcon className="w-6 h-6" />
          {unreadNotifications > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-[#cf304a] rounded-full text-xs text-white flex items-center justify-center">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>

        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#f5f5f5] transition-colors">
            <div className="w-8 h-8 bg-[#f0b90b] rounded-full flex items-center justify-center">
              <span className="text-[#1e2329] font-medium text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-[#474d57] text-sm">{user?.name}</span>
          </Menu.Button>

          <Menu.Items className="absolute right-0 mt-2 w-48 bg-white border border-[#eaecef] rounded-lg shadow-lg py-1 z-50">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => navigate(user?.role === 'admin' ? '/admin/settings' : '/member/profile')}
                  className={`${
                    active ? 'bg-[#f5f5f5]' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-[#474d57]`}
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
                    active ? 'bg-[#f5f5f5]' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-[#cf304a]`}
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
