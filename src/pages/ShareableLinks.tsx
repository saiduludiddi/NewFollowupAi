import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Link as LinkIcon, Plus, Copy, Trash2, Eye, CheckCircle, XCircle, Filter, Calendar } from 'lucide-react'
import type { Database } from '../types/database'

type ShareableLink = Database['public']['Tables']['shareable_links']['Row']

export function ShareableLinks() {
  const { profile } = useAuth()
  const [links, setLinks] = useState<ShareableLink[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadLinks()
  }, [profile, statusFilter, typeFilter])

  const loadLinks = async () => {
    if (!profile || !profile.organization_id) {
      setLoading(false)
      return
    }

    try {
      let query = supabase
        .from('shareable_links')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (statusFilter === 'active') {
        query = query.eq('is_active', true)
      } else if (statusFilter === 'expired') {
        query = query.eq('is_active', false)
      }

      if (typeFilter !== 'all') {
        query = query.eq('link_type', typeFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setLinks(data || [])
    } catch (error) {
      console.error('Error loading shareable links:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyLink = (linkToken: string) => {
    const fullUrl = `${window.location.origin}/share/${linkToken}`
    navigator.clipboard.writeText(fullUrl)
    alert('Link copied to clipboard!')
  }

  const deleteLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shareable link?')) return

    try {
      const { error } = await supabase.from('shareable_links').delete().eq('id', id)

      if (error) throw error
      loadLinks()
    } catch (error) {
      console.error('Error deleting link:', error)
    }
  }

  const toggleLink = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('shareable_links')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      loadLinks()
    } catch (error) {
      console.error('Error toggling link:', error)
    }
  }

  const isExpired = (link: ShareableLink) => {
    if (!link.expires_at) return false
    return new Date(link.expires_at) < new Date()
  }

  const getTypeColor = (type: ShareableLink['link_type']) => {
    switch (type) {
      case 'document':
        return 'bg-blue-100 text-blue-700'
      case 'request':
        return 'bg-green-100 text-green-700'
      case 'folder':
        return 'bg-purple-100 text-purple-700'
      case 'task':
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

  const stats = {
    total: links.length,
    active: links.filter((l) => l.is_active && !isExpired(l)).length,
    expired: links.filter((l) => isExpired(l) || !l.is_active).length,
    totalAccess: links.reduce((acc, l) => acc + (l.current_access_count || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Shareable Links</h2>
          <p className="text-slate-600 mt-1">
            Create and manage secure shareable links for documents, requests, folders, and tasks
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Link</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Links</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <LinkIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Expired</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.expired}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Access</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalAccess}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Eye className="w-6 h-6 text-purple-600" />
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
              {['all', 'active', 'expired'].map((status) => (
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
            <span className="text-sm font-medium text-slate-700">Type:</span>
            <div className="flex space-x-2">
              {['all', 'document', 'request', 'folder', 'task'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    typeFilter === type
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {links.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <LinkIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No shareable links</h3>
          <p className="text-slate-600">Create your first shareable link to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {links.map((link) => {
            const linkUrl = `${window.location.origin}/share/${link.link_token}`
            const expired = isExpired(link)

            return (
              <div
                key={link.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {link.endpoint_name || 'Shareable Link'}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(
                          link.link_type
                        )}`}
                      >
                        {link.link_type}
                      </span>
                      {link.is_active && !expired ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center space-x-1">
                          <XCircle className="w-3 h-3" />
                          <span>{expired ? 'Expired' : 'Inactive'}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mb-4">
                      <code className="text-sm bg-slate-100 px-3 py-1 rounded text-slate-700 font-mono flex-1 truncate">
                        {linkUrl}
                      </code>
                      <button
                        onClick={() => copyLink(link.link_token)}
                        className="p-2 text-slate-500 hover:text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                        title="Copy Link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                      {link.expires_at && (
                        <div>
                          <span className="text-slate-500">Expires:</span>{' '}
                          <span className="font-medium">
                            {new Date(link.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {link.max_access_count && (
                        <div>
                          <span className="text-slate-500">Max Access:</span>{' '}
                          <span className="font-medium">{link.max_access_count}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500">Current Access:</span>{' '}
                        <span className="font-medium">{link.current_access_count || 0}</span>
                      </div>
                      {link.last_accessed_at && (
                        <div>
                          <span className="text-slate-500">Last Access:</span>{' '}
                          <span className="font-medium">
                            {new Date(link.last_accessed_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {link.password_hash && (
                      <div className="mt-2 text-xs text-slate-500">🔒 Password Protected</div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleLink(link.id, link.is_active)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        link.is_active && !expired
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {link.is_active && !expired ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Create Shareable Link</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-600 mb-6">
              Shareable link creation form will be implemented here with type selection, expiry,
              access limits, and permissions
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
