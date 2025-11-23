import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Zap, Mail, Folder, MessageSquare, Phone, CheckCircle, XCircle, Plus, Settings, RefreshCw } from 'lucide-react'
import type { Database } from '../types/database'

type Integration = Database['public']['Tables']['external_integrations']['Row']

export function Integrations() {
  const { profile } = useAuth()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)

  useEffect(() => {
    loadIntegrations()
  }, [profile])

  const loadIntegrations = async () => {
    if (!profile || !profile.organization_id) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('external_integrations')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setIntegrations(data || [])
    } catch (error) {
      console.error('Error loading integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIntegrationIcon = (type: Integration['integration_type']) => {
    switch (type) {
      case 'gmail':
        return Mail
      case 'google_drive':
        return Folder
      case 'whatsapp':
        return MessageSquare
      case 'twilio':
      case 'exotel':
      case 'kaleyra':
        return Phone
      default:
        return Zap
    }
  }

  const getIntegrationColor = (type: Integration['integration_type']) => {
    switch (type) {
      case 'gmail':
        return 'bg-red-100 text-red-700'
      case 'google_drive':
        return 'bg-blue-100 text-blue-700'
      case 'whatsapp':
        return 'bg-green-100 text-green-700'
      case 'twilio':
      case 'exotel':
      case 'kaleyra':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getIntegrationName = (type: Integration['integration_type']) => {
    switch (type) {
      case 'gmail':
        return 'Gmail'
      case 'google_drive':
        return 'Google Drive'
      case 'whatsapp':
        return 'WhatsApp Business'
      case 'twilio':
        return 'Twilio Voice'
      case 'exotel':
        return 'Exotel'
      case 'kaleyra':
        return 'Kaleyra'
      default:
        return type
    }
  }

  const toggleIntegration = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('external_integrations')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      loadIntegrations()
    } catch (error) {
      console.error('Error toggling integration:', error)
    }
  }

  const syncIntegration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('external_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      loadIntegrations()
    } catch (error) {
      console.error('Error syncing integration:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const availableIntegrations = [
    { type: 'gmail', name: 'Gmail', description: 'Import documents from Gmail attachments' },
    { type: 'google_drive', name: 'Google Drive', description: 'Sync documents from Google Drive folders' },
    { type: 'whatsapp', name: 'WhatsApp Business', description: 'Receive documents via WhatsApp' },
    { type: 'twilio', name: 'Twilio Voice', description: 'AI voice calls and follow-ups' },
    { type: 'exotel', name: 'Exotel', description: 'Voice call integration' },
    { type: 'kaleyra', name: 'Kaleyra', description: 'Voice and SMS integration' },
  ]

  const configuredTypes = integrations.map((i) => i.integration_type)
  const unconfiguredIntegrations = availableIntegrations.filter(
    (ai) => !configuredTypes.includes(ai.type)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Integrations</h2>
          <p className="text-slate-600 mt-1">
            Connect external services to automate document collection and communication
          </p>
        </div>
      </div>

      {integrations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Configured Integrations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => {
              const Icon = getIntegrationIcon(integration.integration_type)
              return (
                <div
                  key={integration.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${getIntegrationColor(integration.integration_type)}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {getIntegrationName(integration.integration_type)}
                        </h4>
                        <p className="text-sm text-slate-500">{integration.integration_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {integration.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {integration.last_sync_at && (
                      <div className="text-xs text-slate-500">
                        Last sync: {new Date(integration.last_sync_at).toLocaleString()}
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleIntegration(integration.id, integration.is_active)}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          integration.is_active
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {integration.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => setSelectedIntegration(integration.id)}
                        className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      {integration.is_active && (
                        <button
                          onClick={() => syncIntegration(integration.id)}
                          className="px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {unconfiguredIntegrations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Available Integrations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unconfiguredIntegrations.map((integration) => {
              const Icon = getIntegrationIcon(integration.type as Integration['integration_type'])
              return (
                <div
                  key={integration.type}
                  className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-6 hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 rounded-lg bg-slate-100">
                      <Icon className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{integration.name}</h4>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{integration.description}</p>
                  <button
                    onClick={() => {
                      setSelectedIntegration(integration.type)
                      setShowSetupModal(true)
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Setup Integration</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showSetupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Setup Integration</h3>
              <button
                onClick={() => {
                  setShowSetupModal(false)
                  setSelectedIntegration(null)
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-600 mb-6">
              Integration setup form will be implemented here with OAuth/API key configuration
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSetupModal(false)
                  setSelectedIntegration(null)
                }}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Configure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
