import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Clock, Plus, Mail, MessageSquare, Phone, Bell, CheckCircle, XCircle, Filter, Calendar } from 'lucide-react'
import type { Database } from '../types/database'

type Reminder = Database['public']['Tables']['reminders']['Row']
type User = Database['public']['Tables']['users']['Row']

export function Reminders() {
  const { profile } = useAuth()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null)

  useEffect(() => {
    loadReminders()
    loadUsers()
  }, [profile, statusFilter, channelFilter])

  const loadReminders = async () => {
    if (!profile || !profile.organization_id) {
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('reminders')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('scheduled_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (channelFilter !== 'all') {
        query = query.eq('channel', channelFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setReminders(data || [])
    } catch (error) {
      console.error('Error loading reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    if (!profile || !profile.organization_id) return

    try {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)

      if (data) setUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const getChannelIcon = (channel: Reminder['channel']) => {
    switch (channel) {
      case 'email':
        return Mail
      case 'whatsapp':
        return MessageSquare
      case 'sms':
        return MessageSquare
      case 'voice':
        return Phone
      default:
        return Bell
    }
  }

  const getChannelColor = (channel: Reminder['channel']) => {
    switch (channel) {
      case 'email':
        return 'bg-blue-100 text-blue-700'
      case 'whatsapp':
        return 'bg-green-100 text-green-700'
      case 'sms':
        return 'bg-purple-100 text-purple-700'
      case 'voice':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusColor = (status: Reminder['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      case 'cancelled':
        return 'bg-slate-100 text-slate-700'
      default:
        return 'bg-amber-100 text-amber-700'
    }
  }

  const getStatusIcon = (status: Reminder['status']) => {
    switch (status) {
      case 'sent':
        return CheckCircle
      case 'failed':
        return XCircle
      default:
        return Clock
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Unknown'
    const user = users.find((u) => u.id === userId)
    return user?.full_name || 'Unknown'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stats = {
    pending: reminders.filter((r) => r.status === 'pending').length,
    sent: reminders.filter((r) => r.status === 'sent').length,
    failed: reminders.filter((r) => r.status === 'failed').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Reminders Management</h2>
          <p className="text-slate-600 mt-1">Schedule and manage automated reminders across multiple channels</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Reminder</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pending</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{stats.pending}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Sent</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.sent}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Failed</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.failed}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Status:</span>
            <div className="flex space-x-2">
              {['all', 'pending', 'sent', 'failed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700">Channel:</span>
            <div className="flex space-x-2">
              {['all', 'email', 'whatsapp', 'sms', 'voice', 'in_app'].map((channel) => (
                <button
                  key={channel}
                  onClick={() => setChannelFilter(channel)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    channelFilter === channel
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {channel.charAt(0).toUpperCase() + channel.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {reminders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No reminders found</h3>
          <p className="text-slate-600">Create your first reminder to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Retries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {reminders.map((reminder) => {
                  const ChannelIcon = getChannelIcon(reminder.channel)
                  const StatusIcon = getStatusIcon(reminder.status)
                  return (
                    <tr key={reminder.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {reminder.reminder_type.replace('_', ' ')}
                        </div>
                        {reminder.message_subject && (
                          <div className="text-xs text-slate-500 truncate max-w-xs">
                            {reminder.message_subject}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {getUserName(reminder.recipient_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getChannelColor(
                            reminder.channel
                          )}`}
                        >
                          <ChannelIcon className="w-3 h-3 mr-1" />
                          {reminder.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatDate(reminder.scheduled_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            reminder.status
                          )}`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {reminder.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {reminder.retry_count || 0} / {reminder.max_retries || 3}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedReminder(reminder)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </button>
                        {reminder.status === 'failed' && reminder.retry_count < (reminder.max_retries || 3) && (
                          <button className="text-green-600 hover:text-green-900">Retry</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Create Reminder</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-600 mb-6">Reminder creation form will be implemented here</p>
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
