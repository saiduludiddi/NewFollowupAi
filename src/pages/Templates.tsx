import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, FileText, Edit, Trash2, Copy } from 'lucide-react';
import type { Database } from '../types/database';

type Template = Database['public']['Tables']['templates']['Row'];

export function Templates() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [profile]);

  const loadTemplates = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Templates</h2>
          <p className="text-slate-600 mt-1">Manage reusable templates for document collection</p>
        </div>
        <Link
          to="/templates/new"
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Template</span>
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No templates yet</h3>
          <p className="text-slate-600 mb-6">Create your first template to get started</p>
          <Link
            to="/templates/new"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Template</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">{template.name}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{template.description}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  template.status === 'active' ? 'bg-green-100 text-green-700' :
                  template.status === 'inactive' ? 'bg-slate-100 text-slate-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {template.status}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-slate-500 mb-4">
                <span className={`px-2 py-1 rounded ${
                  template.task_type === 'recurring' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-700'
                }`}>
                  {template.task_type === 'recurring' ? 'Recurring' : 'One-time'}
                </span>
                {template.schedule_frequency && (
                  <span className="text-xs">
                    {template.schedule_frequency}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-slate-100">
                <button className="flex items-center space-x-1 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button className="flex items-center space-x-1 text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  <Copy className="w-4 h-4" />
                  <span>Duplicate</span>
                </button>
                <button className="flex items-center space-x-1 text-sm text-slate-600 hover:text-red-600 transition-colors ml-auto">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
