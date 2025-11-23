import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FileCheck,
  LayoutDashboard,
  FileText,
  CheckSquare,
  FolderOpen,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Clock,
  Phone,
  Link as LinkIcon,
  Upload,
  Activity,
  Zap,
  ClipboardCheck,
  Building,
  ScrollText,
  FileStack,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isAdmin = profile?.role && ['super_admin', 'admin', 'manager', 'team_member'].includes(profile.role);
  const isSuperAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';

  const clientNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Requests', href: '/my-requests', icon: FileCheck },
    { name: 'My Documents', href: '/my-documents', icon: FolderOpen },
    { name: 'Tasks', href: '/my-tasks', icon: CheckSquare },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  // Admin/Team Core Modules
  const adminCoreNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Templates', href: '/templates', icon: FileText },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Requests', href: '/requests', icon: FileCheck },
    { name: 'Documents', href: '/documents', icon: FolderOpen },
    { name: 'Approvals', href: '/approvals', icon: ClipboardCheck },
    { name: 'Clients', href: '/clients', icon: Users },
  ];

  // Admin/Team Automation Modules
  const adminAutomationNavigation = [
    { name: 'Reminders', href: '/reminders', icon: Clock },
    { name: 'Voice Calls', href: '/voice-calls', icon: Phone },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  // System/Integration Modules (Super Admin only)
  const systemNavigation = [
    { name: 'Integrations', href: '/integrations', icon: Zap },
    { name: 'Webhooks', href: '/webhooks', icon: LinkIcon },
    { name: 'AI Verification', href: '/ai-verification', icon: ShieldCheck },
    { name: 'Upload Sessions', href: '/upload-sessions', icon: Upload },
    { name: 'Shareable Links', href: '/shareable-links', icon: LinkIcon },
    { name: 'Document Matches', href: '/document-matches', icon: FileStack },
  ];

  // System Management (Super Admin only)
  const systemManagementNavigation = [
    { name: 'Users Management', href: '/users', icon: Users },
    { name: 'Organizations', href: '/organizations', icon: Building },
    { name: 'Audit Trail', href: '/audit-trail', icon: ScrollText },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900">FollowUp AI</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-200 lg:transform-none flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center space-x-2 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">FollowUp AI</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 pb-4 space-y-1">
            {/* Client Navigation */}
            {!isAdmin && (
              <>
                {clientNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </>
            )}

            {/* Admin Core Modules */}
            {isAdmin && (
              <>
                {adminCoreNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}

                {/* Automation Section */}
                {adminAutomationNavigation.length > 0 && (
                  <div className="pt-4 mt-4 border-t border-slate-200">
                    <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Automation
                    </p>
                  </div>
                )}
                {adminAutomationNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}

                {/* System/Integration Section (Super Admin) */}
                {isSuperAdmin && systemNavigation.length > 0 && (
                  <>
                    <div className="pt-4 mt-4 border-t border-slate-200">
                      <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Integrations
                      </p>
                    </div>
                    {systemNavigation.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      );
                    })}

                    {/* System Management Section */}
                    {systemManagementNavigation.length > 0 && (
                      <div className="pt-4 mt-4 border-t border-slate-200">
                        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                          System
                        </p>
                      </div>
                    )}
                    {systemManagementNavigation.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      );
                    })}
                  </>
                )}
              </>
            )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-200 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
              <span className="text-sm font-medium text-slate-700">
                {profile?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{profile?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 w-full px-4 py-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="bg-white border-b border-slate-200 px-6 py-4 hidden lg:block">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-slate-900">
              {isAdmin
                ? [
                    ...adminCoreNavigation,
                    ...adminAutomationNavigation,
                    ...(isSuperAdmin ? [...systemNavigation, ...systemManagementNavigation] : []),
                  ].find((item) => item.href === location.pathname)?.name ||
                  clientNavigation.find((item) => item.href === location.pathname)?.name ||
                  'Dashboard'
                : clientNavigation.find((item) => item.href === location.pathname)?.name || 'Dashboard'}
            </h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-slate-100 relative">
                <Bell className="w-5 h-5 text-slate-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100">
                <Settings className="w-5 h-5 text-slate-700" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-6 mt-16 lg:mt-0">{children}</main>
      </div>
    </div>
  );
}
