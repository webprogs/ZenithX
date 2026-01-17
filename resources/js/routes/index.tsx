import { Routes, Route, Navigate } from 'react-router-dom';

// Guards
import AuthGuard from './guards/AuthGuard';
import AdminGuard from './guards/AdminGuard';
import GuestGuard from './guards/GuestGuard';

// Layouts
import AdminLayout from '@/components/layout/AdminLayout';
import MemberLayout from '@/components/layout/MemberLayout';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';
import Members from '@/pages/admin/Members';
import MemberDetails from '@/pages/admin/MemberDetails';
import TopupRequests from '@/pages/admin/TopupRequests';
import WithdrawalRequests from '@/pages/admin/WithdrawalRequests';
import InvitationLinks from '@/pages/admin/InvitationLinks';
import UserManagement from '@/pages/admin/UserManagement';
import AuditLogs from '@/pages/admin/AuditLogs';
import Settings from '@/pages/admin/Settings';

// Member Pages
import MemberDashboard from '@/pages/member/Dashboard';
import Investments from '@/pages/member/Investments';
import TopupHistory from '@/pages/member/TopupHistory';
import NewTopup from '@/pages/member/NewTopup';
import WithdrawalHistory from '@/pages/member/WithdrawalHistory';
import NewWithdrawal from '@/pages/member/NewWithdrawal';
import Notifications from '@/pages/member/Notifications';
import Profile from '@/pages/member/Profile';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <GuestGuard>
            <Login />
          </GuestGuard>
        }
      />
      <Route
        path="/register/:code"
        element={
          <GuestGuard>
            <Register />
          </GuestGuard>
        }
      />
      <Route
        path="/register"
        element={
          <GuestGuard>
            <Register />
          </GuestGuard>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="members/:id" element={<MemberDetails />} />
        <Route path="topup-requests" element={<TopupRequests />} />
        <Route path="withdrawal-requests" element={<WithdrawalRequests />} />
        <Route path="invitation-links" element={<InvitationLinks />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Member Routes */}
      <Route
        path="/member"
        element={
          <AuthGuard>
            <MemberLayout />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<MemberDashboard />} />
        <Route path="investments" element={<Investments />} />
        <Route path="topup" element={<TopupHistory />} />
        <Route path="topup/new" element={<NewTopup />} />
        <Route path="withdraw" element={<WithdrawalHistory />} />
        <Route path="withdraw/new" element={<NewWithdrawal />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
