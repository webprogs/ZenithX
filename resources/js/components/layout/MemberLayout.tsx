import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '@/stores/authStore';

// Declare Tawk_API type for TypeScript
declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: Date;
  }
}

const MemberLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  // Load Tawk.to chat widget for members only
  useEffect(() => {
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Set visitor info before script loads
    window.Tawk_API.visitor = {
      name: user?.name || 'Member',
      email: user?.email || '',
    };

    // Set attributes when Tawk loads
    window.Tawk_API.onLoad = function () {
      window.Tawk_API.setAttributes(
        {
          name: user?.name || 'Member',
          email: user?.email || '',
        },
        function (error: any) {
          if (error) {
            console.error('Tawk.to setAttributes error:', error);
          }
        }
      );
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://embed.tawk.to/6976c29fba77e8198a86620c/1jfrugghi';
    script.setAttribute('crossorigin', '*');
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script and Tawk widget when leaving member pages
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Hide the Tawk widget if it exists
      if (window.Tawk_API?.hideWidget) {
        window.Tawk_API.hideWidget();
      }
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MemberLayout;
