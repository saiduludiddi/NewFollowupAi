import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Activity, Filter, Eye, Calendar, User, FileText } from 'lucide-react'
import type { Database } from '../types/database'

type AuditLog = Database['public']['Tables']['audit_trail']['Row']
type User = Database['public']['Tables']['users']['Row']

export function AuditTrail() {
  const { profile } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<Record<string, User>>({})
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  })

  useEffect(() => {
    loadLogs()
    loadUsers()
  }, [profile, entityFilter, actionFilter])

  const loadLogs = async () => {
    if (!profile || !profile.organization_id) {
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('audit_trail')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(500)

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter)
      }

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter)
      }

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start)
      }

      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end)
      }

      const { data, error } = await query

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error loading audit logs:', error)
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

      if (data) {
        const usersMap: Record<string, User> = {}
        data.forEach((user) => {
          usersMap[user.id] = user
        })
        setUsers(usersMap)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const getUserName = (userId: string | null) => {
    if (!userId) return 'System'
    return users[userId]?.full_name || 'Unknown User'
  }

  const getActionColor = (action: AuditLog['action']) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'created':
        return 'bg-green-100 text-green-700'
      case 'update':
      case 'updated':
        return 'bg-blue-100 text-blue-700'
      case 'delete':
      case 'deleted':
        return 'bg-red-100 text-red-700'
      case 'login':
      case 'logout':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Entity Type', 'Action', 'IP Address', 'User Agent'].join(','),
      ...logs.map((log) =>
        [
          new Date(log.created_at).toISOString(),
          getUserName(log.performed_by),
          log.entity_type,
          log.action,
          log.ip_address || 'N/A',
          log.user_agent || 'N/A',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const uniqueEntityTypes = [...new Set(logs.map((log) => log.entity_type))]
  const uniqueActions = [...new Set(logs.map((log) => log.action))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Audit Trail</h2>
          <p className="text-slate-600 mt-1">
            View complete system activity and change history for compliance and security
          </p>
        </div>
        <button
          onClick={exportLogs}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Entity Type:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3 py-1 border border-slate-300 rounded-lg text-sm"
            >
              <option value="all">All</option>
              {uniqueEntityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-1 border border-slate-300 rounded-lg text-sm"
            >
              <option value="all">All</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-1 border border-slate-300 rounded-lg text-sm"
              placeholder="Start Date"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-1 border border-slate-300 rounded-lg text-sm"
              placeholder="End Date"
            />
          </div>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No audit logs found</h3>
          <p className="text-slate-600">System activities will be logged here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-2">
                          <User className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {getUserName(log.performed_by)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{log.entity_type}</div>
                      <div className="text-xs text-slate-500">{log.entity_id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {log.ip_address || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Audit Log Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-slate-500">Timestamp</span>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Performed By</span>
                  <p className="text-sm font-medium text-slate-900">
                    {getUserName(selectedLog.performed_by)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Entity Type</span>
                  <p className="text-sm font-medium text-slate-900">{selectedLog.entity_type}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Entity ID</span>
                  <p className="text-sm font-medium text-slate-900 font-mono text-xs">
                    {selectedLog.entity_id}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Action</span>
                  <p className="text-sm font-medium text-slate-900">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">IP Address</span>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedLog.ip_address || 'N/A'}
                  </p>
                </div>
              </div>
              {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Old Values</h4>
                  <div className="bg-red-50 rounded-lg p-4">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">New Values</h4>
                  <div className="bg-green-50 rounded-lg p-4">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Changes</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {selectedLog.user_agent && (
                <div>
                  <span className="text-sm text-slate-500">User Agent</span>
                  <p className="text-sm text-slate-900">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
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
