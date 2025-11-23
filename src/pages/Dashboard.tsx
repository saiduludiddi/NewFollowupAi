import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  FileCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';

interface Stats {
  pendingRequests: number;
  completedRequests: number;
  overdueItems: number;
  activeTasks: number;
}

export function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    pendingRequests: 0,
    completedRequests: 0,
    overdueItems: 0,
    activeTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [profile]);

  const loadStats = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    try {
      const isClient = profile.role === 'client';

      if (isClient) {
        const [requestsData, tasksData] = await Promise.all([
          supabase
            .from('data_requests')
            .select('status', { count: 'exact' })
            .eq('client_id', profile.id),
          supabase
            .from('tasks')
            .select('status', { count: 'exact' })
            .eq('client_id', profile.id),
        ]);

        const pending = requestsData.data?.filter((r) => r.status === 'sent' || r.status === 'in_progress').length || 0;
        const completed = requestsData.data?.filter((r) => r.status === 'completed').length || 0;
        const overdue = requestsData.data?.filter((r) => r.status === 'in_progress').length || 0;
        const active = tasksData.data?.filter((t) => t.status === 'in_progress').length || 0;

        setStats({
          pendingRequests: pending,
          completedRequests: completed,
          overdueItems: overdue,
          activeTasks: active,
        });
      } else {
        const [requestsData, tasksData] = await Promise.all([
          supabase
            .from('data_requests')
            .select('status', { count: 'exact' })
            .eq('organization_id', profile.organization_id || ''),
          supabase
            .from('tasks')
            .select('status', { count: 'exact' })
            .eq('organization_id', profile.organization_id || ''),
        ]);

        const pending = requestsData.data?.filter((r) => r.status === 'sent' || r.status === 'in_progress').length || 0;
        const completed = requestsData.data?.filter((r) => r.status === 'completed').length || 0;
        const overdue = requestsData.data?.filter((r) => r.status === 'in_progress').length || 0;
        const active = tasksData.data?.filter((t) => t.status === 'in_progress' || t.status === 'not_started').length || 0;

        setStats({
          pendingRequests: pending,
          completedRequests: completed,
          overdueItems: overdue,
          activeTasks: active,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = profile?.role && ['super_admin', 'admin', 'manager', 'team_member'].includes(profile.role);

  const statCards = [
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      icon: Clock,
      color: 'bg-amber-100 text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Completed',
      value: stats.completedRequests,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Tasks',
      value: stats.activeTasks,
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Overdue Items',
      value: stats.overdueItems,
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">
          Welcome back, {profile?.full_name || profile?.email?.split('@')[0] || 'there'}!
        </h2>
        <p className="text-slate-600 mt-1">
          {isAdmin ? 'Here\'s an overview of your organization' : 'Here\'s your activity summary'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.title} className={`${card.bgColor} rounded-xl p-6 border border-slate-200`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">{card.title}</p>
            <p className="text-3xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            <p className="text-slate-500 text-sm">No recent activity to display</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Upcoming Due Dates</h3>
            <FileCheck className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            <p className="text-slate-500 text-sm">No upcoming deadlines</p>
          </div>
        </div>
      </div>
    </div>
  );
}
