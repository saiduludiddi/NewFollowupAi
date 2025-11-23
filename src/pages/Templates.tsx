import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, FileText, Edit, Trash2, Copy, X, Save } from 'lucide-react';
import type { Database } from '../types/database';

type Template = Database['public']['Tables']['templates']['Row'];
type TemplateCategory = Database['public']['Tables']['template_categories']['Row'];

export function Templates() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (profile) {
      loadTemplates();
      loadCategories();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const loadTemplates = async () => {
    try {
      // Show templates for user's organization OR global templates (no organization_id)
      let query = supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (profile?.organization_id) {
        // Show templates for user's org OR global templates
        query = query.or(`organization_id.eq.${profile.organization_id},organization_id.is.null`);
      } else {
        // Show only global templates (no organization_id)
        query = query.is('organization_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      // Show categories for user's organization OR global categories (no organization_id)
      let query = supabase
        .from('template_categories')
        .select('*')
        .order('name', { ascending: true });

      if (profile?.organization_id) {
        // Show categories for user's org OR global categories
        query = query.or(`organization_id.eq.${profile.organization_id},organization_id.is.null`);
      } else {
        // Show only global categories (no organization_id)
        query = query.is('organization_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
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
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Template</span>
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No templates yet</h3>
          <p className="text-slate-600 mb-6">Create your first template to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Template</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">{template.name}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{template.description || 'No description'}</p>
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

      {showCreateModal && (
        <CreateTemplateModal
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onSave={loadTemplates}
          onCategoryCreated={loadCategories}
        />
      )}
    </div>
  );
}

interface CreateTemplateModalProps {
  categories: TemplateCategory[];
  onClose: () => void;
  onSave: () => void;
  onCategoryCreated?: () => void;
}

function CreateTemplateModal({ categories, onClose, onSave, onCategoryCreated }: CreateTemplateModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    task_type: 'one_time' as 'one_time' | 'recurring',
    schedule_frequency: '' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom' | '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    default_sla_days: 7,
    visibility: 'client_facing' as 'internal_only' | 'client_facing',
    status: 'active' as 'active' | 'inactive' | 'archived',
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__add_category__') {
      setShowCategoryModal(true);
      // Reset dropdown to empty immediately
      setFormData({ ...formData, category_id: '' });
    } else {
      setFormData({ ...formData, category_id: value });
    }
  };

  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!categoryFormData.name.trim() || !profile) return;

    setCreatingCategory(true);
    try {
      const slug = generateSlug(categoryFormData.name);
      const { data, error } = await supabase
        .from('template_categories')
        .insert([{
          organization_id: profile.organization_id || null, // Optional - categories don't require organization
          name: categoryFormData.name.trim(),
          slug: slug,
          description: categoryFormData.description.trim() || null,
          is_active: categoryFormData.is_active,
        }])
        .select()
        .single();

      if (error) throw error;

      // Auto-select the newly created category
      setFormData({ ...formData, category_id: data.id });
      
      // Reset category form
      setCategoryFormData({
        name: '',
        description: '',
        is_active: true,
      });
      setShowCategoryModal(false);
      
      // Refresh categories list
      if (onCategoryCreated) {
        onCategoryCreated();
      }
    } catch (error: any) {
      console.error('Error creating category:', error);
      alert(error.message || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      alert('Please log in to create templates');
      return;
    }

    setLoading(true);
    try {
      const templateData: any = {
        organization_id: profile.organization_id || null, // Optional - templates don't require organization
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id || null,
        task_type: formData.task_type,
        priority: formData.priority,
        default_sla_days: formData.default_sla_days,
        visibility: formData.visibility,
        status: formData.status,
        created_by: profile.id,
      };

      if (formData.task_type === 'recurring' && formData.schedule_frequency) {
        templateData.schedule_frequency = formData.schedule_frequency;
      }

      const { error } = await supabase
        .from('templates')
        .insert([templateData]);

      if (error) throw error;

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error creating template:', error);
      alert(error.message || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-900">Create New Template</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., GST Filing Template"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what this template is used for..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={handleCategoryChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
                <option value="__add_category__" className="text-blue-600 font-medium">
                  + Add New Category
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Task Type *
              </label>
              <select
                required
                value={formData.task_type}
                onChange={(e) => setFormData({ ...formData, task_type: e.target.value as 'one_time' | 'recurring' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="one_time">One-time</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
          </div>

          {formData.task_type === 'recurring' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Schedule Frequency
              </label>
              <select
                value={formData.schedule_frequency}
                onChange={(e) => setFormData({ ...formData, schedule_frequency: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Frequency</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Priority *
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Default SLA (Days) *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.default_sla_days}
                onChange={(e) => setFormData({ ...formData, default_sla_days: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Visibility *
              </label>
              <select
                required
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'internal_only' | 'client_facing' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="client_facing">Client Facing</option>
                <option value="internal_only">Internal Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'archived' })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create Template'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Add New Category</h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryFormData({
                    name: '',
                    description: '',
                    is_active: true,
                  });
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateCategory}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., GST Filing"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe this category..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="category_active"
                  checked={categoryFormData.is_active}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="category_active" className="ml-2 text-sm text-slate-700">
                  Active
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategoryFormData({
                      name: '',
                      description: '',
                      is_active: true,
                    });
                  }}
                  className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCategory || !categoryFormData.name.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{creatingCategory ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
