import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Users, UserPlus, Mail, Phone, FileText, CheckSquare, X, Save } from 'lucide-react'
import type { Database } from '../types/database'

type User = Database['public']['Tables']['users']['Row']

export function Clients() {
  const { profile } = useAuth()
  const [clients, setClients] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingClient, setCreatingClient] = useState(false)
  const [clientFormData, setClientFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  })
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  })

  useEffect(() => {
    loadClients()
  }, [profile])

  const loadClients = async () => {
    if (!profile || !profile.organization_id) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'client')
        .order('created_at', { ascending: false })

      if (error) throw error

      const clientsData = data || []
      setClients(clientsData)
      setStats({
        total: clientsData.length,
        active: clientsData.filter((c) => c.is_active).length,
        inactive: clientsData.filter((c) => !c.is_active).length,
      })
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
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
          setClientFormData({ full_name: '', email: '', phone: '' })
          setShowCreateModal(false)
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

      // Reset client form
      setClientFormData({
        full_name: '',
        email: '',
        phone: '',
      })
      setShowCreateModal(false)

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
          <h2 className="text-2xl font-bold text-slate-900">Clients Management</h2>
          <p className="text-slate-600 mt-1">Manage all client accounts</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Client</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Clients</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Clients</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Inactive Clients</p>
              <p className="text-3xl font-bold text-slate-400 mt-2">{stats.inactive}</p>
            </div>
            <div className="bg-slate-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No clients found</h3>
          <p className="text-slate-600">Add your first client to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-slate-700">
                            {client.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {client.full_name}
                          </div>
                          <div className="text-sm text-slate-500">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {client.phone || (
                          <span className="text-slate-400">No phone number</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          client.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {client.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {client.last_login
                        ? new Date(client.last_login).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">
                        View
                      </button>
                      <button className="text-slate-600 hover:text-slate-900">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Add New Client</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setClientFormData({ full_name: '', email: '', phone: '' })
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientFormData.full_name}
                  onChange={(e) =>
                    setClientFormData({ ...clientFormData, full_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter client's full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={clientFormData.email}
                  onChange={(e) =>
                    setClientFormData({ ...clientFormData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter client's email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={clientFormData.phone}
                  onChange={(e) =>
                    setClientFormData({ ...clientFormData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter client's phone number (optional)"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setClientFormData({ full_name: '', email: '', phone: '' })
                  }}
                  className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  disabled={creatingClient}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingClient}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingClient ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Client</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

