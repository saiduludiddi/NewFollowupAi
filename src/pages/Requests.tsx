import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { FileCheck, Clock, CheckCircle, AlertCircle, Plus, Filter, X, Save } from 'lucide-react'
import type { Database } from '../types/database'

type DataRequest = Database['public']['Tables']['data_requests']['Row']

export function Requests() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<DataRequest[]>([])
  const [clients, setClients] = useState<Array<{ id: string; full_name: string; email: string }>>([])
  const [templates, setTemplates] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [creatingClient, setCreatingClient] = useState(false)
  const [clientFormData, setClientFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  })
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    template_id: '',
    due_date: '',
    priority: 'medium' as DataRequest['priority'],
    enable_email: true,
    enable_whatsapp: false,
    enable_voice: false,
  })

  useEffect(() => {
    loadRequests()
    loadClients()
    loadTemplates()
  }, [profile, statusFilter])

  const loadRequests = async () => {
    if (!profile || !profile.organization_id) {
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('data_requests')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: DataRequest['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      case 'sent':
        return 'bg-amber-100 text-amber-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusIcon = (status: DataRequest['status']) => {
    switch (status) {
      case 'completed':
        return CheckCircle
      case 'in_progress':
        return Clock
      case 'sent':
        return FileCheck
      default:
        return AlertCircle
    }
  }

  const loadClients = async () => {
    if (!profile || !profile.organization_id) return

    try {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'client')
        .eq('is_active', true)

      if (data) setClients(data)
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === '__add_client__') {
      setShowClientModal(true)
      // Reset dropdown to empty immediately
      setFormData({ ...formData, client_id: '' })
    } else {
      setFormData({ ...formData, client_id: value })
    }
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientFormData.full_name.trim() || !clientFormData.email.trim() || !profile?.organization_id) {
      alert('Please fill in all required fields')
      return
    }

    setCreatingClient(true)
    try {
      const tempPassword = 'TempPassword123!'
      
      // Try using the database function first (if available)
      try {
        const { data: userId, error: rpcError } = await supabase.rpc('create_client_user', {
          p_email: clientFormData.email.trim(),
          p_full_name: clientFormData.full_name.trim(),
          p_phone: clientFormData.phone.trim() || '',
          p_organization_id: profile.organization_id,
          p_temp_password: tempPassword,
        })

        if (!rpcError && userId) {
          // Success! Function created the user
          setFormData({ ...formData, client_id: userId })
          setClientFormData({ full_name: '', email: '', phone: '' })
          setShowClientModal(false)
          await loadClients()
          alert(`Client created successfully! Temporary password: ${tempPassword}. Please share this with the client.`)
          setCreatingClient(false)
          return
        }
      } catch (rpcErr) {
        console.log('RPC function not available, using signUp method:', rpcErr)
      }

      // Fallback: Create auth user using signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: clientFormData.email.trim(),
        password: tempPassword,
        options: {
          data: {
            full_name: clientFormData.full_name.trim(),
          },
        },
      })

      if (authError) {
        console.error('Auth error:', authError)
        throw new Error(authError.message || 'Failed to create auth user')
      }
      
      if (!authData.user) {
        throw new Error('Failed to create auth user - no user returned')
      }

      // Insert user record - this should work with our RLS policies
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          organization_id: profile.organization_id,
          email: clientFormData.email.trim(),
          full_name: clientFormData.full_name.trim(),
          phone: clientFormData.phone.trim() || null,
          role: 'client',
          is_active: true,
          preferences: {},
        })

      if (insertError) {
        console.error('Insert error:', insertError)
        // If insert fails, try update (in case record was created by trigger)
        const { error: updateError } = await supabase
          .from('users')
          .update({
            organization_id: profile.organization_id,
            role: 'client',
            phone: clientFormData.phone.trim() || null,
            full_name: clientFormData.full_name.trim(),
          })
          .eq('id', authData.user.id)

        if (updateError) {
          console.error('Update error:', updateError)
          throw new Error(updateError.message || 'Failed to create user record')
        }
      }

      // Auto-select the newly created client
      setFormData({ ...formData, client_id: authData.user.id })

      // Reset client form
      setClientFormData({
        full_name: '',
        email: '',
        phone: '',
      })
      setShowClientModal(false)

      // Refresh clients list
      await loadClients()
      
      alert(`Client created successfully! Temporary password: ${tempPassword}. Please share this with the client.`)
    } catch (error: any) {
      console.error('Error creating client:', error)
      const errorMessage = error.message || 'Failed to create client. Make sure the email is unique and you have permission.'
      alert(`Error: ${errorMessage}`)
    } finally {
      setCreatingClient(false)
    }
  }

  const loadTemplates = async () => {
    if (!profile || !profile.organization_id) return

    try {
      const { data } = await supabase
        .from('templates')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')

      if (data) setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const generateRequestNumber = () => {
    const prefix = 'REQ'
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}-${timestamp}-${random}`
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile || !profile.organization_id) return

    try {
      const requestNumber = generateRequestNumber()

      const { error } = await supabase.from('data_requests').insert({
        organization_id: profile.organization_id,
        client_id: formData.client_id,
        template_id: formData.template_id || null,
        request_number: requestNumber,
        title: formData.title,
        description: formData.description || null,
        due_date: formData.due_date || null,
        priority: formData.priority,
        status: 'draft',
        enable_email: formData.enable_email,
        enable_whatsapp: formData.enable_whatsapp,
        enable_voice: formData.enable_voice,
        created_by: profile.id,
      })

      if (error) throw error

      setShowCreateModal(false)
      setFormData({
        title: '',
        description: '',
        client_id: '',
        template_id: '',
        due_date: '',
        priority: 'medium',
        enable_email: true,
        enable_whatsapp: false,
        enable_voice: false,
      })
      loadRequests()
    } catch (error) {
      console.error('Error creating request:', error)
      alert('Failed to create request. Please try again.')
    }
  }

  const getPriorityColor = (priority: DataRequest['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600'
      case 'medium':
        return 'text-amber-600'
      case 'low':
        return 'text-green-600'
      default:
        return 'text-slate-600'
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
          <h2 className="text-2xl font-bold text-slate-900">Requests Management</h2>
          <p className="text-slate-600 mt-1">Manage all data requests across your organization</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Request</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filter by Status:</span>
          </div>
          <div className="flex space-x-2">
            {['all', 'draft', 'sent', 'in_progress', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileCheck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No requests found</h3>
          <p className="text-slate-600">Create your first data request to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const StatusIcon = getStatusIcon(request.status)
            return (
              <div
                key={request.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{request.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(
                          request.status
                        )}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{request.status.replace('_', ' ')}</span>
                      </span>
                      <span className={`text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority} priority
                      </span>
                    </div>
                    {request.description && (
                      <p className="text-slate-600 mb-4">{request.description}</p>
                    )}
                    <div className="flex items-center space-x-6 text-sm text-slate-500">
                      <span>Request #: {request.request_number}</span>
                      {request.due_date && (
                        <span>Due: {new Date(request.due_date).toLocaleDateString()}</span>
                      )}
                      {request.sent_at && (
                        <span>Sent: {new Date(request.sent_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-4">
                      {request.enable_email && (
                        <span className="text-xs text-slate-500">📧 Email</span>
                      )}
                      {request.enable_whatsapp && (
                        <span className="text-xs text-slate-500">💬 WhatsApp</span>
                      )}
                      {request.enable_voice && (
                        <span className="text-xs text-slate-500">📞 Voice</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Create New Request</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Request Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., KYC Document Collection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe what documents or information you need..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Client *
                  </label>
                  <select
                    required
                    value={formData.client_id}
                    onChange={handleClientChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.full_name} ({client.email})
                      </option>
                    ))}
                    <option value="__add_client__" className="text-blue-600 font-medium">
                      + Add New Client
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Template (Optional)
                  </label>
                  <select
                    value={formData.template_id}
                    onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as DataRequest['priority'] })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Communication Channels
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.enable_email}
                      onChange={(e) =>
                        setFormData({ ...formData, enable_email: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">📧 Email</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.enable_whatsapp}
                      onChange={(e) =>
                        setFormData({ ...formData, enable_whatsapp: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">💬 WhatsApp</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.enable_voice}
                      onChange={(e) =>
                        setFormData({ ...formData, enable_voice: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">📞 Voice Call</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Creation Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Add New Client</h3>
              <button
                onClick={() => {
                  setShowClientModal(false)
                  setClientFormData({
                    full_name: '',
                    email: '',
                    phone: '',
                  })
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateClient}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={clientFormData.full_name}
                  onChange={(e) => setClientFormData({ ...clientFormData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., John Doe"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={clientFormData.email}
                  onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={clientFormData.phone}
                  onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., +91 9876543210"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowClientModal(false)
                    setClientFormData({
                      full_name: '',
                      email: '',
                      phone: '',
                    })
                  }}
                  className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingClient || !clientFormData.full_name.trim() || !clientFormData.email.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{creatingClient ? 'Creating...' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

