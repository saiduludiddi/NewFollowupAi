import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Phone, PhoneCall, PhoneOff, CheckCircle, XCircle, Clock, Filter, MessageSquare } from 'lucide-react'
import type { Database } from '../types/database'

type VoiceCallLog = Database['public']['Tables']['voice_call_logs']['Row']
type User = Database['public']['Tables']['users']['Row']

export function VoiceCalls() {
  const { profile } = useAuth()
  const [calls, setCalls] = useState<VoiceCallLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedCall, setSelectedCall] = useState<VoiceCallLog | null>(null)

  useEffect(() => {
    loadCalls()
    loadUsers()
  }, [profile, statusFilter])

  const loadCalls = async () => {
    if (!profile || !profile.organization_id) {
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('voice_call_logs')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (statusFilter !== 'all') {
        query = query.eq('call_status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setCalls(data || [])
    } catch (error) {
      console.error('Error loading calls:', error)
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

      if (data) setUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const getStatusColor = (status: VoiceCallLog['call_status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'answered':
        return 'bg-blue-100 text-blue-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      case 'no_answer':
        return 'bg-amber-100 text-amber-700'
      case 'busy':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusIcon = (status: VoiceCallLog['call_status']) => {
    switch (status) {
      case 'completed':
        return CheckCircle
      case 'answered':
        return PhoneCall
      case 'failed':
        return XCircle
      case 'no_answer':
        return PhoneOff
      default:
        return Clock
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
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
    total: calls.length,
    completed: calls.filter((c) => c.call_status === 'completed').length,
    failed: calls.filter((c) => c.call_status === 'failed').length,
    totalDuration: calls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Voice Calls</h2>
          <p className="text-slate-600 mt-1">View and manage AI voice call logs and transcripts</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Phone className="w-5 h-5" />
          <span>Initiate Call</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Calls</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</p>
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

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Duration</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {formatDuration(stats.totalDuration)}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Status:</span>
            <div className="flex space-x-2">
              {['all', 'completed', 'answered', 'failed', 'no_answer', 'busy'].map((status) => (
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
      </div>

      {calls.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Phone className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No calls found</h3>
          <p className="text-slate-600">Voice calls will appear here once initiated</p>
        </div>
      ) : (
        <div className="space-y-4">
          {calls.map((call) => {
            const StatusIcon = getStatusIcon(call.call_status)
            return (
              <div
                key={call.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedCall(call)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {getUserName(call.recipient_id)}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(
                          call.call_status
                        )}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{call.call_status}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-slate-500 mb-4">
                      <span>📞 {call.phone_number}</span>
                      {call.duration_seconds && (
                        <span>⏱️ {formatDuration(call.duration_seconds)}</span>
                      )}
                      {call.started_at && (
                        <span>
                          📅 {new Date(call.started_at).toLocaleDateString()}{' '}
                          {new Date(call.started_at).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    {call.transcript && (
                      <div className="bg-slate-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-medium text-slate-500">Transcript</span>
                        </div>
                        <p className="text-sm text-slate-700 line-clamp-3">{call.transcript}</p>
                      </div>
                    )}
                    {call.call_outcome && (
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-slate-600">
                          <strong>Outcome:</strong> {call.call_outcome}
                        </span>
                        {call.response_outcome && (
                          <span className="text-slate-600">
                            <strong>Response:</strong> {call.response_outcome}
                          </span>
                        )}
                        {call.expected_submission_date && (
                          <span className="text-slate-600">
                            <strong>Expected:</strong>{' '}
                            {new Date(call.expected_submission_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Call Details</h3>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Call Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Recipient:</span>{' '}
                    <span className="text-slate-900">{getUserName(selectedCall.recipient_id)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Phone:</span>{' '}
                    <span className="text-slate-900">{selectedCall.phone_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>{' '}
                    <span className="text-slate-900">{selectedCall.call_status}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Duration:</span>{' '}
                    <span className="text-slate-900">
                      {formatDuration(selectedCall.duration_seconds)}
                    </span>
                  </div>
                </div>
              </div>
              {selectedCall.transcript && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Transcript</h4>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedCall.transcript}
                    </p>
                  </div>
                </div>
              )}
              {selectedCall.call_outcome && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Outcome Details</h4>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-sm">
                    <div>
                      <strong>Call Outcome:</strong> {selectedCall.call_outcome}
                    </div>
                    {selectedCall.response_outcome && (
                      <div>
                        <strong>Response:</strong> {selectedCall.response_outcome}
                      </div>
                    )}
                    {selectedCall.expected_submission_date && (
                      <div>
                        <strong>Expected Submission:</strong>{' '}
                        {new Date(selectedCall.expected_submission_date).toLocaleDateString()}
                      </div>
                    )}
                    {selectedCall.delay_reason && (
                      <div>
                        <strong>Delay Reason:</strong> {selectedCall.delay_reason}
                      </div>
                    )}
                    {selectedCall.preferred_reminder_channel && (
                      <div>
                        <strong>Preferred Channel:</strong> {selectedCall.preferred_reminder_channel}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCall(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
