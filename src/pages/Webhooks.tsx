import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Link as LinkIcon, Plus, CheckCircle, XCircle, Filter, Copy, Trash2, Settings } from 'lucide-react'
import type { Database } from '../types/database'

type Webhook = Database['public']['Tables']['webhook_endpoints']['Row']

export function Webhooks() {
  const { profile } = useAuth()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    loadWebhooks()
  }, [profile, typeFilter])

  const loadWebhooks = async () => {
    if (!profile || !profile.organization_id) {
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('webhook_endpoints')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (typeFilter !== 'all') {
        query = query.eq('webhook_type', typeFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setWebhooks(data || [])
    } catch (error) {
      console.error('Error loading webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleWebhook = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('webhook_endpoints')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      loadWebhooks()
    } catch (error) {
      console.error('Error toggling webhook:', error)
    }
  }

  const deleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return

    try {
      const { error } = await supabase.from('webhook_endpoints').delete().eq('id', id)

      if (error) throw error
      loadWebhooks()
    } catch (error) {
      console.error('Error deleting webhook:', error)
    }
  }

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url)
  }

  const getTypeColor = (type: Webhook['webhook_type']) => {
    switch (type) {
      case 'voice_call':
        return 'bg-purple-100 text-purple-700'
      case 'document_upload':
        return 'bg-blue-100 text-blue-700'
      case 'approval':
        return 'bg-green-100 text-green-700'
      case 'reminder':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Webhook Endpoints</h2>
          <p className="text-slate-600 mt-1">
            Configure webhooks to receive real-time events from your integrations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Webhook</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Type:</span>
            <div className="flex space-x-2">
              {['all', 'voice_call', 'document_upload', 'approval', 'reminder', 'custom'].map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      typeFilter === type
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {webhooks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <LinkIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No webhooks configured</h3>
          <p className="text-slate-600">Create your first webhook endpoint to receive events</p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {webhook.endpoint_name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(
                        webhook.webhook_type
                      )}`}
                    >
                      {webhook.webhook_type.replace('_', ' ')}
                    </span>
                    {webhook.is_active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium flex items-center space-x-1">
                        <XCircle className="w-3 h-3" />
                        <span>Inactive</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mb-4">
                    <code className="text-sm bg-slate-100 px-3 py-1 rounded text-slate-700 font-mono">
                      {webhook.endpoint_url}
                    </code>
                    <button
                      onClick={() => copyWebhookUrl(webhook.endpoint_url)}
                      className="p-1 text-slate-500 hover:text-slate-700"
                      title="Copy URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-slate-500">
                    {webhook.last_triggered_at && (
                      <span>
                        Last triggered:{' '}
                        {new Date(webhook.last_triggered_at).toLocaleString()}
                      </span>
                    )}
                    {webhook.secret_token && (
                      <span className="text-xs">🔒 Secured with secret token</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleWebhook(webhook.id, webhook.is_active)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      webhook.is_active
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {webhook.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteWebhook(webhook.id)}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Create Webhook Endpoint</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-600 mb-6">
              Webhook creation form will be implemented here with endpoint URL and type selection
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
