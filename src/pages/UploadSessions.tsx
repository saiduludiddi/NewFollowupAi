import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Upload, CheckCircle, XCircle, Clock, Filter, Folder, Mail, MessageSquare, HardDrive, Camera } from 'lucide-react'
import type { Database } from '../types/database'

type UploadSession = Database['public']['Tables']['upload_sessions']['Row']

export function UploadSessions() {
  const { profile } = useAuth()
  const [sessions, setSessions] = useState<UploadSession[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [selectedSession, setSelectedSession] = useState<UploadSession | null>(null)

  useEffect(() => {
    loadSessions()
  }, [profile, statusFilter, sourceFilter])

  const loadSessions = async () => {
    if (!profile || !profile.organization_id) {
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('upload_sessions')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (statusFilter !== 'all') {
        query = query.eq('session_status', statusFilter)
      }

      if (sourceFilter !== 'all') {
        query = query.eq('upload_source', sourceFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Error loading upload sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSourceIcon = (source: UploadSession['upload_source']) => {
    switch (source) {
      case 'local':
        return Folder
      case 'mobile_camera':
        return Camera
      case 'gmail':
        return Mail
      case 'whatsapp':
        return MessageSquare
      case 'google_drive':
        return HardDrive
      default:
        return Upload
    }
  }

  const getSourceColor = (source: UploadSession['upload_source']) => {
    switch (source) {
      case 'local':
        return 'bg-blue-100 text-blue-700'
      case 'mobile_camera':
        return 'bg-purple-100 text-purple-700'
      case 'gmail':
        return 'bg-red-100 text-red-700'
      case 'whatsapp':
        return 'bg-green-100 text-green-700'
      case 'google_drive':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusColor = (status: UploadSession['session_status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      case 'cancelled':
        return 'bg-slate-100 text-slate-700'
      default:
        return 'bg-amber-100 text-amber-700'
    }
  }

  const getStatusIcon = (status: UploadSession['session_status']) => {
    switch (status) {
      case 'completed':
        return CheckCircle
      case 'failed':
        return XCircle
      default:
        return Clock
    }
  }

  const getProgressPercentage = (session: UploadSession) => {
    if (session.total_files === 0) return 0
    return Math.round((session.uploaded_files / session.total_files) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stats = {
    total: sessions.length,
    completed: sessions.filter((s) => s.session_status === 'completed').length,
    inProgress: sessions.filter((s) => s.session_status === 'in_progress').length,
    failed: sessions.filter((s) => s.session_status === 'failed').length,
    totalFiles: sessions.reduce((acc, s) => acc + s.total_files, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Upload Sessions</h2>
          <p className="text-slate-600 mt-1">Track multi-source document upload sessions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Sessions</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Upload className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm font-medium text-slate-600">In Progress</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{stats.inProgress}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Files</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalFiles}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Folder className="w-6 h-6 text-purple-600" />
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
              {['all', 'in_progress', 'completed', 'failed', 'cancelled'].map((status) => (
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
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700">Source:</span>
            <div className="flex space-x-2">
              {['all', 'local', 'mobile_camera', 'gmail', 'whatsapp', 'google_drive'].map(
                (source) => (
                  <button
                    key={source}
                    onClick={() => setSourceFilter(source)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      sourceFilter === source
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {source.charAt(0).toUpperCase() + source.slice(1).replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No upload sessions</h3>
          <p className="text-slate-600">Upload sessions will appear here once documents are uploaded</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const SourceIcon = getSourceIcon(session.upload_source)
            const StatusIcon = getStatusIcon(session.session_status)
            const progress = getProgressPercentage(session)

            return (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-2 rounded-lg ${getSourceColor(session.upload_source)}`}>
                        <SourceIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {session.upload_source.replace('_', ' ').toUpperCase()} Upload
                        </h3>
                        <p className="text-sm text-slate-500">
                          {new Date(session.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(
                          session.session_status
                        )}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{session.session_status.replace('_', ' ')}</span>
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600">Upload Progress</span>
                        <span className="font-medium text-slate-900">
                          {session.uploaded_files} / {session.total_files} files
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            session.session_status === 'completed'
                              ? 'bg-green-600'
                              : session.session_status === 'failed'
                                ? 'bg-red-600'
                                : 'bg-blue-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {session.failed_files > 0 && (
                      <div className="bg-red-50 rounded-lg p-3 mb-2">
                        <p className="text-sm text-red-700">
                          ⚠️ {session.failed_files} file(s) failed to upload
                        </p>
                      </div>
                    )}

                    <div className="flex items-center space-x-6 text-sm text-slate-500">
                      {session.completed_at && (
                        <span>
                          Completed: {new Date(session.completed_at).toLocaleString()}
                        </span>
                      )}
                      {session.source_reference_id && (
                        <span>Reference: {session.source_reference_id}</span>
                      )}
                    </div>
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

      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Session Details</h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-slate-500">Upload Source</span>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedSession.upload_source.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Status</span>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedSession.session_status}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Total Files</span>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedSession.total_files}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Uploaded Files</span>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedSession.uploaded_files}
                  </p>
                </div>
                {selectedSession.failed_files > 0 && (
                  <div>
                    <span className="text-sm text-slate-500">Failed Files</span>
                    <p className="text-sm font-medium text-red-600">
                      {selectedSession.failed_files}
                    </p>
                  </div>
                )}
              </div>
              {selectedSession.metadata &&
                Object.keys(selectedSession.metadata).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Metadata</h4>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedSession.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedSession(null)}
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
